from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv(override=True)

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

response = client.responses.create(
    model="gpt-4o",
    tools=[{"type": "web_search_preview"}],
    input="""search up the prices of laptops and return me a reasonable price to set for my laptop? I want both a max and min price. ouput the price.
    At the end, please return the output in JSON format with the following keys: "min_price" and "max_price"."""
)

print(response.output_text)