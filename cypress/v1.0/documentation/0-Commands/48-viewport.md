excerpt: Change the screen size of your application
slug: viewport

Use `cy.viewport` to control the screen size of your application.

### [cy.viewport( *width*, *height* )](#usage)

Resizes the viewport to the specified dimensions in pixels.

This command is useful for when you need to test your application in a specific width or height, such as responsive applications or applications utilizing media queries.

`cy.viewport` returns null.

***

### [cy.viewport( *preset*, *orientation* )](#preset-usage)

Viewport supports the following presets (in pixels):

| Preset name | width | height |
| ----------- | ----- | ------ |
| macbook-15  | 1440  | 900    |
| macbook-13  | 1280  | 800    |
| macbook-11  | 1366  | 768    |
| ipad-2      | 1024  | 768    |
| ipad-mini   | 1024  | 768    |
| iphone-6+   | 414   | 736    |
| iphone-6    | 375   | 667    |
| iphone-5    | 320   | 568    |
| iphone-4    | 320   | 480    |
| iphone-3    | 320   | 480    |

The **default orientation** is `portrait`.

Pass `landscape` as the orientation to reverse the width/height.

***

## Usage

> Resize the viewport to 1024x768

```javascript
// the viewport will now be changed to 1024x768
cy.viewport(1024, 768)
```

***

> Organize desktop vs mobile tests separately

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
        .get("nav .desktop-menu", {visible: true})
        .get("nav .mobile-menu", {visible: false})
    })

  context("iphone-5 resolution", function(){
    beforeEach(function(){
      // run these tests in a mobile browser
      // and ensure our responsive UI is correct
      cy.viewport("iphone-5")
    })

    it("displays mobile menu on click", function(){
      cy
         .get("nav .desktop-menu", {visible: false})
         .get("nav .mobile-menu", {visible: true}).find("i.hamburger").click()
         .get("ul.slideout-menu", {visible: true})
    })
  })
})
```

***

## Preset Usage

> Resize the viewport to iPhone 6 width and height

```javascript
// the viewport will now be changed to 414x736
cy.viewport("iphone-6")
```

***

> Change the orientation to landscape

```javascript
// the viewport will now be changed to 736x414
// which simulates the user holding the phone sideways
cy.viewport("iphone-6", "landscape")
```

***

## Known Issues

> `devicePixelRatio` is not simulated

This is something Cypress will eventually do, which will match how Chrome's responsive mobile browsing simulation works.

***

## Notes


> Cypress will restore the viewport for each command

When hovering over each command, Cypress will automatically restore the viewport to the dimensions that existed when that command ran.

***

> Default sizing

By default, until you issue a `cy.viewport` command, Cypress will assume the width is: `1000px` and the height is `660px`.

You can change these default dimensions by adding the following to your `cypress.json`

```javascript
// cypress.json
{
  viewportWidth: 1000,
  viewportHeight: 660
}
```

***

> Auto Scaling

By default, if your screen is not large enough to display all of the current dimension's pixels, Cypress will scale and center your application to accommodate.

Scaling the app should not affect any calculations or behavior of your application (in fact it won't even know it's being scaled).

The upsides to this is that tests should consistently pass or fail regardless of each of your developers' screen sizes. Tests will also consistently run in `CI` because all of the viewports will be the same no matter what machine Cypress runs on.