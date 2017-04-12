slug: readfile
excerpt: Read a file's contents

Reads a file and returns its contents. JSON is automatically parsed into JavaScript.

| | |
|--- | --- |
| **Returns** | the contents of the file |
| **Timeout** | `cy.readFile` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.readFile( *filePath* )](#section-usage)

Reads the file at the `filePath`. The `filePath` is relative to the project's root.

***

# [cy.readFile( *filePath*, *encoding* )](#section-specify-encoding)

Reads the file at the `filePath` with the `encoding`. The `filePath` is relative to the project's root.

***

# Options

Pass in an options object to change the default behavior of `cy.readFile`.

**[cy.readFile( *filePath*, *options* )](#options-usage)**

**[cy.readFile( *filePath*, *encoding*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to wait for the `cy.readFile` command to be processed

***

# Usage

## Read a `txt` file

For any file other than JSON, the contents of the file are returned.

```javascript
// message.txt contains:
// Hello World

cy.readFile("path/to/message.txt").then(function (text) {
  expect(text).to.equal("Hello World")   // true
})
```

## Read a `json` file

For JSON, the contents are parsed into JavaScript and returned.

```javascript
// data.json contains:
// {
//   "name": "Eliza",
//   "email": "eliza@example.com"
// }

cy.readFile("path/to/data.json").then(function (user) {
  // user will equal:
  // {
  //   name: "Eliza",
  //   email: "eliza@example.com"
  // }
  expect(user.name).to.equal("Eliza")
})
```

## Specify encoding

Specify the encoding with the second argument.


```javascript
cy.readFile("path/to/logo.png", "base64").then(function (logo) {
  // logo will be encoded as base64
  // and should look something like this:
  // aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw==...
})
```

The following encodings are supported:

* `ascii`
* `base64`
* `binary`
* `hex`
* `latin1`
* `utf8`
* `utf-8`
* `ucs2`
* `ucs-2`
* `utf16le`
* `utf-16le`

***

# Notes

## Implicit assertion

By default, `cy.readFile` asserts that the file exists and will fail if it does not exist. It will retry reading the file if it does not initially exist until the file exists or the command times out.

```javascript
// will fail after the defaultCommandTimeout is reached
cy.readFile('does-not-exist.yaml')
```

## Asserting non-existence

You can assert that a file does not exist like so:

```javascript
// will pass if the file does not exist
cy.readFile('does-not-exist.yaml').should("not.exist")
```

***

# Command Log

## List the contents of cypress.json

```javascript
cy.readFile("cypress.json")
```

The command above will display in the command log as:

<img width="521" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/17934353/a02d6c34-69e5-11e6-8f1d-ab1eda17ab3b.png">

When clicking on the `readFile` command within the command log, the console outputs the following:

<img width="689" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/17934460/089e0652-69e6-11e6-9f00-7eb282be0d27.png">

***

# Related

- [writeFile](https://on.cypress.io/api/writeFile)
- [Creating Fixtures](https://on.cypress.io/guides/creating-fixtures)
