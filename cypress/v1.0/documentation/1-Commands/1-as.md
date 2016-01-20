slug: as
excerpt: Alias reusable objects for later

# [cy.as( *text* )](#usage)

Create an alias to be used later.

[block:callout]
{
  "type": "info",
  "body": "[Read about using aliases first.](http://on.cypress.io/guides/using-aliases)",
  "title": "New to Cypess?"
}
[/block]
***

# Usage

Alias a route, then later wait for that route using `@alias`

```javascript
cy
  .route("PUT", /^\/users\/\d+/, "fixture:user").as("userPut")
  .get("form").submit()
  .wait("@userPut")
    .its("url").should("contain", "users")

```
***

# Command Log

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

1. [get](http://on.cypress.io/api/get)
2. [wait](http://on.cypress.io/api/wait)
3. [Using Aliases](http://on.cypress.io/guides/using-aliases)