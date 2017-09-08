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
            "name": "defaults.js"
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
            "name": "defaults.js"
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

exports['lib/scaffold .support creates supportFolder and commands.js, defaults.js, and index.js when supportFolder does not exist 1'] = `// ***********************************************
// This example commands.js shows you how to
// create the custom command: 'login'.
//
// The commands.js file is a great place to
// modify existing commands and create custom
// commands for use throughout your tests.
//
// You can read more about custom commands here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
// Cypress.Commands.add("login", function(email, password){
//   var email    = email || "joe@example.com"
//   var password = password || "foobar"
//
//   var log = Cypress.Log.command({
//     name: "login",
//     message: [email, password],
//     consoleProps: function(){
//       return {
//         email: email,
//         password: password
//       }
//     }
//   })
//
//   cy
//     .visit("/login", {log: false})
//     .contains("Log In", {log: false})
//     .get("#email", {log: false}).type(email, {log: false})
//     .get("#password", {log: false}).type(password, {log: false})
//     .get("button", {log: false}).click({log: false}) //this should submit the form
//     .get("h1", {log: false}).contains("Dashboard", {log: false}) //we should be on the dashboard now
//     .url({log: false}).should("match", /dashboard/, {log: false})
//     .then(function(){
//       log.snapshot().end()
//     })
// })
`

exports['lib/scaffold .support creates supportFolder and commands.js, defaults.js, and index.js when supportFolder does not exist 2'] = `// ***********************************************
// This example defaults.js shows you how to
// customize the internal behavior of Cypress.
//
// The defaults.js file is a great place to
// override defaults used throughout all tests.
//
// ***********************************************
//
// Cypress.Server.defaults({
//   delay: 500,
//   whitelist: function(xhr){}
// })

// Cypress.Cookies.defaults({
//   whitelist: ["session_id", "remember_token"]
// })
`

exports['lib/scaffold .support creates supportFolder and commands.js, defaults.js, and index.js when supportFolder does not exist 3'] = `// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your other test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/guides/configuration#section-global
// ***********************************************************

// Import commands.js and defaults.js
// using ES2015 syntax:
import "./commands"
import "./defaults"

// Alternatively you can use CommonJS syntax:
// require("./commands")
// require("./defaults")
`

