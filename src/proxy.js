
/**
 * proxy the message between the content.js and background.js
 */
const KEY = 'github-account';
// get the account info
chrome.runtime.sendMessage({ 'type': KEY }).then(res => {
  window.postMessage({
    type: KEY,
    payload: res
  });
})


// when the page is visible, retrive the account info
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === KEY) {
    window.postMessage({
      type: KEY,
      payload: req.payload
    });
  }
  sendResponse({ from: 'proxy', message: 'success' })
})