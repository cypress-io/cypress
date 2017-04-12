slug: environment-variables
excerpt: Set up environment variables

# Contents

- :fa-angle-right: [Use Case](#use-case)
- :fa-angle-right: [Setting Environment Variables](#setting-environment-variables)
  - [Option #1: Set in `cypress.json`](#option-1-set-in-cypress-json-)
  - [Option #2: Create a `cypress.env.json`](#option-2-create-a-cypress-env-json-)
  - [Option #3: Export as `CYPRESS_*`](#option-3-export-as-cypress_-)
  - [Option #4: Pass in from the CLI as `--env`](#option-4-pass-in-from-the-cli-as-env-)
- :fa-angle-right: [Overriding Configuration](#overriding-configuration)

***

# Use Case

Environment variables should be used:
- Whenever values are different across developer machines
- Whenever values change frequently and are highly dynamic

The most common use case is to access custom values you've written in your `hosts` file.

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

***

# Setting Environment Variables

There are 4 different ways to set environment variables. Each has a slightly different use case.

**To summarize you can:**

- set in `cypress.json`
- create a `cypress.env.json`
- export as `CYPRESS_*`
- pass in the CLI as `--env`

Don't feel obligated to pick just one method. It is common to use one strategy for local development but another when running in CI.

When your tests are running, you can use the [`Cypress.env()`](https://on.cypress.io/api/env) function to access the values of your environment variables.

***

## Option #1: Set in `cypress.json`

Any key/value you set in your [`cypress.json`](https://on.cypress.io/guides/configuration) under the `env` key will become an environment variable.

```json
// cypress.json
{
  "projectId": "128076ed-9868-4e98-9cef-98dd8b705d75",
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

[block:callout]
{
  "type": "success",
  "body": "- Great for values that need to be checked into source control and remain the same on all machines",
  "title": "Benefits"
}
[/block]

[block:callout]
{
  "type": "danger",
  "body": "- Only works for values which should be the same on across all machines",
  "title": "Downsides"
}
[/block]

***

## Option #2: Create a `cypress.env.json`

You can create your own `cypress.env.json`, which Cypress will automatically check. Values in here will overwrite conflicting values in `cypress.json`.

This strategy is useful because if you add `cypress.env.json` to your `.gitignore` file, the values in here can be different for each developer machine.

```json
// cypress.env.json

{
  "host": "veronica.dev.local",
  "api_server": "http://localhost:8888/api/v1/"
}
```

```javascript
// in your test files

Cypress.env()             // => {host: "veronica.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("host")       // => "veronica.dev.local"
Cypress.env("api_server") // => "http://localhost:8888/api/v1/"
```

[block:callout]
{
  "type": "success",
  "body": "- Dedicated file just for environment variables\n- Enables you to generate this file from other build processes\n- Values can be different on each machine if not checked into source control",
  "title": "Benefits"
}
[/block]

[block:callout]
{
  "type": "danger",
  "body": "- Another file you have to deal with\n- Overkill for 1 or 2 environment variables",
  "title": "Downsides"
}
[/block]

***

## Option #3: Export as `CYPRESS_*`

Any environment variable on your machine that starts with either `CYPRESS_` or `cypress_` will automatically be added and made available to you.

Conflicting values from this method will override `cypress.json` and `cypress.env.json` files.

Cypress will automatically **strip off** the `CYPRESS_` when adding your environment variables.

```shell
# export cypress env variables from the command line
export CYPRESS_HOST=laura.dev.local
export cypress_api_server=http://localhost:8888/api/v1/
```

```javascript
// in your test files

Cypress.env()             // => {HOST: "laura.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("HOST")       // => "laura.dev.local"
Cypress.env("api_server") // => "http://localhost:8888/api/v1/"
```


[block:callout]
{
  "type": "success",
  "body": "- Quickly export some values\n- Can be stored in your `bash_profile`\n- Allows for dynamic values between different machines\n- Especially useful for CI environments",
  "title": "Benefits"
}
[/block]

[block:callout]
{
  "type": "danger",
  "body": "- Not as obvious where values come from vs the other methods",
  "title": "Downsides"
}
[/block]

***

## Option #4: Pass in from the CLI as `--env`

Lastly you can also pass in environment variables as options when [using the CLI tool](https://github.com/cypress-io/cypress-cli).

Values here will overwrite all other conflicting environment variables.

You can use the `--env` option on `cypress run`.

[block:callout]
{
  "type": "info",
  "body": "Multiple values must be separated by a comma. NOT A SPACE."
}
[/block]

```yaml
cypress run --env host=kevin.dev.local,api_server=http://localhost:8888/api/v1
```

```javascript
// in your test files

Cypress.env()             // => {host: "kevin.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("host")       // => "kevin.dev.local"
Cypress.env("api_server") // => "http://localhost:8888/api/v1/"
```

[block:callout]
{
  "type": "success",
  "body": "- Does not require any changes to files / config\n- Obvious where environment variables come from\n- Allows for dynamic values between different machines\n- Overwrites all other forms of setting env variables",
  "title": "Benefits"
}
[/block]

[block:callout]
{
  "type": "danger",
  "body": "- Pain to write the `--env` options everywhere you use Cypress",
  "title": "Downsides"
}
[/block]

***

# Overriding Configuration

If your environment variables match a standard configuration key then instead of setting an `environment variable` they will instead override the configuration value.

```shell
## this changes the baseUrl configuration value
## and will not set an environment variable in Cypress.env()
export CYPRESS_BASE_URL=http://localhost:8080

## the key 'foo' does not match a configuration key so
## this just sets a regular environment variable in Cypress.env()
export CYPRESS_FOO=bar
```

You can [read more about how environment variables can change configuration here](https://on.cypress.io/configuration).
