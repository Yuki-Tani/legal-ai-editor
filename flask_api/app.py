from flask import Flask, request, jsonify
import os
import json
import openai
from openai import OpenAI
from prompt import PromptEngine

app = Flask(__name__)

GENERATED_DIR = "flask_api/generated"
HOUREI_DIR = "法令"
KEIHIN_JIREI_DIR = "景品表示法事例"
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

@app.route('/api/get_context', methods=['POST'])
def get_context_route():
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
    return jsonify({'contexts': all_contexts}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)
