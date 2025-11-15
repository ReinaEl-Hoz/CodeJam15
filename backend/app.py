from flask import Flask
from flask_cors import CORS
from routes import api

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Register blueprints
app.register_blueprint(api, url_prefix='/api')

@app.route('/')
def index():
    return {
        'message': 'Data Analytics API',
        'endpoints': [
            '/api/query-data',
            '/api/available-queries',
            '/api/test-db'
        ]
    }

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')