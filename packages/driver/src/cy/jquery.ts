import $ from 'jquery'

import $dom from '../dom'
import $utils from '../cypress/utils'

const remoteJQueryisNotSameAsGlobal = (remoteJQuery) => {
  return remoteJQuery && (remoteJQuery !== $)
}

export default {
  create (state) {
    const jquery = () => {
      return state('jQuery') || state('window').$
    }

    const $$ = function (selector, context) {
      if (context == null) {
        context = state('document')
      }

      return $dom.query(selector, context)
    }

    return {
      $$,
      getRemotejQueryInstance (subject) {
        // we make assumptions that you cannot have
        // an array of mixed types, so we only look at
        // the first item (if there's an array)
        const firstSubject = $utils.unwrapFirst(subject)

        if (!$dom.isElement(firstSubject)) return

        const remoteJQuery = jquery()

        if (remoteJQueryisNotSameAsGlobal(remoteJQuery)) {
          const remoteSubject = remoteJQuery(subject)

          return remoteSubject
        }
      },
    }
  },
}
