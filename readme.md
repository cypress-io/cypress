## Getting Started

1. navigate into the installed `eclectus` directory
2. run `npm link` - this will reference the `bin/ecl` globally and you'll now have access to this command everywhere
3. run `gulp` to build the project files and to watch for any changes to JS/HTML/CSS
4. `cd` into your other projects root directory and run `ecl start` to start the eclectus server
5. navigate to `0.0.0.0:3000` in your browser

## Running Tests
1. run `gulp test` in your terminal
2. navigate to `0.0.0.0:3500` in your browser

## Nomenclature
| name | originates | example | description |
|------|------------|---------|-------------|
| runnable | mocha | test, suite, hook | Refers to an object that has "test like properties" |
| hook | mocha | before, beforeEach, after, afterEach | Comes from Mocha.  Refers to the executable code before and any your test runs. |
| runner | mocha |mocha.run() | Comes from Mocha. Is the object which is responsible for iterating through and running all of the tests |
| reporter | mocha | Eclectus / Mocha HTML Page | The object which visually indicates running tests, their statuses, duration, etc |
| entity | me | any model or collection | anything object that has an id or id like properties |
| command(s) | me | Ecl.find() Ecl.server() Ecl.mock() | A method called on the `Ecl` object which is organized and output for each individual test |

## Docs / API

[Visit the Wiki](https://github.com/brian-mann/eclectus/wiki)