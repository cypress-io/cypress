const fs = require('fs')
const yaml = require('yaml')
const path = require('path')

const CHROME_STABLE_KEY = 'chrome-stable-version'
const CHROME_BETA_KEY = 'chrome-beta-version'
const CHROME_FOR_TESTING_STABLE_KEY = 'chrome-for-testing-stable-version'
const FIREFOX_STABLE_KEY = 'firefox-stable-version'
const FIREFOX_BETA_KEY = 'firefox-beta-version'

// This is the path to the CircleCI file that contains the browser version anchors
const CIRCLECI_WORKFLOWS_FILEPATH = path.join(__dirname, '../../.circleci/src/pipeline/@pipeline.yml')

const CHROME_FOR_TESTING_LAST_KNOWN_GOOD_URL = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json'
const FIREFOX_VERSIONS_URL = 'https://product-details.mozilla.org/1.0/firefox_versions.json'

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

const getLatestFirefoxVersions = async () => {
  const response = await fetch(FIREFOX_VERSIONS_URL)

  if (!response.ok) {
    throw new Error(`HTTP error fetching Firefox versions! status: ${response.status}`)
  }

  const data = JSON.parse(await response.text())
  const stable = data?.LATEST_FIREFOX_VERSION
  const beta = data?.LATEST_FIREFOX_RELEASED_DEVEL_VERSION

  if (!stable || typeof stable !== 'string') {
    throw new Error('Firefox versions JSON missing LATEST_FIREFOX_VERSION')
  }

  if (!beta || typeof beta !== 'string') {
    throw new Error('Firefox versions JSON missing LATEST_FIREFOX_RELEASED_DEVEL_VERSION')
  }

  return { stable, beta }
}

const findValue = (doc, key) => doc.contents.items.find((item) => item.key.value === key).value.value

const getVersions = async ({ core }) => {
  try {
    const doc = yaml.parseDocument(fs.readFileSync(CIRCLECI_WORKFLOWS_FILEPATH, 'utf8'))

    const currentChromeStable = findValue(doc, CHROME_STABLE_KEY)
    const currentChromeBeta = findValue(doc, CHROME_BETA_KEY)
    const currentChromeForTestingStable = findValue(doc, CHROME_FOR_TESTING_STABLE_KEY)
    const currentFirefoxStable = findValue(doc, FIREFOX_STABLE_KEY)
    const currentFirefoxBeta = findValue(doc, FIREFOX_BETA_KEY)

    const [stableDataText, betaDataText, latestChromeForTestingStable, latestFirefox] = await Promise.all([
      getLatestVersionData({ channel: 'stable', currentVersion: currentChromeStable }),
      getLatestVersionData({ channel: 'beta', currentVersion: currentChromeBeta }),
      getLastKnownGoodChromeForTestingStable(),
      getLatestFirefoxVersions(),
    ])

    const stableData = JSON.parse(stableDataText)
    const betaData = JSON.parse(betaDataText)
    const hasStableUpdate = stableData.versions.length > 0
    const hasBetaUpdate = betaData.versions.length > 0
    const hasChromeForTestingUpdate = compareChromeVersions(latestChromeForTestingStable, currentChromeForTestingStable) > 0
    // Firefox stable versions are dotted-numeric and orderable; beta versions contain "b" (e.g. "152.0b1"),
    // so just compare for inequality — Mozilla's product-details endpoint always points at the current beta.
    const hasFirefoxStableUpdate = compareChromeVersions(latestFirefox.stable, currentFirefoxStable) > 0
    const hasFirefoxBetaUpdate = latestFirefox.beta !== currentFirefoxBeta
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

    if (hasFirefoxStableUpdate) {
      parts.push(`Firefox (stable) to ${latestFirefox.stable}`)
    }

    if (hasFirefoxBetaUpdate) {
      parts.push(`Firefox (beta) to ${latestFirefox.beta}`)
    }

    description += parts.join(' and ')

    const hasUpdate = hasStableUpdate || hasBetaUpdate || hasChromeForTestingUpdate || hasFirefoxStableUpdate || hasFirefoxBetaUpdate

    core.setOutput('has_update', hasUpdate ? 'true' : 'false')
    core.setOutput('current_stable_version', currentChromeStable)
    core.setOutput('latest_stable_version', hasStableUpdate ? stableData.versions[0].version : currentChromeStable)
    core.setOutput('current_beta_version', currentChromeBeta)
    core.setOutput('latest_beta_version', hasBetaUpdate ? betaData.versions[0].version : currentChromeBeta)
    core.setOutput('current_chrome_for_testing_stable_version', currentChromeForTestingStable)
    core.setOutput('latest_chrome_for_testing_stable_version', hasChromeForTestingUpdate ? latestChromeForTestingStable : currentChromeForTestingStable)
    core.setOutput('current_firefox_stable_version', currentFirefoxStable)
    core.setOutput('latest_firefox_stable_version', hasFirefoxStableUpdate ? latestFirefox.stable : currentFirefoxStable)
    core.setOutput('current_firefox_beta_version', currentFirefoxBeta)
    core.setOutput('latest_firefox_beta_version', hasFirefoxBetaUpdate ? latestFirefox.beta : currentFirefoxBeta)
    core.setOutput('description', description)
  } catch (err) {
    console.log('Errored checking for new browser versions:', err.stack)
    core.setOutput('has_update', 'false')
    process.exit(1)
  }
}

const checkNeedForBranchUpdate = ({
  core,
  latestStableVersion,
  latestBetaVersion,
  latestChromeForTestingStableVersion,
  latestFirefoxStableVersion,
  latestFirefoxBetaVersion,
}) => {
  const doc = yaml.parseDocument(fs.readFileSync(CIRCLECI_WORKFLOWS_FILEPATH, 'utf8'))

  const currentChromeStable = findValue(doc, CHROME_STABLE_KEY)
  const currentChromeBeta = findValue(doc, CHROME_BETA_KEY)
  const currentChromeForTestingStable = findValue(doc, CHROME_FOR_TESTING_STABLE_KEY)
  const currentFirefoxStable = findValue(doc, FIREFOX_STABLE_KEY)
  const currentFirefoxBeta = findValue(doc, FIREFOX_BETA_KEY)

  const hasNewerStableVersion = currentChromeStable !== latestStableVersion
  const hasNewerBetaVersion = currentChromeBeta !== latestBetaVersion
  const hasNewerChromeForTestingVersion = currentChromeForTestingStable !== latestChromeForTestingStableVersion
  const hasNewerFirefoxStableVersion = currentFirefoxStable !== latestFirefoxStableVersion
  const hasNewerFirefoxBetaVersion = currentFirefoxBeta !== latestFirefoxBetaVersion

  const hasNewerUpdate = (
    hasNewerStableVersion ||
    hasNewerBetaVersion ||
    hasNewerChromeForTestingVersion ||
    hasNewerFirefoxStableVersion ||
    hasNewerFirefoxBetaVersion
  )

  core.setOutput('has_newer_update', hasNewerUpdate ? 'true' : 'false')
}

const updateBrowserVersionsFile = ({
  latestBetaVersion,
  latestStableVersion,
  latestChromeForTestingStableVersion,
  latestFirefoxStableVersion,
  latestFirefoxBetaVersion,
}) => {
  const doc = yaml.parseDocument(fs.readFileSync(CIRCLECI_WORKFLOWS_FILEPATH, 'utf8'))

  const currentChromeStableYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY)
  const currentChromeBetaYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY)
  const currentChromeForTestingYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_FOR_TESTING_STABLE_KEY)
  const currentFirefoxStableYamlRef = doc.contents.items.find((item) => item.key.value === FIREFOX_STABLE_KEY)
  const currentFirefoxBetaYamlRef = doc.contents.items.find((item) => item.key.value === FIREFOX_BETA_KEY)

  currentChromeStableYamlRef.value.value = latestStableVersion
  currentChromeBetaYamlRef.value.value = latestBetaVersion
  currentChromeForTestingYamlRef.value.value = latestChromeForTestingStableVersion
  currentFirefoxStableYamlRef.value.value = latestFirefoxStableVersion
  currentFirefoxBetaYamlRef.value.value = latestFirefoxBetaVersion

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
