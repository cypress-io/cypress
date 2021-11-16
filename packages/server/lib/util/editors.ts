import _ from 'lodash'
import Bluebird from 'bluebird'
import debugModule from 'debug'

import { Editor, osFileSystemExplorer, EditorsResult, CyEditor } from '@packages/types'
import {
  getEnvEditors,
} from './env-editors'
import shell from './shell'
import savedState from '../saved_state'

const debug = debugModule('cypress:server:editors')

const createEditor = (editor: Editor): CyEditor => {
  return {
    id: editor.id,
    name: editor.name,
    binary: editor.binary,
    isOther: false,
  }
}

const getOtherEditor = (preferredOpener?: CyEditor): CyEditor => {
  // if preferred editor is the 'other' option, use it since it has the
  // path (binary) saved with it
  if (preferredOpener && preferredOpener.isOther) {
    return preferredOpener
  }

  return {
    id: 'other',
    name: 'Other',
    binary: null,
    isOther: true,
  }
}

const computerOpener = (): CyEditor => {
  return {
    id: 'computer',
    name: osFileSystemExplorer[process.platform] || osFileSystemExplorer.linux,
    binary: 'computer',
    isOther: false,
  }
}

const getUserEditors = async (): Promise<CyEditor[]> => {
  return Bluebird.filter(getEnvEditors(), (editor) => {
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

      const cyEditors = _.map(editors, createEditor)

      return [computerOpener()].concat(cyEditors).concat(getOtherEditor(preferredOpener))
    })
  })
}

export const getUserEditor = async (alwaysIncludeEditors = false): Promise<EditorsResult> => {
  debug('get user editor')

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

export const setUserEditor = async (editor: Editor) => {
  debug('set user editor: %o', editor)

  const state = await savedState.create()

  state.set('preferredOpener', editor)
}
