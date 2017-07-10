---
title: viewport
comments: false
---

Control the size and orientation of the screen for your application.

{% note info %}
You can set the viewport's width and height globally by defining `viewportWidth` and `viewportHeight` in the {% url 'configuration' configuration %}.
{% endnote %}

# Syntax

```javascript
cy.viewport(width, height)
cy.viewport(preset, orientation)
cy.viewport(width, height, options)
cy.viewport(preset, orientation, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.viewport(550, 750)    // Set viewport to 550px x 750px
cy.viewport('iphone-6')  // Set viewport to 357px x 667px
```

## Arguments

**{% fa fa-angle-right %} width** ***(Number)***

Width of viewport in pixels (must be between 200 and 3000).

**{% fa fa-angle-right %} height** ***(Number)***

Height of viewport in pixels (must be between 200 and 3000).

**{% fa fa-angle-right %} preset** ***(String)***

A preset dimension to set the viewport. Preset supports the following options:

| Preset | width | height |
| ----------- | ----- | ------ |
| `macbook-15`  | 1440  | 900    |
| `macbook-13`  | 1280  | 800    |
| `macbook-11`  | 1366  | 768    |
| `ipad-2`      | 1024  | 768    |
| `ipad-mini`   | 1024  | 768    |
| `iphone-6+`   | 414   | 736    |
| `iphone-6`    | 375   | 667    |
| `iphone-5`    | 320   | 568    |
| `iphone-4`    | 320   | 480    |
| `iphone-3`    | 320   | 480    |

**{% fa fa-angle-right %} orientation** ***(String)***

The orientation of the screen. The *default orientation* is `portrait`. Pass `landscape` as the orientation to reverse the width/height.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.viewport()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}

## Yields {% helper_icon yields %}

{% yields null cy.viewport %}

# Examples

## Width, Height

***Resize the viewport to 1024px x 768px***

```javascript
cy.viewport(1024, 768)
```

***Organize desktop vs mobile tests separately***

```javascript
describe('Nav Menus', function(){
  context('720p resolution', function(){
    beforeEach(function(){
      // run these tests as if in a desktop
      // browser with a 720p monitor
      cy.viewport(1280, 720)
    })

    it('displays full header', function(){
      cy.get('nav .desktop-menu').should('be.visible')
      cy.get('nav .mobile-menu').should('not.be.visible')
    })
  })

  context('iphone-5 resolution', function(){
    beforeEach(function(){
      // run these tests as if in a mobile browser
      // and ensure our responsive UI is correct
      cy.viewport('iphone-5')
    })

    it('displays mobile menu on click', function(){
      cy.get('nav .desktop-menu').should('not.be.visible')
      cy.get('nav .mobile-menu')
        .should('be.visible')
        .find('i.hamburger').click()
      cy.get('ul.slideout-menu').should('be.visible')
    })
  })
})
```

## Preset

***Resize the viewport to iPhone 6 width and height***

```javascript
cy.viewport('iphone-6') // viewport will change to 414px x 736px
```

## Orientation

***Change the orientation to landscape***

```javascript
// the viewport will now be changed to 736px x 414px
// and simulates the user holding the iPhone in landscape
cy.viewport('iphone-6', 'landscape')
```

# Notes

## devicePixelRatio

***`devicePixelRatio` is not simulated***

This is something Cypress will eventually do, which will match how Chrome's responsive mobile browsing simulation works. {% open_an_issue %} if you need this to be fixed.

## Restores

***Cypress will restore the viewport in the snapshot***

When hovering over each command, Cypress will automatically display the snapshot in the viewport dimensions that existed when that command ran.

## Defaults

***Default sizing***

By default, until you issue a `cy.viewport()` command, Cypress sets the width to `1000px` and the height to `660px` by default.

You can {% url 'change these default dimensions' configuration#Viewport %} by adding the following to your `cypress.json`:

```json
{
  "viewportWidth": 1000,
  "viewportHeight": 660
}
```

Additionally, Cypress automatically sets the viewport to it's default size between each test.

## Scaling

***Auto Scaling***

By default, if your screen is not large enough to display all of the current dimension's pixels, Cypress will scale and center your application within the Cypress runner to accommodate.

Scaling the app should not affect any calculations or behavior of your application (in fact it won't even know it's being scaled).

The upsides to this are that tests should consistently pass or fail regardless of a developers' screen size. Tests will also consistently run in `CI` because all of the viewports will be the same no matter what machine Cypress runs on.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.viewport %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.viewport %}

## Timeouts {% helper_icon timeout %}

{% timeouts none cy.viewport %}

# Command Log

***Change viewport size to test responsive nav***

```javascript
cy.get('#navbar').should('be.visible')

cy.viewport(320, 480)

// the navbar should have collapse since our screen is smaller
cy.get('#navbar').should('not.be.visible')
cy.get('.navbar-toggle').should('be.visible').click()
cy.get('.nav').find('a').should('be.visible')
```

The commands above will display in the command log as:

![Command Log viewport](/img/api/viewport/viewport-size-width-and-height-changes-and-is-shown-in-the-commands.png)

When clicking on `viewport` within the command log, the console outputs the following:

![Console log viewport](/img/api/viewport/console-log-shows-width-and-height-of-tested-viewport.png)

# See also

- {% url 'configuration' configuration %}
