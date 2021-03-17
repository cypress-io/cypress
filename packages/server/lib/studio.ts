import savedState from './saved_state'
import { Command, FileDetails, createNewTestInFile, appendCommandsToTest, createNewTestInSuite } from './util/spec_writer'

interface FileDetailsOptionalPosition {
  absoluteFile: string
  line?: number
  column?: number
}

interface SaveInfo {
  fileDetails: FileDetailsOptionalPosition
  commands: Command[]
  isSuite: boolean
  testName?: string
}

class StudioSaveError extends Error {
  static errMessage = (isSuite) => `Studio was unable to find your ${isSuite ? 'suite' : 'test'} in the spec file.`

  constructor (isSuite) {
    super(StudioSaveError.errMessage(isSuite))
    this.name = 'StudioSaveError'
  }
}

export const setStudioModalShown = () => {
  return savedState.create()
  .then((state) => {
    state.set('showedStudioModal', true)
  })
}

export const getStudioModalShown = () => {
  return savedState.create()
  .then((state) => state.get())
  .then((state) => !!state.showedStudioModal)
}

export const save = (saveInfo: SaveInfo) => {
  const { fileDetails, commands, isSuite, testName } = saveInfo

  const saveToFile = () => {
    if (!fileDetails.line || !fileDetails.column) {
      return createNewTestInFile(fileDetails, commands, testName || 'New Test')
    }

    if (isSuite) {
      return createNewTestInSuite(fileDetails as FileDetails, commands, testName || 'New Test')
    }

    return appendCommandsToTest(fileDetails as FileDetails, commands)
  }

  return saveToFile()
  .then((success) => {
    return setStudioModalShown()
    .then(() => {
      if (!success) {
        throw new StudioSaveError(isSuite)
      }

      return null
    })
  })
  .catch((err) => {
    return {
      type: err.type,
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  })
}
