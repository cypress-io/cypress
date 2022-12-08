const createPullRequest = async ({ context, github, baseBranch, branchName, description, body }) => {
  await github.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: branchName,
    title: `chore: ${description}`,
    body,
    maintainer_can_modify: true,
  })
}

module.exports = {
  createPullRequest,
}
