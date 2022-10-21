import simpleGit from 'simple-git'
import { Octokit } from '@octokit/core'
import { createAppAuth } from '@octokit/auth-app'
import assert from 'assert'

const git = simpleGit()

const appId = process.env.GITHUB_APP_ID

assert(appId, 'missing GITHUB_APP_ID')

const privateKey = process.env.GITHUB_PRIVATE_KEY

assert(privateKey, 'missing GITHUB_PRIVATE_KEY')

const installationId = process.env.GITHUB_APP_CYPRESS_INSTALLATION_ID

assert(installationId, 'missing GITHUB_APP_CYPRESS_INSTALLATION_ID')

const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId,
    privateKey: Buffer.from(privateKey, 'base64').toString(),
    installationId,
  },
})

const isPRNeeded = async () => {
  // TODO: platform specific
  const result = await git.status(['--', 'tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json'])

  return result.modified.length > 0
}

const branchExists = async () => {
  const result = await git.branch(['--list', 'v8-snapshot-update-develop'])

  return result.all.length > 0
}

const pushChanges = async () => {
  const result = await git.branch(['--list', 'v8-snapshot-update-develop'])

  if (result.all.length > 0) {
    await git.stash()
    await git.checkoutBranch('v8-snapshot-update-develop', 'origin')
    await git.stash(['pop'])
  } else {
    await git.checkoutLocalBranch('v8-snapshot-update-develop')
  }

  await git.add(['tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json'])
  await git.push('origin', 'v8-snapshot-update-develop')
}

const createPR = async () => {
  if (await isPRNeeded()) {
    await pushChanges()

    const exists = await branchExists()

    if (exists) {
      await git.checkoutBranch('v8-snapshot-update-develop', 'origin')
    } else {
      await git.checkoutLocalBranch('v8-snapshot-update-develop')
    }

    await git.add(['tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json'])
    await git.push('origin', 'v8-snapshot-update-develop')

    if (!exists) {
      appOctokit.request(
        'POST /repos/{owner}/{repo}/pulls',
        {
          owner: 'cypress-io',
          repo: 'cypress',
          title: 'chore: update v8 snapshot cache',
          head: 'v8-snapshot-update-develop',
          base: 'ryanm/feat/v8-snapshot-cleanup-binary',
        },
      )
    }
  }
}

createPR()
