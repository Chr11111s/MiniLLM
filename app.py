from flask import Flask, render_template, request, jsonify
import requests
import base64

app = Flask(__name__)

# 直接在代码中写入 API key
api_key = 'Your API Key'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/text', methods=['POST'])
def generate_text():
    try:
        text_input = request.form.get('input')
        files = request.files.getlist('files')

        # 处理上传的文件，如果需要可以转换为 base64 编码
        images = []
        for file in files:
            if file:
                file_content = base64.b64encode(file.read()).decode('utf-8')
                images.append({
                    'filename': file.filename,
                    'content': file_content,
                    'type': file.mimetype
                })

        # 调用 OpenAI API 生成响应
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json={
                'model': 'gpt-4',
                'messages': [{'role': 'user', 'content': text_input}],
                'max_tokens': 2048,
                'temperature': 0.7
            }
        )

        response.raise_for_status()
        response_data = response.json()
        
        # 确保返回完整的响应内容
        full_text = ''.join(choice['message']['content'] for choice in response_data['choices'])

        return jsonify({
            'text': full_text,
            'images': images
        })
    except requests.RequestException as e:
        print('Error:', e)
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print('Error:', e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
