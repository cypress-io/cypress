---
title: Cypress.Blob
comments: false
---

Cypress automatically includes a {% url 'Blob' https://github.com/nolanlawson/blob-util %} library and exposes it as `Cypress.Blob`.

Use `Cypress.Blob` to convert `base64` strings to `blob` objects. Useful for testing uploads.

# Syntax

```javascript
Cypress.Blob.method()
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.Blob.method()
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.Blob.method()  // Errors, cannot be chained off 'cy'
```

# Examples

## Image Fixture

**Using an image fixture**

```javascript
// programmatically upload the logo
cy.fixture("images/logo.png").as("logo")
cy.get("input[type=file]").then(function($input){

  // convert the logo base64 string to a blob
  return Cypress.Blob.base64StringToBlob(this.logo, "image/png").then(function(blob){

    // pass the blob to the fileupload jQuery plugin
    // used in your application's code
    // which initiates a programmatic upload
    $input.fileupload("add", {files: blob})
  })
})
```

## Getting dataUrl string

**create an `img` element and set its `src` to the `dataUrl`**

```javascript
return Cypress.Blob.imgSrcToDataURL("/assets/img/logo.png").then(function(dataUrl){
  var img = Cypress.$("<img />", {src: dataUrl})

  cy.get(".utility-blob").then(function($div){
    // append the image
    $div.append(img)
  })
  cy.get(".utility-blob img").click().should("have.attr", "src", dataUrl)
})
```
