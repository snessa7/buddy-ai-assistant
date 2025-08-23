# AI Assistant for Administrative Work

A local AI assistant designed for administrative and logistics work with document knowledge base support.

## Features

- 🤖 **Local AI Chat**: Uses Ollama for private, local AI conversations
- 📄 **Document Knowledge Base**: Upload PDFs, DOCX, and TXT files for RAG (Retrieval Augmented Generation)
- ⚙️ **Customizable Instructions**: Set custom system prompts for specific work needs
- 🔒 **Privacy First**: Everything runs locally, no data sent to external services
- 🌐 **Browser-Based**: Clean web interface accessible from any browser

## Prerequisites

1. **Python 3.8+** installed on your system
2. **Ollama** installed and running
3. **AI Model** (recommended: `gemma3n:e4b` or `phi3:3.8b`)

## Quick Start

### 1. Install Ollama (if not already installed)
```bash
# macOS
brew install ollama

# Start Ollama
ollama serve
```

### 2. Download AI Model
```bash
# Recommended model for work tasks
ollama pull gemma3n:e4b

# Alternative lightweight model
ollama pull phi3:3.8b
```

### 3. Start the AI Assistant
```bash
# Make startup script executable
chmod +x start.sh

# Run the assistant
./start.sh
```

### 4. Open in Browser
Navigate to: `http://localhost:8000`

## Usage

### Basic Chat
- Type messages in the chat input
- Press **Ctrl+Enter** to send
- Use **Ctrl+/** to focus the chat input
- Use **Ctrl+Shift+C** to clear chat history

### Knowledge Base
1. **Upload Documents**: Drag & drop or click to browse files
2. **Supported Formats**: PDF, DOCX, DOC, TXT
3. **Toggle RAG**: Use the "Use Knowledge Base" switch to enable/disable document search
4. **Manage Documents**: View uploaded files and delete them as needed

### Custom Instructions
- Edit the "Custom Instructions" textarea to customize AI behavior
- Instructions are auto-saved locally
- Default prompt is optimized for administrative work

## Project Structure

```
wife-ai-assistant/
├── backend/
│   └── app.py              # FastAPI backend server
├── frontend/
│   ├── index.html          # Main web interface
│   ├── style.css           # Styling
│   └── script.js           # Frontend logic
├── knowledge_base/
│   ├── documents/          # Uploaded files
│   └── vector_db/          # ChromaDB vector storage
├── requirements.txt        # Python dependencies
├── start.sh               # Startup script
└── README.md              # This file
```

## Configuration

### Model Selection
Edit `backend/app.py` to change the default model:
```python
DEFAULT_MODEL = "gemma3n:e4b"  # Change to your preferred model
```

### Port Configuration
The server runs on port 8000 by default. To change:
```python
# In backend/app.py, modify the last line:
uvicorn.run(app, host="0.0.0.0", port=YOUR_PORT)
```

## Troubleshooting

### "Ollama not running"
- Start Ollama: `ollama serve`
- Check if running: `curl http://localhost:11434/api/version`

### "Model not available"
- List available models: `ollama list`
- Pull the required model: `ollama pull gemma3n:e4b`

### "Connection error"
- Ensure the backend server is running
- Check if port 8000 is available
- Try accessing http://localhost:8000 directly

### Document Upload Issues
- Ensure file is PDF, DOCX, DOC, or TXT format
- Check file isn't corrupted
- Large files may take time to process

## Advanced Usage

### Multiple Models
You can test different models by stopping the server and changing `DEFAULT_MODEL` in `backend/app.py`:

- **Fast & Light**: `qwen2.5:0.5b`
- **Balanced**: `phi3:3.8b`
- **Best Quality**: `gemma3n:e4b` or `llama3.1:8b`

### Custom System Prompts
Tailor the AI for specific tasks:

**Email Assistant**:
```
You are an email writing assistant. Help compose professional, clear, and concise business emails. Always maintain a professional tone.
```

**Meeting Notes**:
```
You are a meeting notes assistant. Help organize and summarize meeting discussions, action items, and decisions clearly.
```

### Keyboard Shortcuts
- **Ctrl+Enter**: Send message
- **Ctrl+/**: Focus chat input
- **Ctrl+Shift+C**: Clear chat history

## Security Notes

- All data stays local on your machine
- No internet connection required after setup
- Documents are stored locally in `knowledge_base/documents/`
- Vector embeddings stored locally in `knowledge_base/vector_db/`

## Support

This is a custom-built tool. For issues:
1. Check the troubleshooting section above
2. Verify Ollama is running with the correct model
3. Check console output for error messages