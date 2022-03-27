import debugModule from 'debug'
import launchEditor from 'launch-editor'

const debug = debugModule('cypress:server:file-opener')

export interface OpenFileDetails {
  file: string
  where: {
    binary: string
  }
  line: number
  column: number
}

export const openFile = (fileDetails: OpenFileDetails) => {
  debug('open file: %o', fileDetails)

  const binary = fileDetails.where.binary

  if (binary === 'computer') {
    try {
      require('electron').shell.showItemInFolder(fileDetails.file)
    } catch (err: any) {
      debug('error opening file: %s', err.stack)
    }

    return
  }

  const { file, line, column } = fileDetails

  launchEditor(`${file}:${line}:${column}`, `"${binary}"`, (__, errMsg) => {
    debug('error opening file: %s', errMsg)
  })
}
