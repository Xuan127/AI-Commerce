from flask import Flask
from flask_cors import CORS

from config import config
from routes import register_routes

def create_app(config_name='development'):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Enable CORS
    CORS(app)

    # Register all routes
    register_routes(app)

    # Example route (you can also move this to routes.py)
    @app.route('/')
    def home():
        return 'Hello, Flask!'

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
