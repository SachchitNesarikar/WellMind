# rag_server.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import chromadb
import os
import sqlite3
from datetime import datetime

# --- ENVIRONMENT ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GOOGLE_API_KEY)

# --- FASTAPI APP ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GEMINI ---
chat_model = genai.GenerativeModel("gemini-2.5-flash")

# --- EMBEDDING MODEL ---
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# --- CHROMA DB SETUP (✅ Optimal) ---
chroma_client = chromadb.PersistentClient(path="./rag_data")
collection = chroma_client.get_or_create_collection(name="mental_health_docs")

# --- SQLITE DB SETUP ---
DB_PATH = "conversations.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    sender TEXT,
    message TEXT,
    timestamp TEXT
)
""")
conn.commit()

def store_message(user_id, sender, message):
    cursor.execute("INSERT INTO messages (user_id, sender, message, timestamp) VALUES (?, ?, ?, ?)",
                   (user_id, sender, message, datetime.utcnow().isoformat()))
    conn.commit()

def get_context(user_id, limit=5):
    cursor.execute("SELECT sender, message FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT ?", (user_id, limit))
    rows = cursor.fetchall()
    context = "\n".join([f"{sender}: {msg}" for sender, msg in reversed(rows)])
    return context

@app.post("/ingest")
async def ingest_document(request: Request):
    data = await request.json()
    content = data.get("content")
    source = data.get("source", "unknown")

    if not content:
        return {"error": "No content provided"}

    # Chunk the content (simplified here)
    chunks = [chunk.strip() for chunk in content.split('\n') if len(chunk.strip()) > 30]

    embeddings = embedder.encode(chunks).tolist()

    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            embeddings=[embeddings[i]],
            ids=[f"{source}_{i}"],
            metadatas=[{"source": source}]
        )

    return {"status": f"Ingested {len(chunks)} chunks from '{source}'"}

@app.post("/chat")
async def chat_with_bot(request: Request):
    data = await request.json()
    user_message = data.get("message")
    user_id = data.get("user_id", "anonymous")
    user_name = data.get("name", "Friend")

    if not user_message:
        return {"response": "Please enter a message."}

    try:
        # Embed user query
        query_embedding = embedder.encode([user_message])[0].tolist()

        # Retrieve top 3 relevant docs
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )

        # Format retrieved docs
        docs = results.get("documents", [[]])[0]
        rag_context = "\n\n".join(docs)

        # Retrieve conversation context
        chat_history = get_context(user_id)

        # Build prompt
        prompt = f"""
You are a compassionate mental health assistant. The user's name is {user_name}.

Conversation history:
{chat_history}

Relevant knowledge:
{rag_context}

User's message:
{user_message}

Respond empathetically and informatively using the above context and knowledge.
"""

        # Get response
        response = chat_model.generate_content(prompt)
        bot_reply = response.text

        # Store conversation
        store_message(user_id, "user", user_message)
        store_message(user_id, "bot", bot_reply)

        return {"response": bot_reply}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}

@app.get("/context/{user_id}")
def get_user_context(user_id: str):
    return {"context": get_context(user_id)}
