import _ from 'lodash'
import { dialog, OpenDialogOptions, SaveDialogOptions } from 'electron'
import path from 'path'

import { get as getWindow } from './windows'

export const show = () => {
  // associate this dialog to the mainWindow
  // so the user never loses track of which
  // window the dialog belongs to. in other words
  // if they blur off, they only need to focus back
  // on the Cypress app for this dialog to appear again
  // https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/Sheets/Concepts/AboutSheets.html

  const props: OpenDialogOptions = {
    // we only want the user to select a single
    // directory. not multiple, and not files
    properties: ['openDirectory'],
  }

  return dialog.showOpenDialog(props)
  .then((obj) => {
    // return the first path since there can only ever
    // be a single directory selection
    return _.get(obj, ['filePaths', 0])
  })
}

export const showSaveDialog = (integrationFolder: string) => {
  // attach to the desktop-gui window so it displays as a modal rather than a standalone window
  const window = getWindow('INDEX')
  const props: SaveDialogOptions = {
    defaultPath: path.join(integrationFolder, 'untitled.spec.js'),
    buttonLabel: 'Create File',
    showsTagField: false,
    filters: [{
      name: 'JavaScript',
      extensions: ['.js'],
    }, {
      name: 'TypeScript',
      extensions: ['.ts'],
    }, {
      name: 'Other',
      extensions: ['*'],
    }],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  }

  return dialog.showSaveDialog(window, props).then((obj) => {
    return obj.filePath || null
  })
}
