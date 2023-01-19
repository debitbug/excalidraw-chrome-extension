const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

const decode = function (base64) {
  let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }
  const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return arraybuffer;
};

const decryptShareLinkData = async (key, value) => {
  const iv = decode(value.slice(0, 16))
  const buffer = decode(value.slice(16));
  const importedKey = await window.crypto.subtle.importKey(
    "jwk",
    {
      alg: "A128GCM",
      ext: true,
      k: key,
      key_ops: ["encrypt", "decrypt"],
      kty: "oct",
    },
    {
      name: "AES-GCM",
      length: 128,
    },
    false, // extractable
    ['decrypt'],
  )
  const result = await window.crypto.subtle.decrypt({
    name: 'AES-GCM',
    iv
  }, importedKey, buffer).catch(console.error);
  return new TextDecoder().decode(result);
}

const $ = document.querySelector.bind(document);
const GITHUB_ACCOUNT_KEY = ['token', 'owner', 'repo'];
let githubAccount = {};


function fetchGitHubFiles() {
  const { token, repo, owner } = githubAccount;
  return fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
    method: 'GET',
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`
    },
  }).then(res => res.json())
}

function renderFiles(data) {
  const tpl = (item) => `<li data-id=${item.url}>${item.path}</li>`
  const listStr = data.map(tpl).join('');
  $('.files').innerHTML = listStr;
}


function editExcalidrawFile() {
  $('.files').addEventListener('click', (evt) => {
    if (evt.target.tagName !== 'LI') {
      return;
    }
    const { target } = evt;
    const filePath = target.innerText;
    const linkEncryptData = filePath.split('.')[1]
    decryptShareLinkData(githubAccount.token.slice(githubAccount.token.length - 22), linkEncryptData).then(res => {
      chrome.tabs.create({
        active: true,
        url: 'https://excalidraw.com/#json=' + res,
      })
    }).catch(console.error);
  })
}

function gotoOptionPage() {
  // show the button
  const $container = $('.go-to-option');

  $container.style.display = 'block';

  $container.querySelector('button').onclick = () => {
    chrome.runtime.openOptionsPage();
  }
}


function main() {
  // get the account info
  chrome.storage.sync.get(GITHUB_ACCOUNT_KEY).then(result => {
    if (Object.keys(result).length === GITHUB_ACCOUNT_KEY.length) {
      // show the git files list
      githubAccount = result;
      fetchGitHubFiles().then(res => {
        renderFiles(res.tree.filter(i => /^\d{6}/.test(i.path)));
      });
      editExcalidrawFile();
    } else {
      // show go to options button
      gotoOptionPage()
    }
  })
}

window.onload = main;


