const createPullRequest = async ({ context, github, baseBranch, branchName, description, body, reviewers }) => {
  console.log('inside github', JSON.stringify(github, null, 2))
  const { data: { number } } = await github.rest.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: branchName,
    title: `chore: ${description}`,
    body,
    maintainer_can_modify: true,
  })

  if (reviewers) {
    await github.rest.pulls.requestReviewers({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: number,
      reviewers,
    })
  }
}

module.exports = {
  createPullRequest,
}
