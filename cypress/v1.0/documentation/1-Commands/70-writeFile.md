slug: writefile
excerpt: Write to a file with the specified contents

Writes to a file with the specified contents. JavaScript arrays and objects are stringified and formatted into text. If the path to the file does not exist, the file and it's path will be created. If the file already exists, it will be over-written.

| | |
|--- | --- |
| **Returns** | the contents written to the file |
| **Timeout** | `cy.writeFile` will wait for the duration of [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the server to write the file. |

***

# [cy.writeFile( *filePath*, *contents* )](#usage)

Writes to the `filePath` with the `contents`. The `filePath` is relative to the project's root. `contents` must be a string, an array, or an object.

***

# [cy.writeFile( *filePath*, *contents*, *encoding* )](#specify-encoding)

Writes to the `filePath` with the `contents` using the `encoding`. The `filePath` is relative to the project's root. `contents` must be a string, an array, or an object.

***

# Options

Pass in an options object to change the default behavior of `cy.writeFile`.

**[cy.writeFile( *filePath*, *contents*, *options* )](#options-usage)**

**[cy.writeFile( *filePath*, *contents*, *encoding*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the `cy.writeFile` command to be processed

***

# Usage

## Write some text to a `txt` file

```javascript
// {projectRoot}/path/to/message.txt will be created with the contents "Hello World"
cy
  .writeFile("path/to/message.txt", "Hello World")
  .then(function (text) {
    expect(text).to.equal("Hello World") // true
  })
```

## Write JSON to a file

JavaScript arrays and objects are stringified and formatted into text.

```javascript
// {projectRoot}/path/to/data.json will be created with the following:
// {
//   "name": "Eliza",
//   "email": "eliza@example.com"
// }

cy
  .writeFile("path/to/data.json", { name: "Eliza", email: "eliza@example.com" })
  .then(function (user) {
    // user will equal:
    // {
    //   name: "Eliza",
    //   email: "eliza@example.com"
    // }
    expect(user.name).to.equal("Eliza")
  })
```

## Write response data to a fixture file

```javascript
cy
  .request('https://jsonplaceholder.typicode.com/users')
  .then(function(response){
    cy.writeFile('cypress/fixtures/users.json', response.body)
  })
  // our fixture file is now generated and can be used
  .fixture('users')
  .then(function(users){
    expect(users[0].name).to.exist
  })
```

## Specify encoding

Specify the encoding with the third argument.

```javascript
// {projectRoot}/path/to/message.txt will be created with the contents "Hello World"
// the encoding will be "ascii"
cy.writeFile("path/to/ascii.txt", "Hello World", "ascii"))
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

# Command Log

## Write an array to a file

```javascript
cy.writeFile("info.log", ["foo", "bar", "baz"])
```

The command above will display in the command log as:

<img width="618" alt="screen shot of command log" src="https://cloud.githubusercontent.com/assets/1157043/17936162/df857dda-69eb-11e6-8951-f34618a72e39.png">

When clicking on the `writeFile` command within the command log, the console outputs the following:

<img width="452" alt="screen shot of console output" src="https://cloud.githubusercontent.com/assets/1157043/17936161/df7e6bf8-69eb-11e6-8ef2-a90113dece9b.png">

# Related

- [readFile](https://on.cypress.io/api/readFile)
- [Creating Fixtures](https://on.cypress.io/guides/creating-fixtures)
