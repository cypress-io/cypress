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
}

export const createPullRequest = async ({ context, github, baseBranch, branchName, description, body, reviewers, team_reviewers }: CreatePullRequestOptions) => {
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
}
