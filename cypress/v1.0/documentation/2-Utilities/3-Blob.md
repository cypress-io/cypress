slug: blob
excerpt: Convert base64 strings to blob objects

## [cy.Blob.method()](#usage)

Cypress proxies a [`Blob Utilities`](https://github.com/nolanlawson/blob-util) library and exposes it as `cy.Blob`.

Use `cy.Blob` to convert `base64` strings to `blob` objects. Useful for testing uploads.

***

## Usage

```javascript
// programmatically upload the logo
cy
  .fixture("images/logo.png").as("logo")
  .get("input[type=file]").then(function($input){

    // convert the logo base64 string to a blob
    cy.Blob.base64StringToBlob(this.logo, "image/png").then(function(blob){

      // pass the blob to the fileupload jQuery plugin
      // which initiates a programmatic upload
      $input.fileupload("add", {files: blob})
    })
  })
```