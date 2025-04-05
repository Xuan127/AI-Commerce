from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Enable CORS
    CORS(app)

    # Example route (you can also move this to routes.py)
    @app.route('/')
    def home():
        return 'Hello, Flask!'

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
