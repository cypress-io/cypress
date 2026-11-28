interface RepoContext {
  repo: {
    owner: string
    repo: string
  }
}

interface RequestReviewersParams {
  owner: string
  repo: string
  pull_number: number
  reviewers?: string[]
  team_reviewers?: string[]
}

interface ProjectBoardNodeIds {
  organization: { projectV2: { id: string } }
  repository: { pullRequest: { id: string } }
}

// The subset of the Octokit client that `actions/github-script` passes in as `github`
interface GitHubClient {
  rest: {
    pulls: {
      create: (params: {
        owner: string
        repo: string
        base: string
        head: string
        title: string
        body: string
        maintainer_can_modify: boolean
      }) => Promise<{ data: { number: number } }>
      requestReviewers: (params: RequestReviewersParams) => Promise<unknown>
    }
  }
  graphql: <T>(query: string, variables: Record<string, unknown>) => Promise<T>
}

interface CreatePullRequestOptions {
  context: RepoContext
  github: GitHubClient
  baseBranch: string
  branchName: string
  description: string
  body: string
  reviewers?: string[]
  team_reviewers?: string[]
  addToProjectBoard?: boolean
}

export const createPullRequest = async ({ context, github, baseBranch, branchName, description, body, reviewers, team_reviewers, addToProjectBoard }: CreatePullRequestOptions) => {
  const { data: { number } } = await github.rest.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    base: baseBranch,
    head: branchName,
    title: `chore: ${description}`,
    body,
    maintainer_can_modify: true,
  })

  if (reviewers || team_reviewers) {
    const requestReviewersParams: RequestReviewersParams = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: number,
    }

    if (reviewers) requestReviewersParams.reviewers = reviewers

    if (team_reviewers) requestReviewersParams.team_reviewers = team_reviewers

    try {
      await github.rest.pulls.requestReviewers(requestReviewersParams)
    } catch (err) {
      // Requesting a team reviewer requires the token to have org `members: read`
      // permission. Don't fail the workflow over reviewer assignment - the PR
      // itself was already created successfully.
      console.log(`Could not request reviewers for PR #${number}:`, err instanceof Error ? err.message : err)
    }
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

    const projectBoardNodeId = await github.graphql<ProjectBoardNodeIds>(
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
