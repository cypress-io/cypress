excerpt: Alias reusable objects for later
slug: as

#### **New to Cypress?** [Read about Aliasing first.](aliasing)

***

### [cy.as( *text* )](#usage)

Create an alias to be used later.

***

## Usage

#### Alias a route, then later wait for that route using `@alias`

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .route(\"PUT\", /^\\/users\\/\\d+/, \"fixture:user\").as(\"userPut\")\n  .get(\"form\").submit()\n  .wait(\"@userPut\")\n    .its(\"url\").should(\"contain\", \"users\")\n\n",
            "language": "javascript"
        }
    ]
}
[/block]

***

## Command Log

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .route(/company/, \"fixture:company\").as(\"companyGet\")\n  .route(/roles/, \"fixture:roles\").as(\"rolesGet\")\n  .route(/teams/, \"fixture:teams\").as(\"teamsGet\")\n  .route(/users\\/\\d+/, \"fixture:user\").as(\"userGet\")\n  .route(\"PUT\", /^\\/users\\/\\d+/, \"fixture:user\").as(\"userPut\")\n",
            "language": "javascript"
        }
    ]
}
[/block]

Aliases of routes display in the routes instrument panel:

<img width="567" alt="screen shot 2015-11-29 at 2 25 47 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459470/22e31e54-96a5-11e5-8895-a6ff5f8bb973.png">

***

## Related
1. [wait](wait)
2. [get](get)