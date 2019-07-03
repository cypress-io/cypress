require("console.table")
_         = require("lodash")
fs        = require("fs-extra")
Promise   = require("bluebird")
bumpercar = require("@cypress/bumpercar")
path      = require("path")
la        = require('lazy-ass')
check     = require('check-more-types')
R         = require("ramda")
os        = require("os")
{configFromEnvOrJsonFile, filenameToShellVariable} = require('@cypress/env-or-json-file')
makeEmptyGithubCommit = require("make-empty-github-commit")
parse = require("parse-github-repo-url")
{setCommitStatus} = require("@cypress/github-commit-status-check")

fs = Promise.promisifyAll(fs)

car = null

# all the projects to trigger / run / change environment variables for
_PROVIDERS = {
  appVeyor: {
    main: "cypress-io/cypress"
    win32: [
      "cypress-io/cypress-test-tiny"
      "cypress-io/cypress-test-example-repos"
    ]
  }

  circle: {
    main: "cypress-io/cypress"
    linux: [
      "cypress-io/cypress-test-tiny"
      "cypress-io/cypress-test-module-api"
      "cypress-io/cypress-test-node-versions"
      "cypress-io/cypress-test-nested-projects"
      "cypress-io/cypress-test-ci-environments"
      "cypress-io/cypress-test-example-repos"
    ]
    darwin: [
      "cypress-io/cypress-test-tiny"
      "cypress-io/cypress-test-example-repos"
    ]
  }
}

remapProjects = (projectsByProvider) ->
  list = []

  _.mapValues projectsByProvider, (provider, name) ->
    remapPlatform = (platform, repos) ->
      repos.forEach (repo) ->
        list.push({
          repo
          provider: name
          platform
        })

    if provider.win32 then remapPlatform("win32", provider.win32)
    if provider.linux then remapPlatform("linux", provider.linux)
    if provider.darwin then remapPlatform("darwin", provider.darwin)

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
# {repo, provider, platform}
PROJECTS = remapProjects(_PROVIDERS)

getCiConfig = ->
  key = path.join("scripts", "support", "ci.json")
  config = configFromEnvOrJsonFile(key)

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
getFilterByProvider = (providerName, platformName) ->
  if providerName
    console.log("only allow projects for provider", providerName)
    providerFilter = R.propEq("provider", providerName)
  else
    providerFilter = R.identity

  if platformName
    console.log("only allow projects for platform", platformName)
    platformFilter = R.propEq("platform", platformName)
  else
    platformFilter = R.identity

  # combined filter is when both filters pass
  projectFilter = R.allPass([providerFilter, platformFilter])
  projectFilter

module.exports = {
  _PROVIDERS,

  remapProjects,

  getFilterByProvider,

  nextVersion: (version) ->
    MAIN_PROJECTS = remapMain(_PROVIDERS)
    console.log("Setting next version to build", version)
    console.table("In these projects", MAIN_PROJECTS)

    la(check.unemptyString(version),
      "missing next version to set", version)

    setNextDevVersion = (project, provider) ->
      console.log("setting env var NEXT_DEV_VERSION to %s on %s in project %s",
        version, provider, project)
      car.updateProjectEnv(project, provider, {
        NEXT_DEV_VERSION: version,
      })

    awaitEachProjectAndProvider(MAIN_PROJECTS, setNextDevVersion)

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
        CYPRESS_INSTALL_BINARY: binaryVersionOrUrl
      })
    awaitEachProjectAndProvider(PROJECTS, updateProject, projectFilter)
    .then R.always(result)

  # triggers test projects on multiple CIs
  # the test projects will exercise the new version of
  # the Cypress test runner we just built
  runTestProjects: (getStatusAndMessage, providerName, version, platform) ->

    projectFilter = getFilterByProvider(providerName, platform)

    makeCommit = (project, provider, creds) ->
      ## make empty commit to trigger CIs
      ## project is owner/repo string like cypress-io/cypress-test-tiny
      console.log("making commit to project", project)

      # print if we have a few github variables present
      console.log("do we have GH_APP_ID?", Boolean(process.env.GH_APP_ID))
      console.log("do we have GH_INSTALLATION_ID?", Boolean(process.env.GH_INSTALLATION_ID))
      console.log("do we have GH_PRIVATE_KEY?", Boolean(process.env.GH_PRIVATE_KEY))

      parsedRepo = parse(project)
      owner = parsedRepo[0]
      repo = parsedRepo[1]

      { status, message } = getStatusAndMessage(repo)

      if not message
        message =
          """
          Testing new Cypress version #{version}

          """
        if process.env.CIRCLE_BUILD_URL
          message += "\n"
          message += "Circle CI build url #{process.env.CIRCLE_BUILD_URL}"

        if process.env.APPVEYOR
          slug = process.env.APPVEYOR_PROJECT_SLUG
          build = process.env.APPVEYOR_BUILD_ID
          message += "\n"
          message += "AppVeyor CI #{slug} #{build}"

      defaultOptions = {
        owner,
        repo,
        message,
        token: creds.githubToken,
      }

      createGithubCommitStatusCheck = ({ sha }) ->
        return if not status

        # status is {owner, repo, sha} and maybe a few other properties
        isStatus = check.schema({
          owner: check.unemptyString,
          repo: check.unemptyString,
          sha: check.commitId,
          context: check.unemptyString,
          platform: check.unemptyString,
          arch: check.unemptyString
        })
        if not isStatus(status)
          console.error("Invalid status object %o", status)

        targetUrl = "https://github.com/#{owner}/#{repo}/commit/#{sha}"
        commitStatusOptions = {
          targetUrl,
          owner: status.owner,
          repo: status.repo,
          sha: status.sha,
          context: status.context,
          state: 'pending',
          description: "#{owner}/#{repo}",
        }

        console.log(
          'creating commit status check',
          commitStatusOptions.description,
          commitStatusOptions.context
        )

        setCommitStatus(commitStatusOptions)

      if not version
        return makeEmptyGithubCommit(defaultOptions).then(createGithubCommitStatusCheck)

      # first try to commit to branch for next upcoming version
      specificBranchOptions = {
        owner: owner,
        repo: repo,
        token: creds.githubToken,
        message,
        branch: version
      }

      makeEmptyGithubCommit(specificBranchOptions)
      .catch () ->
        # maybe there is no branch for next version
        # try default branch
        makeEmptyGithubCommit(defaultOptions)
      .then(createGithubCommitStatusCheck)

    awaitEachProjectAndProvider(PROJECTS, makeCommit, projectFilter)
}
