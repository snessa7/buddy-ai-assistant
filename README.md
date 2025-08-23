# 🚀 Buddy - Monique's AI Assistant

A personalized AI assistant built specifically for Monique's administrative and logistics work, featuring a beautiful Apple Messages-style chat interface, sticky notes system, and weather widget.

## 🔗 Important Links

- **🏠 Repository**: `https://github.com/snessa7/buddy-ai-assistant`
- **🌐 Live Site**: `https://snessa7.github.io/buddy-ai-assistant` (when deployed)
- **🔧 Local Access**: `http://localhost:8000`
- **📋 Deployment Status**: [GitHub Actions](https://github.com/snessa7/buddy-ai-assistant/actions)
- **📖 Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

## ⚡ Current Status

- ✅ **Local Development**: Fully functional
- ✅ **Frontend Deployment**: GitHub Actions configured
- ⏳ **Frontend Live**: Workflow in queue (GitHub Actions)
- 🔄 **Backend Deployment**: Ready for Railway setup
- 🎯 **Goal**: Remote access for Monique's work computer

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

### **🌐 Remote Deployment (In Progress)**

Monique can access Buddy from anywhere! We're setting up cloud deployment:

**Current Status:**
- ✅ **Frontend**: GitHub Pages deployment configured (workflow in queue)
- ⏳ **Backend**: Ready for Railway deployment
- 🎯 **Goal**: `https://snessa7.github.io/buddy-ai-assistant`

**Deployment Progress:**
1. ✅ Created GitHub Actions workflow for automatic frontend deployment
2. ⏳ GitHub Actions workflow is queued (typical wait: 5-15 minutes for free accounts)
3. 🔄 **Next**: Deploy backend to Railway
4. 🔄 **Final**: Configure frontend to use remote backend

**Access URLs:**
- **Local Development**: `http://localhost:8000`
- **Remote Frontend** (when ready): `https://snessa7.github.io/buddy-ai-assistant`

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

### **Local Development Issues**

#### **Backend Won't Start**
- Check if port 8000 is available: `lsof -i :8000`
- Kill any existing processes: `pkill -f "python backend/app.py"`
- Restart with: `source venv/bin/activate && python backend/app.py`

#### **Ollama Connection Issues**
- Ensure Ollama is running: `ollama serve`
- Check if models are downloaded: `ollama list`
- Download a model: `ollama pull llama3.2:latest`

#### **Sticky Notes Not Working**
- Check browser console for JavaScript errors
- Ensure all files are properly loaded
- Try refreshing the page

### **Deployment Issues**

#### **GitHub Actions Workflow Stuck**
- **Status**: Check [Actions Tab](https://github.com/snessa7/buddy-ai-assistant/actions)
- **Queue**: Free accounts may wait 5-15 minutes
- **Alternative**: Manual Pages setup (see DEPLOYMENT.md)

#### **GitHub Pages Not Loading**
- Wait for workflow to complete successfully
- Check if `gh-pages` branch exists
- Verify Pages settings: Repository → Settings → Pages

#### **Frontend Shows Errors**
- Check browser console for config.js loading issues
- Verify API URL configuration in `frontend/config.js`
- Test local backend connection first

### **Checking Deployment Status**
1. **GitHub Actions**: [View Workflow Runs](https://github.com/snessa7/buddy-ai-assistant/actions)
2. **GitHub Pages**: Repository Settings → Pages
3. **Live Site**: `https://snessa7.github.io/buddy-ai-assistant` (when ready)

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
- **Accessible Anywhere**: Cloud deployment for work computer access

## 🚀 Next Steps

### **For Immediate Use (Local)**
1. **Start the backend**: `source venv/bin/activate && python backend/app.py`
2. **Open browser**: `http://localhost:8000`
3. **Start chatting**: Buddy is ready to help Monique!

### **For Remote Access (In Progress)**
1. **Wait for GitHub Actions**: Check [workflow status](https://github.com/snessa7/buddy-ai-assistant/actions)
2. **Deploy backend to Railway**: Follow [DEPLOYMENT.md](DEPLOYMENT.md) guide
3. **Update configuration**: Point frontend to Railway backend
4. **Share with Monique**: `https://snessa7.github.io/buddy-ai-assistant`

### **Upcoming Enhancements**
- **Backend cloud hosting**: Railway deployment
- **Environment switching**: Easy local/remote toggle
- **Persistent storage**: Cloud database for sticky notes
- **Mobile optimization**: Perfect for Monique's phone

## 📞 Support

### **For Development Issues**
- Check the troubleshooting section above
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup
- Monitor [GitHub Actions](https://github.com/snessa7/buddy-ai-assistant/actions) for deployment status

### **For Monique**
- **Local access**: `http://localhost:8000`
- **Remote access**: `https://snessa7.github.io/buddy-ai-assistant` (when ready)
- **Getting started**: Click the settings gear ⚙️ to customize Buddy
- **Help**: All features have tooltips and helpful hints

## 🤝 Contributing

This is a personal project for Monique, but suggestions and improvements are welcome!

## 📄 License

Personal use project - built with ❤️ for Monique

---

## 🎯 Quick Start Commands

```bash
# Start local development
source venv/bin/activate && python backend/app.py

# Check deployment status
curl https://snessa7.github.io/buddy-ai-assistant

# Monitor GitHub Actions
# Visit: https://github.com/snessa7/buddy-ai-assistant/actions
```

**🎉 Ready to boost productivity? Buddy is here to help Monique manage her administrative work efficiently!**