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
  description?: string
}

interface EditorsResult {
  preferredOpener?: CyEditor
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

const getOtherEditor = (preferredOpener?: CyEditor) => {
  // if preferred editor is the 'other' option, use it since it has the
  // path (openerId) saved with it
  if (preferredOpener && preferredOpener.isOther) {
    return preferredOpener
  }

  return {
    id: 'other',
    name: 'Other',
    openerId: '',
    isOther: true,
    description: 'Enter the full path to your editor\'s executable',
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
      return state.get('preferredOpener')
    })
    .then((preferredOpener?: CyEditor) => {
      debug('saved preferred editor: %o', preferredOpener)

      const onComputer = {
        id: 'computer',
        name: 'On Computer',
        openerId: 'computer',
        isOther: false,
        description: 'Opens the file in your system\'s file management application (e.g. Finder, File Explorer)',
      }
      const cyEditors = _.map(editors, createEditor)

      // @ts-ignore
      return [onComputer].concat(cyEditors).concat([getOtherEditor(preferredOpener)])
    })
  })
}

export const getUserEditor = (alwaysIncludeEditors = false): Bluebird<EditorsResult> => {
  return savedState.create()
  .then((state) => state.get())
  .then((state) => {
    const preferredOpener = state.preferredOpener

    if (preferredOpener) {
      debug('return preferred editor: %o', preferredOpener)
      if (!alwaysIncludeEditors) {
        return { preferredOpener }
      }
    }

    return getUserEditors().then((availableEditors) => {
      debug('return available editors: %o', availableEditors)

      return { availableEditors, preferredOpener }
    })
  })
}

export const setUserEditor = (editor) => {
  return savedState.create()
  .then((state) => {
    state.set('preferredOpener', editor)
  })
}
