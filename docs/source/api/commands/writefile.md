---
title: writeFile
comments: true
---

Write to a file with the specified contents.

# Syntax

```javascript
cy.writeFile(filePath, contents)
cy.writeFile(filePath, contents, encoding)
cy.writeFile(filePath, contents, options)
cy.writeFile(filePath, contents, encoding, options)
```

## Usage

`cy.writeFile()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.writeFile('menu.json')    
```

## Arguments

**{% fa fa-angle-right %} filePath** ***(String)***

A path to a file within the project root (the directory that contains `cypress.json`).

**{% fa fa-angle-right %} contents** ***(String, Array, or Object)***

The contents to be written to the file.

**{% fa fa-angle-right %} encoding**  ***(String)***

The encoding to be used when writing to the file. The following encodings are supported:

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

Pass in an options object to change the default behavior of `cy.writeFile()`.

Option | Default | Notes
--- | --- | ---
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to wait for the command to be processed.

## Yields

`cy.writeFile()` yields the contents written to the file.

## Timeout

`cy.writeFile()` will wait up for the duration of {% url `defaultCommandTimeout` configuration#Timeouts %} for the server to write to the file.

# Examples

## Text

**Write some text to a `txt` file**

If the path to the file does not exist, the file and it's path will be created. If the file already exists, it will be over-written.

```javascript
cy
  .writeFile('path/to/message.txt', 'Hello World')
  .then(function (text) {
    expect(text).to.equal('Hello World') // true
  })
```

`{projectRoot}/path/to/message.txt` will be created with the following contents:

```text
 "Hello World"
```

## JSON

**Write JSON to a file**

JavaScript arrays and objects are stringified and formatted into text.

```javascript
cy.writeFile('path/to/data.json', { name: 'Eliza', email: 'eliza@example.com' })
  .then(function (user) {
    expect(user.name).to.equal('Eliza')
  })
```

`{projectRoot}/path/to/data.json` will be created with the following contents:

```json
{
  "name": "Eliza",
  "email": "eliza@example.com"
}
```

**Write response data to a fixture file**

```javascript
cy.request('https://jsonplaceholder.typicode.com/users').then(function(response){
  cy.writeFile('cypress/fixtures/users.json', response.body)
})

// our fixture file is now generated and can be used
cy.fixture('users').then(function(users){
  expect(users[0].name).to.exist
})
```

## Encoding

**Specify the encoding with the third argument.**

```javascript
cy.writeFile('path/to/ascii.txt', 'Hello World', 'ascii'))
```

`{projectRoot}/path/to/message.txt` will be created with the following contents:

```text
Hello World
```

# Command Log

**Write an array to a file**

```javascript
cy.writeFile('info.log', ['foo', 'bar', 'baz'])
```

The command above will display in the command log as:

<img width="618" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/17936162/df857dda-69eb-11e6-8951-f34618a72e39.png">

When clicking on the `writeFile` command within the command log, the console outputs the following:

<img width="452" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/17936161/df7e6bf8-69eb-11e6-8ef2-a90113dece9b.png">

# See also

- {% url `cy.readFile()` readfile %}
- [Creating Fixtures](https://on.cypress.io/guides/creating-fixtures)
