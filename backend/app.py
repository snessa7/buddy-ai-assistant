from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import chromadb
import requests
import json
import os
import shutil
import uuid
from typing import List, Optional
import asyncio
from pathlib import Path

# Document processing imports
import PyPDF2
from docx import Document as DocxDocument
import io

app = FastAPI()

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).parent.parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base" / "documents"
VECTOR_DB_DIR = BASE_DIR / "knowledge_base" / "vector_db"
FRONTEND_DIR = BASE_DIR / "frontend"

# Ensure directories exist
KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)

# ChromaDB client
chroma_client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))
collection_name = "knowledge_base"

try:
    collection = chroma_client.get_collection(collection_name)
except:
    collection = chroma_client.create_collection(collection_name)

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    use_rag: bool = False
    system_prompt: Optional[str] = None
    conversation_history: Optional[List[dict]] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []

class DocumentInfo(BaseModel):
    filename: str
    size: int
    upload_date: str

# Ollama configuration
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "phi3:3.8b"
def extract_text_from_file(file_path: str, filename: str) -> str:
    """Extract text from various file formats"""
    file_extension = filename.lower().split('.')[-1]
    
    try:
        if file_extension == 'pdf':
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        
        elif file_extension in ['docx', 'doc']:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        
        elif file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        
        else:
            return f"Unsupported file format: {file_extension}"
    
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to end at a sentence boundary
        if end < len(text):
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            boundary = max(last_period, last_newline)
            
            if boundary > start + chunk_size // 2:
                chunk = text[start:start + boundary + 1]
                end = start + boundary + 1
        
        chunks.append(chunk.strip())
        start = end - overlap if end < len(text) else end
    
    return [chunk for chunk in chunks if chunk.strip()]
async def query_ollama(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """Query Ollama API"""
    try:
        print(f"Querying Ollama with model: {model}")
        print(f"Prompt length: {len(prompt)}")
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=60  # Reduced timeout
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"Response keys: {response_data.keys()}")
            
            if "response" in response_data:
                return response_data["response"]
            else:
                print(f"Unexpected response format: {response_data}")
                return "Error: Unexpected response format from Ollama"
        else:
            print(f"Error response: {response.text}")
            return f"Error: {response.status_code} - {response.text}"
    
    except requests.exceptions.Timeout:
        print("Ollama request timed out")
        return "Error: Request timed out. The model may be loading, please try again."
    except requests.exceptions.ConnectionError:
        print("Cannot connect to Ollama")
        return "Error: Cannot connect to Ollama. Make sure Ollama is running."
    except Exception as e:
        print(f"Unexpected error: {e}")
        return f"Error communicating with Ollama: {str(e)}"

def search_knowledge_base(query: str, n_results: int = 3) -> List[dict]:
    """Search the knowledge base using ChromaDB"""
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        formatted_results = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                metadata = results['metadatas'][0][i] if results['metadatas'] and results['metadatas'][0] else {}
                formatted_results.append({
                    'content': doc,
                    'source': metadata.get('filename', 'Unknown'),
                    'distance': results['distances'][0][i] if results['distances'] else 0
                })
        
        return formatted_results
    
    except Exception as e:
        print(f"Error searching knowledge base: {e}")
        return []
# API Endpoints
@app.get("/")
async def serve_frontend():
    """Serve the main HTML file"""
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# Mount static files
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests with optional RAG and conversation history"""
    
    sources = []
    context = ""
    
    # If RAG is enabled, search knowledge base
    if request.use_rag:
        search_results = search_knowledge_base(request.message)
        if search_results:
            context = "\n\nRelevant information from knowledge base:\n"
            for result in search_results:
                context += f"- {result['content'][:500]}...\n"
                sources.append(result['source'])
    
    # Build conversation context from history
    conversation_context = ""
    if request.conversation_history:
        conversation_context = "\n\nConversation history:\n"
        for msg in request.conversation_history[-6:]:  # Use last 6 messages for context
            role = "Human" if msg['role'] == 'user' else "Assistant"
            conversation_context += f"{role}: {msg['content']}\n"
    
    # Build the prompt
    system_prompt = request.system_prompt or "You are a helpful AI assistant."
    
    full_prompt = f"""System: {system_prompt}
{conversation_context}
{context}

User: {request.message}"""
    
    # Query Ollama with selected model or default
    selected_model = request.model or DEFAULT_MODEL
    response = await query_ollama(full_prompt, selected_model)
    
    return ChatResponse(response=response, sources=list(set(sources)))

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document for RAG"""
    
    # Check file type
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_extension} not supported. Allowed: {allowed_extensions}"
        )
    
    # Save file
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{file.filename}"
    file_path = KNOWLEDGE_DIR / safe_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract text
    text = extract_text_from_file(str(file_path), file.filename)
    
    if text.startswith("Error") or text.startswith("Unsupported"):
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=text)
    
    # Chunk text
    chunks = chunk_text(text)
    
    # Add to vector database
    ids = [f"{file_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"filename": file.filename, "chunk_index": i} for i in range(len(chunks))]
    
    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )
    
    return {"message": f"Successfully processed {file.filename}", "chunks_created": len(chunks)}
@app.get("/api/documents")
async def list_documents():
    """List all uploaded documents"""
    documents = []
    
    for file_path in KNOWLEDGE_DIR.glob("*"):
        if file_path.is_file():
            # Extract original filename (remove UUID prefix)
            display_name = "_".join(file_path.name.split("_")[1:])
            documents.append({
                "filename": display_name,
                "stored_name": file_path.name,
                "size": file_path.stat().st_size,
                "upload_date": file_path.stat().st_ctime
            })
    
    return {"documents": documents}

@app.delete("/api/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document and its vector embeddings"""
    
    file_path = KNOWLEDGE_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get file ID from filename
    file_id = filename.split("_")[0]
    
    # Remove from vector database
    try:
        # Get all chunk IDs for this file
        results = collection.get()
        chunk_ids_to_delete = [id for id in results['ids'] if id.startswith(file_id)]
        
        if chunk_ids_to_delete:
            collection.delete(ids=chunk_ids_to_delete)
    except Exception as e:
        print(f"Error deleting from vector DB: {e}")
    
    # Remove file
    os.remove(file_path)
    
    return {"message": f"Successfully deleted {filename}"}

@app.get("/api/models")
async def get_models():
    """Get available Ollama models"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        models = response.json().get("models", [])
        model_names = [model["name"] for model in models]
        
        # Use the first available model as current, or DEFAULT_MODEL if none available
        current_model = model_names[0] if model_names else DEFAULT_MODEL
        
        return {
            "models": model_names,
            "current_model": current_model
        }
    except Exception as e:
        return {
            "models": [],
            "current_model": DEFAULT_MODEL,
            "error": str(e)
        }

@app.get("/api/health")
async def health_check():
    """Check if Ollama is running and model is available"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        models = response.json().get("models", [])
        model_names = [model["name"] for model in models]
        
        # Use the first available model as current, or DEFAULT_MODEL if none available
        current_model = model_names[0] if model_names else DEFAULT_MODEL
        
        return {
            "ollama_status": "running",
            "available_models": model_names,
            "current_model": current_model,
            "model_available": True if model_names else False
        }
    except Exception as e:
        return {
            "ollama_status": "error",
            "error": str(e),
            "available_models": [],
            "current_model": DEFAULT_MODEL,
            "model_available": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)