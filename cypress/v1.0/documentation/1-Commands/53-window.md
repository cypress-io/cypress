slug: window
excerpt: Get global window object

# [cy.window()](#section-usage)

Returns the global window object of the remote application you've visited.

***

# Options

Pass in an options object to change the default behavior of `cy.window`.

**cy.window( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

***

# Usage

## Returns the remote window object

```javascript
cy
  .visit("http://localhost:8080/app")
  .window().then(function(win){
    // win is the remote window
    // of the page at: http://localhost:8080/app
  })
```

***

# Command Log

## Get the window

```javascript
cy.window()
```

The commands above will display in the command log as:

<img width="587" alt="screen shot 2015-11-29 at 2 15 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459397/ced0a6de-96a3-11e5-93b4-9abd9ffabd98.png">

When clicking on `window` within the command log, the console outputs the following:

<img width="758" alt="screen shot 2015-11-29 at 2 16 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459398/d0e6f4be-96a3-11e5-8583-69dcffef9cd3.png">

***

# Related

- [document](https://on.cypress.io/api/document)
