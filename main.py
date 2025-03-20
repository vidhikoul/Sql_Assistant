from fastapi import FastAPI
from transformers import T5Tokenizer, T5ForConditionalGeneration
from pydantic import BaseModel
import torch
import re
import spacy

app = FastAPI()

# Initialize the tokenizer from Hugging Face Transformers library
tokenizer = T5Tokenizer.from_pretrained('t5-small')

# Load the model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = T5ForConditionalGeneration.from_pretrained('./models')
model = model.to(device)
model.eval()

#detecting if user is asking for update query
def is_update_query(prompt: str) -> bool:
    update_keywords = [
        "update", "modify", "change", "set", "edit",
        "update table", "change column", "modify record",
        "update value", "update where", "set column"
    ]
    
    prompt_lower = prompt.lower()
    return any(keyword in prompt_lower for keyword in update_keywords)

#detecting if user is asking for delete query
def is_delete_query(prompt: str) -> bool:
    delete_patterns = [
        r"\bdelete\b", r"\bremove\b", r"\bdrop\b", r"\btruncate\b",
        r"delete from", r"remove record", r"delete row",
        r"delete data", r"delete entry", r"delete where",
        r"remove from table", r"delete all records",
        r"clear table", r"delete user", r"delete using sql",
        r"how to delete", r"remove duplicate records"
    ]
    # Convert to lowercase
    prompt_lower = prompt.lower()
    # Check for any pattern in the prompt
    return any(re.search(pattern, prompt_lower) for pattern in delete_patterns)

def extract_update_details_nlp(prompt: str):
    doc = nlp(prompt)
    columns = []
    values = []
    
    for token in doc:
        if token.dep_ == "dobj" or token.dep_ == "attr":  # Direct Object (Potential Column)
            columns.append(token.text)
        if token.dep_ == "pobj" or token.dep_ == "nummod":  # Prepositional Object (Potential Value)
            values.append(token.text)
    
    return [{"column": col, "new_value": val} for col, val in zip(columns, values)]

def generate_sql(input_prompt):
    # Tokenize the input prompt
    inputs = tokenizer(input_prompt, padding=True, truncation=True, return_tensors="pt").to(device)

    # Forward pass
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=512)

    # Decode the output IDs to a string (SQL query in this case)
    generated_sql = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return generated_sql

def generate_query(prompt):
    query = generate_sql(prompt)
    if(is_delete_query(prompt)):
        condition = query.split("FROM", 1)
        return f"DELETE FROM {condition[1]}"
    elif(is_update_query(prompt)):
        clms = extract_update_details_nlp(prompt)
        condition = query.split("FROM", 1)
        condition = condition[1].split("WHERE", 1)
        changes = "SET "
        for c in clms:
            changes += f"{c['column']} = {c['new_value']}"

        return f"UPDATE {condition[0]} {changes} WHERE {condition[1]}"
    else:
        return query
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
