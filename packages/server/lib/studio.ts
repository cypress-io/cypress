import savedState from './saved_state'
import { Command, FileDetails, appendCommandsToTest, createNewTestInSuite } from './util/spec_writer'

interface SaveInfo {
  fileDetails: FileDetails
  commands: Command[]
  isSuite: boolean
  testName?: string
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
    if (isSuite) {
      return createNewTestInSuite(fileDetails, commands, testName!)
    }

    return appendCommandsToTest(fileDetails, commands)
  }

  return saveToFile()
  .then((success) => {
    return setStudioModalShown()
    .then(() => success)
  })
  .catch(() => false)
}
