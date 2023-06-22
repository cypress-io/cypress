import { parse } from 'graphql'

export const FAKE_USER_QUERY = parse(
  `{ cloudViewer { __typename id fullName email } }`,
)

export const FAKE_USER_RESPONSE = {
  data: {
    cloudViewer: {
      __typename: 'CloudUser',
      id: '1',
      fullName: 'test',
      email: 'test@example.com',
    },
  },
}

export const FAKE_USER_WITH_OPTIONAL_MISSING = parse(
  `{ cloudViewer { __typename id fullName email cloudProfileUrl } }`,
)

export const FAKE_USER_WITH_OPTIONAL_MISSING_RESPONSE = {
  data: {
    cloudViewer: {
      __typename: 'CloudUser',
      id: '1',
      fullName: 'test',
      email: 'test@example.com',
      cloudProfileUrl: null,
    },
  },
}

export const FAKE_USER_WITH_OPTIONAL_RESOLVED_RESPONSE = {
  data: {
    cloudViewer: {
      __typename: 'CloudUser',
      id: '1',
      fullName: 'test',
      email: 'test@example.com',
      cloudProfileUrl: 'https://example.com',
    },
  },
}

export const FAKE_USER_WITH_REQUIRED_MISSING = parse(
  `{ cloudViewer { __typename id fullName email userIsViewer } }`,
)

export const FAKE_USER_WITH_REQUIRED_RESOLVED_RESPONSE = {
  data: {
    cloudViewer: {
      __typename: 'CloudUser',
      id: '1',
      fullName: 'test',
      email: 'test@example.com',
      userIsViewer: true,
    },
  },
}

export const CLOUD_PROJECT_QUERY = parse(
  `{ currentProject { id cloudProject { __typename  ... on CloudProject { id } } } }`,
)

export const CLOUD_PROJECT_RESPONSE = {
  data: { cloudProjectBySlug: { __typename: 'CloudProject', id: '1' } },
}

export const CLOUD_PROJECT_REQUEST_WITH_VARIABLES = parse(`
  query WithVariables($fromBranch: String!) {
    currentProject {
      id
      specs {
        id
        cloudSpec(name: "QueryList") {
          id
          fetchingStatus
          data {
            ... on CloudProjectSpec {
              id
              specRuns(first: 4, fromBranch: $fromBranch) {
                nodes {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`)

export const FAKE_SHAS = ['fcb90f', 'fc753a', '207e80']

export const FAKE_PROJECT_WITH_ERROR = {
  error: {
    name: 'FAKE ERROR',
    message: 'This had an error',
  },
}

export const FAKE_PROJECT_NO_RUNS = {
  data: {
    cloudProjectBySlug: { __typename: 'CloudProject', runsByCommitShas: [] },
  },
}

export const FAKE_PROJECT_ONE_RUNNING_RUN = {
  data: {
    cloudProjectBySlug: {
      __typename: 'CloudProject',
      runsByCommitShas: [
        { runNumber: 1, status: 'RUNNING', totalFailed: 0, commitInfo: { sha: FAKE_SHAS[0] } },
      ],
    },
  },
}

export const FAKE_PROJECT_MULTIPLE_COMPLETED = {
  data: {
    cloudProjectBySlug: {
      __typename: 'CloudProject',
      runsByCommitShas: [
        { runNumber: 4, status: 'FAILED', totalFailed: 1, commitInfo: { sha: FAKE_SHAS[1] } },
        { runNumber: 1, status: 'PASSED', totalFailed: 0, commitInfo: { sha: FAKE_SHAS[0] } },
      ],
    },
  },
}

export const FAKE_PROJECT_MULTIPLE_COMPLETED_PLUS_RUNNING = {
  data: {
    cloudProjectBySlug: {
      __typename: 'CloudProject',
      runsByCommitShas: [
        { runNumber: 5, status: 'RUNNING', totalFailed: 0, commitInfo: { sha: FAKE_SHAS[2] } },
        { runNumber: 4, status: 'FAILED', totalFailed: 4, commitInfo: { sha: FAKE_SHAS[1] } },
        { runNumber: 1, status: 'PASSED', totalFailed: 0, commitInfo: { sha: FAKE_SHAS[0] } },
      ],
    },
  },
}

export const FAKE_PROJECT_MULTIPLE_COMPLETED_SAME_SHA_PLUS_RUNNING = {
  data: {
    cloudProjectBySlug: {
      __typename: 'CloudProject',
      runsByCommitShas: [
        { runNumber: 5, status: 'RUNNING', totalFailed: 1, commitInfo: { sha: FAKE_SHAS[2] } },
        { runNumber: 4, status: 'FAILED', totalFailed: 5, commitInfo: { sha: FAKE_SHAS[1] } },
        { runNumber: 3, status: 'FAILED', totalFailed: 2, commitInfo: { sha: FAKE_SHAS[1] } },
        { runNumber: 1, status: 'PASSED', totalFailed: 0, commitInfo: { sha: FAKE_SHAS[0] } },
      ],
    },
  },
}

export const FAKE_PROJECT_ONE_RUNNING_RUN_ONE_SPEC = {
  data: {
    cloudNodesByIds: [{
      id: 'fake7d6376473',
      runNumber: 1,
      completedInstanceCount: 1,
      totalInstanceCount: 1,
      totalTests: 5,
      status: 'RUNNING',
      scheduledToCompleteAt: undefined,
    }],
    pollingIntervals: {
      runByNumber: 20,
    },
  },
}
