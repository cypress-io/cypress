slug: url

### [cy.url()](#usage)

Returns the current URL as a string.

***

## Usage

#### Assert the URL is `http://localhost:8000/users/1/edit`

[block:code]
{
    "codes": [
        {
            "code": "// clicking the anchor causes the browser to follow the link\ncy\n  .get(\"#user-edit a\").click()\n  .url().should(\"eq\", \"http://localhost:8000/users/1/edit\") // => true\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### URL is a shortcut for `cy.location().href`

`cy.url()` uses `href` under the hood.

[block:code]
{
    "codes": [
        {
            "code": "// these return the same string\ncy.url()\ncy.location().its(\"href\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

#### Why is this command called `url` instead of `href`?

Given this remote URL:

`http://localhost:8000/index.html`

All 3 of these assertions are the same.

[block:code]
{
    "codes": [
        {
            "code": "cy.location().its(\"href\").should(\"eq\", \"http://localhost:8000/index.html\")\n\ncy.location().invoke(\"toString\").should(\"eq\", \"http://localhost:8000/index.html\")\n\ncy.url().should(\"eq\", \"http://localhost:8000/index.html\")\n",
            "language": "js"
        }
    ]
}
[/block]

`href` and `toString` come from the `window.location` spec.

But you may be wondering where the `url` property comes from.  Per the `window.location` spec, there actually isn't a `url` property on the `location` object.

`cy.url()` exists because its what most developers naturally assume would return them the full current URL.  We almost never refer to the URL as an `href`.

***

## Command Log

[block:code]
{
    "codes": [
        {
            "code": "cy.url().should(\"contain\", \"#users/new\")\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="583" alt="screen shot 2015-11-29 at 1 42 40 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459196/20645888-969f-11e5-973a-6a4a98339b15.png">

When clicking on `url` within the command log, the console outputs the following:

<img width="440" alt="screen shot 2015-11-29 at 1 42 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459197/229e2552-969f-11e5-80a9-eeaf3221a178.png">

***
## Related
1. [hash](hash)
2. [location](location)