slug: location

### [cy.location()](#usage)

Returns an object literal which matches the `window.location` spec.

Given a remote URL of:

```
http://localhost:8000/app/index.html?q=brian#/users/123/edit
```

An object would be returned with the following properties:

Key | Type | Returns
--- | --- | ----
hash | string | #/users/123/edit
host | string | localhost:8000
hostname | string | localhost
href | string | http://localhost:8000/app/index.html?q=brian#/users/123/edit
origin | string | http://localhost:8000
pathname | string | /app.index.html
port | string | 8000
protocol | string | http:
search | string | ?q=brian
toString | function | http://localhost:8000/app/index.html?q=brian#/users/123/edit

***

## Usage

#### Test that a redirect works

[block:code]
{
    "codes": [
        {
            "code": "// we should be redirected to the login page\ncy\n  .visit(\"http://localhost:3000/admin\")\n  .location().its(\"pathname\").should(\"eq\", \"/login\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Test searching for a user

[block:code]
{
    "codes": [
        {
            "code": "// we can yield the location subject and work with\n// it directly as an object\ncy\n  .get(\"#search\").type(\"brian{enter}\")\n  .location().then(function(location){\n    expect(location.search).to.eq(\"?search=brian\")\n    expect(location.pathname).to.eq(\"/users\")\n    expect(location.toString()).to.eq(\"http://localhost:8000/users?search=brian\")\n  })\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

#### Do not use `window.location`

Let's examine the following scenario:

[block:code]
{
    "codes": [
        {
            "code": "// get our remote window and log out\n// the window.location object\ncy.window().then(function(window){\n  console.log(window.location)\n})\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// go through the location command\n// and log out this object\ncy.location().then(function(location){\n  console.log(location)\n})\n",
            "language": "js"
        }
    ]
}
[/block]

Cypress automatically normalizes the `cy.location()` command and strips out extrenuous values and properties found in `window.location`.

Also the object literal returned by `cy.location()` is just a basic object literal, not the special `window.location` object.

When changing properties on the real `window.location` object, it will force the browser to navigate away.

In Cypress, the object we returned is a plain object, and changing or affecting its properties will have no effect on navigation.

***

## Command Log

[block:code]
{
    "codes": [
        {
            "code": "cy.location().its(\"href\").should(\"contain\", \"#users/new\")\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="581" alt="screen shot 2015-11-29 at 1 39 13 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459185/b2bca74a-969e-11e5-85b5-3d154efd57a7.png">

When clicking on `location` within the command log, the console outputs the following:

<img width="818" alt="screen shot 2015-11-29 at 1 39 30 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459186/b6766bc8-969e-11e5-85b4-d9a1c67e6ef2.png">

***

## Related

1. [hash](hash)
2. [url](url)