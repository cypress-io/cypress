const createPullRequest = async ({ context, github, baseBranch, branchName, description, body, reviewers, addToProjectBoard }) => {
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

  //add to firewatch board
  if (addToProjectBoard) {
    const getProjectV2NodeIdQuery = `
      query ($org: String!, $project_id: Int!, $repo: String!, $issueNumber: Int!) {
        organization(login: $org) {
          projectV2(number: $project_id) {
            id
          }
        }
        repository(owner: $org, name: $repo) {
          pullRequest(number: $issueNumber) {
            id
          }
        }
      }`

    const getProjectV2NodeIdQueryVars = {
      org: context.repo.owner,
      project_id: 9,
      repo: context.repo.repo,
      issueNumber: number,
    }

    let projectBoardNodeId = await github.graphql(
      getProjectV2NodeIdQuery,
      getProjectV2NodeIdQueryVars,
    )

    const addToProjectBoardQuery = `
          mutation ($project_id: ID!, $item_id: ID!) {
            addProjectV2ItemById(input: {contentId: $item_id, projectId: $project_id}) {
              clientMutationId
              item {
                id
              }
            }
          }`

    const addToProjectBoardQueryVars = {
      project_id: projectBoardNodeId.organization.projectV2.id,
      item_id: projectBoardNodeId.repository.pullRequest.id,
    }

    await github.graphql(
      addToProjectBoardQuery,
      addToProjectBoardQueryVars,
    )
  }
}

module.exports = {
  createPullRequest,
}
