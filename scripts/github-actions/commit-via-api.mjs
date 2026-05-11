import fs from 'node:fs'

export const commitViaApi = async ({ context, github, baseBranch, branchName, filePaths, message }) => {
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

    const { data: baseRef } = await github.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    })

    expectedHeadOid = baseRef.object.sha

    await github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: expectedHeadOid,
    })
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
