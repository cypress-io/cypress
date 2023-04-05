const createPullRequest = async ({ context, github, baseBranch, branchName, description, body, reviewers }) => {
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
  // Get node information about the PR since adding it to the Firewatch Project Board Beta requires use of graphQL
  const getItemInfoQuery = `
    query ($org: String!, $repo: String!, $project: Int!, $issue: Int!) {
      organization(login: $org) {
        repository(name: $repo) {
          pullRequest(number: $issue) {
            closed
            closedAt
            id
            projectItems(first: 10, includeArchived: true) {
              nodes {
                id
                isArchived
                fieldValueByName(name: "Status") {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2SingleSelectField {
                        project {
                          ... on ProjectV2 {
                            id
                            number
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        projectV2(number: $project) {
          id
          field(name: "Status") {
            ... on ProjectV2SingleSelectField {
              id
              options {
                id
                name
              }
            }
          }
        }
      }
    }`;
  
  const getItemInfoVars = {
    org: context.repo.owner,
    repo: context.repo.repo,
    issue: number,
    project: 9 // Firewatch board: https://github.com/orgs/cypress-io/projects/9
  };

  const getItemInfo = await github.graphql(getItemInfoQuery,getItemInfoVars);

  // Need to get the node_id for use in graphQL mutations
  const prItemId = getItemInfo.organization.repository.pullRequest.id;
  const projectID = getItemInfo.organization.projectV2.id;

  //Add PR to firewatch board -  https://github.com/orgs/cypress-io/projects/9
  const addToProjectBoardQuery = `
    mutation ($project_id: ID!, $item_id: ID!) {
      addProjectV2ItemById(input: {contentId: $item_id, projectId: $project_id}) {
        clientMutationId
        item {
          id
        }
      }
    }`;

  const addToProjectBoardQueryVars = {
    project_id: projectID,
    item_id: prItemId
  };

  const addToProjectBoard = await github.graphql(addToProjectBoardQuery,addToProjectBoardQueryVars);

}

module.exports = {
  createPullRequest,
}
