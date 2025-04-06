import base64
from openai import OpenAI
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv(override=True)

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

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
                            "text": """Analyze this image and identify the products shown.
                            Create a list of objects, where each object represents a product with the following JSON format:
                            [
                                {
                                    "name": "Product name",
                                    "min_price": 80,
                                    "max_price": 120
                                },
                                {
                                    "name": "Second product (if present)",
                                    "min_price": 40,
                                    "max_price": 60
                                }
                            ]
                            Include all identifiable products in the image."""
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
    image_path = "backend/example_image.jpeg"  # Updated to match the actual file extension

    # Getting the Base64 string
    base64_image = encode_image(image_path)

    result = image_to_listing(base64_image)
    print(result)
