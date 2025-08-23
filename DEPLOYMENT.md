# 🚀 Deployment Guide for Buddy AI Assistant

This guide will help you deploy Buddy AI Assistant so Monique can access it from anywhere!

## 📋 **Prerequisites**

- GitHub account
- Railway account (free tier available)
- Ollama running on Railway (or use a cloud Ollama service)

## 🎯 **Deployment Options**

### **Option A: Full Cloud Deployment (Recommended)**
- Frontend: GitHub Pages
- Backend: Railway
- Ollama: Railway or cloud service

### **Option B: Hybrid Deployment**
- Frontend: GitHub Pages
- Backend: Railway
- Ollama: Your local machine (requires port forwarding)

## 🚀 **Step 1: Deploy Backend to Railway**

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create a new project

2. **Connect Your Repository**
   - Click "Deploy from GitHub repo"
   - Select your `wife-ai-assistant` repository
   - Railway will detect it's a Python app

3. **Configure Environment Variables**
   ```bash
   OLLAMA_URL=https://your-ollama-service.railway.app
   DEFAULT_MODEL=llama3.2:latest
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Note the generated URL (e.g., `https://your-app-name.railway.app`)

## 🌐 **Step 2: Deploy Frontend to GitHub Pages**

1. **Enable GitHub Pages**
   - Go to your repository Settings
   - Scroll to "Pages" section
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` (will be created automatically)

2. **Update Configuration**
   - Edit `frontend/config.js`
   - Change `remote.apiUrl` to your Railway URL
   - Change `current: 'remote'` to use remote backend

3. **Push Changes**
   ```bash
   git add .
   git commit -m "🚀 Configure for remote deployment"
   git push origin main
   ```

4. **Wait for Deployment**
   - GitHub Actions will automatically deploy to `gh-pages` branch
   - Your site will be available at: `https://yourusername.github.io/repository-name`

## 🔧 **Step 3: Configure Ollama**

### **Option A: Use Railway Ollama Service**
1. Deploy Ollama to Railway
2. Set `OLLAMA_URL` to your Railway Ollama service
3. Pull models: `ollama pull llama3.2:latest`

### **Option B: Use Local Ollama with Port Forwarding**
1. Install ngrok: `brew install ngrok`
2. Forward Ollama port: `ngrok http 11434`
3. Set `OLLAMA_URL` to the ngrok URL

## ✅ **Step 4: Test Deployment**

1. **Frontend**: Visit your GitHub Pages URL
2. **Backend**: Test API endpoints
3. **Chat**: Send a test message
4. **Sticky Notes**: Create a test note

## 🔄 **Switching Between Local and Remote**

### **Use Local Backend**
```javascript
// In frontend/config.js
current: 'local'
```

### **Use Remote Backend**
```javascript
// In frontend/config.js
current: 'remote'
```

## 🚨 **Troubleshooting**

### **Frontend Not Loading**
- Check GitHub Pages deployment status
- Verify `gh-pages` branch exists
- Check browser console for errors

### **Backend Connection Failed**
- Verify Railway app is running
- Check environment variables
- Test API endpoints directly

### **Ollama Not Working**
- Ensure Ollama service is accessible
- Check model availability
- Verify API endpoints

## 📱 **Access from Anywhere**

Once deployed:
- **Monique's Work Computer**: `https://yourusername.github.io/repository-name`
- **Your Local Development**: `http://localhost:8000`
- **Mobile Devices**: Same GitHub Pages URL

## 🔒 **Security Notes**

- **Railway**: Free tier has limitations, consider paid for production
- **GitHub Pages**: Public repository = public code (but not data)
- **Ollama**: Consider using cloud Ollama service for production

## 🎉 **Success!**

Monique can now access Buddy from:
- Her work computer
- Her phone
- Any device with internet access

The app will work exactly the same, but now it's accessible from anywhere!

---

**Need help?** Check the troubleshooting section or create an issue in your repository.
