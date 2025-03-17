from fastapi import FastAPI
from transformers import T5Tokenizer, T5ForConditionalGeneration
from pydantic import BaseModel
import torch

app = FastAPI()

# Initialize the tokenizer from Hugging Face Transformers library
tokenizer = T5Tokenizer.from_pretrained('t5-small')

# Load the model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = T5ForConditionalGeneration.from_pretrained('cssupport/t5-small-awesome-text-to-sql')
model = model.to(device)
model.eval()

def generate_sql(input_prompt):
    # Tokenize the input prompt
    inputs = tokenizer(input_prompt, padding=True, truncation=True, return_tensors="pt").to(device)

    # Forward pass
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=512)

    # Decode the output IDs to a string (SQL query in this case)
    generated_sql = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return generated_sql
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
