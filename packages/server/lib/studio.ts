import * as savedState from './saved_state'
import { Command, SaveDetails, createNewTestInFile, appendCommandsToTest, createNewTestInSuite, convertCommandsToText } from './util/spec_writer'

interface SaveInfo extends SaveDetails {
  isSuite: boolean
  isRoot: boolean
}

class StudioSaveError extends Error {
  static errMessage = (isSuite) => `Studio was unable to find your ${isSuite ? 'suite' : 'test'} in the spec file.`

  constructor (isSuite) {
    super(StudioSaveError.errMessage(isSuite))
    this.name = 'StudioSaveError'
  }
}

export const getStudioModalShown = () => {
  return savedState.create()
  .then((state) => state.get())
  .then((state) => !!state.showedStudioModal)
}

export const save = (saveInfo: SaveInfo) => {
  const { isSuite, isRoot, absoluteFile, commands, testName } = saveInfo

  const saveToFile = () => {
    if (isRoot) {
      return createNewTestInFile(absoluteFile, commands, testName || 'New Test')
    }

    if (isSuite) {
      return createNewTestInSuite(saveInfo)
    }

    return appendCommandsToTest(saveInfo)
  }

  return saveToFile()
  .then((success) => {
    if (!success) {
      throw new StudioSaveError(isSuite)
    }

    return null
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

export const getCommandsText = (commands: Command[]) => {
  return convertCommandsToText(commands)
}
