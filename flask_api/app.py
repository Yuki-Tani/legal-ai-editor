from flask import Flask, request, jsonify
import os
from prompt import PromptEngine

app = Flask(__name__)

INDEX_FILE = "flask_api/generated/embeddings.index"
DB_FILE = "flask_api/generated/database.sqlite"

@app.route('/api/get_context', methods=['POST'])
def get_context_route():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': '質問文が提供されていません'}), 400

    question = data['question']
    
    try:
        engine = PromptEngine(index_file=INDEX_FILE, db_file=DB_FILE)
        context = engine.get_context(question)
        return jsonify({'context': context}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
