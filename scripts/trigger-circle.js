/* eslint-disable no-console */
const execa = require('execa')
const got = require('got')

const changedPackages = require('./changed-packages')

const convertName = (name) => {
  return name.replace(/@cypress\//, 'npm-')
}

const containsBinary = (changes) => {
  return !!changes.find((name) => name === 'cypress' || name.includes('@packages'))
}

const generateConfig = async (changes, all = false) => {
  // get list of public packages
  const { stdout: packs } = await execa('npx', ['lerna', 'la', '--json'])
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
  try {
    const pr = process.env.CIRCLE_PULL_REQUEST.match(/\d+/)[0]

    const response = await got.get(`https://api.github.com/repos/cypress-io/cypress/pulls/${pr}`, { responseType: 'json' })

    return response.body.base.ref
  } catch (e) {
    return null
  }
}

const findBase = async (currentBranch) => {
  // if we know there is a PR, find it's base
  if (process.env.CIRCLE_PULL_REQUEST) {
    const prBase = await getPRBase()

    if (prBase) {
      return prBase
    }
  }

  // we don't know exactly what to compare to here without PR info
  // so we check if the current state of develop is in the history of our branch
  // and if it is we base off develop, if not then our branch is behind develop
  // so we default to master as the most likely option

  const { stdout: branchesFromDevelop } = await execa('git', ['branch', '--contains', 'develop'])

  return branchesFromDevelop.includes(currentBranch) ? 'develop' : 'master'
}

const configByChanged = async (currentBranch) => {
  // make sure that we have both develop and master pulled down
  await execa('git', ['fetch', 'origin', 'develop:develop'])
  await execa('git', ['fetch', 'origin', 'master:master'])

  const base = await findBase(currentBranch)
  const changed = await changedPackages(base)

  return await generateConfig(changed)
}

const triggerPipeline = async (config, currentBranch) => {
  const response = await got.post(`https://circleci.com/api/v2/project/gh/cypress-io/cypress/pipeline`, {
    headers: {
      api_key_header: process.env.CIRCLE_TOKEN,
    },
    json: {
      branch: currentBranch,
      parameters: config,
    },
  })

  return !!response
}

const main = async () => {
  if (!process.env.CIRCLECI) {
    console.log('This script should not be run outside of CircleCI!')
    process.exit(1)
  }

  const { stdout: currentBranch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])

  let config

  if (currentBranch === 'develop' || currentBranch === 'master') {
    config = await generateConfig([], true)
  } else {
    config = await configByChanged(currentBranch)
  }

  const trigger = await triggerPipeline(config, currentBranch)

  if (trigger) {
    console.log('Successfully triggered CircleCI workflows')
  }
}

main()
