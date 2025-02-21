const https = require('https')
const fs = require('fs')
const yaml = require('yaml')

const CHROME_STABLE_KEY = 'chrome-stable-version'
const CHROME_BETA_KEY = 'chrome-beta-version'

// https://developer.chrome.com/docs/versionhistory/reference/#platform-identifiers
const getLatestVersionData = ({ channel, currentVersion }) => {
  const options = {
    hostname: 'versionhistory.googleapis.com',
    port: 443,
    path: `/v1/chrome/platforms/linux/channels/${channel}/versions?filter=version>${currentVersion}&order_by=version%20desc`,
    method: 'GET',
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let response = ''

      res.on('data', (d) => {
        response += d.toString()
      })

      res.on('end', () => {
        resolve(response)
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.end()
  })
}

const getVersions = async ({ core }) => {
  try {
    // file path is relative to repo root
    const doc = yaml.parseDocument(fs.readFileSync('./.circleci/workflows.yml', 'utf8'))

    const currentChromeStable = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY).value.value
    const currentChromeBeta = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY).value.value

    const stableData = JSON.parse(await getLatestVersionData({ channel: 'stable', currentVersion: currentChromeStable }))
    const betaData = JSON.parse(await getLatestVersionData({ channel: 'beta', currentVersion: currentChromeBeta }))
    const hasStableUpdate = stableData.versions.length > 0
    const hasBetaUpdate = betaData.versions.length > 0
    let description = 'Update '

    if (hasStableUpdate) {
      description += `Chrome (stable) to ${stableData.versions[0].version}`

      if (hasBetaUpdate) {
        description += ' and '
      }
    }

    if (hasBetaUpdate) {
      description += `Chrome (beta) to ${betaData.versions[0].version}`
    }

    core.setOutput('has_update', (hasStableUpdate || hasBetaUpdate) ? 'true' : 'false')
    core.setOutput('current_stable_version', currentChromeStable)
    core.setOutput('latest_stable_version', hasStableUpdate ? stableData.versions[0].version : currentChromeStable)
    core.setOutput('current_beta_version', currentChromeBeta)
    core.setOutput('latest_beta_version', hasBetaUpdate ? betaData.versions[0].version : currentChromeBeta)
    core.setOutput('description', description)
  } catch (err) {
    console.log('Errored checking for new Chrome versions:', err.stack)
    core.setOutput('has_update', 'false')
  }
}

const checkNeedForBranchUpdate = ({ core, latestStableVersion, latestBetaVersion }) => {
  // file path is relative to repo root
  const doc = yaml.parseDocument(fs.readFileSync('./.circleci/workflows.yml', 'utf8'))

  const currentChromeStable = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY).value.value
  const currentChromeBeta = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY).value.value

  const hasNewerStableVersion = currentChromeStable !== latestStableVersion
  const hasNewerBetaVersion = currentChromeBeta !== latestBetaVersion

  core.setOutput('has_newer_update', (hasNewerStableVersion || hasNewerBetaVersion) ? 'true' : 'false')
}

const updateBrowserVersionsFile = ({ latestBetaVersion, latestStableVersion }) => {
  const doc = yaml.parseDocument(fs.readFileSync('./.circleci/workflows.yml', 'utf8'))

  const currentChromeStableYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_STABLE_KEY)
  const currentChromeBetaYamlRef = doc.contents.items.find((item) => item.key.value === CHROME_BETA_KEY)

  currentChromeStableYamlRef.value.value = latestStableVersion
  currentChromeBetaYamlRef.value.value = latestBetaVersion

  // file path is relative to repo root
  fs.writeFileSync('./.circleci/workflows.yml', yaml.stringify(doc), 'utf8')
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
}
