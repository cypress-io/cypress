const $ = require('jquery')

const $dom = require('../dom')
const $utils = require('../cypress/utils')

const remoteJQueryisNotSameAsGlobal = (remoteJQuery) => {
  return remoteJQuery && (remoteJQuery !== $)
}

const create = function (state) {
  const jquery = () => {
    return state('jQuery') || state('window').$
  }

  return {
    getRemotejQueryInstance (subject) {
      const remoteJQuery = jquery()

      // we make assumptions that you cannot have
      // an array of mixed types, so we only look at
      // the first item (if there's an array)
      const firstSubject = $utils.unwrapFirst(subject)

      if ($dom.isElement(firstSubject) && remoteJQueryisNotSameAsGlobal(remoteJQuery)) {
        const remoteSubject = remoteJQuery(subject)

        return remoteSubject
      }
    },
  }
}

module.exports = {
  create,
}
