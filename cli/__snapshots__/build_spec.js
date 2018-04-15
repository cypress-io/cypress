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
    "browser",
    "cypress",
    "cypress.io",
    "automation",
    "end-to-end",
    "e2e",
    "integration",
    "mocks",
    "test",
    "testing",
    "runner",
    "spies",
    "stubs"
  ],
  "types": "types",
  "scripts": {
    "postinstall": "node index.js --exec install",
    "size": "t=\"$(npm pack .)\"; wc -c \"${t}\"; tar tvf \"${t}\"; rm \"${t}\";"
  }
}
