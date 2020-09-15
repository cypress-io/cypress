const _ = require('lodash')
const Promise = require('bluebird')
const bumpercar = require('@cypress/bumpercar')
const path = require('path')
const la = require('lazy-ass')
const check = require('check-more-types')
const R = require('ramda')
const { configFromEnvOrJsonFile, filenameToShellVariable } = require('@cypress/env-or-json-file')
const makeEmptyGithubCommit = require('make-empty-github-commit')
const parse = require('parse-github-repo-url')
const { setCommitStatus } = require('@cypress/github-commit-status-check')

let car = null

// all the projects to trigger / run / change environment variables for
const _PROVIDERS = {
  appVeyor: {
    main: 'cypress-io/cypress',
    win32: [
      'cypress-io/cypress-test-tiny',
      'cypress-io/cypress-test-example-repos',
    ],
  },

  circle: {
    main: 'cypress-io/cypress',
    linux: [
      'cypress-io/cypress-test-tiny',
      'cypress-io/cypress-test-module-api',
      'cypress-io/cypress-test-node-versions',
      'cypress-io/cypress-test-nested-projects',
      'cypress-io/cypress-test-ci-environments',
      'cypress-io/cypress-test-example-repos',
    ],
    darwin: [
      'cypress-io/cypress-test-tiny',
      'cypress-io/cypress-test-example-repos',
    ],
  },
}

const remapProjects = function (projectsByProvider) {
  const list = []

  _.mapValues(projectsByProvider, (provider, name) => {
    const remapPlatform = (platform, repos) => {
      return repos.forEach((repo) => {
        return list.push({
          repo,
          provider: name,
          platform,
        })
      })
    }

    if (provider.win32) {
      remapPlatform('win32', provider.win32)
    }

    if (provider.linux) {
      remapPlatform('linux', provider.linux)
    }

    if (provider.darwin) {
      return remapPlatform('darwin', provider.darwin)
    }
  })

  return list
}

const remapMain = function (projectsByProvider) {
  const list = []

  _.mapValues(projectsByProvider, (provider, name) => {
    return list.push({
      repo: provider.main,
      provider: name,
    })
  })

  return list
}

// make flat list of objects
// {repo, provider, platform}
const PROJECTS = remapProjects(_PROVIDERS)

const getCiConfig = function () {
  const key = path.join('scripts', 'support', 'ci.json')
  const config = configFromEnvOrJsonFile(key)

  if (!config) {
    console.error('⛔️  Cannot find CI credentials')
    console.error('Using @cypress/env-or-json-file module')
    console.error('and filename', key)
    console.error('which is environment variable', filenameToShellVariable(key))
    throw new Error('CI config not found')
  }

  return config
}

const awaitEachProjectAndProvider = function (projects, fn, filter = R.identity) {
  const creds = getCiConfig()

  // configure a new Bumpercar
  const providers = {}

  if (check.unemptyString(creds.githubToken)) {
    providers.travis = {
      githubToken: creds.githubToken,
    }
  }

  if (check.unemptyString(creds.circleToken)) {
    providers.circle = {
      circleToken: creds.circleToken,
    }
  }

  if (check.unemptyString(creds.appVeyorToken)) {
    providers.appVeyor = {
      appVeyorToken: creds.appVeyorToken,
    }
  }

  const providerNames = Object.keys(providers)

  console.log('configured providers', providerNames)
  la(check.not.empty(providerNames), 'empty list of providers')

  car = bumpercar.create({ providers })

  const filteredProjects = R.filter(filter, projects)

  if (check.empty(filteredProjects)) {
    console.log('⚠️ zero filtered projects left after filtering')
  }

  console.log('filtered projects:')
  console.table(filteredProjects)

  return Promise.mapSeries(filteredProjects, (project) => {
    return fn(project.repo, project.provider, creds)
  })
}

// do not trigger all projects if there is specific provider
// for example appVeyor should be used for Windows testing
const getFilterByProvider = function (providerName, platformName) {
  let platformFilter; let providerFilter

  if (providerName) {
    console.log('only allow projects for provider', providerName)
    providerFilter = R.propEq('provider', providerName)
  } else {
    providerFilter = R.identity
  }

  if (platformName) {
    console.log('only allow projects for platform', platformName)
    platformFilter = R.propEq('platform', platformName)
  } else {
    platformFilter = R.identity
  }

  // combined filter is when both filters pass
  const projectFilter = R.allPass([providerFilter, platformFilter])

  return projectFilter
}

module.exports = {
  _PROVIDERS,

  remapProjects,

  getFilterByProvider,

  nextVersion (version) {
    const MAIN_PROJECTS = remapMain(_PROVIDERS)

    console.log('Setting next version to build', version)
    console.log('In these projects:')
    console.table(MAIN_PROJECTS)

    la(check.unemptyString(version),
      'missing next version to set', version)

    const setNextDevVersion = function (project, provider) {
      console.log('setting env var NEXT_DEV_VERSION to %s on %s in project %s',
        version, provider, project)

      return car.updateProjectEnv(project, provider, {
        NEXT_DEV_VERSION: version,
      })
    }

    return awaitEachProjectAndProvider(MAIN_PROJECTS, setNextDevVersion)
  },

  // in each project, set a couple of environment variables
  version (nameOrUrl, binaryVersionOrUrl, platform, providerName) {
    console.log('All possible projects:')
    console.table(PROJECTS)

    la(check.unemptyString(nameOrUrl),
      'missing cypress name or url to set', nameOrUrl)

    if (check.semver(nameOrUrl)) {
      console.log('for version', nameOrUrl)
      nameOrUrl = `cypress@${nameOrUrl}`
      console.log('full NPM install name is', nameOrUrl)
    }

    la(check.unemptyString(binaryVersionOrUrl),
      'missing binary version or url', binaryVersionOrUrl)

    const result = {
      versionName: nameOrUrl,
      binary: binaryVersionOrUrl,
    }

    const projectFilter = getFilterByProvider(providerName)

    const updateProject = function (project, provider) {
      console.log('setting environment variables in', project)

      return car.updateProjectEnv(project, provider, {
        CYPRESS_NPM_PACKAGE_NAME: nameOrUrl,
        CYPRESS_INSTALL_BINARY: binaryVersionOrUrl,
      })
    }

    return awaitEachProjectAndProvider(PROJECTS, updateProject, projectFilter)
    .then(R.always(result))
  },

  // triggers test projects on multiple CIs
  // the test projects will exercise the new version of
  // the Cypress test runner we just built
  runTestProjects (getStatusAndMessage, providerName, version, platform) {
    const projectFilter = getFilterByProvider(providerName, platform)

    const makeCommit = function (project, provider, creds) {
      // make empty commit to trigger CIs
      // project is owner/repo string like cypress-io/cypress-test-tiny
      console.log('making commit to project', project)

      // print if we have a few github variables present
      console.log('do we have GH_APP_ID?', Boolean(process.env.GH_APP_ID))
      console.log('do we have GH_INSTALLATION_ID?', Boolean(process.env.GH_INSTALLATION_ID))
      console.log('do we have GH_PRIVATE_KEY?', Boolean(process.env.GH_PRIVATE_KEY))

      const parsedRepo = parse(project)
      const owner = parsedRepo[0]
      const repo = parsedRepo[1]

      let { status, message } = getStatusAndMessage(repo)

      if (!message) {
        message =
          `\
Testing new Cypress version ${version}
\
`

        if (process.env.CIRCLE_BUILD_URL) {
          message += '\n'
          message += `Circle CI build url ${process.env.CIRCLE_BUILD_URL}`
        }

        if (process.env.APPVEYOR) {
          const slug = process.env.APPVEYOR_PROJECT_SLUG
          const build = process.env.APPVEYOR_BUILD_ID

          message += '\n'
          message += `AppVeyor CI ${slug} ${build}`
        }
      }

      const defaultOptions = {
        owner,
        repo,
        message,
        token: creds.githubToken,
      }

      const createGithubCommitStatusCheck = function ({ sha }) {
        if (!status) {
          return
        }

        // status is {owner, repo, sha} and maybe a few other properties
        const isStatus = check.schema({
          owner: check.unemptyString,
          repo: check.unemptyString,
          sha: check.commitId,
          context: check.unemptyString,
          platform: check.unemptyString,
          arch: check.unemptyString,
        })

        if (!isStatus(status)) {
          console.error('Invalid status object %o', status)
        }

        const targetUrl = `https://github.com/${owner}/${repo}/commit/${sha}`
        const commitStatusOptions = {
          targetUrl,
          owner: status.owner,
          repo: status.repo,
          sha: status.sha,
          context: status.context,
          state: 'pending',
          description: `${owner}/${repo}`,
        }

        console.log(
          'creating commit status check',
          commitStatusOptions.description,
          commitStatusOptions.context,
        )

        return setCommitStatus(commitStatusOptions)
      }

      if (!version) {
        return makeEmptyGithubCommit(defaultOptions).then(createGithubCommitStatusCheck)
      }

      // first try to commit to branch for next upcoming version
      const specificBranchOptions = {
        owner,
        repo,
        token: creds.githubToken,
        message,
        branch: version,
      }

      return makeEmptyGithubCommit(specificBranchOptions)
      .catch(() => {
        // maybe there is no branch for next version
        // try default branch
        return makeEmptyGithubCommit(defaultOptions)
      }).then(createGithubCommitStatusCheck)
    }

    return awaitEachProjectAndProvider(PROJECTS, makeCommit, projectFilter)
  },
}
