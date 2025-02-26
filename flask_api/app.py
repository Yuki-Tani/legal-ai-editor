from flask import Flask, request, jsonify
import os
import json
import openai
from openai import OpenAI
from prompt import PromptEngine
from google import genai
import logging

app = Flask(__name__)

GENERATED_DIR = "flask_api/generated"
HOUREI_DIR = "法令"
KEIHIN_JIREI_DIR = "景品表示法事例"
KINOUSEI_DIR = "機能性表示食品"
TOKUTEI_DIR = "特定商取引事例"
INDEX_FILE = "embeddings.index"
DB_FILE = "database.sqlite"
CATEGORIES = [
    "憲法・司法・警察",
    "行政・地方自治",
    "財政・税金",
    "経済・産業・貿易",
    "労働・社会保障",
    "土地・都市・建築",
    "交通・運輸・通信",
    "環境・防災",
    "文化・教育・観光",
    "民事・商取引"
]

openai_api_key = os.getenv("OPENAI_API_KEY")
openai.api_key = openai_api_key
client = OpenAI()
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai_client = genai.Client(http_options= {'api_version': 'v1alpha'}, api_key=gemini_api_key)

def call_gpt_messages_4o(messages):
    response = client.chat.completions.create(
        model="gpt-4o", messages=messages
    )
    return response.choices[0].message.content

def classify_law(text):
    if not text:
        return jsonify({'error': 'テキストが提供されていません'}), 400
    system_message = f"""
あなたは日本の法律に関する文章を10個のカテゴリに分類するアシスタントです。
入力された文章に最も関連するカテゴリを上位2つ選び、JSON形式で出力してください。
出力フォーマットの例：
{{
  "categories": [
    "カテゴリ1",
    "カテゴリ2"
  ]
}}
以下が10のカテゴリ一覧です。カテゴリ名は絶対に変更しないでください：
{', '.join(CATEGORIES)}
""".strip()
    example_input_1 = "地方自治法に基づき、市町村は、地域の特性に応じた施策を講じることができる。財源は、地方税、補助金、その他の財源を充てることができる。"
    example_output_1 = {
        "categories": [
            "行政・地方自治",
            "財政・税金"
        ]
    }
    
    example_input_2 = "大気汚染や温暖化対策などの環境保全について、国は、環境基本法に基づき、環境保全のための施策を講じることができる。すべての国民は、健康で文化的な最低限度の生活を営む権利を有する。"
    example_output_2 = {
        "categories": [
            "環境・防災",
            "憲法・司法・警察"
        ]
    }
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": example_input_1},
        {"role": "assistant", "content": json.dumps(example_output_1, ensure_ascii=False)},
        {"role": "user", "content": example_input_2},
        {"role": "assistant", "content": json.dumps(example_output_2, ensure_ascii=False)},
        {
            "role": "user",
            "content": text
        }
    ]
    
    response = call_gpt_messages_4o(messages)
    try:
        content = json.loads(response)
    except json.JSONDecodeError as e:
        return jsonify({'error': f"JSONデコードエラー: {e}"}),
    return content

@app.route('/api/get_horei_context', methods=['POST'])
def get_horei_context_route():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': '質問文が提供されていません'}), 400
    question = data['question']
    category_response = classify_law(question)
    if 'error' in category_response:
        return jsonify({'error': category_response['error']}), 500
    all_contexts = ""
    if 'categories' not in category_response:
        return jsonify({'error': 'カテゴリが見つかりません'}), 500
    
    for category in category_response['categories']:
        category_dir = os.path.join(GENERATED_DIR, HOUREI_DIR, category)
        if not os.path.exists(category_dir):
            return jsonify({'error': f"カテゴリ'{category}'のデータが見つかりません"}), 404
        index_file = os.path.join(category_dir, INDEX_FILE)
        db_file = os.path.join(category_dir, DB_FILE)
        try:
            engine = PromptEngine(index_file=index_file, db_file=db_file)
            context = engine.get_context(question)
            all_contexts += f"【{category}】\n{context}\n\n"
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'context': all_contexts}), 200

@app.route('/api/get_keihin_jirei_context', methods=['POST'])
def get_keihin_jirei_context_route():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': '質問文が提供されていません'}), 400
    question = data['question']
    keihin_jirei_dir = os.path.join(GENERATED_DIR, KEIHIN_JIREI_DIR)
    if not os.path.exists(keihin_jirei_dir):
        return jsonify({'error': f"景品表示法事例データが見つかりません"}), 404
    index_file = os.path.join(keihin_jirei_dir, INDEX_FILE)
    db_file = os.path.join(keihin_jirei_dir, DB_FILE)
    
    try:
        engine = PromptEngine(index_file=index_file, db_file=db_file)
        context = engine.get_context(question, top_faiss=10, top_bm25=10, top_cohere=5)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'context': context}), 200

@app.route('/api/get_kinousei_hyouji_syokuhin_context', methods=['POST'])
def get_kinousei_hyouji_syokuhin_context_route():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': '質問文が提供されていません'}), 400
    question = data['question']
    kinousei_dir = os.path.join(GENERATED_DIR, KINOUSEI_DIR)
    if not os.path.exists(kinousei_dir):
        return jsonify({'error': f"機能性表示食品データが見つかりません"}), 404
    index_file = os.path.join(kinousei_dir, INDEX_FILE)
    db_file = os.path.join(kinousei_dir, DB_FILE)
    
    try:
        engine = PromptEngine(index_file=index_file, db_file=db_file)
        context = engine.get_context(question, top_faiss=10, top_bm25=10, top_cohere=5)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'context': context}), 200

@app.route('/api/get_tokutei_syoutorihiki_jirei_context', methods=['POST'])
def get_tokutei_syoutorihiki_jirei_context_route():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': '質問文が提供されていません'}), 400
    question = data['question']
    tokutei_dir = os.path.join(GENERATED_DIR, TOKUTEI_DIR)
    if not os.path.exists(tokutei_dir):
        return jsonify({'error': f"特定商取引データが見つかりません"}), 404
    index_file = os.path.join(tokutei_dir, INDEX_FILE)
    db_file = os.path.join(tokutei_dir, DB_FILE)
    
    try:
        engine = PromptEngine(index_file=index_file, db_file=db_file)
        context = engine.get_context(question, top_faiss=10, top_bm25=10, top_cohere=5)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'context': context}), 200

@app.route('/api/search_external_topic', methods=['POST'])
def analyze_document():
    search_tool = {'google_search': {}}
    data = request.get_json()
    document = data.get("text")
    if not document:
        return jsonify({"error": "テキストが提供されていません。"}), 400
    prompt = f"""
    以下の法律に関する文書から、トピックを1つ以上抽出してください。さらに、そのトピックに関する最も最新のニュース、関連企業、関連商品、専門情報をウェブ検索して、非常に詳しく要約してください。回答は要約と参考文献のみにしてください。他の文字を含めないでください。
    文書: {document}
    """

    try:
        chat = genai_client.chats.create(model='gemini-2.0-flash-exp', config={'tools': [search_tool]})
        response = chat.send_message(prompt)
        result_text = ""
        for part in response.candidates[0].content.parts:
            
            result_text += part.text
        return jsonify({"result": result_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
