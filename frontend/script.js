// Global variables
const API_BASE = '';
let isLoading = false;
let conversationHistory = [];

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const ragToggle = document.getElementById('rag-toggle');
const ragIndicator = document.getElementById('rag-indicator');
const ragStatusText = document.getElementById('rag-status-text');
const systemPrompt = document.getElementById('system-prompt');
const modelSelector = document.getElementById('model-selector');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const documentsList = document.getElementById('documents-list');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Sidebar elements
const settingsToggle = document.getElementById('settings-toggle');
const settingsSidebar = document.getElementById('settings-sidebar');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSidebar = document.getElementById('close-sidebar');
const chatContainer = document.querySelector('.chat-container');

// Control buttons
const exportButton = document.getElementById('export-conversation');
const clearButton = document.getElementById('clear-conversation');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkHealth();
    loadModels();
    loadDocuments();
    loadConversationHistory();
    setupEventListeners();
    setupAutoResize();
    updateRAGStatus();
});

// Load conversation history from localStorage
function loadConversationHistory() {
    const saved = localStorage.getItem('ai-assistant-conversation');
    if (saved) {
        try {
            conversationHistory = JSON.parse(saved);
            // Restore messages to UI
            const welcomeMessage = chatMessages.querySelector('.welcome-message');
            if (welcomeMessage && conversationHistory.length > 0) {
                welcomeMessage.remove();
            }
            
            conversationHistory.forEach(msg => {
                addMessageToUI(msg.content, msg.role, msg.sources);
            });
        } catch (e) {
            console.error('Error loading conversation history:', e);
            conversationHistory = [];
        }
    }
}

// Save conversation history to localStorage
function saveConversationHistory() {
    try {
        localStorage.setItem('ai-assistant-conversation', JSON.stringify(conversationHistory));
    } catch (e) {
        console.error('Error saving conversation history:', e);
    }
}

// Add message to conversation history
function addToHistory(content, role, sources = []) {
    conversationHistory.push({
        content,
        role,
        sources,
        timestamp: new Date().toISOString()
    });
    saveConversationHistory();
}

// Health check
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        
        if (data.ollama_status === 'running' && data.model_available) {
            statusDot.classList.add('connected');
            statusText.textContent = `Connected (${data.current_model})`;
        } else {
            statusText.textContent = data.ollama_status === 'running' 
                ? `Model ${data.current_model} not available` 
                : 'Ollama not running';
        }
    } catch (error) {
        statusText.textContent = 'Connection error';
        console.error('Health check failed:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Chat input and send
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Allow Shift+Enter for new lines
                return;
            }
            e.preventDefault();
            sendMessage();
        }
    });

    // RAG toggle
    ragToggle.addEventListener('change', updateRAGStatus);

    // Sidebar controls
    settingsToggle.addEventListener('click', openSidebar);
    closeSidebar.addEventListener('click', closeSidebarPanel);
    settingsOverlay.addEventListener('click', closeSidebarPanel);

    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Control buttons
    exportButton.addEventListener('click', exportConversation);
    clearButton.addEventListener('click', clearConversation);

    // Auto-save system prompt
    let systemPromptTimeout;
    systemPrompt.addEventListener('input', () => {
        clearTimeout(systemPromptTimeout);
        systemPromptTimeout = setTimeout(() => {
            localStorage.setItem('ai-assistant-system-prompt', systemPrompt.value);
        }, 1000);
    });

    // Load saved system prompt
    const savedPrompt = localStorage.getItem('ai-assistant-system-prompt');
    if (savedPrompt) {
        systemPrompt.value = savedPrompt;
    } else {
        // Set default personalized prompt for Monique
        systemPrompt.value = "You are Buddy, Monique's personal AI assistant for administrative and logistics work. Be friendly, professional, and focus on practical solutions that help Monique efficiently manage her tasks.";
    }

    // Auto-save model selection
    modelSelector.addEventListener('change', () => {
        localStorage.setItem('ai-assistant-selected-model', modelSelector.value);
    });

    // Load saved model selection
    const savedModel = localStorage.getItem('ai-assistant-selected-model');
    if (savedModel) {
        // Set the saved model after models are loaded
        setTimeout(() => {
            if (modelSelector.querySelector(`option[value="${savedModel}"]`)) {
                modelSelector.value = savedModel;
            }
        }, 100);
    }
}

// Update RAG status indicator
function updateRAGStatus() {
    const isEnabled = ragToggle.checked;
    ragStatusText.textContent = isEnabled ? 'Knowledge base: ON' : 'Knowledge base: OFF';
    const dot = ragIndicator.querySelector('.indicator-dot');
    
    if (isEnabled) {
        dot.classList.remove('disabled');
        ragStatusText.style.color = 'var(--success)';
    } else {
        dot.classList.add('disabled');
        ragStatusText.style.color = 'var(--text-muted)';
    }
}

// Sidebar functions
function openSidebar() {
    settingsSidebar.classList.add('open');
    settingsOverlay.classList.add('active');
    chatContainer.classList.add('sidebar-open');
    document.body.style.overflow = 'hidden';
}

function closeSidebarPanel() {
    settingsSidebar.classList.remove('open');
    settingsOverlay.classList.remove('active');
    chatContainer.classList.remove('sidebar-open');
    document.body.style.overflow = '';
}

// Auto-resize textarea
function setupAutoResize() {
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Chat functionality
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || isLoading) return;

    // Add user message to chat and history
    addMessageToUI(message, 'user');
    addToHistory(message, 'user');
    
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Show loading
    const loadingId = showLoading();
    isLoading = true;
    sendButton.disabled = true;

    try {
        const selectedModel = modelSelector.value || null;
        
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                use_rag: ragToggle.checked,
                system_prompt: systemPrompt.value.trim() || null,
                model: selectedModel,
                conversation_history: conversationHistory.slice(-10) // Send last 10 messages for context
            })
        });

        const data = await response.json();
        
        // Remove loading message
        removeLoading(loadingId);
        
        if (response.ok) {
            addMessageToUI(data.response, 'assistant', data.sources);
            addToHistory(data.response, 'assistant', data.sources);
        } else {
            const errorMsg = `Error: ${data.detail || 'Unknown error'}`;
            addMessageToUI(errorMsg, 'assistant');
            addToHistory(errorMsg, 'assistant');
        }
    } catch (error) {
        removeLoading(loadingId);
        const errorMsg = `Connection error: ${error.message}`;
        addMessageToUI(errorMsg, 'assistant');
        addToHistory(errorMsg, 'assistant');
    } finally {
        isLoading = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// Add message to UI
function addMessageToUI(content, sender, sources = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);

    // Add sources if available
    if (sources && sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'message-sources';
        sourcesDiv.innerHTML = `<strong>📚 Sources:</strong> ${sources.join(', ')}`;
        messageDiv.appendChild(sourcesDiv);
    }

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show loading indicator
function showLoading() {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content loading-message';
    contentDiv.innerHTML = `
        <span>Thinking</span>
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    loadingDiv.appendChild(contentDiv);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return loadingId;
}

// Remove loading indicator
function removeLoading(loadingId) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Export conversation
function exportConversation() {
    if (conversationHistory.length === 0) {
        showNotification('No conversation to export', 'warning');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ai-conversation-${timestamp}.json`;
    
    const exportData = {
        exportDate: new Date().toISOString(),
        messageCount: conversationHistory.length,
        conversation: conversationHistory
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Conversation exported successfully! 📤', 'success');
    closeSidebarPanel();
}

// Clear conversation
function clearConversation() {
    if (conversationHistory.length === 0) {
        showNotification('No conversation to clear', 'warning');
        return;
    }

    if (confirm('Are you sure you want to clear the entire conversation history? This cannot be undone.')) {
        conversationHistory = [];
        saveConversationHistory();
        
        // Clear UI messages
        const messages = chatMessages.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Add back welcome message
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-content">
                    <h3>💫 Hi Monique! I'm Buddy</h3>
                    <p>I'm here to help you with your work and administrative tasks. I can search through your documents, follow your custom instructions, and keep everything completely secure.</p>
                    <p class="security-note">🔐 <strong>Everything runs locally on your computer</strong> - your data never leaves your device and stays 100% private!</p>
                    <p class="welcome-cta">Start by saying hello, or click Settings to upload documents! 👋</p>
                </div>
            </div>
        `;
        
        showNotification('Conversation cleared! 🗑️', 'success');
        closeSidebarPanel();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '1000',
        animation: 'slideInRight 0.3s ease',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid transparent'
    });

    // Set colors based on type
    if (type === 'success') {
        notification.style.background = 'rgba(74, 222, 128, 0.1)';
        notification.style.color = 'var(--success)';
        notification.style.borderColor = 'rgba(74, 222, 128, 0.3)';
    } else if (type === 'warning') {
        notification.style.background = 'rgba(251, 191, 36, 0.1)';
        notification.style.color = 'var(--warning)';
        notification.style.borderColor = 'rgba(251, 191, 36, 0.3)';
    } else if (type === 'error') {
        notification.style.background = 'rgba(248, 113, 113, 0.1)';
        notification.style.color = 'var(--error)';
        notification.style.borderColor = 'rgba(248, 113, 113, 0.3)';
    }

    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// File upload handling
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    uploadFiles(files);
    e.target.value = ''; // Reset input
}

// Upload files
async function uploadFiles(files) {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    
    for (const file of files) {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(extension)) {
            showUploadStatus(`File "${file.name}" is not supported. Allowed types: ${allowedTypes.join(', ')}`, 'error');
            continue;
        }

        try {
            showUploadStatus(`Uploading "${file.name}"...`, 'info');
            
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showUploadStatus(`Successfully uploaded "${file.name}" (${result.chunks_created} chunks created)`, 'success');
                loadDocuments(); // Refresh document list
            } else {
                showUploadStatus(`Failed to upload "${file.name}": ${result.detail}`, 'error');
            }
        } catch (error) {
            showUploadStatus(`Error uploading "${file.name}": ${error.message}`, 'error');
        }
    }
}

// Show upload status
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type}`;
    uploadStatus.style.display = 'block';
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 5000);
    }
}

// Load available models
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/api/models`);
        const data = await response.json();
        
        if (data.models && data.models.length > 0) {
            // Clear existing options
            modelSelector.innerHTML = '';
            
            // Add models to selector
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelector.appendChild(option);
            });
            
            // Set default model if available
            if (data.current_model && data.models.includes(data.current_model)) {
                modelSelector.value = data.current_model;
            } else if (data.models.length > 0) {
                modelSelector.value = data.models[0];
            }
        } else {
            modelSelector.innerHTML = '<option value="">No models available</option>';
        }
    } catch (error) {
        console.error('Failed to load models:', error);
        modelSelector.innerHTML = '<option value="">Error loading models</option>';
    }
}

// Load documents list
async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE}/api/documents`);
        const data = await response.json();
        
        displayDocuments(data.documents);
    } catch (error) {
        console.error('Failed to load documents:', error);
    }
}

// Display documents
function displayDocuments(documents) {
    if (!documents || documents.length === 0) {
        documentsList.innerHTML = '<p class="no-documents">No documents uploaded yet</p>';
        return;
    }

    documentsList.innerHTML = documents.map(doc => `
        <div class="document-item">
            <div class="document-info">
                <div class="document-name">${escapeHtml(doc.filename)}</div>
                <div class="document-size">${formatBytes(doc.size)}</div>
            </div>
            <button class="delete-button" onclick="deleteDocument('${escapeHtml(doc.stored_name)}', '${escapeHtml(doc.filename)}')">
                ✕
            </button>
        </div>
    `).join('');
}

// Delete document
async function deleteDocument(storedName, displayName) {
    if (!confirm(`Are you sure you want to delete "${displayName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(storedName)}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showUploadStatus(`Successfully deleted "${displayName}"`, 'success');
            loadDocuments(); // Refresh document list
        } else {
            showUploadStatus(`Failed to delete "${displayName}": ${result.detail}`, 'error');
        }
    } catch (error) {
        showUploadStatus(`Error deleting "${displayName}": ${error.message}`, 'error');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus chat input with Ctrl+/
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        chatInput.focus();
        closeSidebarPanel();
    }
    
    // Clear chat with Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearConversation();
    }

    // Toggle settings with Ctrl+,
    if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        if (settingsSidebar.classList.contains('open')) {
            closeSidebarPanel();
        } else {
            openSidebar();
        }
    }

    // Close sidebar with Escape
    if (e.key === 'Escape' && settingsSidebar.classList.contains('open')) {
        e.preventDefault();
        closeSidebarPanel();
    }
});

// Periodic health check
setInterval(checkHealth, 30000); // Check every 30 seconds

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);