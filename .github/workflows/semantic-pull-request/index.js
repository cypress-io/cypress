const core = require('@actions/core');
const github = require('@actions/github');
const validatePrTitle = require('./validatePrTitle');

module.exports = async function run() {
  try {
    const client = github.getOctokit(process.env.GITHUB_TOKEN, {
      baseUrl: githubBaseUrl
    });

    const contextPullRequest = github.context.payload.pull_request;
    if (!contextPullRequest) {
      throw new Error(
        "This action can only be invoked in `pull_request_target` or `pull_request` events. Otherwise the pull request can't be inferred."
      );
    }

    const owner = contextPullRequest.base.user.login;
    const repo = contextPullRequest.base.repo.name;

    // The pull request info on the context isn't up to date. When
    // the user updates the title and re-runs the workflow, it would
    // be outdated. Therefore fetch the pull request via the REST API
    // to ensure we use the current title.
    const {data: pullRequest} = await client.rest.pulls.get({
      owner,
      repo,
      pull_number: contextPullRequest.number
    });

    await validatePrTitle(pullRequest.title);

    const commits = [];
    let nonMergeCommits = [];

    for await (const response of client.paginate.iterator(
      client.rest.pulls.listCommits,
      {
        owner,
        repo,
        pull_number: contextPullRequest.number
      }
    )) {
      commits.push(...response.data);

      // GitHub does not count merge commits when deciding whether to use
      // the PR title or a commit message for the squash commit message.
      nonMergeCommits = commits.filter(
        (commit) => commit.parents.length < 2
      );

      // We only need two non-merge commits to know that the PR
      // title won't be used.
      if (nonMergeCommits.length >= 2) break;
    }

    // If there is only one (non merge) commit present, GitHub will use
    // that commit rather than the PR title for the title of a squash
    // commit. To make sure a semantic title is used for the squash
    // commit, we need to validate the commit title.
    if (nonMergeCommits.length === 1) {
      try {
        await validatePrTitle(nonMergeCommits[0].commit.message, {
          types,
          scopes,
          requireScope,
          subjectPattern,
          subjectPatternError
        });
      } catch (error) {
        throw new Error(
          `Pull request has only one commit and it's not semantic; this may lead to a non-semantic commit in the base branch (see https://github.community/t/how-to-change-the-default-squash-merge-commit-message/1155). Amend the commit message to match the pull request title, or add another commit.`
        );
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};
