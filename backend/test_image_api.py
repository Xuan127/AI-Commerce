import base64
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def encode_image(image_path):
    """Encode an image to base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def test_create_listing_from_image(image_path):
    """Test the create-listing-from-image endpoint"""
    
    # Get Flask server URL from environment or use default
    base_url = os.getenv("FLASK_URL", "http://localhost:8000")
    endpoint = f"{base_url}/create-listing-from-image"
    
    # Encode the image
    print(f"Encoding image: {image_path}")
    base64_image = encode_image(image_path)
    print(f"Image encoded successfully, first 50 chars: {base64_image[:50]}...")
    
    # Prepare the request payload
    payload = {
        "base64_image": base64_image
    }
    
    # Make the POST request
    print(f"Sending POST request to {endpoint}")
    response = requests.post(
        endpoint,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    # Print the response
    print(f"Status code: {response.status_code}")
    try:
        response_json = response.json()
        print(f"Response JSON: {json.dumps(response_json, indent=2)}")
        
        # If there's an error, analyze it in more detail
        if "error" in response_json and "listings_id_key" in response_json["error"]:
            print("\nDuplicate ID error detected. The OpenAI response likely includes an 'id' field.")
            print("Let's extract the currently existing listings to see what's happening:")
            
            try:
                listings_response = requests.get(f"{base_url}/listings")
                print(f"\nExisting listings: {json.dumps(listings_response.json(), indent=2)}")
            except Exception as e:
                print(f"Failed to get existing listings: {str(e)}")
    except:
        print(f"Response text: {response.text}")
    
    return response

if __name__ == "__main__":
    # Path to the example image
    image_path = "example_image.jpg"
    
    # Check if the file exists
    if not os.path.isfile(image_path):
        # Try with full path
        image_path = f"backend/{image_path}"
        if not os.path.isfile(image_path):
            print(f"Error: Image file not found at {image_path}")
            exit(1)
    
    print(f"Using image at: {image_path}")
    
    # Test the endpoint
    test_create_listing_from_image(image_path)
