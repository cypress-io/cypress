import _ from 'lodash'
import Bluebird from 'bluebird'
import debugModule from 'debug'

import type { Editor } from '@packages/types'
import { getEnvEditors } from './env-editors'
import * as shell from './shell'

export const osFileSystemExplorer = {
  darwin: 'Finder',
  win32: 'File Explorer',
  linux: 'File System',
} as const

const debug = debugModule('cypress:server:util:editors')

const createEditor = (editor: Editor): Editor => {
  return {
    id: editor.id,
    name: editor.name,
    binary: editor.binary,
  }
}

const computerOpener = (): Editor => {
  return {
    id: 'computer',
    name: osFileSystemExplorer[process.platform] || osFileSystemExplorer.linux,
    binary: 'computer',
  }
}

const launchEditorOpener = (): Editor[] => {
  const binary = process.env.LAUNCH_EDITOR

  if (!binary) {
    return []
  }

  return [{
    id: 'launch-editor',
    name: `LAUNCH_EDITOR (${binary})`,
    binary,
  }]
}

export const getUserEditors = async (): Promise<Editor[]> => {
  const editors = await Bluebird.filter([...getEnvEditors(), ...launchEditorOpener()], (editor) => {
    return shell.commandExists(editor.binary)
  })

  debug('user has the following editors: %o', editors)

  if (process.env.LAUNCH_EDITOR && !editors.some((editor) => editor.id === 'launch-editor')) {
    debug('LAUNCH_EDITOR is not a command Cypress can find: %s', process.env.LAUNCH_EDITOR)
  }

  // LAUNCH_EDITOR can name an editor that's already detected
  return [computerOpener(), ..._.uniqBy(editors, 'binary').map(createEditor)]
}
