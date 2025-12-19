// content.js - Chrome Extension untuk AI Reply di X.com

// State management
let currentTweetContext = null;
let aiButtonInjected = new WeakSet();

/**
 * Scrape teks dari tweet yang sedang dibalas
 */
function scrapeTweetText(tweetElement) {
  try {
    // Cari elemen yang mengandung teks tweet
    const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
    
    if (!tweetTextElement) {
      console.log('Tweet text element not found');
      return null;
    }

    // Extract semua teks termasuk mentions dan hashtags
    let fullText = '';
    
    // Traverse semua child nodes untuk mendapatkan teks lengkap
    const traverseNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        fullText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'IMG' && node.alt) {
          // Handle emoji
          fullText += node.alt;
        } else {
          node.childNodes.forEach(traverseNodes);
        }
      }
    };

    tweetTextElement.childNodes.forEach(traverseNodes);

    // Extract author information
    const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
    let author = 'Unknown';
    
    if (authorElement) {
      const authorLink = authorElement.querySelector('a[href^="/"]');
      if (authorLink) {
        author = authorLink.getAttribute('href').substring(1).split('/')[0];
      }
    }

    return {
      text: fullText.trim(),
      author: author,
      fullContext: `@${author}: ${fullText.trim()}`
    };
  } catch (error) {
    console.error('Error scraping tweet:', error);
    return null;
  }
}

/**
 * Cari tweet element dari compose dialog yang terbuka
 */
function findOriginalTweet() {
  // Saat reply dialog terbuka, tweet asli ada di layer/modal
  const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
  
  // Biasanya tweet pertama dalam modal adalah tweet yang dibalas
  for (let article of tweetArticles) {
    // Cek apakah ini bukan compose box
    if (!article.querySelector('[data-testid="tweetTextarea_0"]')) {
      return article;
    }
  }
  
  return null;
}

/**
 * Inject tombol "Generate AI Reply" ke compose toolbar
 */
function injectAIButton(composeBox) {
  // Cek jika sudah di-inject
  if (aiButtonInjected.has(composeBox)) {
    return;
  }

  // Cari toolbar (tempat tombol Tweet berada)
  const toolbar = composeBox.querySelector('[data-testid="toolBar"]');
  
  if (!toolbar) {
    console.log('Toolbar not found, retrying...');
    return;
  }

  // Cari tombol Tweet/Reply
  const tweetButton = composeBox.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
  
  if (!tweetButton) {
    console.log('Tweet button not found');
    return;
  }

  // Buat tombol AI
  const aiButton = document.createElement('button');
  aiButton.className = 'x-ai-generate-button';
  aiButton.type = 'button';
  aiButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 4px;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
    <span>Generate AI Reply</span>
  `;

  // Styling untuk match dengan X.com UI
  aiButton.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    margin-right: 8px;
    border: 1px solid rgb(207, 217, 222);
    border-radius: 9999px;
    background-color: transparent;
    color: rgb(15, 20, 25);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  // Hover effect
  aiButton.addEventListener('mouseenter', () => {
    aiButton.style.backgroundColor = 'rgba(15, 20, 25, 0.1)';
  });

  aiButton.addEventListener('mouseleave', () => {
    aiButton.style.backgroundColor = 'transparent';
  });

  // Click handler
  aiButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleGenerateAIReply(composeBox);
  });

  // Insert button sebelum tombol Tweet
  const buttonContainer = tweetButton.parentElement;
  buttonContainer.insertBefore(aiButton, tweetButton);

  // Mark as injected
  aiButtonInjected.add(composeBox);
  
  console.log('AI button injected successfully');
}

/**
 * Handle generate AI reply
 */
async function handleGenerateAIReply(composeBox) {
  const aiButton = composeBox.querySelector('.x-ai-generate-button');
  const originalText = aiButton ? aiButton.innerHTML : '';
  
  try {
    // Scrape tweet yang sedang dibalas
    const originalTweet = findOriginalTweet();
    
    if (!originalTweet) {
      alert('Could not find the original tweet to reply to');
      return;
    }

    const tweetData = scrapeTweetText(originalTweet);
    
    if (!tweetData) {
      alert('Could not extract tweet text');
      return;
    }

    console.log('Scraped tweet:', tweetData);

    // Tampilkan loading state
    if (aiButton) {
      aiButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; margin-right: 4px;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
          <path fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"/>
        </svg>
        <span>Generating...</span>
      `;
      aiButton.disabled = true;
    }

    // Add spin animation
    if (!document.getElementById('ai-spin-animation')) {
      const style = document.createElement('style');
      style.id = 'ai-spin-animation';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Kirim request ke background script untuk generate AI reply
    const response = await chrome.runtime.sendMessage({
      action: 'generateReply',
      tweetContext: tweetData.fullContext,
      tweetText: tweetData.text,
      author: tweetData.author
    });

    if (response.success) {
      // Try auto-insert first
      const insertSuccess = await insertReplyText(composeBox, response.reply);
      
      if (insertSuccess) {
        // Show success state
        if (aiButton) {
          aiButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 4px;">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <span>Generated!</span>
          `;
          
          // Reset after 2 seconds
          setTimeout(() => {
            aiButton.innerHTML = originalText;
            aiButton.disabled = false;
          }, 2000);
        }
      } else {
        // If auto-insert failed, copy to clipboard as fallback
        await copyToClipboard(response.reply);
        
        if (aiButton) {
          aiButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 4px;">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            <span>Copied! Press Ctrl+V</span>
          `;
          
          // Reset after 3 seconds
          setTimeout(() => {
            aiButton.innerHTML = originalText;
            aiButton.disabled = false;
          }, 3000);
        }
        
        // Focus the textarea so user can paste
        const textarea = composeBox.querySelector('[data-testid="tweetTextarea_0"]');
        if (textarea) {
          textarea.focus();
        }
      }
      
    } else {
      throw new Error(response.error || 'Failed to generate reply');
    }

  } catch (error) {
    console.error('Error generating AI reply:', error);
    alert(`Error: ${error.message}`);
    
    // Reset button
    if (aiButton) {
      aiButton.innerHTML = originalText;
      aiButton.disabled = false;
    }
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('✅ Text copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Insert generated text ke textarea reply - PASTE SIMULATION
 * Returns true if successful, false if needs manual paste
 */
async function insertReplyText(composeBox, text) {
  try {
    // Cari textarea
    const textarea = composeBox.querySelector('[data-testid="tweetTextarea_0"]');
    
    if (!textarea) {
      console.error('Reply textarea not found');
      return false;
    }

    // Focus textarea
    textarea.focus();
    textarea.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Method 1: Simulate PASTE event (most reliable)
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer
    });
    
    // Dispatch paste event
    textarea.dispatchEvent(pasteEvent);
    
    // Wait a bit for paste to process
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Method 2: If paste didn't work, manual insertion
    if (!textarea.textContent || textarea.textContent.length < 3) {
      console.log('Paste failed, using manual method');
      
      // Clear and insert
      textarea.innerHTML = '';
      const textNode = document.createTextNode(text);
      textarea.appendChild(textNode);
      
      // Set cursor
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(textNode, text.length);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Trigger all necessary events
    const events = [
      new Event('input', { bubbles: true, composed: true }),
      new Event('change', { bubbles: true }),
      new InputEvent('input', { 
        bubbles: true, 
        inputType: 'insertText',
        data: text 
      }),
      new InputEvent('beforeinput', { 
        bubbles: true, 
        inputType: 'insertText',
        data: text 
      }),
      new KeyboardEvent('keydown', { bubbles: true }),
      new KeyboardEvent('keyup', { bubbles: true })
    ];
    
    for (const event of events) {
      textarea.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Force React update - comprehensive search
    try {
      // Method 1: Direct React props
      const allKeys = Object.keys(textarea);
      const reactKey = allKeys.find(k => 
        k.includes('react') || k.includes('React')
      );
      
      if (reactKey && textarea[reactKey]) {
        const props = textarea[reactKey];
        
        const event = {
          target: textarea,
          currentTarget: textarea,
          type: 'input',
          bubbles: true
        };
        
        // Try all possible handlers
        if (props.onInput) props.onInput(event);
        if (props.onChange) props.onChange(event);
        if (props.onKeyUp) props.onKeyUp(event);
      }
      
      // Method 2: Find parent with React and trigger from there
      let parent = textarea.parentElement;
      let depth = 0;
      
      while (parent && depth < 5) {
        const parentReactKey = Object.keys(parent).find(k => k.includes('react'));
        if (parentReactKey && parent[parentReactKey]?.onChange) {
          parent[parentReactKey].onChange({
            target: textarea,
            currentTarget: textarea
          });
          break;
        }
        parent = parent.parentElement;
        depth++;
      }
    } catch (e) {
      console.log('React update attempt:', e.message);
    }
    
    // Final verification and triggers
    textarea.focus();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // One more input event for good measure
    textarea.dispatchEvent(new Event('input', { 
      bubbles: true,
      composed: true 
    }));
    
    // Click somewhere in the textarea to ensure focus
    textarea.click();
    
    // Verify the text is properly inserted
    const hasText = textarea.textContent && textarea.textContent.length > 5;
    
    console.log('✅ Text inserted:', textarea.textContent);
    console.log('✅ Character count:', textarea.textContent.length);
    console.log('✅ Insert success:', hasText);
    
    // Check if tweet button is enabled (sign of successful insertion)
    await new Promise(resolve => setTimeout(resolve, 200));
    const tweetButton = composeBox.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
    const buttonEnabled = tweetButton && !tweetButton.disabled;
    
    console.log('✅ Tweet button enabled:', buttonEnabled);
    
    // Return true only if both text exists AND button is enabled
    return hasText && buttonEnabled;
    
  } catch (error) {
    console.error('❌ Error inserting reply text:', error);
    return false;
  }
}

/**
 * Observe untuk detect ketika reply dialog dibuka
 */
function observeReplyDialogs() {
  const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Cek apakah ini compose box (reply dialog)
          const composeBoxes = node.querySelectorAll 
            ? node.querySelectorAll('[data-testid="tweetTextarea_0"]')
            : [];

          // Atau cek node itu sendiri
          if (node.matches && node.matches('[data-testid="tweetTextarea_0"]')) {
            const composeBox = node.closest('[role="dialog"], [role="group"]') || node.parentElement;
            if (composeBox) {
              setTimeout(() => injectAIButton(composeBox), 500);
            }
          }

          // Atau cek children
          composeBoxes.forEach(textarea => {
            const composeBox = textarea.closest('[role="dialog"], [role="group"]') || textarea.parentElement;
            if (composeBox) {
              setTimeout(() => injectAIButton(composeBox), 500);
            }
          });
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Reply dialog observer started');
}

/**
 * Fallback: Check periodically untuk reply dialogs
 */
function checkForReplyDialogs() {
  const composeTextareas = document.querySelectorAll('[data-testid="tweetTextarea_0"]');
  
  composeTextareas.forEach(textarea => {
    const composeBox = textarea.closest('[role="dialog"], [role="group"]') || textarea.parentElement;
    
    if (composeBox && !aiButtonInjected.has(composeBox)) {
      // Check if this is a reply (has original tweet in modal)
      const dialog = textarea.closest('[role="dialog"]');
      if (dialog) {
        const tweets = dialog.querySelectorAll('article[data-testid="tweet"]');
        if (tweets.length > 0) {
          injectAIButton(composeBox);
        }
      }
    }
  });
}

/**
 * Initialize
 */
function init() {
  console.log('X.com AI Reply Extension initialized');
  
  // Start observing
  observeReplyDialogs();
  
  // Periodic check sebagai fallback
  setInterval(checkForReplyDialogs, 2000);
  
  // Initial check
  setTimeout(checkForReplyDialogs, 3000);
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for messages from background script (optional)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkStatus') {
    sendResponse({ status: 'active', injected: aiButtonInjected.size });
  }
  return true;
});