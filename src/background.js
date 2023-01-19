chrome.scripting.registerContentScripts([
  {
    id: 'content',
    matches: ['https://excalidraw.com/*'],
    js: ['src/content.js'],
    runAt: 'document_idle',
    world: chrome.scripting.ExecutionWorld.MAIN,
  },
])

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['src/content.js']
  });
});

const GITHUB_ACCOUNT_KEY = ['token', 'owner', 'repo']

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'github-account') {
    chrome.storage.sync.get(GITHUB_ACCOUNT_KEY).then(result => {
      sendResponse(result);
    })
  }
  return true;
})

async function notifyStorage() {
  await new Promise(resolve => {
    setTimeout(resolve, 20);
  })
  chrome.storage.sync.get(GITHUB_ACCOUNT_KEY).then(result => {
    // send message to all excalidraw tab to upload git account info
    chrome.tabs.query({ currentWindow: true }).then(tabs => {
      tabs.filter(tab => tab.url.startsWith('https://excalidraw.com')).forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'github-account', payload: result })
      })
    })
  }).catch(console.error);
}

// storage update and send to content
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (GITHUB_ACCOUNT_KEY.some(key => changes[key])) {
    notifyStorage();
  }
})


