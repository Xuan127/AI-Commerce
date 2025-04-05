import asyncio
import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from openai import OpenAI
from pydantic import BaseModel
from supabase import create_client


class RelevanceScore(BaseModel):
                relevance_score: int
                
def create_app():
    app = Flask(__name__)

    # Load environment variables
    load_dotenv()

    # Initialize Supabase client
    url = os.environ.get("SUPBASE_URL")
    key = os.environ.get("SUPBASE_KEY")
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
