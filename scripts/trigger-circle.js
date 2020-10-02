/* eslint-disable no-console */
const { execSync } = require('child_process')
const https = require('https')

const changedPackages = require('./changed-packages')

const convertName = (name) => {
  return name.replace(/@cypress\//, 'npm-')
}

const containsBinary = (changes) => {
  return !!changes.find((name) => name === 'cypress' || name.includes('@packages'))
}

const exec = (...args) => {
  return execSync(...args).toString().trim()
}

const makeHTTPRequest = async (options, data) => {
  let output = ''

  if (!options.headers || !options.headers['User-Agent']) {
    options.headers = {
      'User-Agent': 'curl/7.37.0',
      ...options.headers,
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', (d) => {
        output += d
      })

      res.on('end', () => {
        resolve(output)
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

const generateConfig = async (changes, all = false) => {
  // get list of public packages
  const packs = exec('npx lerna la --json')
  const packages = JSON.parse(packs)
  const publicPackages = packages.filter((p) => p.name.includes('@cypress') && !p.private)

  const config = {
    trigger: false, // trigger is always false since we don't want to run this job twice
    binary: all || containsBinary(changes),
  }

  // determine whether we should run each package
  for (let { name } of publicPackages) {
    const workflow = convertName(name)

    config[workflow] = all || changes.includes(name)
  }

  return config
}

const getPRBase = async () => {
  // const pr = process.env.CIRCLE_PULL_REQUEST.match(/\d+/)[0]
  const pr = 'https://github.com/cypress-io/cypress/pull/8726'.match(/\d+/)[0]

  try {
    const response = await makeHTTPRequest({
      hostname: 'api.github.com',
      path: `/repos/cypress-io/cypress/pulls/${pr}`,
      method: 'GET',
    })

    return JSON.parse(response).base.ref
  } catch (e) {
    return null
  }
}

const findBase = async (currentBranch) => {
  // if we know there is a PR, find it's base
  if (process.env.CIRCLE_PULL_REQUEST) {
    const prBase = await getPRBase()

    console.log(`Found base of PR on GitHub: ${prBase}`)

    if (prBase) {
      return prBase
    }
  }

  // we don't know exactly what to compare to here without PR info
  // so we check if the current state of develop is in the history of our branch
  // and if it is we base off develop, if not then our branch is behind develop
  // so we default to master as the most likely option

  const branchesFromDevelop = exec('git branch --contains develop')
  const isDevelop = branchesFromDevelop.includes(currentBranch)

  if (!isDevelop) {
    // make sure that we have master pulled down
    exec('git fetch origin master:master')
  }

  return isDevelop ? 'develop' : 'master'
}

const configFromCompare = async (compare) => {
  console.log(`Comparing to base ${compare}`)

  const changed = await changedPackages(compare)

  return await generateConfig(changed)
}

const configForBranch = async (currentBranch) => {
  const base = await findBase(currentBranch)

  return await configFromCompare(base)
}

const triggerPipeline = async (config, currentBranch) => {
  const response = await makeHTTPRequest({
    hostname: 'circleci.com',
    path: '/api/v2/project/gh/cypress-io/cypress/pipeline',
    method: 'POST',
    headers: {
      'Circle-Token': process.env.CIRCLE_TOKEN,
    },
  }, {
    branch: currentBranch,
    parameters: config,
  })

  return !!response
}

const main = async () => {
  if (!process.env.CIRCLECI) {
    console.log('This script should not be run outside of CircleCI!')
    process.exit(1)
  }

  const currentBranch = exec('git rev-parse --abbrev-ref HEAD')

  console.log(`Current branch ${currentBranch}`)

  let config

  if (currentBranch === 'develop' || currentBranch === 'master') {
    config = await configFromCompare('HEAD~')
  } else {
    config = await configForBranch(currentBranch)
  }

  console.log('Using configuration:')
  console.log(config)

  const trigger = await triggerPipeline(config, currentBranch)

  if (trigger) {
    console.log('Successfully triggered CircleCI workflows')
  }
}

main()
