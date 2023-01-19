const $ = document.querySelector.bind(document);


function saveOptions(data) {
  chrome.storage.sync.set(data).then(() => {
    $('.log').textContent = 'options saved.';

    setTimeout(() => {
      $('.log').textContent = ''
    }, 2000);
  }).catch(console.error)
}

function restoreOption() {
  chrome.storage.sync.get().then(data => {
    console.log('get from store age', data);
    data.token && ($('[name="token"').value = data.token)
    data.owner && ($('[name="owner"').value = data.owner)
    data.repo && ($('[name="repo"').value = data.repo)
  })
}

$('.github-info').addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = {}
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  console.log('data-->', data);
  // save github-info to storage
  saveOptions(data);
})

window.onload = () => {
  restoreOption();
}
