import Promise from 'bluebird'

export default {
  fetch: (resourceUrl, win = window) => {
    return new Promise((resolve, reject) => {
      const xhr = new win.XMLHttpRequest()

      xhr.onload = function () {
        resolve(this.responseText)
      }

      xhr.onerror = function (e) {
        reject(new Error(`Fetching resource at '${resourceUrl}' failed. Status: ${this.status} Text: ${this.statusText} \n\n Error: ${e}`))
      }

      xhr.open('GET', resourceUrl)
      xhr.send()
    })
  },
}
