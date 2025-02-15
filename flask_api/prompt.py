import faiss
import os
from openai import OpenAI
import openai
import sqlite3
import cohere
from typing import List, Optional, Dict, Tuple
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from embedding import get_embedding_from_text, EMBEDDING_DIM

class PromptEngine:
    def __init__(
        self,
        index_file: str,
        db_file: StopIteration
    ):
        self.index_file = index_file
        self.db_file = db_file

        openai_api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = openai_api_key
        self.client = OpenAI()

        cohere_api_key = os.getenv("CO_API_KEY")
        self.co = cohere.Client(cohere_api_key)

        self.index = self.load_faiss_index()
        self.conn, self.cursor = self.initialize_database()

    def load_faiss_index(self) -> faiss.IndexFlatIP:
        """Load an existing FAISS index from file or create a new one."""
        if os.path.exists(self.index_file):
            index = faiss.read_index(self.index_file)
            print(f"FAISS index loaded from {self.index_file}.")
        else:
            index = faiss.IndexFlatIP(EMBEDDING_DIM)
            print("FAISS index created.")
        return index

    def initialize_database(self) -> Tuple[sqlite3.Connection, sqlite3.Cursor]:
        """Connect to the SQLite database."""
        if not os.path.exists(self.db_file):
            raise FileNotFoundError(f"SQLite database file {self.db_file} not found.")
        try:
            conn = sqlite3.connect(self.db_file, check_same_thread=False)
            cursor = conn.cursor()
            print(f"Connected to SQLite database at {self.db_file}.")

            # FTS5エクステンションをロード（必要に応じて）
            try:
                conn.execute('SELECT load_extension("fts5")')
            except sqlite3.OperationalError:
                pass  # 無視
            return conn, cursor
        except sqlite3.Error as e:
            print(f"SQLite connection error: {e}")
            raise

    def retrieve_document_content(self, doc_id: int) -> Optional[str]:
        """Retrieve the content of a document from the SQLite database."""
        try:
            self.cursor.execute(
                "SELECT contents FROM documents WHERE doc_id = ?", (doc_id,)
            )
            row = self.cursor.fetchone()
            if row:
                return row[0]
            else:
                return None
        except sqlite3.Error as e:
            print(f"SQLite error while retrieving document {doc_id}: {e}")
            return None

    def extract_nouns_gpt(self, text):
        tokens = []
        prompt = f"""以下の文章から法律の専門用語を抜き出してください。それぞれの法律用語は,で区切ってください。
文章：この文書は、サービスの利用条件、機密保持、責任制限などを含む基本的な利用規約を示しています。
回答：利用条件,機密保持,責任制限,利用規約
文章：**6. 機密保持** ユーザーと当社は、本サービスを通じて得られた情報、データ、文書に関して守秘義務を負います。
回答：機密保持,守秘義務
        文章：{text}
        回答：
        """
        response = self.call_gpt(prompt)
        # 3文字未満の単語を除外
        tokens = response.split(",")
        tokens = [token.strip() for token in tokens if len(token.strip()) >= 3]
        return tokens

    def get_tokens(self, query: str) -> List[str]:
        tokens = self.extract_nouns_gpt(query)
        return tokens

    def bm25_search(self, tokens: List[str], top_n: int) -> List[Tuple[int, float]]:
        """Perform BM25 search using SQLite FTS5 and return top_n results."""
        try:
            if tokens:
                match_query = " OR ".join(tokens)
            else:
                match_query = ""

            # Enable rank function for BM25 scoring
            self.conn.create_function("rank", 1, lambda x: x)

            # Execute the BM25 query
            self.cursor.execute(
                f"""
            SELECT rowid, content, bm25(trigram_fts) AS rank
            FROM trigram_fts
            WHERE trigram_fts MATCH ?
            ORDER BY rank
            LIMIT ?;
            """,
                (match_query, top_n),
            )

            results = self.cursor.fetchall()

            if not results:
                return []

            # Collect scores
            scores = [row[2] for row in results]
            doc_ids = [row[0] for row in results]

            # BM25 scores: lower is better, so we can invert them
            # For simplicity, we can assign a similarity score as 1 / (1 + rank)
            similarities = [1 / (1 + score) for score in scores]

            return list(zip(doc_ids, similarities))

        except sqlite3.Error as e:
            print(f"SQLite error during BM25 search: {e}")
            return []

    def get_top_faiss_results(
        self, question: str, top_n: int
    ) -> List[Tuple[int, float]]:
        """Retrieve the top_n similar documents using FAISS."""
        # Step 1: Get the embedding for the question
        question_embedding = get_embedding_from_text(question)
        if question_embedding is None:
            return []

        # Step 2: Convert the question embedding to numpy array
        question_embedding_np = question_embedding.reshape(1, -1).astype("float32")

        # Step 3: Find the top_n most similar documents using FAISS
        cons_sim, indices = self.index.search(question_embedding_np, top_n)

        # Extract the indices and similarities
        doc_ids = [int(idx) + 1 for idx in indices[0]]  # Assuming doc_ids start from 1
        sims = cons_sim[0].tolist()

        return list(zip(doc_ids, sims))

    def get_docs_from_ids(self, doc_ids: List[int]) -> List[str]:
        """Retrieve document contents given a list of doc_ids."""
        docs = []
        for doc_id in doc_ids:
            content = self.retrieve_document_content(doc_id)
            if content:
                docs.append(content)
            else:
                print(f"Document with doc_id={doc_id} not found in database.")
        return docs

    def rerank_with_cohere(
        self, query: str, docs: List[str], doc_ids: List[int], top_n: int
    ) -> List[Tuple[int, float]]:
        """Rerank documents using Cohere's reranker and return top_n results."""
        if not docs:
            return []
        response = self.co.rerank(query=query, documents=docs)
        # Extract top_n results
        top_results = response.results[:top_n]
        # Get the indices and scores
        top_doc_ids = [doc_ids[result.index] for result in top_results]
        top_scores = [result.relevance_score for result in top_results]
        return list(zip(top_doc_ids, top_scores))

    def assemble_context_from_results(self, results: List[Tuple[int, float]]) -> str:
        """Retrieve documents from doc_ids and assemble the context."""
        doc_ids = [doc_id for doc_id, _ in results]
        docs = self.get_docs_from_ids(doc_ids)
        context = "\n\n".join(docs)
        return context

    def get_context(self, question: str) -> str:
        # Get top 10 from FAISS and BM25 without duplicates, rerank with Cohere, get top 5
        faiss_results = self.get_top_faiss_results(question, top_n=10)
        tokens = self.get_tokens(question)
        bm25_results = self.bm25_search(tokens, top_n=10)
        combined_results = faiss_results + bm25_results
        # Remove duplicates based on doc_id
        seen_doc_ids = set()
        unique_results = []
        for doc_id, score in combined_results:
            if doc_id not in seen_doc_ids:
                seen_doc_ids.add(doc_id)
                unique_results.append((doc_id, score))
        doc_ids = [doc_id for doc_id, _ in unique_results]
        docs = self.get_docs_from_ids(doc_ids)
        results = self.rerank_with_cohere(question, docs, doc_ids, top_n=5)

        # Assemble context from results
        context = self.assemble_context_from_results(results)
        return context

    def call_gpt(self, prompt):
        response = self.client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    def call_gpt_messages(self, messages):
        response = self.client.chat.completions.create(
            model="gpt-4o-mini", messages=messages
        )
        return response.choices[0].message.content
