exports['lib/scaffold .fileTree returns tree-like structure of scaffolded 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "examples",
        "children": [
          {
            "name": "actions.spec.js"
          },
          {
            "name": "aliasing.spec.js"
          },
          {
            "name": "assertions.spec.js"
          },
          {
            "name": "connectors.spec.js"
          },
          {
            "name": "cookies.spec.js"
          },
          {
            "name": "cypress_api.spec.js"
          },
          {
            "name": "files.spec.js"
          },
          {
            "name": "local_storage.spec.js"
          },
          {
            "name": "location.spec.js"
          },
          {
            "name": "misc.spec.js"
          },
          {
            "name": "navigation.spec.js"
          },
          {
            "name": "network_requests.spec.js"
          },
          {
            "name": "querying.spec.js"
          },
          {
            "name": "spies_stubs_clocks.spec.js"
          },
          {
            "name": "traversal.spec.js"
          },
          {
            "name": "utilities.spec.js"
          },
          {
            "name": "viewport.spec.js"
          },
          {
            "name": "waiting.spec.js"
          },
          {
            "name": "window.spec.js"
          }
        ]
      },
      {
        "name": "_fixtures",
        "children": [
          {
            "name": "example.json"
          }
        ]
      },
      {
        "name": "_support",
        "children": [
          {
            "name": "commands.js"
          },
          {
            "name": "index.js"
          }
        ]
      }
    ]
  },
  {
    "name": "cypress",
    "children": [
      {
        "name": "plugins",
        "children": [
          {
            "name": "index.js"
          }
        ]
      }
    ]
  }
]

exports['lib/scaffold .fileTree leaves out integration tests if using component testing 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "_fixtures",
        "children": [
          {
            "name": "example.json"
          }
        ]
      },
      {
        "name": "_support",
        "children": [
          {
            "name": "commands.js"
          },
          {
            "name": "index.js"
          }
        ]
      }
    ]
  },
  {
    "name": "cypress",
    "children": [
      {
        "name": "plugins",
        "children": [
          {
            "name": "index.js"
          }
        ]
      }
    ]
  }
]

exports['lib/scaffold .fileTree leaves out fixtures if configured to false 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "examples",
        "children": [
          {
            "name": "actions.spec.js"
          },
          {
            "name": "aliasing.spec.js"
          },
          {
            "name": "assertions.spec.js"
          },
          {
            "name": "connectors.spec.js"
          },
          {
            "name": "cookies.spec.js"
          },
          {
            "name": "cypress_api.spec.js"
          },
          {
            "name": "files.spec.js"
          },
          {
            "name": "local_storage.spec.js"
          },
          {
            "name": "location.spec.js"
          },
          {
            "name": "misc.spec.js"
          },
          {
            "name": "navigation.spec.js"
          },
          {
            "name": "network_requests.spec.js"
          },
          {
            "name": "querying.spec.js"
          },
          {
            "name": "spies_stubs_clocks.spec.js"
          },
          {
            "name": "traversal.spec.js"
          },
          {
            "name": "utilities.spec.js"
          },
          {
            "name": "viewport.spec.js"
          },
          {
            "name": "waiting.spec.js"
          },
          {
            "name": "window.spec.js"
          }
        ]
      },
      {
        "name": "_support",
        "children": [
          {
            "name": "commands.js"
          },
          {
            "name": "index.js"
          }
        ]
      }
    ]
  },
  {
    "name": "cypress",
    "children": [
      {
        "name": "plugins",
        "children": [
          {
            "name": "index.js"
          }
        ]
      }
    ]
  }
]

exports['lib/scaffold .fileTree leaves out support if configured to false 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "examples",
        "children": [
          {
            "name": "actions.spec.js"
          },
          {
            "name": "aliasing.spec.js"
          },
          {
            "name": "assertions.spec.js"
          },
          {
            "name": "connectors.spec.js"
          },
          {
            "name": "cookies.spec.js"
          },
          {
            "name": "cypress_api.spec.js"
          },
          {
            "name": "files.spec.js"
          },
          {
            "name": "local_storage.spec.js"
          },
          {
            "name": "location.spec.js"
          },
          {
            "name": "misc.spec.js"
          },
          {
            "name": "navigation.spec.js"
          },
          {
            "name": "network_requests.spec.js"
          },
          {
            "name": "querying.spec.js"
          },
          {
            "name": "spies_stubs_clocks.spec.js"
          },
          {
            "name": "traversal.spec.js"
          },
          {
            "name": "utilities.spec.js"
          },
          {
            "name": "viewport.spec.js"
          },
          {
            "name": "waiting.spec.js"
          },
          {
            "name": "window.spec.js"
          }
        ]
      },
      {
        "name": "_fixtures",
        "children": [
          {
            "name": "example.json"
          }
        ]
      }
    ]
  },
  {
    "name": "cypress",
    "children": [
      {
        "name": "plugins",
        "children": [
          {
            "name": "index.js"
          }
        ]
      }
    ]
  }
]

exports['lib/scaffold .support creates supportFolder and commands.js and index.js when supportFolder does not exist 1'] = `
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

`

exports['lib/scaffold .support creates supportFolder and commands.js and index.js when supportFolder does not exist 2'] = `
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

`

exports['lib/scaffold .fileTree leaves out plugins if configured to false 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "examples",
        "children": [
          {
            "name": "actions.spec.js"
          },
          {
            "name": "aliasing.spec.js"
          },
          {
            "name": "assertions.spec.js"
          },
          {
            "name": "connectors.spec.js"
          },
          {
            "name": "cookies.spec.js"
          },
          {
            "name": "cypress_api.spec.js"
          },
          {
            "name": "files.spec.js"
          },
          {
            "name": "local_storage.spec.js"
          },
          {
            "name": "location.spec.js"
          },
          {
            "name": "misc.spec.js"
          },
          {
            "name": "navigation.spec.js"
          },
          {
            "name": "network_requests.spec.js"
          },
          {
            "name": "querying.spec.js"
          },
          {
            "name": "spies_stubs_clocks.spec.js"
          },
          {
            "name": "traversal.spec.js"
          },
          {
            "name": "utilities.spec.js"
          },
          {
            "name": "viewport.spec.js"
          },
          {
            "name": "waiting.spec.js"
          },
          {
            "name": "window.spec.js"
          }
        ]
      },
      {
        "name": "_fixtures",
        "children": [
          {
            "name": "example.json"
          }
        ]
      },
      {
        "name": "_support",
        "children": [
          {
            "name": "commands.js"
          },
          {
            "name": "index.js"
          }
        ]
      }
    ]
  }
]

exports['lib/scaffold .plugins creates pluginsFile when pluginsFolder does not exist 1'] = `
/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // <backtick>on<backtick> is used to hook into various events Cypress emits
  // <backtick>config<backtick> is the resolved Cypress config
}

`
