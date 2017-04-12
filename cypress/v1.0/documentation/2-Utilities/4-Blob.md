slug: cypress-blob
excerpt: Convert base64 strings to blob objects

# [Cypress.Blob.method()](#setion-usage)

Cypress proxies a [`Blob Utilities`](https://github.com/nolanlawson/blob-util) library and exposes it as `Cypress.Blob`.

Use `Cypress.Blob` to convert `base64` strings to `blob` objects. Useful for testing uploads.

***

# Usage

## Using an image fixture

```javascript
// programmatically upload the logo
cy
  .fixture("images/logo.png").as("logo")
  .get("input[type=file]").then(function($input){

    // convert the logo base64 string to a blob
    return Cypress.Blob.base64StringToBlob(this.logo, "image/png").then(function(blob){

      // pass the blob to the fileupload jQuery plugin
      // which initiates a programmatic upload
      $input.fileupload("add", {files: blob})
    })
  })
```

## Getting dataUrl string

```javascript
return Cypress.Blob.imgSrcToDataURL("/assets/img/logo.png").then(function(dataUrl){

  // create an <img> element and set its src to the dataUrl
  var img = Cypress.$("<img />", {src: dataUrl})

  cy
    .get(".utility-blob").then(function($div){
      // append the image
      $div.append(img)
    })
    .get(".utility-blob img").click().should("have.attr", "src", dataUrl)
})
```
