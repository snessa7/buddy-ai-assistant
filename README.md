# 🚀 Buddy - Monique's AI Assistant

A personalized AI assistant built specifically for Monique's administrative and logistics work, featuring a beautiful Apple Messages-style chat interface, sticky notes system, and weather widget.

## ✨ Features

### 🤖 **AI Chat Assistant**
- **Personalized for Monique**: Buddy is configured specifically for administrative and logistics tasks
- **Apple Messages Style**: Beautiful, intuitive chat interface with chat bubbles
- **Knowledge Base Integration**: Upload and reference documents (PDF, DOCX, TXT)
- **Model Selection**: Choose from available Ollama models
- **Custom Instructions**: Tailor Buddy's responses to your preferences

### 📝 **Sticky Notes System**
- **Quick Note Creation**: Type and save notes instantly
- **Color Coding**: 5 beautiful colors (yellow, blue, pink, green, orange)
- **Inline Editing**: Click any note to edit directly
- **Search Functionality**: Find notes quickly with real-time search
- **No More Lost Notes**: Digital organization for your desk clutter

### 🌤️ **Weather Widget**
- **Vancouver, WA Weather**: Real-time weather updates
- **Beautiful Animations**: Engaging visual effects
- **Click to Refresh**: Get latest weather data
- **Temperature in Fahrenheit**: Easy to read

### 🔐 **Security & Privacy**
- **100% Local**: Everything runs on your computer
- **No Data Sharing**: Your information never leaves your device
- **Secure**: Local AI processing with Ollama

## 🚀 Quick Start

### **Local Development**

#### Prerequisites
- Python 3.8+
- Ollama installed and running
- At least one AI model downloaded (e.g., `llama3.2:latest`)

#### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wife-ai-assistant
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the application**
   ```bash
   python backend/app.py
   ```

5. **Open in browser**
   ```
   http://localhost:8000
   ```

### **🌐 Remote Deployment (Recommended)**

Want Monique to access Buddy from anywhere? Deploy to the cloud!

**Quick Deploy:**
1. **Backend**: Deploy to [Railway](https://railway.app) (free tier)
2. **Frontend**: Automatically deploys to GitHub Pages
3. **Access**: `https://yourusername.github.io/repository-name`

**Full Instructions**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed steps!

## 📖 How to Use

### **Starting a Chat**
1. Open the application at `http://localhost:8000`
2. Type your message in the chat input
3. Press **Enter** to send, **Shift+Enter** for new lines
4. Buddy will respond with personalized assistance

### **Creating Sticky Notes**
1. Click the **"📝 Sticky Notes"** button in the header
2. Type your note in the textarea
3. Choose a color from the color picker
4. Click **"Add Note"** to save

### **Managing Sticky Notes**
- **Edit**: Click any note to edit inline
- **Delete**: Click the 🗑️ button on any note
- **Search**: Use the search box to find specific notes
- **Color Change**: Select different colors when creating/editing

### **Uploading Documents**
1. Click **"⚙️ Settings"** in the header
2. Drag and drop files or click to browse
3. Supported formats: PDF, DOCX, TXT
4. Buddy can now reference these documents in conversations

### **Changing AI Models**
1. Open **Settings** (⚙️)
2. Select your preferred model from the dropdown
3. Your choice is automatically saved

## 🛠️ Configuration

### **Environment Variables**
- `OLLAMA_BASE_URL`: Ollama server URL (default: `http://localhost:11434`)
- `DEFAULT_MODEL`: Default AI model (default: `llama3.2:latest`)

### **Customizing Buddy**
- **AI Instructions**: Modify how Buddy responds in Settings
- **Model Selection**: Choose the AI model that works best for you
- **Knowledge Base**: Upload relevant documents for context

## 🔧 Troubleshooting

### **Backend Won't Start**
- Check if port 8000 is available: `lsof -i :8000`
- Kill any existing processes: `pkill -f "python backend/app.py"`

### **Ollama Connection Issues**
- Ensure Ollama is running: `ollama serve`
- Check if models are downloaded: `ollama list`
- Download a model: `ollama pull llama3.2:latest`

### **Sticky Notes Not Working**
- Check browser console for JavaScript errors
- Ensure all files are properly loaded
- Try refreshing the page

## 📁 Project Structure

```
wife-ai-assistant/
├── backend/
│   └── app.py              # FastAPI backend server
├── frontend/
│   ├── index.html          # Main HTML interface
│   ├── style.css           # Styling and animations
│   └── script.js           # Frontend functionality
├── knowledge_base/
│   ├── documents/          # Uploaded document storage
│   └── vector_db/          # Vector database for RAG
├── venv/                   # Python virtual environment
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🌟 Key Features for Monique

- **Simple & Fast**: No complex interfaces to learn
- **Familiar Design**: Looks like her favorite messaging apps
- **Quick Notes**: Perfect for phone calls and meetings
- **Organized**: No more lost sticky notes
- **Professional**: Clean, beautiful interface
- **Local**: Everything stays on her computer

## 🤝 Contributing

This is a personal project for Monique, but suggestions and improvements are welcome!

## 📄 License

Personal use project - built with ❤️ for Monique

---

**🎯 Ready to boost your productivity? Open `http://localhost:8000` and start chatting with Buddy!**