import _ from 'lodash'
import { allEditors, Editor } from 'env-editor'
import Bluebird from 'bluebird'
import debugModule from 'debug'

import shell from './shell'
import savedState from '../saved_state'

const debug = debugModule('cypress:server:editors')

interface CyEditor {
  id: string
  name: string
  openerId: string
  isOther: boolean
}

interface EditorsResult {
  preferredEditor?: CyEditor
  availableEditors?: CyEditor[]
}

const createEditor = (editor: Editor): CyEditor => {
  return {
    id: editor.id,
    name: editor.name,
    openerId: editor.id,
    isOther: false,
  }
}

const getOtherEditor = (preferredEditor?: CyEditor) => {
  // if preferred editor is the 'other' option, use it since it has the
  // path (openerId) saved with it
  if (preferredEditor && preferredEditor.isOther) {
    return preferredEditor
  }

  return {
    id: 'other',
    name: 'Other',
    openerId: '',
    isOther: true,
  }
}

const getUserEditors = (): Bluebird<CyEditor[]> => {
  return Bluebird.filter(allEditors(), (editor) => {
    debug('check if user has editor %s with binary %s', editor.name, editor.binary)

    return shell.commandExists(editor.binary)
  })
  .then((editors: Editor[] = []) => {
    debug('user has the following editors: %o', editors)

    return savedState.create()
    .then((state) => {
      return state.get('preferredEditor')
    })
    .then((preferredEditor?: CyEditor) => {
      debug('saved preferred editor: %o', preferredEditor)

      return _.map(editors, createEditor).concat([getOtherEditor(preferredEditor)])
    })
  })
}

export const getUserEditor = (alwaysIncludeEditors = false): Bluebird<EditorsResult> => {
  return savedState.create()
  .then((state) => state.get())
  .then((state) => {
    const preferredEditor = state.preferredEditor

    if (preferredEditor) {
      debug('return preferred editor: %o', preferredEditor)
      if (!alwaysIncludeEditors) {
        return { preferredEditor }
      }
    }

    return getUserEditors().then((availableEditors) => {
      debug('return available editors: %o', availableEditors)

      return { availableEditors, preferredEditor }
    })
  })
}

export const setUserEditor = (editor) => {
  return savedState.create()
  .then((state) => {
    state.set('preferredEditor', editor)
  })
}
