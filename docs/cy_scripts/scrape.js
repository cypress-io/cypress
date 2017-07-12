/* eslint-disable no-console */

const path = require('path')
const chalk = require('chalk')
const request = require('request-promise')
const { configFromEnvOrJsonFile } = require('./env-or-file')
const { stripIndent } = require('common-tags')
const R = require('ramda')

function checkToken (token) {
  if (!token) {
    const example = JSON.stringify({
      token: 'foobarbaz',
    })

    console.log(chalk.red(stripIndent`Cannot scrape docs.
      You are missing your Circle CI API token.
      It should look like this:

        ${example}
    `))
    throw new Error('missing token')
  }
}

function getCircleCredentials () {
  const key = path.join('support', '.circle-credentials.json')
  return configFromEnvOrJsonFile(key)
    .get('token')
}

function scrape () {
  return getCircleCredentials()
  .then(R.tap(checkToken))
  .then((token) => {
    // hmm, how do we trigger workflow?
    // seems this is not supported yet as of July 10th 2017
    // https://discuss.circleci.com/t/trigger-workflow-through-rest-api/13931
    return request({
      url: 'https://circleci.com/api/v1.1/project/github/cypress-io/docsearch-scraper/',
      method: 'POST',
      json: true,
      auth: {
        user: token,
      },
    })
    .then((body) => {
      console.log('\n', 'Started Circle CI build:', chalk.green(body.build_url), '\n')
    })
  })
}

// if we're not being required
// then kick off scraping
if (!module.parent) {
  scrape()
}

module.exports = scrape
