from fastapi import FastAPI
from transformers import T5Tokenizer, T5ForConditionalGeneration
from pydantic import BaseModel

app = FastAPI()

# Use a Text-to-SQL fine-tuned model
model_name = "gaussalgo/T5-LM-Large-text2sql-spider"
tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
model = T5ForConditionalGeneration.from_pretrained(model_name)

def generate_sql(query):
    input_text = "Generate SQL query: " + query
    inputs = tokenizer(input_text, return_tensors="pt")
    output = model.generate(**inputs, max_length=256)
    return tokenizer.decode(output[0], skip_special_tokens=True)

# Root endpoint
@app.get("/")
def home():
    return {"message": "Welcome to the API!"}

class QueryInput(BaseModel):
    query: str

@app.post("/query")
async def query(query: QueryInput):
    return generate_sql(query.query)