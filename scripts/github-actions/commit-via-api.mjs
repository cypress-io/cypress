import fs from 'node:fs'

export const commitViaApi = async ({ context, github, baseBranch, branchName, filePaths, message, resetToBase = false }) => {
  const owner = context.repo.owner
  const repo = context.repo.repo
  const repositoryNameWithOwner = `${owner}/${repo}`

  // The GitHub API requires POSIX paths even on Windows runners.
  const additions = filePaths.map((rawPath) => {
    const path = rawPath.split('\\').join('/')

    return {
      path,
      contents: fs.readFileSync(rawPath).toString('base64'),
    }
  })

  const getBaseSha = async () => {
    const { data } = await github.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    })

    return data.object.sha
  }

  let expectedHeadOid

  try {
    const { data } = await github.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    })

    expectedHeadOid = data.object.sha
  } catch (err) {
    if (err.status !== 404) throw err

    expectedHeadOid = await getBaseSha()

    await github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: expectedHeadOid,
    })
  }

  // Files generated from a fresh checkout of the base branch belong on top of
  // that base, not on whatever the bot branch held before. Without the reset,
  // the branch never picks up later base commits, so its PR conflicts and its
  // tree stops matching the generated files.
  if (resetToBase && branchName !== baseBranch) {
    const baseSha = await getBaseSha()

    if (baseSha !== expectedHeadOid) {
      await github.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: baseSha,
        force: true,
      })

      expectedHeadOid = baseSha
    }
  }

  const mutation = `
    mutation ($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit { oid url }
      }
    }`

  const { createCommitOnBranch } = await github.graphql(mutation, {
    input: {
      branch: { repositoryNameWithOwner, branchName },
      message: { headline: message },
      expectedHeadOid,
      fileChanges: { additions },
    },
  })

  return createCommitOnBranch.commit
}
