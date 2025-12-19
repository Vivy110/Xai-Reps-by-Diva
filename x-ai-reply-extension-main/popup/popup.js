// popup/popup.js - Universal API Configuration

// Documentation links
const API_DOCS = {
  openai: 'https://platform.openai.com/docs/api-reference',
  claude: 'https://docs.anthropic.com/claude/reference',
  gemini: 'https://ai.google.dev/docs',
  grok: 'https://docs.x.ai/',
  deepseek: 'https://platform.deepseek.com/docs',
  groq: 'https://console.groq.com/docs',
  perplexity: 'https://docs.perplexity.ai/',
  mistral: 'https://docs.mistral.ai/',
  together: 'https://docs.together.ai/',
  ollama: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
  custom: ''
};

let AI_PROVIDERS = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  chrome.runtime.sendMessage({ action: 'getProviders' }, (response) => {
    AI_PROVIDERS = response.providers;
    loadSettings();
    setupEventListeners();
  });
});

/**
 * Load saved settings
 */
async function loadSettings() {
  chrome.storage.sync.get([
    'aiProvider', 
    'apiKey', 
    'selectedModel', 
    'customInstructions',
    'customApiUrl',
    'customAuthHeader',
    'customAuthPrefix',
    'customRequestFormat',
    'customModels'
  ], (data) => {
    const provider = data.aiProvider || 'openai';
    
    // Set provider
    document.getElementById('aiProvider').value = provider;
    
    // Show/hide custom config
    toggleCustomConfig(provider);
    
    // Load custom config if custom provider
    if (provider === 'custom') {
      document.getElementById('customApiUrl').value = data.customApiUrl || '';
      document.getElementById('customAuthHeader').value = data.customAuthHeader || 'Authorization';
      document.getElementById('customAuthPrefix').value = data.customAuthPrefix || 'Bearer';
      document.getElementById('customRequestFormat').value = data.customRequestFormat || 'openai';
      document.getElementById('customModels').value = data.customModels || '';
    }
    
    // Load models
    loadModelsForProvider(provider, data);
    
    // Set selected model
    if (data.selectedModel) {
      setTimeout(() => {
        document.getElementById('selectedModel').value = data.selectedModel;
      }, 100);
    }
    
    // Set API key
    if (data.apiKey) {
      document.getElementById('apiKey').value = data.apiKey;
    }

    // Set custom instructions
    if (data.customInstructions) {
      document.getElementById('customInstructions').value = data.customInstructions;
    }
    
    // Update docs links
    updateDocsLinks(provider);
    
    // Update API key hint
    updateApiKeyHint(provider);
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Provider change
  document.getElementById('aiProvider').addEventListener('change', (e) => {
    const provider = e.target.value;
    toggleCustomConfig(provider);
    loadModelsForProvider(provider);
    updateDocsLinks(provider);
    updateApiKeyHint(provider);
  });

  // Custom models change
  document.getElementById('customModels').addEventListener('input', (e) => {
    const provider = document.getElementById('aiProvider').value;
    if (provider === 'custom') {
      loadModelsForProvider(provider);
    }
  });

  // Toggle password visibility
  document.getElementById('toggleKey').addEventListener('click', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleBtn = document.getElementById('toggleKey');
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  });

  // Test connection
  document.getElementById('testBtn').addEventListener('click', testConnection);

  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // Enter key to save
  document.getElementById('apiKey').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
}

/**
 * Toggle custom configuration section
 */
function toggleCustomConfig(provider) {
  const customConfig = document.getElementById('customConfig');
  customConfig.style.display = provider === 'custom' ? 'block' : 'none';
}

/**
 * Load models for selected provider
 */
function loadModelsForProvider(provider, savedData = null) {
  const modelSelect = document.getElementById('selectedModel');
  modelSelect.innerHTML = '';
  
  let models = [];
  let defaultModel = '';

  if (provider === 'custom') {
    // Use custom models if available
    const customModelsInput = document.getElementById('customModels').value;
    if (customModelsInput) {
      models = customModelsInput.split(',').map(m => m.trim()).filter(m => m);
      defaultModel = models[0] || '';
    } else if (savedData && savedData.customModels) {
      models = savedData.customModels.split(',').map(m => m.trim()).filter(m => m);
      defaultModel = models[0] || '';
    }
  } else {
    const providerConfig = AI_PROVIDERS[provider];
    if (providerConfig) {
      models = providerConfig.models;
      defaultModel = providerConfig.defaultModel;
    }
  }

  if (models.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = provider === 'custom' ? 'Enter models above' : 'No models available';
    modelSelect.appendChild(option);
    return;
  }

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    
    if (model === defaultModel) {
      option.textContent += ' (Recommended)';
      option.selected = true;
    }
    
    modelSelect.appendChild(option);
  });
}

/**
 * Update documentation links
 */
function updateDocsLinks(provider) {
  const linksContainer = document.getElementById('apiKeyLinks');
  const docUrl = API_DOCS[provider];
  
  if (docUrl) {
    linksContainer.innerHTML = `
      <a href="${docUrl}" target="_blank" class="api-link">
        📚 ${AI_PROVIDERS[provider]?.name || 'API'} Documentation →
      </a>
    `;
  } else if (provider === 'custom') {
    linksContainer.innerHTML = `
      <p class="no-link">💡 Configure your custom API endpoint above</p>
    `;
  } else {
    linksContainer.innerHTML = '<p class="no-link">Check provider documentation</p>';
  }
}

/**
 * Update API key hint
 */
function updateApiKeyHint(provider) {
  const hint = document.getElementById('apiKeyHint');
  
  if (provider === 'ollama') {
    hint.textContent = 'Not required for local Ollama';
    hint.style.color = '#10b981';
  } else if (provider === 'custom') {
    hint.textContent = 'Enter API key if your endpoint requires authentication';
    hint.style.color = '#6b7280';
  } else {
    hint.textContent = 'Required for API authentication';
    hint.style.color = '#6b7280';
  }
}

/**
 * Test API connection
 */
async function testConnection() {
  const provider = document.getElementById('aiProvider').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('selectedModel').value;
  
  const testBtn = document.getElementById('testBtn');
  const testStatus = document.getElementById('testStatus');
  
  // Show loading
  testBtn.disabled = true;
  testBtn.textContent = '🔄 Testing...';
  testStatus.style.display = 'none';

  let requestData = { provider, apiKey, model };

  // Add custom config if custom provider
  if (provider === 'custom') {
    requestData.apiUrl = document.getElementById('customApiUrl').value.trim();
    requestData.authHeader = document.getElementById('customAuthHeader').value.trim();
    requestData.authPrefix = document.getElementById('customAuthPrefix').value.trim();
    requestData.requestFormat = document.getElementById('customRequestFormat').value;
    
    // Validate custom config
    if (!requestData.apiUrl) {
      showTestStatus('❌ Please enter API URL', false);
      testBtn.disabled = false;
      testBtn.textContent = '🔌 Test Connection';
      return;
    }
  }

  // Validate
  if (provider !== 'ollama' && !apiKey && provider !== 'custom') {
    showTestStatus('❌ Please enter API key', false);
    testBtn.disabled = false;
    testBtn.textContent = '🔌 Test Connection';
    return;
  }

  if (!model) {
    showTestStatus('❌ Please select a model', false);
    testBtn.disabled = false;
    testBtn.textContent = '🔌 Test Connection';
    return;
  }

  try {
    // Send test request to background script
    chrome.runtime.sendMessage(
      { action: 'testConnection', ...requestData },
      (response) => {
        if (response.success) {
          showTestStatus('✅ Connection successful!', true);
        } else {
          showTestStatus(`❌ ${response.error}`, false);
        }
        
        testBtn.disabled = false;
        testBtn.textContent = '🔌 Test Connection';
      }
    );
  } catch (error) {
    showTestStatus(`❌ ${error.message}`, false);
    testBtn.disabled = false;
    testBtn.textContent = '🔌 Test Connection';
  }
}

/**
 * Show test status
 */
function showTestStatus(message, isSuccess) {
  const testStatus = document.getElementById('testStatus');
  testStatus.textContent = message;
  testStatus.className = 'test-status ' + (isSuccess ? 'success' : 'error');
  testStatus.style.display = 'block';
  
  setTimeout(() => {
    testStatus.style.display = 'none';
  }, 5000);
}

/**
 * Save settings
 */
async function saveSettings() {
  const provider = document.getElementById('aiProvider').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const selectedModel = document.getElementById('selectedModel').value;
  const customInstructions = document.getElementById('customInstructions').value.trim();
  
  // Build settings object
  const settings = {
    aiProvider: provider,
    apiKey: apiKey,
    selectedModel: selectedModel,
    customInstructions: customInstructions
  };

  // Add custom config if custom provider
  if (provider === 'custom') {
    settings.customApiUrl = document.getElementById('customApiUrl').value.trim();
    settings.customAuthHeader = document.getElementById('customAuthHeader').value.trim();
    settings.customAuthPrefix = document.getElementById('customAuthPrefix').value.trim();
    settings.customRequestFormat = document.getElementById('customRequestFormat').value;
    settings.customModels = document.getElementById('customModels').value.trim();
    
    // Validate
    if (!settings.customApiUrl) {
      showStatus('❌ Please enter API URL for custom provider', false);
      return;
    }
    
    if (!settings.customModels) {
      showStatus('❌ Please enter at least one model', false);
      return;
    }
  }
  
  // Validate API key (except for Ollama and optionally custom)
  if (provider !== 'ollama' && !apiKey && provider !== 'custom') {
    showStatus('❌ Please enter an API key', false);
    return;
  }
  
  if (!selectedModel) {
    showStatus('❌ Please select a model', false);
    return;
  }
  
  // Save to storage
  chrome.storage.sync.set(settings, () => {
    const providerName = AI_PROVIDERS[provider]?.name || 'Custom API';
    showStatus(`✅ Saved! Using ${providerName} - ${selectedModel}`, true);
  });
}

/**
 * Show status message
 */
function showStatus(message, isSuccess) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + (isSuccess ? 'success' : 'error');
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
