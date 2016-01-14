excerpt: Set up environment variables
slug: environment-variables

## Environment Variables
- [Use Case](#use-case)
- [Setting Env Vars](#setting-env-vars)

Cypress gives you 4 flexible ways of setting environment variables.

When your tests are running, you can use the [`Cypress.env()`](env) function to access the values of your environment variables.

## Use Case

Environment variables should be used:
- Whenever values are different across developer machines
- Whenever values change frequently and are highly dynamic

The most common use case are accessing the custom values you've written in your `hosts` file.

For instance instead of hard coding this in your tests:

```javascript
cy
  // this would break on other dev machines
  .visit("http://server.dev.local")
```

We can move this into an environment variable.

```javascript
cy
  // now this is pointing to a dynamic
  // environment variable
  .visit(Cypress.env("host"))
```

## Setting Env Vars

There are 4 different ways to set environment variables. Each has a slightly different use case.

To summarize you can:
- set in `cypress.json`
- create a `cypress.env.json`
- export as `CYPRESS_*`
- pass in the CLI as `--env`

Don't feel obligated to pick just one method. It is common to use one strategy for local development but another when running in CI.

***

### Option #1: Set in `cypress.json`

Any key/value you set in your `cypress.json` under the `env` key will become an environment variable.

```javascript
// cypress.json
{
  "viewporthWidth": 800,
  "viewportHeight": 600,
  "env": {
    "foo": "bar",
    "some": "value"
  }
}
```

```javascript
// in your test files

Cypress.env()       // => {foo: "bar", some: "value"}
Cypress.env("foo")  // => "bar"
Cypress.env("some") // => "value"
```

**Benefits**
- Great for values which need to be checked into source control and remain the same on all machines

**Downsides**
- Only works for values which should be the same on across all machines

***

### Option #2: Create a `cypress.env.json`

You can create your own `cypress.env.json`, which Cypress will automatically check for. Values in here will overwrite conflicting values in `cypress.json`.

This strategy is useful because if you add `cypress.env.json` to your `.gitignore` file, the values in here can be different for each developer machine.

```javascript
// cypress.env.json

{
  "host": "brian.dev.local",
  "api_server": "http://localhost:8888/api/v1/"
}
```

```javascript
// in your test files

Cypress.env()             // => {host: "brian.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("host")       // => "brian.dev.local"
Cypress.env("api_server") // => "http://localhost:8888/api/v1/"
```

**Benefits**
- Dedicated file just for environment variables
- Enables you to generate this file from other build processes
- If its not checked into source control these values can be different on each machine

**Downsides**
- Another file you have to deal with
- Overkill for 1 or 2 environment variables

***

### Option #3: Export as `CYPRESS_*`

Any environment variable on your machine which starts with either `CYPRESS_` or `cypress_` will automatically be added and made available to you.

Conflicting values from this method will override `cypress.json` and `cypress.env.json` files.

Cypress will automatically **strip off** the `CYPRESS_` part when adding your environment variables.

```bash
## export cypress env variables from the command line
export CYPRESS_HOST=brian.dev.local
export cypress_api_server=http://localhost:8888/api/v1/
```

```javascript
// in your test files

Cypress.env()             // => {HOST: "brian.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("HOST")       // => "brian.dev.local"
Cypress.env("api_server") // => "http://localhost:8888/api/v1/"
```

**Benefits**
- Quickly export some values
- Can be stored in your `bash_profile`
- Allows for dynamic values between different machines
- Especially useful for CI environments

**Downsides**
- Not as obvious where values come from vs the other methods

***

### Option #4: Pass in from the CLI as `--env`

Lastly you can also pass in environment variables as options when [using the CLI tool](https://github.com/cypress-io/cypress-cli).

Values here will overwrite all other conflicting environment variables.

You can use the `--env` option on `cypress run` or `cypress ci`.

> **Note:** Multiple values must be separated by a comma. NOT A SPACE.

```bash
cypress run --env host=brian.dev.local,api_server=http://localhost:8888/api/v1
```

```javascript
// in your test files

Cypress.env()             // => {host: "brian.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("host")       // => "brian.dev.local"
Cypress.env("api_server") // => "http://localhost:8888/api/v1/"
```

**Benefits**
- Does not require any changes to files / config
- Obvious where environment variables come from
- Allows for dynamic values between different machines
- Overwrites all other forms of setting env variables

**Downsides**
- Pain to always write the `--env` options everywhere you use Cypress


