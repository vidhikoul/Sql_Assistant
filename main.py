from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

model_name = "codellama/CodeLlama-7b-Instruct-hf"  # Update this if using a local model
llm_pipeline = pipeline("text-generation", model=model_name)

def generate_query(prompt):
    output = llm_pipeline(prompt, max_length=512, truncation=True)[0]["generated_text"]
    return output


# Root endpoint
@app.get("/")
async def home():
    return {"message": "Welcome to the API!"}

class QueryInput(BaseModel):
    query: str

@app.post("/query")
async def query(query: QueryInput):
    """POST API to generate SQL from text."""
    
    return {"sql_query": generate_query(query.body.query)}
