const https = require('https')
const fs = require('fs')

const getLatestVersionData = () => {
  const options = {
    hostname: 'omahaproxy.appspot.com',
    port: 443,
    path: '/all.json',
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
    const data = JSON.parse(await getLatestVersionData())
    const linuxData = data.find((item) => item.os === 'linux')
    const stableData = linuxData.versions.find((version) => version.channel === 'stable')
    const betaData = linuxData.versions.find((version) => version.channel === 'beta')
    const hasStableUpdate = currentBrowserVersions['chrome:stable'] !== stableData.version
    const hasBetaUpdate = currentBrowserVersions['chrome:beta'] !== betaData.version
    let description = 'Update '

    if (hasStableUpdate) {
      description += `Chrome (stable) to ${stableData.version}`

      if (hasBetaUpdate) {
        description += ' and '
      }
    }

    if (hasBetaUpdate) {
      description += `Chrome (beta) to ${betaData.version}`
    }

    core.setOutput('has_update', (hasStableUpdate || hasBetaUpdate) ? 'true' : 'false')
    core.setOutput('current_stable_version', currentBrowserVersions['chrome:stable'])
    core.setOutput('latest_stable_version', stableData.version)
    core.setOutput('current_beta_version', currentBrowserVersions['chrome:beta'])
    core.setOutput('latest_beta_version', betaData.version)
    core.setOutput('description', description)
  } catch (err) {
    // eslint-disable-next-line no-console
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
  const { data } = await github.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: `${context.repo.owner}:${branchName}`,
  })

  if (!data.length) {
    // eslint-disable-next-line no-console
    console.log('Could not find PR for branch:', branchName)

    return
  }

  await github.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: data[0].number,
    title: `chore: ${description}`,
  })
}

const createPullRequest = async ({ context, github, baseBranch, branchName, description }) => {
  await github.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: branchName,
    title: `chore: ${description}`,
    body: 'This PR was auto-generated to update the version(s) of Chrome for driver tests',
    maintainer_can_modify: true,
  })
}

module.exports = {
  getVersions,
  checkNeedForBranchUpdate,
  updateBrowserVersionsFile,
  updatePRTitle,
  createPullRequest,
}
