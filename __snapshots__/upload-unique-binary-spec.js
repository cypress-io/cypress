exports['getCDN for binary'] = {
  "input": {
    "platform": "darwin-x64",
    "filename": "cypress.zip",
    "version": "3.3.0",
    "hash": "ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123"
  },
  "result": "https://cdn.cypress.io/beta/binary/3.3.0/darwin-x64/ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123/cypress.zip"
}

exports['upload binary folder'] = {
  "input": {
    "platformArch": "darwin-x64",
    "version": "3.3.0",
    "hash": "ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123"
  },
  "result": "beta/binary/3.3.0/darwin-x64/ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123/"
}

exports['upload binary folder for platform'] = {
  "input": {
    "platformArch": "darwin-x64",
    "version": "3.3.0"
  },
  "result": "beta/binary/3.3.0/darwin-x64"
}
