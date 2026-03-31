const fs = require('fs')
const yaml = require('yaml')
const path = require('path')

const CHROME_STABLE_KEY = 'chrome-stable-version'
const CHROME_BETA_KEY = 'chrome-beta-version'
const CHROME_FOR_TESTING_STABLE_KEY = 'chrome-for-testing-stable-version'

// This is the path to the CircleCI file that contains the browser version anchors
const CIRCLECI_WORKFLOWS_FILEPATH = path.join(__dirname, '../../.circleci/src/pipeline/@pipeline.yml')

const CHROME_FOR_TESTING_LAST_KNOWN_GOOD_URL = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json'

/** @returns {number} negative if a < b, 0 if equal, positive if a > b */
const compareChromeVersions = (a, b) => {
  const partsA = a.split('.').map((n) => parseInt(n, 10) || 0)
  const partsB = b.split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(partsA.length, partsB.length)

  for (let i = 0; i < len; i++) {
    const da = partsA[i] || 0
    const db = partsB[i] || 0

    if (da !== db) {
      return da - db
    }
  }

  return 0
}

// https://developer.chrome.com/docs/versionhistory/reference/#platform-identifiers
const getLatestVersionData = async ({ channel, currentVersion }) => {
  const url = `https://versionhistory.googleapis.com/v1/chrome/platforms/linux/channels/${channel}/versions?filter=version>${currentVersion}&order_by=version%20desc`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.text()
}

const getLastKnownGoodChromeForTestingStable = async () => {
  const response = await fetch(CHROME_FOR_TESTING_LAST_KNOWN_GOOD_URL)

  if (!response.ok) {
    throw new Error(`HTTP error fetching Chrome for Testing versions! status: ${response.status}`)
  }

  const data = JSON.parse(await response.text())
  const version = data?.channels?.Stable?.version

  if (!version || typeof version !== 'string') {
    throw new Error('Chrome for Testing JSON missing channels.Stable.version')
  }

  return version
}

const getVersions = async ({ core }) => {
  try {
    const doc = yaml.parseDocument(fs.readFileSync(CIRCLECI_WORKFLOWS_FILEPATH, 'utf8'))

    const currentChromeStable = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY).value.value
    const currentChromeBeta = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY).value.value
    const currentChromeForTestingStable = doc.contents.items.find((item) => item.key.value === CHROME_FOR_TESTING_STABLE_KEY).value.value

    const [stableDataText, betaDataText, latestChromeForTestingStable] = await Promise.all([
      getLatestVersionData({ channel: 'stable', currentVersion: currentChromeStable }),
      getLatestVersionData({ channel: 'beta', currentVersion: currentChromeBeta }),
      getLastKnownGoodChromeForTestingStable(),
    ])

    const stableData = JSON.parse(stableDataText)
    const betaData = JSON.parse(betaDataText)
    const hasStableUpdate = stableData.versions.length > 0
    const hasBetaUpdate = betaData.versions.length > 0
    const hasChromeForTestingUpdate = compareChromeVersions(latestChromeForTestingStable, currentChromeForTestingStable) > 0
    let description = 'Update '

    const parts = []

    if (hasStableUpdate) {
      parts.push(`Chrome (stable) to ${stableData.versions[0].version}`)
    }

    if (hasBetaUpdate) {
      parts.push(`Chrome (beta) to ${betaData.versions[0].version}`)
    }

    if (hasChromeForTestingUpdate) {
      parts.push(`Chrome for Testing (stable) to ${latestChromeForTestingStable}`)
    }

    description += parts.join(' and ')

    core.setOutput('has_update', (hasStableUpdate || hasBetaUpdate || hasChromeForTestingUpdate) ? 'true' : 'false')
    core.setOutput('current_stable_version', currentChromeStable)
    core.setOutput('latest_stable_version', hasStableUpdate ? stableData.versions[0].version : currentChromeStable)
    core.setOutput('current_beta_version', currentChromeBeta)
    core.setOutput('latest_beta_version', hasBetaUpdate ? betaData.versions[0].version : currentChromeBeta)
    core.setOutput('current_chrome_for_testing_stable_version', currentChromeForTestingStable)
    core.setOutput('latest_chrome_for_testing_stable_version', hasChromeForTestingUpdate ? latestChromeForTestingStable : currentChromeForTestingStable)
    core.setOutput('description', description)
  } catch (err) {
    console.log('Errored checking for new Chrome versions:', err.stack)
    core.setOutput('has_update', 'false')
    process.exit(1)
  }
}

const checkNeedForBranchUpdate = ({ core, latestStableVersion, latestBetaVersion, latestChromeForTestingStableVersion }) => {
  const doc = yaml.parseDocument(fs.readFileSync(CIRCLECI_WORKFLOWS_FILEPATH, 'utf8'))

  const currentChromeStable = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY).value.value
  const currentChromeBeta = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY).value.value
  const currentChromeForTestingStable = doc.contents.items.find((item) => item.key.value === CHROME_FOR_TESTING_STABLE_KEY).value.value

  const hasNewerStableVersion = currentChromeStable !== latestStableVersion
  const hasNewerBetaVersion = currentChromeBeta !== latestBetaVersion
  const hasNewerChromeForTestingVersion = currentChromeForTestingStable !== latestChromeForTestingStableVersion

  core.setOutput('has_newer_update', (hasNewerStableVersion || hasNewerBetaVersion || hasNewerChromeForTestingVersion) ? 'true' : 'false')
}

const updateBrowserVersionsFile = ({ latestBetaVersion, latestStableVersion, latestChromeForTestingStableVersion }) => {
  const doc = yaml.parseDocument(fs.readFileSync(CIRCLECI_WORKFLOWS_FILEPATH, 'utf8'))

  const currentChromeStableYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY)
  const currentChromeBetaYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY)
  const currentChromeForTestingYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_FOR_TESTING_STABLE_KEY)

  currentChromeStableYamlRef.value.value = latestStableVersion
  currentChromeBetaYamlRef.value.value = latestBetaVersion
  currentChromeForTestingYamlRef.value.value = latestChromeForTestingStableVersion

  fs.writeFileSync(CIRCLECI_WORKFLOWS_FILEPATH, yaml.stringify(doc), 'utf8')
}

const updatePRTitle = async ({ context, github, baseBranch, branchName, description }) => {
  const { data } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: `${context.repo.owner}:${branchName}`,
  })

  if (!data.length) {
    console.log('Could not find PR for branch:', branchName)

    return
  }

  await github.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: data[0].number,
    title: `chore: ${description}`,
  })
}

module.exports = {
  getVersions,
  checkNeedForBranchUpdate,
  updateBrowserVersionsFile,
  updatePRTitle,
  CIRCLECI_WORKFLOWS_FILEPATH,
}
