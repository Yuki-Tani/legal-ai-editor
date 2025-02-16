import numpy as np
from openai import OpenAI

client = OpenAI()

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536

def get_embedding_from_text(texts) -> np.array:
    try:
        response = client.embeddings.create(input=texts, model=EMBEDDING_MODEL)
        return np.array(response.data[0].embedding)
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None