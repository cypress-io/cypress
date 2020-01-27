const Promise = require('bluebird')

const fetch = (resourceUrl, win = window) => {
  return new Promise((resolve, reject) => {
    const xhr = new win.XMLHttpRequest()

    xhr.onload = function () {
      resolve(this.responseText)
    }

    xhr.onerror = function () {
      reject(new Error(`Fetching resource at '${resourceUrl}' failed`))
    }

    xhr.open('GET', resourceUrl)
    xhr.send()
  })
}

module.exports = {
  fetch,
}
