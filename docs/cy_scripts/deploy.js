/* eslint-disable no-console */

const _          = require('lodash')
const path       = require('path')
const gift       = require('gift')
const gulp       = require('gulp')
const chalk      = require('chalk')
const human      = require('human-interval')
const Promise    = require('bluebird')
const inquirer   = require('inquirer')
const awspublish = require('gulp-awspublish')
const parallelize = require('concurrent-transform')
const scrape     = require('./scrape')

const distDir = path.resolve('public')

const fs = Promise.promisifyAll(require('fs-extra'))

// initialize on existing repo
const repo = Promise.promisifyAll(gift(path.resolve('..')))

console.log()
console.log(chalk.yellow('Cypress Docs Deployinator'))
console.log(chalk.yellow('==============================\n'))

function getS3Credentials () {
  const pathToAwsCreds = path.resolve('support', '.aws-credentials.json')

  return fs.readJsonAsync(pathToAwsCreds)
  .catch({ code: 'ENOENT' }, (err) => {
    console.log(chalk.red(`Cannot deploy.\n\nYou are missing your AWS credentials.\n\nPlease add your credentials here: ${pathToAwsCreds}\n`))

    throw err
  })
}

function getCurrentBranch () {
  return repo.branchAsync()
  .get('name')
}

function promptForDeployEnvironment () {
  return prompt({
    type: 'list',
    name: 'strategy',
    message: 'Which environment are you deploying?',
    choices: [
      { name: 'Staging',    value: 'staging' },
      { name: 'Production', value: 'production' },
    ],
  })
  .get('strategy')
}

function ensureCleanWorkingDirectory () {
  return repo.statusAsync()
  .then((status) => {
    if (!status.clean) {
      console.log(chalk.red('\nUncommited files:'))

      _.each(status.files, (props, file) => {
        console.log(chalk.red(`- ${file}`))
      })

      console.log('')

      throw new Error('Cannot deploy master to production. You must first commit these above files.')
    }
  })
}

function getPublisher (bucket, key, secret) {
  return awspublish.create({
    httpOptions: {
      timeout: human('10 minutes'),
    },
    params: {
      Bucket: bucket,
    },
    accessKeyId: key,
    secretAccessKey: secret,
  })
}

function publishToS3 (publisher) {
  const headers = {}

  return new Promise((resolve, reject) => {
    const files = path.join(distDir, '**', '*')

    return gulp.src(files)
    .pipe(parallelize(publisher.publish(headers), 100))

    // we dont need to gzip here because cloudflare
    // will automatically gzip the content for us
    // after its cached at their edge location
    // but we should probably gzip the index.html?
    // .pipe(awspublish.gzip({ext: '.gz'}))

    .pipe(awspublish.reporter())
    .on('error', reject)
    .on('end', resolve)
  })
}

function uploadToS3 (env) {
  return getS3Credentials()
  .then((json) => {
    const bucket = json[`bucket-${env}`] || (function () {
      throw new Error(`Could not find a bucket for environment: ${env}`)
    })()

    console.log('\n', 'Deploying to:', chalk.green(bucket), '\n')

    const publisher = getPublisher(bucket, json.key, json.secret)

    return publishToS3(publisher)
  })
}

function prompt (questions) {
  return Promise.resolve(inquirer.prompt(questions))
}

function commitMessage (env, branch) {
  const msg = `docs: deployed to ${env} [skip ci]`

  console.log(
    '\n',
    'Committing and pushing to remote origin:',
    '\n',
    chalk.green(`(${branch})`),
    chalk.cyan(msg)
  )

  // commit empty message that we deployed
  return repo.commitAsync(msg, {
    'allow-empty': true,
  })
  .then(function () {
    // and push it to the origin with the current branch
    return repo.remote_pushAsync('origin', branch)
  })
}

function scrapeDocs (env, branch) {
  console.log('')

  // if we aren't on master do nothing
  if (branch !== 'master') {
    console.log('Skipping doc scraping because you are not on branch:', chalk.cyan('master'))

    return
  }

  // if we arent deploying to production return
  if (env !== 'production') {
    console.log('Skipping doc scraping because you deployed to:', chalk.cyan('production'))

    return
  }

  return prompt({
    type: 'list',
    name: 'scrape',
    message: 'Would you like to scrape the docs? (You only need to do this if they have changed on this deployment)',
    choices: [
      { name: 'Yes', value: true },
      { name: 'No',  value: false },
    ],
  })
  .get('scrape')
  .then((bool) => {
    if (bool) {
      return scrape()
    }
  })

}

getS3Credentials()
.then(getCurrentBranch)
.then((branch) => {
  console.log('On branch:', chalk.green(branch), '\n')

  return promptForDeployEnvironment()
  .then((env) => {
    if (env === 'staging') {
      return env
    }

    if (env === 'production') {
      if (branch !== 'master') {
        throw new Error('Cannot deploy master to production. You are not on the \'master\' branch.')
      }

      return ensureCleanWorkingDirectory()
      .return(env)
    } else {
      throw new Error(`Unknown environment: ${env}`)
    }
  })
  .then((env) => {
    return uploadToS3(env)
    .then(() => {
      return commitMessage(env, branch)
    })
    .then(() => {
      return scrapeDocs(env, branch)
    })
  })
})
.then(() => {
  console.log(chalk.yellow('\n==============================\n'))
  console.log(chalk.bgGreen(chalk.black(' Done Deploying ')))
  console.log('')
})
