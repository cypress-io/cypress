slug: as
excerpt: Alias a route or DOM element for use later.

[block:callout]
{
  "type": "info",
  "body": "[Read about using aliases first.](https://on.cypress.io/guides/using-aliases)",
  "title": "New to Cypess?"
}
[/block]

Assign an alias to a route or DOM element for use later. Reference the alias later within the [`cy.get`](https://on.cypress.io/api/get) or [`cy.wait`](https://on.cypress.io/api/wait) command with the prefix `@`.

| | |
|--- | --- |
| **Returns** | the DOM element or route being aliased  |
| **Timeout** | the alias will retry the chain of commands before the alias assignment for the duration of the [Command Timeout](https://on.cypress.io/guides/configuration#section-global-options) |

***

# [cy.as( *text* )](#section-usage)

Create an alias to be used later, passing the name of the alias as a parameter.

***

# Usage

## Alias a route, then wait for that route using `@alias`

```javascript
cy
  .route("PUT", /^\/users\/\d+/, "fixture:user").as("userPut")
  .get("form").submit()
  .wait("@userPut")
    .its("url").should("contain", "users")

```

***

# Command Log

## Alias several routes

```javascript
cy
  .route(/company/, "fixture:company").as("companyGet")
  .route(/roles/, "fixture:roles").as("rolesGet")
  .route(/teams/, "fixture:teams").as("teamsGet")
  .route(/users\/\d+/, "fixture:user").as("userGet")
  .route("PUT", /^\/users\/\d+/, "fixture:user").as("userPut")
```

Aliases of routes display in the routes instrument panel:

<img width="567" alt="screen shot 2015-11-29 at 2 25 47 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459470/22e31e54-96a5-11e5-8895-a6ff5f8bb973.png">

***

# Related

- [get](https://on.cypress.io/api/get)
- [wait](https://on.cypress.io/api/wait)
- [Using Aliases](https://on.cypress.io/guides/using-aliases)