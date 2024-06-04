const la = require('lazy-ass')
const is = require('check-more-types')
const bluebird = require('bluebird')

// goes through the list of properties and asks relevant question
// resolves with all relevant options set
// if the property already exists, skips the question
function askMissingOptions (propertiesToQuestions) {
  la(is.object(propertiesToQuestions), 'expected object property:question')

  // options are collected from the CLI
  return (options = {}) => {
    const reducer = (memo, property) => {
      if (is.has(memo, property)) {
        return memo
      }

      const question = propertiesToQuestions[property]

      if (!is.fn(question)) {
        return memo
      }

      la(is.fn(question), 'cannot find question for property', property)

      return question(memo[property]).then((answer) => {
        memo[property] = answer

        return memo
      })
    }

    const properties = Object.keys(propertiesToQuestions)

    return bluebird.reduce(properties, reducer, options)
  }
}

module.exports = askMissingOptions
