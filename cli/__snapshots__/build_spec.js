exports['package.json build outputs expected properties 1'] = {
  "name": "test",
  "engines": "test engines",
  "version": "x.y.z",
  "description": "Cypress.io end to end testing tool",
  "author": "Brian Mann",
  "homepage": "https://github.com/cypress-io/cypress",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/cypress-io/cypress/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/cypress-io/cypress.git"
  },
  "keywords": [
    "automation",
    "browser",
    "cypress",
    "cypress.io",
    "e2e",
    "end-to-end",
    "integration",
    "mocks",
    "runner",
    "spies",
    "stubs",
    "test",
    "testing"
  ],
  "types": "types",
  "scripts": {
    "postinstall": "node index.js --exec install",
    "size": "t=\"$(npm pack .)\"; wc -c \"${t}\"; tar tvf \"${t}\"; rm \"${t}\";"
  }
}
