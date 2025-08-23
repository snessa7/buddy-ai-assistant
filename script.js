// Global variables
let API_BASE = '';
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
const weatherWidget = document.getElementById('weather-widget');
const weatherIcon = document.getElementById('weather-icon');
const weatherTemp = document.getElementById('weather-temp');
const stickyNotesToggle = document.getElementById('sticky-notes-toggle');
const stickyNotesModal = document.getElementById('sticky-notes-modal');
const stickyNotesBackdrop = document.getElementById('sticky-notes-backdrop');
const closeStickyNotes = document.getElementById('close-sticky-notes');
const addNoteBtn = document.getElementById('add-note-btn');
const quickNoteInput = document.getElementById('quick-note-input');
const notesGrid = document.getElementById('notes-grid');
const notesSearch = document.getElementById('notes-search');

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
document.addEventListener('DOMContentLoaded', async function() {
    // Load configuration and set API base
    try {
        const config = await import('./config.js');
        API_BASE = config.default.getApiUrl();
        console.log(`Using API: ${config.default.getDescription()} - ${API_BASE}`);
    } catch (e) {
        // Fallback to local if config fails to load
        API_BASE = 'http://localhost:8000';
        console.log('Config load failed, using local API:', API_BASE);
    }
    
    checkHealth();
    loadModels();
    loadDocuments();
    loadConversationHistory();
    loadWeather();
    loadStickyNotes();
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
        systemPrompt.value = "You are Buddy, Monique's personal AI assistant for administrative and logistics work. Be friendly, professional, and focus on practical solutions that help Monique efficiently manage her tasks. You can also help Monique with her sticky notes - she has a digital sticky note system where she can create, edit, search, and organize notes. You can help her find specific notes, suggest organization strategies, and remind her about important notes she might have forgotten.";
    }

    // Auto-save model selection
    modelSelector.addEventListener('change', () => {
        localStorage.setItem('ai-assistant-selected-model', modelSelector.value);
    });

    // Weather widget click to refresh
    weatherWidget.addEventListener('click', loadWeather);
    
    // Sticky notes functionality
    if (stickyNotesToggle) {
        stickyNotesToggle.addEventListener('click', openStickyNotesModal);
    }
    if (closeStickyNotes) {
        closeStickyNotes.addEventListener('click', closeStickyNotesModal);
    }
    if (stickyNotesBackdrop) {
        stickyNotesBackdrop.addEventListener('click', closeStickyNotesModal);
    }
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', addQuickNote);
    }
    if (notesSearch) {
        notesSearch.addEventListener('input', filterNotes);
    }
    
    // Color picker functionality
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
        });
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

    // Reset stop flag
    window.stopResponseFlag = false;

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
            // Add AI response to UI
            const messageElement = addMessageToUI(data.response, 'assistant', data.sources);
            
            // Show stop button during response
            const stopBtn = messageElement.querySelector('.stop-btn');
            if (stopBtn) {
                stopBtn.style.display = 'inline-block';
                
                // Check if response was stopped
                if (window.stopResponseFlag) {
                    stopBtn.style.display = 'none';
                    return;
                }
            }
            
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
        window.stopResponseFlag = false;
    }
}

// Add message to UI
function addMessageToUI(content, sender, sources = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    // Add action buttons for AI messages
    if (sender === 'assistant') {
        const actionBar = document.createElement('div');
        actionBar.className = 'message-actions';
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.onclick = () => copyToClipboard(content);
        
        // Stop button (only show while streaming)
        const stopBtn = document.createElement('button');
        stopBtn.className = 'action-btn stop-btn';
        stopBtn.innerHTML = '⏹️';
        stopBtn.title = 'Stop response';
        stopBtn.style.display = 'none';
        stopBtn.onclick = () => stopResponse();
        
        actionBar.appendChild(copyBtn);
        actionBar.appendChild(stopBtn);
        messageDiv.appendChild(actionBar);
    }

    messageDiv.appendChild(contentDiv);

    // Add sources if available
    if (sources && sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'message-sources';
        sourcesDiv.innerHTML = `<strong>📚 Sources:</strong> ${sources.join(', ')}`;
        messageDiv.appendChild(sourcesDiv);
    }

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.message.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// Sticky Notes Functions
let selectedColor = 'yellow';
let allNotes = [];

async function loadStickyNotes() {
    try {
        const response = await fetch(`${API_BASE}/api/sticky-notes`);
        const data = await response.json();
        allNotes = data.notes || [];
        renderStickyNotes(allNotes);
    } catch (error) {
        console.error('Failed to load sticky notes:', error);
        // Show some sample notes for demo
        allNotes = [
            { id: 1, content: "Call John about order #1234", color: "yellow" },
            { id: 2, content: "Meeting with team at 2 PM", color: "blue" },
            { id: 3, content: "Pick up dry cleaning", color: "pink" },
            { id: 4, content: "Review SOP documents", color: "green" }
        ];
        renderStickyNotes(allNotes);
    }
}

function renderStickyNotes(notes) {
    if (!notesGrid) return;
    
    notesGrid.innerHTML = '';
    
    if (notes.length === 0) {
        notesGrid.innerHTML = '<div class="no-notes">No sticky notes yet. Create your first note above! 📝</div>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = createStickyNoteElement(note);
        notesGrid.appendChild(noteElement);
    });
}

function createStickyNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = `sticky-note ${note.color}`;
    noteDiv.dataset.noteId = note.id;
    
    noteDiv.innerHTML = `
        <div class="note-content">${note.content}</div>
        <div class="note-actions">
            <button class="action-btn delete-btn" title="Delete note">🗑️</button>
        </div>
    `;
    
    // Add click to edit functionality
    noteDiv.addEventListener('click', (e) => {
        if (!e.target.classList.contains('action-btn')) {
            editNoteInline(noteDiv, note);
        }
    });
    
    // Add delete functionality
    noteDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
    });
    
    return noteDiv;
}

function addQuickNote() {
    if (!quickNoteInput) return;
    
    const content = quickNoteInput.value.trim();
    if (!content) {
        showNotification('Please enter some content for your note', 'error');
        return;
    }
    
    createNote(content, selectedColor);
    quickNoteInput.value = '';
}

async function createNote(content, color) {
    try {
        const response = await fetch(`${API_BASE}/api/sticky-notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, color })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            showNotification('Note created! 📝', 'success');
            loadStickyNotes(); // Reload to show new note
        } else {
            showNotification('Failed to create note', 'error');
        }
    } catch (error) {
        console.error('Error creating note:', error);
        showNotification('Failed to create note', 'error');
    }
}

function editNoteInline(noteElement, note) {
    const contentDiv = noteElement.querySelector('.note-content');
    const originalContent = contentDiv.textContent;
    
    // Create textarea for editing
    const textarea = document.createElement('textarea');
    textarea.value = originalContent;
    textarea.className = 'inline-edit-textarea';
    textarea.style.cssText = `
        width: 100%;
        border: none;
        background: transparent;
        resize: none;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
        line-height: 1.4;
        padding: 0;
        margin: 0;
        outline: none;
    `;
    
    // Replace content with textarea
    contentDiv.innerHTML = '';
    contentDiv.appendChild(textarea);
    textarea.focus();
    
    // Auto-resize textarea
    textarea.style.height = textarea.scrollHeight + 'px';
    
    // Save on blur or enter
    const saveEdit = async () => {
        const newContent = textarea.value.trim();
        if (newContent && newContent !== originalContent) {
            await updateNote(note.id, newContent, note.color);
        } else {
            contentDiv.textContent = originalContent;
        }
    };
    
    textarea.addEventListener('blur', saveEdit);
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        }
        if (e.key === 'Escape') {
            contentDiv.textContent = originalContent;
        }
    });
}

async function updateNote(noteId, content, color) {
    try {
        const response = await fetch(`${API_BASE}/api/sticky-notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, color })
        });
        
        if (response.ok) {
            showNotification('Note updated! ✏️', 'success');
            loadStickyNotes();
        } else {
            showNotification('Failed to update note', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showNotification('Failed to update note', 'error');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Delete this note?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/sticky-notes/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Note deleted! 🗑️', 'success');
            loadStickyNotes();
        } else {
            showNotification('Failed to delete note', 'error');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showNotification('Failed to delete note', 'error');
    }
}

function filterNotes() {
    if (!notesSearch) return;
    
    const searchTerm = notesSearch.value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        note.content.toLowerCase().includes(searchTerm)
    );
    renderStickyNotes(filteredNotes);
}

function openStickyNotesModal() {
    if (stickyNotesModal) {
        stickyNotesModal.classList.add('show');
        loadStickyNotes(); // Load notes when opening
        
        // Close settings sidebar if open
        if (settingsSidebar && settingsSidebar.classList.contains('open')) {
            closeSidebarPanel();
        }
    }
}

function closeStickyNotesModal() {
    if (stickyNotesModal) {
        stickyNotesModal.classList.remove('show');
    }
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard! 📋', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard! 📋', 'success');
    }
}

// Stop AI response
function stopResponse() {
    // Set a flag to stop the response
    window.stopResponseFlag = true;
    showNotification('Response stopped ⏹️', 'info');
    
    // Hide all stop buttons
    const stopBtns = document.querySelectorAll('.stop-btn');
    stopBtns.forEach(btn => btn.style.display = 'none');
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

// Load weather data for Vancouver, WA
async function loadWeather() {
    try {
        weatherWidget.classList.add('loading');
        
        // Fetch weather from our backend API
        const response = await fetch(`${API_BASE}/api/weather`);
        const weatherData = await response.json();
        
        if (weatherData.error) {
            throw new Error(weatherData.error);
        }
        
        updateWeatherDisplay(weatherData);
        
    } catch (error) {
        console.error('Failed to load weather:', error);
        showWeatherError();
    }
}

// Update weather display
function updateWeatherDisplay(weather) {
    weatherWidget.classList.remove('loading');
    weatherWidget.classList.remove('error');
    
    weatherTemp.textContent = `${weather.temperature}°`;
    weatherIcon.textContent = weather.icon;
    
    // Add success animation
    weatherWidget.style.transform = 'scale(1.05)';
    setTimeout(() => {
        weatherWidget.style.transform = 'scale(1)';
    }, 200);
}

// Show weather error state
function showWeatherError() {
    weatherWidget.classList.remove('loading');
    weatherWidget.classList.add('error');
    weatherTemp.textContent = '--°';
    weatherIcon.textContent = '❌';
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