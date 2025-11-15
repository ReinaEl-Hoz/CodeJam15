# main.py
from flask import Flask
from flask_cors import CORS
from routes import api  # Replace 'your_routes_file' with actual filename

app = Flask(__name__)

# CORS setup for frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Register the blueprint
app.register_blueprint(api, url_prefix='/api')

@app.route('/')
def index():
    return {'message': 'API is running'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)