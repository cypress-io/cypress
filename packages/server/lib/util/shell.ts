import _ from 'lodash'
import commandExistsModule from 'command-exists'

export const commandExists = (command) => {
  return Promise.resolve(commandExistsModule(command))
  .then(() => true)
  // commandExists rejects with no error if command does not exist
  // otherwise, it's a legitimate error
  .catch((err) => {
    if (_.isNil(err)) {
      return false
    }

    throw err
  })
}
