// Configuration for Buddy AI Assistant
const config = {
    // Backend API URLs
    local: {
        apiUrl: 'http://localhost:8000',
        description: 'Local Development'
    },
    remote: {
        apiUrl: 'https://your-railway-app-name.railway.app',
        description: 'Remote Production (Railway)'
    },
    
    // Current environment - change this to switch between local/remote
    current: 'local', // Options: 'local' or 'remote'
    
    // Get current API URL
    getApiUrl() {
        return this[this.current].apiUrl;
    },
    
    // Get current description
    getDescription() {
        return this[this.current].description;
    },
    
    // Switch environment
    setEnvironment(env) {
        if (env === 'local' || env === 'remote') {
            this.current = env;
            localStorage.setItem('buddy-environment', env);
            return true;
        }
        return false;
    },
    
    // Load saved environment
    loadEnvironment() {
        const saved = localStorage.getItem('buddy-environment');
        if (saved && (saved === 'local' || saved === 'remote')) {
            this.current = saved;
        }
    }
};

// Load saved environment on script load
config.loadEnvironment();

export default config;
