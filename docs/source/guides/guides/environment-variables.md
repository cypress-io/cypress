---
title: Environment Variables
comments: false
---

Environment variables are useful when:

- Values are different across developer machines.
- Values change frequently and are highly dynamic.

The most common use case is to access custom values you've written in your `hosts` file.

***Instead of hard coding this in your tests:***

```javascript
cy.visit('http://server.dev.local') // this will break on other dev machines
```

***We can move this into an environment variable.***

```javascript
cy.visit(Cypress.env("host")) // points to a dynamic env var
```

# Setting Environment Variables

There are 4 different ways to set environment variables. Each has a slightly different use case.

***To summarize you can:***

- Set in `cypress.json`
- Create a `cypress.env.json`
- Export as `CYPRESS_*`
- Pass in the CLI as `--env`

Don't feel obligated to pick just one method. It is common to use one strategy for local development but another when running in {% url 'CI' continuous-integration %}.

When your tests are running, you can use the {% url `Cypress.env` env %} function to access the values of your environment variables.

## Option #1: `cypress.json`

Any key/value you set in your {% url 'configuration' configuration %} under the `env` key will become an environment variable.

```javascript
// cypress.json

{
  "projectId": "128076ed-9868-4e98-9cef-98dd8b705d75",
  "env": {
    "foo": "bar",
    "some": "value"
  }
}
```

***Test file***

```javascript
Cypress.env()       // {foo: "bar", some: "value"}
Cypress.env("foo")  // "bar"
Cypress.env("some") // "value"
```

***Overview***

{% note success Benefits %}
- Great for values that need to be checked into source control and remain the same on all machines.
{% endnote %}

{% note danger Downsides %}
- Only works for values that should be the same on across all machines.
{% endnote %}

## Option #2: `cypress.env.json`

You can create your own `cypress.env.json` file that Cypress will automatically check. Values in here will overwrite conflicting values in `cypress.json`.

This strategy is useful because if you add `cypress.env.json` to your `.gitignore` file, the values in here can be different for each developer machine.

```javascript
// cypress.env.json

{
  "host": "veronica.dev.local",
  "api_server": "http://localhost:8888/api/v1/"
}
```

***Test file***

```javascript
Cypress.env()             // {host: "veronica.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("host")       // "veronica.dev.local"
Cypress.env("api_server") // "http://localhost:8888/api/v1/"
```

***Overview***

{% note success Benefits %}
- Dedicated file just for environment variables.
- Enables you to generate this file from other build processes.
- Values can be different on each machine (if not checked into source control).
{% endnote %}

{% note danger Downsides %}
- Another file you have to deal with.
- Overkill for 1 or 2 environment variables.
{% endnote %}

## Option #3: `CYPRESS_*`

Any environment variable on your machine that starts with either `CYPRESS_` or `cypress_` will automatically be added and made available to you.

Conflicting values will override values from `cypress.json` and `cypress.env.json` files.

Cypress will *strips off* the `CYPRESS_` when adding your environment variables.

***Export cypress env variables from the command line***

```shell
export CYPRESS_HOST=laura.dev.local
export cypress_api_server=http://localhost:8888/api/v1/
```

***Test file***

```javascript
Cypress.env()             // {HOST: "laura.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("HOST")       // "laura.dev.local"
Cypress.env("api_server") // "http://localhost:8888/api/v1/"
```

***Overview***

{% note success Benefits %}
- Quickly export some values.
- Can be stored in your `bash_profile`.
- Allows for dynamic values between different machines.
- Especially useful for CI environments.
{% endnote %}

{% note danger Downsides %}
- Not as obvious where values come from versus the other options.
{% endnote %}

## Option #4: `--env`

Lastly you can pass in environment variables as options when {% url 'using the CLI tool' command-line#cypress-run %}.

Values here will overwrite all other conflicting environment variables.

You can use the `--env` argument for {% url '`cypress run`' command-line#cypress-run %}.

{% note warning  %}
Multiple values must be separated by a comma, not a space.
{% endnote %}

***From the command line or CI***

```shell
cypress run --env host=kevin.dev.local,api_server=http://localhost:8888/api/v1
```

***Test file***

```javascript
Cypress.env()             // {host: "kevin.dev.local", api_server: "http://localhost:8888/api/v1"}
Cypress.env("host")       // "kevin.dev.local"
Cypress.env("api_server") // "http://localhost:8888/api/v1/"
```

***Overview***

{% note success Benefits %}
- Does not require any changes to files or configuration.
- Obvious where environment variables come from.
- Allows for dynamic values between different machines.
- Overwrites all other forms of setting env variables.
{% endnote %}

{% note danger Downsides %}
- Pain to write the `--env` options everywhere you use Cypress.
{% endnote %}

# Overriding Configuration

If your environment variables match a standard configuration key, then instead of setting an `environment variable` they will instead override the configuration value.

***Change the `baseUrl` configuration value / not set env var in `Cypress.env()`***

```shell
export CYPRESS_BASE_URL=http://localhost:8080
```

***'foo' does not match config / sets env var in `Cypress.env()`***

```shell
export CYPRESS_FOO=bar
```

You can {% url 'read more about how environment variables can change configuration here' configuration %}.
