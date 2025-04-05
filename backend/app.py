import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from supabase import create_client


def create_app():
    app = Flask(__name__)

    # Load environment variables
    load_dotenv()

    # Initialize Supabase client
    url = os.environ.get("SUPBASE_URL")
    key = os.environ.get("SUPBASE_KEY")
    supabase = create_client(url, key)

    # Enable CORS
    CORS(app)

    # Example route (you can also move this to routes.py)
    @app.route('/')
    def home():
        return 'Hello, Flask!'
    
    # Get all listings
    @app.route('/listings', methods=['GET'])
    def get_listings():
        # Get all listings from the database
        listings = supabase.table('listings').select('*').execute()
        return listings.data
    
    # Push all listings for a merchant
    @app.route('/merchants/<merchant_id>/push-listings', methods=['POST'])
    def push_listing(merchant_id):
        # Get all listings for a merchant
        listings = supabase.table('listings').select('*').eq('user_id', merchant_id).execute()
        return listings.data

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8000, debug=True)
