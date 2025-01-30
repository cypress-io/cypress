import Promise from 'bluebird'

export default {
  fetch: (resourceUrl, win = window) => {
    return new Promise((resolve, reject) => {
      const xhr = new win.XMLHttpRequest()

      xhr.onload = function () {
        resolve(this.responseText)
      }

      xhr.onerror = function (e) {
        reject(new Error(`Fetching resource at '${resourceUrl}' failed: ${this.status} ${this.statusText} \n\n ${e}`))
      }

      xhr.open('GET', resourceUrl)
      xhr.send()
    })
  },
}
