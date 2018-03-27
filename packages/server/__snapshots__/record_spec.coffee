exports['lib/modes/record .generateProjectRunId calls api.createRun with args 1'] = [
  {
    "projectId": "id-123",
    "recordKey": "key-123",
    "commitSha": "sha-123",
    "commitBranch": "master",
    "commitAuthorName": "brian",
    "commitAuthorEmail": "brian@cypress.io",
    "commitMessage": "such hax",
    "remoteOrigin": "https://github.com/foo/bar.git",
    "ciParams": {
      "foo": "bar"
    },
    "ciProvider": "circle",
    "ciBuildNumber": "build-123",
    "groupId": null,
    "specs": [
      "spec.js"
    ]
  }
]

exports['lib/modes/record .generateProjectRunId passes groupId 1'] = [
  {
    "projectId": "id-123",
    "recordKey": "key-123",
    "commitSha": "sha-123",
    "commitBranch": "master",
    "commitAuthorName": "brian",
    "commitAuthorEmail": "brian@cypress.io",
    "commitMessage": "such hax",
    "remoteOrigin": "https://github.com/foo/bar.git",
    "ciParams": {
      "foo": "bar"
    },
    "ciProvider": "circle",
    "ciBuildNumber": "build-123",
    "groupId": "gr123",
    "specs": [
      "spec.js"
    ]
  }
]

exports['lib/modes/record .generateProjectRunId figures out groupId from CI environment variables 1'] = [
  {
    "projectId": "id-123",
    "recordKey": "key-123",
    "commitSha": "sha-123",
    "commitBranch": "master",
    "commitAuthorName": "brian",
    "commitAuthorEmail": "brian@cypress.io",
    "commitMessage": "such hax",
    "remoteOrigin": "https://github.com/foo/bar.git",
    "ciParams": {
      "foo": "bar"
    },
    "ciProvider": "circle",
    "ciBuildNumber": "build-123",
    "groupId": "ci-group-123",
    "specs": [
      "spec.js"
    ]
  }
]

