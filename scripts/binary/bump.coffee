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
  appVeyor: [
    "cypress-io/cypress-test-tiny"
    "cypress-io/cypress-example-kitchensink"
  ]

  circle: [
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
  # could also be remap + flatten
  list = []
  addToList = (projects, provider) ->
    projects.forEach (repo) ->
      list.push({
        repo,
        provider
      })
  R.mapObjIndexed(addToList, projectsByProvider)
  list

# make flat list of objects
# {repo, provider}
PROJECTS = remapProjects(_PROVIDERS)

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

awaitEachProjectAndProvider = (fn, filter = R.identity) ->
  creds = getCiConfig()
  # TODO only check tokens for providers we really going to use
  la(check.unemptyString(creds.githubToken), "missing githubToken")
  la(check.unemptyString(creds.circleToken), "missing circleToken")
  la(check.unemptyString(creds.appVeyorToken), "missing appVeyorToken")

  ## configure a new Bumpercar
  car = bumpercar.create({
    providers: {
      travis: {
        githubToken: creds.githubToken
      }
      circle: {
        circleToken: creds.circleToken
      }
      appVeyor: {
        appVeyorToken: creds.appVeyorToken
      }
    }
  })

  filteredProjects = R.filter(filter, PROJECTS)
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
    awaitEachProjectAndProvider(updateProject, projectFilter)
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
    awaitEachProjectAndProvider(makeCommit, projectFilter)
}
