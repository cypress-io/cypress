const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid')
const { CHANGESET_DIR, changeCatagories, userFacingChanges } = require('./changeset')

const changeTypes = Object.keys(changeCatagories)
const userFacingChangeTypes = Object.keys(userFacingChanges)

const prompt = (questions) => {
  return Promise.resolve(inquirer.prompt(questions))
}

module.exports = () => {
  let changeEntry = []

  return prompt([{
    name: 'changeType',
    type: 'list',
    message: 'What type of change is this?',
    choices: changeTypes,
  }]).then((opts) => {
    if (!userFacingChangeTypes.includes(opts.changeType)) {
      console.log('This is not a user-facing change. No need to create a changelog entry.')

      process.exit(0)
    }

    changeEntry.push('---')
    changeEntry.push(`type: ${opts.changeType}`)
    changeEntry.push('---')

    return prompt([{
      name: 'changeset',
      type: 'input',
      message: 'What was changed?',
    }])
  }).then(async (opts) => {
    changeEntry.push('')
    changeEntry.push(opts.changeset)

    const fileName = `${uuid.v4()}.md`
    const changesetPath = path.join(CHANGESET_DIR, fileName)

    fs.writeFileSync(changesetPath, changeEntry.join('\n'))

    console.log('Added changeset to', changesetPath)
  })
}
