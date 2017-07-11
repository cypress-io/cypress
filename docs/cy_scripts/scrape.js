/* eslint-disable no-console */

const path = require('path')
const chalk = require('chalk')
const request = require('request-promise')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

function getCircleCredentials () {
  const pathToCircleCreds = path.resolve('support', '.circle-credentials.json')

  const example = JSON.stringify({
    token: 'foobarbaz',
  }, null, 2)

  return fs.readJsonAsync(pathToCircleCreds)
  .catch({ code: 'ENOENT' }, () => {
    return {}
  })
  .then((json) => {
    const token = json.token

    if (!token) {
      console.log(chalk.red(`Cannot scrape docs.\n\nYou are missing your Circle CI token.\n\nPlease add your token here: ${pathToCircleCreds}\n\nIt should look like this:\n\n${example}\n`))
    }

    return token
  })
}

function scrape () {
  return getCircleCredentials()
  .then((token) => {
    // bail if we dont have a token
    if (!token) {
      console.log('After fixing this problem you can run scraping by itself with this command:', chalk.yellow('npm run scrape'), '\n')
      return
    }

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
