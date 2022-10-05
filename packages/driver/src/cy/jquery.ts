import $ from 'jquery'

import $dom from '../dom'
import $utils from '../cypress/utils'
import type { StateFunc } from '../cypress/state'

const remoteJQueryisNotSameAsGlobal = (remoteJQuery) => {
  return remoteJQuery && (remoteJQuery !== $)
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (state: StateFunc) => ({
  $$ (selector, context?) {
    if (context == null) {
      context = state('document')
    }

    return $dom.query(selector, context)
  },

  getRemotejQueryInstance (subject) {
    // we make assumptions that you cannot have
    // an array of mixed types, so we only look at
    // the first item (if there's an array)
    const firstSubject = $utils.unwrapFirst(subject)

    if (!$dom.isElement(firstSubject)) return

    const remoteJQuery = state('jQuery') || state('window').$

    if (remoteJQueryisNotSameAsGlobal(remoteJQuery)) {
      const remoteSubject = remoteJQuery(subject)

      return remoteSubject
    }
  },
})

export interface IJQuery extends ReturnType<typeof create> {}
