import base64
from openai import OpenAI
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv(override=True)

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

class Listing(BaseModel):
    """A listing object"""
    title: str = Field(..., description="Title of the listing")
    user_id: str = Field(..., description="ID of the user creating the listing")
    description: str = Field(..., description="Description of the listing")
    image_encoding: str = Field(..., description="Base64 encoded image of the listing")
    price: float = Field(..., description="Price of the listing")
    location: str = Field(..., description="Location of the listing")

# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def image_to_listing(base64_image):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        { 
                            "type": "text", 
                            "text": """Analyze this image and create a product listing with the following JSON format:
                            user_id is random 5 digits integer, title is a string, description is a string, price is a int, location is a string.
                            {
                                "title": "Product title",
                                "user_id": "123",
                                "description": "Detailed product description",
                                "price": 99,
                                "location": "City, Country"
                            }"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"}
        )
        
        # print(f"Response status: {response.model_dump_json()[:100]}...")
        
        if response.choices and response.choices[0].message and response.choices[0].message.content:
            return response.choices[0].message.content
        else:
            print("No content received in response")
            return None
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        return None

if __name__ == "__main__": 
    # Path to your image
    image_path = "backend/example_image.jpg"

    # Getting the Base64 string
    base64_image = encode_image(image_path)

    print(image_to_listing(base64_image))
