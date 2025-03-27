from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from groq import Groq

app = FastAPI()

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def extract_text_from_txt(txt_path):
    with open(txt_path, "r", encoding="utf-8") as file:
        text = file.read()
    return text

def chunk_text(text, chunk_size=1000, chunk_overlap=100):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_text(text)

def create_vector_db(txt_text, dbname):
    chunks = chunk_text(txt_text)
    vector_db = FAISS.from_texts(chunks, embeddings)
    vector_db.save_local(dbname)

async def generate_query(prompt, dialect):
    if dialect == "trino":
        vector_db = FAISS.load_local("vector_db_trino", embeddings, allow_dangerous_deserialization=True)
    elif dialect == "spark":
        vector_db = FAISS.load_local("vector_db_spark", embeddings, allow_dangerous_deserialization=True)
    docs = vector_db.similarity_search(prompt, k=3)  # Retrieve the top 3 relevant chunks
    query = f"""Use the following documentation to answer the query and give only SQL query without and explainantions:

{docs}

Question: {prompt}
Answer:
"""
    client = Groq(api_key="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")
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content" : query}],
        temperature=1,
        max_completion_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )
    response_text = ""
    for chunk in completion:
        # Process each chunk from the stream
        response_text += chunk.choices[0].delta.content or ""
        print(chunk.choices[0].delta.content or "", end="")

    return response_text

# Root endpoint
@app.get("/")
async def home():
    return {"message": "Welcome to the API!"}

class QueryInput(BaseModel):
    query: str
    dialect: str

@app.post("/query")
async def query(query: QueryInput):
    """POST API to generate SQL from text."""
    generated = await generate_query(query.query, query.dialect)
    return {"sql_query": generated}
