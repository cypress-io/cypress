const inquirer = require('inquirer')
const { userFacingChanges, changeCatagories } = require('./semantic-commits/change-categories')
const { addChangeset } = require('./changeset')

const changeTypes = Object.keys(changeCatagories)
const userFacingChangeTypes = Object.keys(userFacingChanges)

const prompt = (questions) => {
  return Promise.resolve(inquirer.prompt(questions))
}

module.exports = async ({ type, message }) => {
  if (!type) {
    type = await prompt([{
      name: 'type',
      type: 'list',
      message: 'What type of change is this?',
      choices: changeTypes,
    }]).then((opts) => opts.type)
  } else {
    if (!changeTypes.includes(type)) {
      console.log(`${type} is not a valid change type. Use one of: ${changeTypes.join(',')}.`)

      process.exit(0)
    }
  }

  if (!userFacingChangeTypes.includes(type)) {
    console.log('This is not a user-facing change. No need to create a changelog entry.')

    process.exit(0)
  }

  if (!message) {
    message = await prompt([{
      name: 'message',
      type: 'input',
      message: 'What was changed?',
    }]).then((opts) => opts.message)
  }

  return addChangeset(type, message)
}
