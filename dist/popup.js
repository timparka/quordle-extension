(()=>{"use strict";document.addEventListener("DOMContentLoaded",(function(){chrome.tabs.query({active:!0,currentWindow:!0},(e=>{const t=e[0];t&&void 0!==t.id?(console.log("Sending message to content script"),chrome.tabs.sendMessage(t.id,{type:"requestSuggestions"},(e=>{chrome.runtime.lastError?console.error("Error in messaging content script:",chrome.runtime.lastError.message):(console.log("Received response:",e),e&&"suggestions sent"===e.status&&Array.isArray(e.data)?function(e){const t=document.getElementById("suggestions");t?(t.innerHTML="",0!==e.length?e.forEach((e=>{const n=document.createElement("div");n.textContent=`Quadrant ${e.quadrant}: ${e.suggestions.map((e=>e.trim())).join(", ")}`,t.appendChild(n)})):t.textContent="No suggestions available at this moment."):console.error("Suggestions element not found in the popup.")}(e.data):console.error("No suggestions received or in the wrong format."))}))):console.error("No active tab identified.")}))}))})();