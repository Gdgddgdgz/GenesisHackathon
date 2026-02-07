import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
token = os.getenv("HUGGINGFACE_TOKEN")
print(f"Token loaded: {token[:4]}...{token[-4:] if token else 'None'}")

if not token:
    print("ERROR: No token found in .env")
    exit(1)

client = InferenceClient(token=token)

try:
    print("Attempting to connect to meta-llama/Meta-Llama-3-8B-Instruct...")
    response = client.chat_completion(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=10
    )
    print("SUCCESS: Model responded.")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"FAILURE: {e}")
