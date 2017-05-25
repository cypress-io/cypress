---
title: exec
comments: true
description: ''
---

Execute a system command.

# Syntax

```javascript
.exec(command)
.exec(command, options)
```

## Usage

`.exec()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.exec('npm run build')    
```

## Arguments

**{% fa fa-angle-right %} command** ***(String)***

The system command to be executed from the project root (the directory that contains `cypress.json`).

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.exec()`.

Option | Default | Notes
--- | --- | ---
`failOnNonZeroExit` | `true` | whether to fail if the command exits with a non-zero code
`env` | `{}` | Object of environment variables to set before the command executes (e.g. `{ USERNAME: 'johndoe' }`). Will be merged with existing system environment variables
`log` | `true` | whether to display command in command log
`timeout` | [`execTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to allow the command to execute

## Yields

`.exec()` yields an object with the exit `code`, `stdout`, and `stderr`.

## Timeout

`.exec()` will allow the command to execute for the duration of the [`execTimeout`](https://on.cypress.io/guides/configuration#timeouts)

# Examples

## Prepping data

`cy.exec` provides an escape hatch for running arbitrary system commands, so you can take actions necessary for your test, but outside the scope of Cypress. This is great for:

- Running build scripts
- Seeding your test database
- Starting processes
- Killing processes

**Run a build command**

```javascript
cy
  .exec('npm run build')
  .then(function (result) {
    // yields the 'result' object
    // {
    //   code: 0,
    //   stdout: "Files successfully built",
    //   stderr: ""
    // }
  })
```

**Seed the database and assert it was successful**

```javascript
cy.exec('rake db:seed').its('code').should('eq', 0)
```

**Run an arbitrary script and assert its output**

```javascript
cy.exec('npm run my-script').its('stdout').should('contain', 'Done running the script')
```

**Write to a file to create a fixture from response body**
```javascript
cy.server()
cy.route('POST', '/comments').as('postComment')
cy.get('.add-comment').click()
cy.wait('@postComment').then(function(xhr){
  cy.exec(`echo ${JSON.stringify(xhr.responseBody)} >cypress/fixtures/comment.json`)
  cy.fixture('comment.json').should('deep.eq', xhr.responseBody)
})
```

## Options

**Change the timeout**

You can increase the time allowed to execute the command, although *we don't recommend executing commands that take a long time to exit*.

Cypress will *not* continue running any other commands until `.exec()` has finished, so a long-running command will drastically slow down your test cycle.

```javascript
// will fail if script takes longer than 20 seconds to finish
cy.exec('npm run build', { timeout: 20000 });
```

**Choose to not fail on non-zero exit and assert on code and stderr**

```javascript
cy
  .exec('man bear pig', { failOnNonZeroExit: false })
  .its('code').should('eq', 1)
  .its('stderr').should('contain', 'No manual entry for bear')
```

**Specify environment variables**

```javascript
cy
  .exec('echo $USERNAME', { env: { USERNAME: 'johndoe' } })
  .its('stdout').should('contain', 'johndoe')
```

# Notes

**Commands that do not exit are not supported**

`.exec()` does not support commands that don't exit, such as:

- `rails server`
- A task that runs a watch
- Any process that needs to be manually interrupted to stop

A command must exit within the `execTimeout` or Cypress will kill the command's process and fail the current test.

# Command Log

**List the contents of cypress.json**

```javascript
cy.exec('cat cypress.json')
```

The command above will display in the command log as:

<img width="445" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/15369507/e03a7eca-1d00-11e6-8558-396d8c9b6d98.png">

When clicking on the `exec` command within the command log, the console outputs the following:

<img width="758" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/15969867/e3ab646e-2eff-11e6-9199-987ca2f74025.png">

# See also

- [request](https://on.cypress.io/api/request)
- [readFile](https://on.cypress.io/api/readFile)
- [writeFile](https://on.cypress.io/api/writeFile)
