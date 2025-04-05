import os

from supabase import Client, create_client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

response = (
    supabase.table("listings")
    .insert([
        {"id": 1, "username": "john_doe", "title": "Mountain Bike", "description": "Like new mountain bike for sale", "price": 299, "image_encoding": None},
        {"id": 2, "username": "jane_smith", "title": "iPhone 13", "description": "Gently used iPhone 13 128GB", "price": 699, "image_encoding": None},
        {"id": 3, "username": "mike123", "title": "Gaming Laptop", "description": "MSI Gaming Laptop, RTX 3060", "price": 1299, "image_encoding": None},
    ])
    .execute()
)

response = (
    supabase.table("buyers")
    .insert([
        {"id": 1, "name": "jem", "preferences": ["Mountain Bike", "iPhone 13", "Gaming Laptop"]},
        {"id": 2, "name": "yu xuan", "preferences": ["Mountain Bike", "iPhone 13", "Gaming Laptop"]},
        {"id": 3, "name": "mong", "preferences": ["Mountain Bike", "iPhone 13", "Gaming Laptop"]},
    ])
    .execute()
)

response = (
    supabase.table("listings")
    .select("*")
    .execute()
)

response = (
    supabase.table("buyers")
    .select("*")
    .execute()
)


print(response)