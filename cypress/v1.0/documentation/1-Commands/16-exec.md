slug: exec
excerpt: Execute a system command

Allows you to execute any system command. The system command can be anything you would normally run on the command line, such as `npm run build`, `rake db:seed`, etc.

This is a complementary command to `cy.request`. Whereas you can use `cy.request` for talking to external endpoints, you can use `cy.exec` to execute command line scripts on your system. This is great for running build scripts, seeding your test database, starting or killing processes, etc.

Does not support long-running commands, such as `rails server`, a task that runs a watch, or any process that needs to be manually interrupted to stop. It must exit within the timeout or Cypress will kill the process and fail the current test.

The current working directory is set to the root of your project (the parent of the cypress directory).

| | |
|--- | --- |
| **Returns** | an object with the exit `code`, the `stdout`, and the `stderr` |
| **Timeout** | `cy.exec` will allow the command to execute for the duration of the [`execTimeout`](https://on.cypress.io/guides/configuration#section-global-options) |

***

# [cy.exec( *command* )](#section-command-usage)

Execute a system command.

***

# Options

Pass in an options object to change the default behavior of `cy.exec`.

**cy.exec( *command*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log
`timeout` | [`execTimeout`](https://on.cypress.io/guides/configuration#section-global-options) | Total time to allow the command to execute
`failOnNonZeroExit` | `true` | Fail if the command exits with a non-zero code
`env` | `{}` | Object of environment variables to set before the command executes (e.g. { USERNAME: 'johndoe' }). Will be merged with existing system environment variables

***

# Usage

## Run a build command

```javascript
cy
  .exec("npm run build")
  .then(function (result) {
    // subject is now the result object
    // {
    //   code: 0,
    //   stdout: "Files successfully built",
    //   stderr: ""
    // }
  })
```

## Seed the database and assert it was successful

```javascript
cy.exec("rake db:seed").its("code").should("eq", 0)
```

## Run an arbitrary script and assert its output

```javascript
cy.exec("npm run my-script").its("stdout").should("contain", "Done running the script")
```

***

# Command Log

## List the contents of cypress.json

```javascript
cy.exec("cat cypress.json")
```

The command above will display in the command log as:

<img width="445" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/15369507/e03a7eca-1d00-11e6-8558-396d8c9b6d98.png">

When clicking on the `exec` command within the command log, the console outputs the following:

<img width="758" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/15369509/e49c6b22-1d00-11e6-9984-5a888c01e3e7.png">

***
