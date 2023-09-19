const https = require('https')
const fs = require('fs')

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
    const currentBrowserVersions = JSON.parse(fs.readFileSync('./browser-versions.json'))
    const stableData = JSON.parse(await getLatestVersionData({ channel: 'stable', currentVersion: currentBrowserVersions['chrome:stable'] }))
    const betaData = JSON.parse(await getLatestVersionData({ channel: 'beta', currentVersion: currentBrowserVersions['chrome:beta'] }))
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
    core.setOutput('current_stable_version', currentBrowserVersions['chrome:stable'])
    core.setOutput('latest_stable_version', hasStableUpdate ? stableData.versions[0].version : currentBrowserVersions['chrome:stable'])
    core.setOutput('current_beta_version', currentBrowserVersions['chrome:beta'])
    core.setOutput('latest_beta_version', hasBetaUpdate ? betaData.versions[0].version : currentBrowserVersions['chrome:beta'])
    core.setOutput('description', description)
  } catch (err) {
    console.log('Errored checking for new Chrome versions:', err.stack)
    core.setOutput('has_update', 'false')
  }
}

const checkNeedForBranchUpdate = ({ core, latestStableVersion, latestBetaVersion }) => {
  // file path is relative to repo root
  const branchBrowserVersions = JSON.parse(fs.readFileSync('./browser-versions.json'))
  const hasNewerStableVersion = branchBrowserVersions['chrome:stable'] !== latestStableVersion
  const hasNewerBetaVersion = branchBrowserVersions['chrome:beta'] !== latestBetaVersion

  core.setOutput('has_newer_update', (hasNewerStableVersion || hasNewerBetaVersion) ? 'true' : 'false')
}

const updateBrowserVersionsFile = ({ latestBetaVersion, latestStableVersion }) => {
  const currentBrowserVersions = JSON.parse(fs.readFileSync('./browser-versions.json'))
  const newVersions = Object.assign(currentBrowserVersions, {
    'chrome:beta': latestBetaVersion,
    'chrome:stable': latestStableVersion,
  })

  // file path is relative to repo root
  fs.writeFileSync('./browser-versions.json', `${JSON.stringify(newVersions, null, 2) }\n`)
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
