---
title: location
comments: false
---

Get the global `window.location` object of the page that is currently active.

# Syntax

```javascript
cy.location()
cy.location(key)
cy.location(options)
cy.location(key, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.location()       // Get location object
cy.location('host') // Get the host of the location object
cy.location('port') // Get the port of the location object
```

## Arguments

**{% fa fa-angle-right %} key** ***(String)***

A key on the location object. Returns this value instead of the full location object.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.location()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout cy.location %}

## Yields {% helper_icon yields %}

`cy.location()` yields the location object with the following properties:

- `hash`
- `host`
- `hostname`
- `href`
- `origin`
- `pathname`
- `port`
- `protocol`
- `search`
- `toString`

***When given a `key` argument:***

{% yields sets_subject cy.location 'yields the value of the location property as a string' %}

# Examples

## No Args

***Make assertions about every location property***

```javascript
cy.visit('http://localhost:8000/app/index.html?q=dan#/users/123/edit')

cy.location().should(function(location) {
  expect(location.hash).to.eq('#/users/123/edit')
  expect(location.host).to.eq('localhost:8000')
  expect(location.hostname).to.eq('localhost')
  expect(location.href).to.eq('http://localhost:8000/app/index.html?q=dan#/users/123/edit')
  expect(location.origin).to.eq('http://localhost:8000')
  expect(location.pathname).to.eq('/app.index.html')
  expect(location.port).to.eq('8000')
  expect(location.protocol).to.eq('http:')
  expect(location.search).to.eq('?q=dan')
  expect(location.toString()).to.eq('http://localhost:8000/app/index.html?q=brian#/users/123/edit')
})
```

***Check location for query params and pathname***

We can yield the location object within a {% url `.should()` should %} command and work with it directly.

```javascript
cy.get('#search').type('niklas{enter}')
cy.location().should(function(location){
  expect(location.search).to.eq('?search=niklas')
  expect(location.pathname).to.eq('/users')
})
```

## Key

***Assert that a redirect works***

Grab only the `pathname` and add an assertion.

```javascript
cy.visit('http://localhost:3000/admin')
cy.location('pathname').should('eq', '/login')
```

# Notes

## Native Location

***No need to use `window.location`***

Cypress automatically normalizes the `cy.location()` command and strips out extraneous values and properties found in `window.location`. Also, the object literal yielded by `cy.location()` is just a basic object literal, not the special `window.location` object.

When changing properties on the real `window.location` object, it forces the browser to navigate away. In Cypress, the object yielded is a plain object, so changing its properties will have no effect on navigation.

***Console output of `window.location`***

```javascript
cy.window().then(function(window){
  console.log(window.location)
})
```

![Console.log of window.location](/img/api/location/window-location-object-printed-in-console-log.png)

***Console output of `.location()`***

```javascript
cy.location().then(function(location){
  console.log(location)
})
```

![Console Log of Cypress location command](/img/api/location/special-cypress-location-object-logged-in-console-output.png)

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.location %}

## Assertions {% helper_icon assertions %}

{% assertions retry cy.location %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions cy.location %}

# Command Log

***Assert on the location's href***

```javascript
cy.location().should(function(location){
  expect(location.href).to.include('commands/querying')
})
```

The commands above will display in the command log as:

![Command Log](/img/api/location/make-assertion-about-location-url-in-tests.png)

When clicking on `location` within the command log, the console outputs the following:

![Console Log](/img/api/location/location-object-in-console-log.png)

# See also

- {% url `cy.hash()` hash %}
- {% url `cy.url()` url %}
