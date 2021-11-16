import _ from 'lodash'
import Bluebird from 'bluebird'
import debugModule from 'debug'

import { Editor, osFileSystemExplorer, EditorsResult } from '@packages/types'
import { getEnvEditors } from './env-editors'
import shell from './shell'
import savedState from '../saved_state'

const debug = debugModule('cypress:server:editors')

const createEditor = (editor: Editor): Editor => {
  return {
    id: editor.id,
    name: editor.name,
    binary: editor.binary,
  }
}

const getOtherEditor = (preferredOpener?: Editor): Editor | undefined => {
  // if preferred editor is the 'other' option, use it since it has the
  // path (binary) saved with it
  if (preferredOpener && preferredOpener.id === 'other') {
    return preferredOpener
  }

  return
}

const computerOpener = (): Editor => {
  return {
    id: 'computer',
    name: osFileSystemExplorer[process.platform] || osFileSystemExplorer.linux,
    binary: 'computer',
  }
}

const getUserEditors = async (): Promise<Editor[]> => {
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
    .then((preferredOpener?: Editor) => {
      debug('saved preferred editor: %o', preferredOpener)

      const cyEditors = _.map(editors, createEditor)
      const preferred = getOtherEditor(preferredOpener)

      if (!preferred) {
        return [computerOpener()].concat(cyEditors)
      }

      return [computerOpener()].concat(cyEditors, preferred)
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
