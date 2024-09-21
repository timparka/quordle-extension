// This function will handle the display of suggestions in the popup
function displaySuggestions(suggestions: { quadrant: number; suggestions: string[] }[]) {
  const suggestionElement = document.getElementById('suggestions');
  if (!suggestionElement) {
    console.error('Suggestions element not found in the popup.');
    return;
  }
  
  // Clear previous suggestions
  suggestionElement.innerHTML = ''; 

  // Check if there are suggestions to display
  if (suggestions.length === 0) {
    suggestionElement.textContent = 'No suggestions available at this moment.';
    return;
  }

  // Iterate over the suggestions array
  suggestions.forEach((suggestion) => {
    const div = document.createElement('div');
    div.textContent = `Quadrant ${suggestion.quadrant}: ${suggestion.suggestions.map(s => s.trim()).join(', ')}`;
    suggestionElement.appendChild(div);
  });
}

// This function sends a message to the content script and handles the response
function requestSuggestionsFromContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || typeof activeTab.id === 'undefined') {
      console.error('No active tab identified.');
      return;
    }

    console.log('Sending message to content script'); // Debugging log
    chrome.tabs.sendMessage(activeTab.id, { type: 'requestSuggestions' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error in messaging content script:', chrome.runtime.lastError.message);
        return;
      }
      
      console.log('Received response:', response); // Debugging log
      if (response && response.status === 'suggestions sent' && Array.isArray(response.data)) {
        displaySuggestions(response.data);
      } else {
        console.error('No suggestions received or in the wrong format.');
      }
    });
  });
}

// When the DOM is fully loaded, send the message to request suggestions
document.addEventListener('DOMContentLoaded', requestSuggestionsFromContentScript);
