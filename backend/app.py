import asyncio
import os
import json

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from pydantic import BaseModel
from supabase import create_client

from image_to_listing import image_to_listing
from supabase_functions import insert_to_supabase


class RelevanceScore(BaseModel):
                relevance_score: int
                
def create_app():
    app = Flask(__name__)

    # Load environment variables
    load_dotenv()

    # Initialize Supabase client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase = create_client(url, key)
    openAIClient = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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
    
    # Create listing from image
    @app.route('/create-listing-from-image', methods=['POST'])
    def create_listing_from_image():
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        
        # Check if base64_image is in the request
        if 'base64_image' not in data:
            return jsonify({"error": "base64_image is required"}), 400
            
        base64_image = data['base64_image']
        
        # Process image to generate listing details
        listing_json = image_to_listing(base64_image)
        
        if not listing_json:
            return jsonify({"error": "Failed to generate listing from image"}), 500
            
        # Parse the JSON string returned by image_to_listing
        listing_data = json.loads(listing_json)

        # Remove id field if it exists to let Supabase auto-generate it
        if "id" in listing_data:
            print(f"Removing id field: {listing_data['id']}")
            del listing_data["id"]
        
        # Set user_id to 1 regardless of what OpenAI returns
        listing_data["user_id"] = 1
        
        # Add the image encoding to the listing data
        listing_data["image_encoding"] = base64_image
        
        # Insert the new listing into Supabase
        try:
            response = insert_to_supabase('listings', listing_data)
            return jsonify({
                "message": "Listing created successfully",
                "data": response.data
            }), 201
        except Exception as e:
            return jsonify({"error": f"Failed to create listing: {str(e)}"}), 500
    
    # Push all listings for a merchant
    @app.route('/merchants/<merchant_id>/push-listings', methods=['POST'])
    async def push_listing(merchant_id):
        buyers = supabase.table('users').select('id, username, preferences').execute()
        listings = supabase.table('listings').select('*').eq('user_id', merchant_id).execute()

        tasks = []
        # for each listing, find relevant buyers
        for listing in listings.data:
            for buyer in buyers.data:
                task = openAIClient.beta.chat.completions.parse(
                    model="gpt-4.5-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a recommendation system that rates how relevant items are to users based on their preferences. Return a relevance score from 1-10, where 1 is least relevant and 10 is most relevant."
                        },
                        {
                            "role": "user", 
                            "content": f"Rate how relevant this listing is to the user's preferences:\nListing: {listing}\nUser preferences: {buyer['preferences']}"
                        }
                    ],
                    response_format=RelevanceScore,
                )
                tasks.append((task, buyer['id'], buyer['username']))
            
        # Execute all tasks concurrently and wait for results
        responses = await asyncio.gather(*[task[0] for task in tasks])
        
        # Process results
        for (response, task) in zip(responses, tasks):
            print({
                'user_id': task[1],
                'username': task[2],
                'relevance_score': response.choices[0].message.parsed
            })

        return listings.data

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8000, debug=True)
