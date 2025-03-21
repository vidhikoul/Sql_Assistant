from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
import requests
app = FastAPI()

# Ollama API details
OLLAMA_URL = "http://localhost:11434/api/generate"  # Default Ollama endpoint
MODEL_NAME = "codellama"  # Ensure this matches your locally installed model

def generate_query(prompt):
    response = requests.post(OLLAMA_URL, json={
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False  # Set to True if you want streaming responses
    })
    if response.status_code == 200:
        sql_query = response.json().get("response", "No output generated.")
        return sql_query
    return "Error"

# Root endpoint
@app.get("/")
async def home():
    return {"message": "Welcome to the API!"}

class QueryInput(BaseModel):
    query: str

@app.post("/query")
async def query(query: QueryInput):
    """POST API to generate SQL from text."""
    
    return {"sql_query": generate_query(query.query)}
