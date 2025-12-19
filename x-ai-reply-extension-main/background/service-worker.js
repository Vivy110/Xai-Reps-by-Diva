// background/service-worker.js - Universal API Support

// Pre-configured AI Providers
const PRESET_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  claude: {
    name: 'Anthropic Claude',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    requestFormat: 'claude',
    authHeader: 'x-api-key',
    authPrefix: ''
  },
  gemini: {
    name: 'Google Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash-exp',
    requestFormat: 'gemini',
    authHeader: 'key',
    authPrefix: ''
  },
  grok: {
    name: 'xAI Grok',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    models: ['grok-beta', 'grok-vision-beta'],
    defaultModel: 'grok-beta',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-chat',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  groq: {
    name: 'Groq',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  perplexity: {
    name: 'Perplexity',
    apiUrl: 'https://api.perplexity.ai/chat/completions',
    models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'],
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  ollama: {
    name: 'Ollama (Local)',
    apiUrl: 'http://localhost:11434/api/chat',
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'qwen2.5'],
    defaultModel: 'llama3.2',
    requestFormat: 'ollama',
    authHeader: '',
    authPrefix: ''
  },
  together: {
    name: 'Together AI',
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    models: ['meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'],
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  mistral: {
    name: 'Mistral AI',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    defaultModel: 'mistral-small-latest',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  custom: {
    name: 'Custom API',
    apiUrl: '',
    models: [],
    defaultModel: '',
    requestFormat: 'openai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  }
};

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReply') {
    handleGenerateReply(request, sendResponse);
    return true;
  } else if (request.action === 'getProviders') {
    sendResponse({ providers: PRESET_PROVIDERS });
    return true;
  } else if (request.action === 'testConnection') {
    testAPIConnection(request, sendResponse);
    return true;
  }
});

/**
 * Main handler for generating replies
 */
async function handleGenerateReply(request, sendResponse) {
  try {
    const storage = await chrome.storage.sync.get([
      'aiProvider', 
      'apiKey', 
      'selectedModel', 
      'customInstructions',
      'customApiUrl',
      'customAuthHeader',
      'customAuthPrefix',
      'customRequestFormat',
      'customModels'
    ]);
    
    const provider = storage.aiProvider || 'openai';
    const apiKey = storage.apiKey;
    let config = PRESET_PROVIDERS[provider];

    // Handle custom provider
    if (provider === 'custom') {
      config = {
        name: 'Custom API',
        apiUrl: storage.customApiUrl,
        models: storage.customModels ? storage.customModels.split(',').map(m => m.trim()) : [],
        defaultModel: storage.selectedModel || '',
        requestFormat: storage.customRequestFormat || 'openai',
        authHeader: storage.customAuthHeader || 'Authorization',
        authPrefix: storage.customAuthPrefix || 'Bearer'
      };
    }

    if (!apiKey && config.authHeader) {
      sendResponse({
        success: false,
        error: 'API key not set. Please configure in extension popup.'
      });
      return;
    }

    if (!config.apiUrl) {
      sendResponse({
        success: false,
        error: 'API URL not configured.'
      });
      return;
    }

    const model = storage.selectedModel || config.defaultModel;
    const customInstructions = storage.customInstructions || '';
    const { tweetText, author } = request;

    // Generate reply
    const reply = await generateReply(config, apiKey, model, tweetText, author, customInstructions);

    sendResponse({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Error in background script:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Universal reply generator
 */
async function generateReply(config, apiKey, model, tweetText, author, customInstructions) {
  const systemPrompt = customInstructions || 
    'You are a helpful assistant writing Twitter/X replies. Be concise, engaging, and stay under 280 characters.';
  
  const userPrompt = `You are replying to this tweet from @${author}:

"${tweetText}"

Write a thoughtful, engaging reply. Keep it under 280 characters. Be helpful and relevant.`;

  switch (config.requestFormat) {
    case 'openai':
      return await callOpenAIFormat(config, apiKey, model, systemPrompt, userPrompt);
    case 'claude':
      return await callClaudeFormat(config, apiKey, model, systemPrompt, userPrompt);
    case 'gemini':
      return await callGeminiFormat(config, apiKey, model, systemPrompt, userPrompt);
    case 'ollama':
      return await callOllamaFormat(config, model, systemPrompt, userPrompt);
    default:
      throw new Error('Unsupported request format');
  }
}

/**
 * OpenAI-compatible format (OpenAI, Groq, DeepSeek, Grok, etc.)
 */
async function callOpenAIFormat(config, apiKey, model, systemPrompt, userPrompt) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (config.authHeader && apiKey) {
    const authValue = config.authPrefix ? `${config.authPrefix} ${apiKey}` : apiKey;
    headers[config.authHeader] = authValue;
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Claude format
 */
async function callClaudeFormat(config, apiKey, model, systemPrompt, userPrompt) {
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  };

  if (config.authHeader && apiKey) {
    headers[config.authHeader] = apiKey;
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: model,
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * Gemini format
 */
async function callGeminiFormat(config, apiKey, model, systemPrompt, userPrompt) {
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const url = `${config.apiUrl}${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

/**
 * Ollama format (local)
 */
async function callOllamaFormat(config, model, systemPrompt, userPrompt) {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}. Make sure Ollama is running on localhost:11434`);
  }

  const data = await response.json();
  return data.message.content.trim();
}

/**
 * Test API connection
 */
async function testAPIConnection(request, sendResponse) {
  try {
    const { provider, apiKey, apiUrl, authHeader, authPrefix, requestFormat, model } = request;
    
    let config = PRESET_PROVIDERS[provider];
    
    if (provider === 'custom') {
      config = {
        apiUrl: apiUrl,
        requestFormat: requestFormat,
        authHeader: authHeader,
        authPrefix: authPrefix
      };
    }

    // Simple test message
    const testPrompt = "Reply with just 'OK' if you can read this.";
    
    const result = await generateReply(
      config, 
      apiKey, 
      model, 
      testPrompt, 
      'test', 
      'You are a test assistant. Reply with OK.'
    );

    sendResponse({
      success: true,
      message: 'Connection successful!',
      response: result
    });

  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('Universal AI Reply Extension installed');
  
  chrome.storage.sync.get(['aiProvider'], (result) => {
    if (!result.aiProvider) {
      chrome.storage.sync.set({ aiProvider: 'openai' });
    }
  });
});
