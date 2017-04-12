slug: viewport
excerpt: Change the screen size of your application

Use `cy.viewport` to control the screen size and orientation of your application. This command is useful for when you need to test your application in a specific width or height, such as responsive applications or applications utilizing media queries. `cy.viewport` width and height must be between 200px and 3000px.

| | |
|--- | --- |
| **Returns** | `null` |
| **Timeout** | *cannot timeout* |

***

# [cy.viewport( *width*, *height* )](#usage)

Resize the viewport to the specified dimensions in pixels.

***

# [cy.viewport( *preset*, *orientation* )](#preset-usage)

Resize the viewport to a preset dimension. Viewport supports the following presets (in pixels):

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

The **default orientation** is `portrait`. Pass `landscape` as the orientation to reverse the width/height.

***

# Options

Pass in an options object to change the default behavior of `cy.viewport`.

**cy.viewport( *width*, *height*, *options* )**
**cy.viewport( *preset*, *orientation*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

You can also set options for the viewport's `viewportWidth` and `viewportHeight` globally in [configuration](https://on.cypress.io/guides/configuration).

***

# Usage

## Resize the viewport to 1024 x 768

```javascript
// the viewport will now be changed to 1024x768 pixels
cy.viewport(1024, 768)
```

***

## Organize desktop vs mobile tests separately

```javascript
describe("Nav Menus", function(){
  context("720p resolution", function(){
    beforeEach(function(){
      // run these tests in a desktop browser
      // with a 720p monitor
      cy.viewport(1280, 720)
    })

    it("displays full header", function(){
      cy
        .get("nav .desktop-menu").should("be.visible")
        .get("nav .mobile-menu").should("not.be.visible")
    })

  context("iphone-5 resolution", function(){
    beforeEach(function(){
      // run these tests in a mobile browser
      // and ensure our responsive UI is correct
      cy.viewport("iphone-5")
    })

    it("displays mobile menu on click", function(){
      cy
        .get("nav .desktop-menu").should("not.be.visible")
        .get("nav .mobile-menu")
          .should("be.visible")
          .find("i.hamburger").click()
        .get("ul.slideout-menu").should("be.visible")
    })
  })
})
```

***

# Preset Usage

## Resize the viewport to iPhone 6 width and height

```javascript
// the viewport will now be changed to 414x736
cy.viewport("iphone-6")
```

***

## Change the orientation to landscape

```javascript
// the viewport will now be changed to 736x414
// which simulates the user holding the iPhone in lanscape
cy.viewport("iphone-6", "landscape")
```

***

# Known Issues

## `devicePixelRatio` is not simulated

This is something Cypress will eventually do, which will match how Chrome's responsive mobile browsing simulation works. [Open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) if you need this to be fixed.

***

# Notes

## Cypress will restore the viewport for each command

When hovering over each command, Cypress will automatically restore the viewport to the dimensions that existed when that command ran.

***

## Default sizing

By default, until you issue a `cy.viewport` command, Cypress will assume the width is: `1000px` and the height is `660px`.

You can [change these default dimensions](https://on.cypress.io/guides/configuration) by adding the following to your `cypress.json`

```javascript
{
  viewportWidth: 1000,
  viewportHeight: 660
}
```

Additionally, Cypress automatically sets the viewport to it's default size between each test.

***

## Auto Scaling

By default, if your screen is not large enough to display all of the current dimension's pixels, Cypress will scale and center your application within Cypress to accommodate.

Scaling the app should not affect any calculations or behavior of your application (in fact it won't even know it's being scaled).

The upsides to this is that tests should consistently pass or fail regardless of each of your developers' screen sizes. Tests will also consistently run in `CI` because all of the viewports will be the same no matter what machine Cypress runs on.

# Related

- [Configuration](https://on.cypress.io/guides/configuration)
