exports['lib/scaffold .plugins creates plugins/index.js when pluginsFolder does not exist 1'] = `// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// Currently,
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/guides/plugins
// https://on.cypress.io/guides/configuration#section-global
// ***********************************************************

/**
*  This function is called when a project is opened or re-opened (e.g. due to
*  the project's config changing)
*/
module.exports = (register, config) => {
  /**
  *  <backtick>register<backtick> is used to hook into various events in the Cypress lifecycle
  *  <backtick>config<backtick> is the resolved Cypress config
  */

  /**
  * Registering 'on:spec:file:preprocessor' will override the default
  * preprocessing. This includes watching the spec file, so the plugin
  * you register needs to handle that too.
  *
  * TODO: add link to doc with preprocessor plugin details
  */
  // register('on:spec:file:preprocessor', (filePath, options, util) => {
  //   return filePath
  // })
}
`

exports['lib/scaffold .fileTree returns tree-like structure of scaffolded 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "example_spec.js"
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

exports['lib/scaffold .fileTree leaves out fixtures if configured to false 1'] = [
  {
    "name": "tests",
    "children": [
      {
        "name": "example_spec.js"
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
        "name": "example_spec.js"
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

exports['lib/scaffold .support creates supportFolder and commands.js and index.js when supportFolder does not exist 1'] = `// ***********************************************
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
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
`

exports['lib/scaffold .support creates supportFolder and commands.js and index.js when supportFolder does not exist 2'] = `// ***********************************************************
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
        "name": "example_spec.js"
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

