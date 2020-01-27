import debugModule from 'debug'
import launchEditor from 'launch-editor'

const debug = debugModule('cypress:server:file-opener')

export const openFile = (fileDetails) => {
  debug('open file: %o', fileDetails)

  const openerId = fileDetails.where.openerId

  if (openerId === 'computer') {
    try {
      require('electron').shell.showItemInFolder(fileDetails.file)
    } catch (err) {
      debug('error opening file: %s', err.stack)
    }

    return
  }

  const { file, line, column } = fileDetails

  launchEditor(`${file}:${line}:${column}`, `"${openerId}"`, (__, errMsg) => {
    debug('error opening file: %s', errMsg)
  })
}
