from fastapi import FastAPI
from transformers import T5Tokenizer, T5ForConditionalGeneration
from pydantic import BaseModel
import torch

app = FastAPI()

# Model and Tokenizer (lazy loading)
model = None
tokenizer = None

def load_model():
    """Load the model and tokenizer only when needed."""
    global model, tokenizer
    if model is None:
        model_name = "gaussalgo/T5-LM-Large-text2sql-spider"
        tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
        model = T5ForConditionalGeneration.from_pretrained(model_name)
        model.eval()  # Set to evaluation mode (faster inference)

def generate_sql(query: str) -> str:
    """Generate SQL query from text input."""
    load_model()  # Load model on first use

    input_text = "Generate SQL query: " + query
    inputs = tokenizer(input_text, return_tensors="pt")

    # Use `torch.no_grad()` to reduce memory usage
    with torch.no_grad():
        output = model.generate(**inputs, max_length=256)

    return tokenizer.decode(output[0], skip_special_tokens=True)

# Root endpoint
@app.get("/")
async def home():
    return {"message": "Welcome to the API!"}

class QueryInput(BaseModel):
    query: str

@app.post("/query")
async def query(query: QueryInput):
    """POST API to generate SQL from text."""
    return {"sql_query": generate_sql(query.query)}
