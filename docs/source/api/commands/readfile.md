---
title: readFile
comments: false
---

Read a file and yield its contents.

# Syntax

```javascript
cy.readFile(filePath)
cy.readFile(filePath, encoding)
cy.readFile(filePath, options)
cy.readFile(filePath, encoding, options)
```

## Usage

`cy.readFile()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.readFile('menu.json')    
```

## Arguments

**{% fa fa-angle-right %} filePath** ***(String)***

A path to a file within the project root (the directory that contains `cypress.json`).

**{% fa fa-angle-right %} encoding**  ***(String)***

The encoding to be used when reading the file. The following encodings are supported:

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

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `cy.readFile()`.

Option | Default | Notes
--- | --- | ---
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to wait for the command to be processed

## Yields

`cy.readFile()` yields the contents of the file.

## Timeout

`cy.readFile()` will wait up for the duration of {% url `defaultCommandTimeout` configuration#Timeouts %} for the server to process the command.

# Examples

## Text

**Read a `txt` file**

For any file other than JSON, the contents of the file are returned.

***message.txt***
```text
Hello World
```

***test file***
```javascript
cy.readFile('path/to/message.txt').then(function (text) {
  expect(text).to.equal('Hello World')   // true
})
```

## JSON

For JSON, the contents yielded are parsed into JavaScript and returned.

***Data.json***

```json
{
  "name": "Eliza",
  "email": "eliza@example.com"
}
```

***test file***
```javascript
cy.readFile('path/to/data.json').then(function (user) {
  expect(user.name).to.equal('Eliza') // true
})
```

## YAML

**Get translation data from Yaml file**

```javascript
YAML = require('yamljs')

cy.readFile("languages/en.yml").then(function (yamlString) {
  this.english = YAML.parse(yamlString)
})

cy.get("#sidebar").find(".sidebar-title")
  .each(function (displayedTitle, i) {
    englishTitle = this.english.sidebar[@sidebarTitles[i]]
    expect(displayedTitle.text()).to.eq(englishTitle)
  })
```

## Encoding

**Specify the encoding with the second argument.**

```javascript
cy.readFile('path/to/logo.png', 'base64').then(function (logo) {
  // logo will be encoded as base64
  // and should look something like this:
  // aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw==...
})
```

# Notes

**Implicit file existence assertion**

By default, `cy.readFile()` asserts that the file exists and will fail if it does not exist. It will retry reading the file if it does not initially exist until the file exists or the command times out.

```javascript
// will fail after the defaultCommandTimeout is reached
cy.readFile('does-not-exist.yaml')
```

**Asserting file non-existence**

You can assert that a file does not exist like so:

```javascript
// will pass if the file does not exist
cy.readFile('does-not-exist.yaml').should("not.exist")
```

# Command Log

**List the contents of cypress.json**

```javascript
cy.readFile('cypress.json')
```

The command above will display in the command log as:

![Command Log](/img/api/readfile/readfile-can-get-content-of-system-files-in-tests.png)

When clicking on the `readFile` command within the command log, the console outputs the following:

![Console Log](/img/api/readfile/console-log-shows-content-from-file-formatted-as-javascript.png)

# See also

- {% url `cy.exec()` exec %}
- {% url `cy.fixture()` fixture %}
- {% url `cy.writeFile()` writefile %}
