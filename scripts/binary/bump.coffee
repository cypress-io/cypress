require("console.table")
_         = require("lodash")
fs        = require("fs-extra")
Promise   = require("bluebird")
bumpercar = require("@cypress/bumpercar")
path      = require("path")
la        = require('lazy-ass')
check     = require('check-more-types')
R         = require("ramda")
{configFromEnvOrJsonFile, filenameToShellVariable} = require('@cypress/env-or-json-file')
makeEmptyGithubCommit = require("make-empty-github-commit")
parse = require("parse-github-repo-url")

fs = Promise.promisifyAll(fs)

car = null

# all the projects to trigger / run / change environment variables for
_PROVIDERS = {
  buildkite: {
    main: "cypress-io/cypress"
    others: [
      "cypress-io/cypress-test-tiny"
      "cypress-io/cypress-example-kitchensink"
    ]
  }

  appVeyor: {
    main: "cypress-io/cypress"
    others: [
      "cypress-io/cypress-test-tiny"
      "cypress-io/cypress-test-example-repos"
      "cypress-io/cypress-example-kitchensink"
      "cypress-io/cypress-example-todomvc"
    ]
  }

  circle: {
    main: "cypress-io/cypress"
    others: [
      # "cypress-io/cypress-dashboard"
      # "cypress-io/cypress-core-example"
      # "cypress-io/cypress-core-desktop-gui"
      # "cypress-io/cypress-example-kitchensink"
      # "cypress-io/cypress-example-todomvc"
      # "cypress-io/cypress-example-piechopper"
      # "cypress-io/cypress-example-recipes"

      "cypress-io/cypress-test-tiny"
      "cypress-io/cypress-test-module-api"
      "cypress-io/cypress-test-node-versions"
      "cypress-io/cypress-test-nested-projects"
      "cypress-io/cypress-test-ci-environments"
      "cypress-io/cypress-test-example-repos"
    ]
  }

  # travis: [
  #   # "cypress-io/cypress-dashboard"
  #   "cypress-io/cypress-core-example"
  #   "cypress-io/cypress-core-desktop-gui"
  #   "cypress-io/cypress-example-kitchensink"
  #   "cypress-io/cypress-example-todomvc"
  #   "cypress-io/cypress-example-piechopper"
  #   "cypress-io/cypress-example-recipes"
  # ]
}

remapProjects = (projectsByProvider) ->
  list = []

  _.mapValues projectsByProvider, (provider, name) ->
    provider.others.forEach (repo) ->
      list.push({
        repo
        provider: name
      })

  list

remapMain = (projectsByProvider) ->
  list = []

  _.mapValues projectsByProvider, (provider, name) ->
    list.push({
      repo: provider.main
      provider: name
    })

  list

# make flat list of objects
# {repo, provider}
PROJECTS = remapProjects(_PROVIDERS)
MAIN_PROJECTS = remapMain(_PROVIDERS)

getCiConfig = ->
  ## gleb: fix this plzzzzzz
  old = process.cwd()

  process.chdir(__dirname)

  key = "support/.ci.json"

  config = configFromEnvOrJsonFile(key)

  process.chdir(old)

  if !config
    console.error('⛔️  Cannot find CI credentials')
    console.error('Using @cypress/env-or-json-file module')
    console.error('and filename', key)
    console.error('which is environment variable', filenameToShellVariable(key))
    throw new Error('CI config not found')
  config

awaitEachProjectAndProvider = (projects, fn, filter = R.identity) ->
  creds = getCiConfig()

  ## configure a new Bumpercar
  providers = {}
  if check.unemptyString(creds.githubToken)
    providers.travis = {
      githubToken: creds.githubToken
    }
  if check.unemptyString(creds.circleToken)
    providers.circle = {
      circleToken: creds.circleToken
    }
  if check.unemptyString(creds.appVeyorToken)
    providers.appVeyor = {
      appVeyorToken: creds.appVeyorToken
    }
  if check.unemptyString(creds.buildkiteToken)
    providers.buildkite = {
      buildkiteToken: creds.buildkiteToken
    }
  providerNames = Object.keys(providers)
  console.log("configured providers", providerNames)
  la(check.not.empty(providerNames), "empty list of providers")

  car = bumpercar.create({providers})

  filteredProjects = R.filter(filter, projects)
  if check.empty(filteredProjects)
    console.log("⚠️ zero filtered projects left after filtering")
  console.table("filtered projects", filteredProjects)
  Promise.mapSeries filteredProjects, (project) ->
    fn(project.repo, project.provider, creds)

# do not trigger all projects if there is specific provider
# for example appVeyor should be used for Windows testing
getFilterByProvider = (providerName) ->
  if providerName
    console.log("only allow projects for provider", providerName)
    projectFilter = R.propEq("provider", providerName)
  else
    projectFilter = R.identity
  projectFilter

module.exports = {
  nextVersion: (version) ->
    console.table("All possible projects", MAIN_PROJECTS)

    la(check.unemptyString(version),
      "missing next version to set", version)

    updateProject = (project, provider) ->
      console.log("setting %s environment variables in project %s", provider, project)
      car.updateProjectEnv(project, provider, {
        NEXT_DEV_VERSION: version,
      })

    awaitEachProjectAndProvider(MAIN_PROJECTS, updateProject)

  # in each project, set a couple of environment variables
  version: (nameOrUrl, binaryVersionOrUrl, platform, providerName) ->
    console.table("All possible projects", PROJECTS)

    la(check.unemptyString(nameOrUrl),
      "missing cypress name or url to set", nameOrUrl)

    if check.semver(nameOrUrl)
      console.log("for version", nameOrUrl)
      nameOrUrl = "cypress@#{nameOrUrl}"
      console.log("full NPM install name is", nameOrUrl)

    la(check.unemptyString(binaryVersionOrUrl),
      "missing binary version or url", binaryVersionOrUrl)

    result = {
      versionName: nameOrUrl,
      binary: binaryVersionOrUrl
    }

    projectFilter = getFilterByProvider(providerName)

    updateProject = (project, provider) ->
      console.log("setting environment variables in", project)
      car.updateProjectEnv(project, provider, {
        CYPRESS_NPM_PACKAGE_NAME: nameOrUrl,
        CYPRESS_BINARY_VERSION: binaryVersionOrUrl
      })
    awaitEachProjectAndProvider(PROJECTS, updateProject, projectFilter)
    .then R.always(result)

  run: (message, providerName) ->
    projectFilter = getFilterByProvider(providerName)

    if not message
      message =
        """
        Testing new Cypress version

        """
      if process.env.CIRCLE_BUILD_URL
        message += "\n"
        message += "Circle CI build url #{process.env.CIRCLE_BUILD_URL}"

      if process.env.APPVEYOR
        slug = process.env.APPVEYOR_PROJECT_SLUG
        build = process.env.APPVEYOR_BUILD_ID
        message += "\n"
        message += "AppVeyor CI #{slug} #{build}"

    makeCommit = (project, provider, creds) ->
      # instead of triggering CI via API
      # car.runProject(project, provider)
      # make empty commit to trigger CIs

      parsedRepo = parse(project)
      console.log("running project", project)
      makeEmptyGithubCommit({
        owner: parsedRepo[0],
        repo: parsedRepo[1],
        token: creds.githubToken,
        message
      })
    awaitEachProjectAndProvider(PROJECTS, makeCommit, projectFilter)
}
