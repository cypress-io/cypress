import _ from 'lodash'
import { dialog, OpenDialogOptions, SaveDialogOptions } from 'electron'

import { get as getWindow } from './windows'

module.exports = {
  show () {
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
  },

  showSaveDialog (integrationFolder: string) {
    const window = getWindow('INDEX')
    const props: SaveDialogOptions = {
      defaultPath: `${integrationFolder}/untitled_spec`,
      showsTagField: false,
      filters: [{
        name: 'JavaScript',
        extensions: ['.js'],
      }, {
        name: 'TypeScript',
        extensions: ['.ts'],
      }, {
        name: 'JSX',
        extensions: ['.jsx'],
      }, {
        name: 'TSX',
        extensions: ['.tsx'],
      }, {
        name: 'Other',
        extensions: ['*'],
      }],
      properties: ['createDirectory'],
    }

    return dialog.showSaveDialog(window, props).then((obj) => {
      console.log(obj)
    })
  },
}
