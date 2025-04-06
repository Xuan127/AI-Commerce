import asyncio
import json
import os

import requests
import stripe
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from image_to_listing import image_to_listing
from image_to_listing_v2 import image_to_listing as image_to_listing_v2
from openai import OpenAI
from pydantic import BaseModel
from supabase import create_client
from supabase_functions import insert_to_supabase


class RelevanceScore(BaseModel):
    relevance_score: int


class RelevanceScoreWithUser(RelevanceScore):
    user_id: int
    username: str


async def get_relevance_score(listing, buyer) -> RelevanceScoreWithUser:
    openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    task = openai.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a recommendation system that rates how relevant items are to users based on their preferences. Return a relevance score from 1-10, where 1 is least relevant and 10 is most relevant.",
            },
            {
                "role": "user",
                "content": f"Rate how relevant this listing is to the user's preferences:\nListing: {listing}\nUser preferences: {buyer}",
            },
        ],
        response_format=RelevanceScore,
    )
    result = task.choices[0].message.parsed
    formatted_result = RelevanceScoreWithUser(
        relevance_score=result.relevance_score,
        user_id=buyer.get("id"),
        username=buyer.get("username"),
    )
    return formatted_result


def create_app():
    app = Flask(__name__)

    # Load environment variables
    load_dotenv(override=True)

    # Initialize Supabase client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    print(f"URL: {url}")
    print(f"KEY: {key}")
    supabase = create_client(url, key)

    # Initialize Stripe client
    stripe.api_key = os.environ.get("STRIPE_API_KEY")

    # Enable CORS
    CORS(app)

    # Example route (you can also move this to routes.py)
    @app.route("/")
    def home():
        return "Hello, Flask!"

    # Get all listings
    @app.route("/listings", methods=["GET"])
    def get_listings():
        # Get all listings from the database
        listings = supabase.table("listings").select("*").execute()
        return listings.data

    # Create listing from image
    @app.route("/create-listing-from-image", methods=["POST"])
    def create_listing_from_image():
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Check if base64_image is in the request
        if "base64_image" not in data:
            return jsonify({"error": "base64_image is required"}), 400

        base64_image = data["base64_image"]

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
            product = stripe.Product.create(name=listing_data["title"])
            price = stripe.Price.create(
                product=product.id,
                unit_amount=listing_data["price"],
                currency="usd"
            )
            payment_link = stripe.PaymentLink.create(
                line_items=[{
                    "price": price.id,
                    "quantity": 1
                }]
            )
            return jsonify({
                "message": "Listing created successfully",
                "data": {
                    **response.data,
                    "stripe_product": product,
                    "stripe_price": price,
                    "stripe_payment_link": payment_link.url
                }
            }), 201
        except Exception as e:
            return jsonify({"error": f"Failed to create listing: {str(e)}"}), 500

    # Push all listings for a merchant
    @app.route("/merchants/<merchant_id>/push-listings", methods=["POST"])
    async def push_listing(merchant_id):
        buyers = supabase.table("users").select("id, username, preferences").execute()
        listings = (
            supabase.table("listings").select("*").eq("user_id", merchant_id).execute()
        )
        tasks = [
            get_relevance_score(listing, buyer)
            for listing in listings.data
            for buyer in buyers.data
        ]
        responses = await asyncio.gather(*tasks)

        # do something with the potential buyers later
        print(responses)

        # Placeholder response
        return {"message": "Listings pushed successfully"}

    @app.route("/create-realtime-key", methods=["GET"])
    def create_realtime_key():
        headers = {
            "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
            "Content-Type": "application/json",
        }

        payload = {"model": "gpt-4o-realtime-preview-2024-12-17", "voice": "verse"}

        try:
            response = requests.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers=headers,
                json=payload,
            )

            response.raise_for_status()  # Raise an exception for HTTP errors
            return jsonify(response.json()), 200
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to create realtime key: {str(e)}"}), 500

    # takes in a price id and returns a new price and payment link
    @app.route("/tools/update-price", methods=["POST"])
    def update_price():
        # Get data from request
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        listing_data = request.get_json()

        # Check required fields
        if "product_id" not in listing_data or "price" not in listing_data:
            return jsonify({"error": "product_id and price are required"}), 400
        
        product_id = listing_data["product_id"]
        price = listing_data["price"]
        
        new_price = stripe.Price.create(
            product=product_id,
            unit_amount=price,
            currency="usd"
        )
        payment_link = stripe.PaymentLink.create(
            line_items=[{
                "price": new_price.id,
                "quantity": 1
            }]
        )
        return jsonify({
            "message": "Price updated successfully",
            "data": {
                "product_id": product_id,
                "price": new_price,
                "payment_link": payment_link.url
            }
        }), 200
    
    # Create listing from image using v2 implementation
    @app.route("/image-to-products", methods=["POST"])
    def image_to_products():
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Check if base64_image is in the request
        if "base64_image" not in data:
            return jsonify({"error": "base64_image is required"}), 400

        base64_image = data["base64_image"]

        # Process image to generate product details using v2 implementation
        result_json = image_to_listing_v2(base64_image)

        if not result_json:
            return jsonify({"error": "Failed to analyze image"}), 500

        # Return the JSON response directly
        return jsonify(json.loads(result_json)), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=True)
