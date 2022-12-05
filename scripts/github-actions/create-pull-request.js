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
  createPullRequest,
}
