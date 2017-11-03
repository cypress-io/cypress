exports['lib/modes/record .generateProjectBuildId calls api.createRun with args 1'] = [
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
    "specPattern": null,
    "specs": [
      "spec.js"
    ]
  }
]

exports['lib/modes/record .generateProjectBuildId passes groupId 1'] = [
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
    "specPattern": null,
    "specs": [
      "spec.js"
    ]
  }
]

exports['lib/modes/record .generateProjectBuildId figures out groupId from CI environment variables 1'] = [
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
    "specPattern": null,
    "specs": [
      "spec.js"
    ]
  }
]

