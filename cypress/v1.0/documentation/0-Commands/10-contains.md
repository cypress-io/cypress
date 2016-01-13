slug: contains

### [cy.contains( *text* )](#text-usage)

Returns the deepest element containing the text.  Elements can contain *more* than the desired text and still match.

Additionally, Cypress will prefer these elements (in this order) `input[type='submit']`, `button`, `a`, `label` over the deepest element found.

If Cypress does not find a matching element, it will continue to retry until the [`commandTimeout`](options) has been reached.

***

### [cy.contains( *text*, *options* )](#text-options)

Pass in an options object to specify the conditions of the element.

***

### [cy.contains( *selector*, *text* )](#selector-and-text-usage)

Specify a selector to filter elements containing the text.  Cypress will **ignore** it's default preference of `input[type='submit']`, `button`, `a`, `label` for the specified selector.

Using a selector allows you to return more *shallow* elements in the tree which contain the specific text.

***

## Text Usage

> Find the deepest element containing the text `apples`

[block:code]
{
    "codes": [
        {
            "code": "<ul>\n  <li>apples</li>\n  <li>oranges</li>\n  <li>bananas</li>\n</ul>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// returns <li>apples</li>\ncy.contains(\"apples\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Find the input[type='submit'] by value <br>

[block:code]
{
    "codes": [
        {
            "code": "<div id=\"main\">\n  <form>\n    <div>\n      <label>name</label>\n      <input name=\"name\" />\n    </div>\n    <div>\n      <label>age</label>\n      <input name=\"age\" />\n    </div>\n    <input type=\"submit\" value=\"submit the form!\" />\n  </form>\n</div>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// get the form element\n// search inside its descendants for the content 'submit the form!'\n// find the input[type='submit'] element\n// click it\ncy.get(\"form\").contains(\"submit the form!\").click()\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Cypress will favor `button` of any type

[block:code]
{
    "codes": [
        {
            "code": "<form>\n  <input name=\"search\" />\n  <button>\n    <i class=\"fa fa-search\"></i>\n    <span>Search</span>\n  </button>\n</form>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// let's make sure the <i> has the class: \"fa-search\"\n\n// even though the <span> is the deepest element which contains: \"Search\"\n// Cypress will automatically favor button elements higher in the chain\n\n// in this case the <button> is returned which is why we can now drill\n// into its children\ncy.contains(\"Search\").children(\"i\").should(\"have.class\", \"fa-search\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Cypress will favor `a`

[block:code]
{
    "codes": [
        {
            "code": "<nav>\n  <a href=\"/dashboard\">\n    <i class=\"fa fa-dashboard\"></i>\n    <span>Dashboard</span>\n  </a>\n  <a href=\"/users\">\n    <i class=\"fa fa-users\"></i>\n    <span>Users</span>\n  </a>\n  <a href=\"/signout\">\n    <i class=\"fa fa-sign-out\"></i>\n    <span>Sign Out</span>\n  </a>\n</nav>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// even though the <span> is the deepest element which contains: \"Sign Out\"\n// Cypress will automatically favor anchor elements higher in the chain\n\n// in this case we can assert on the anchors properties\ncy.get(\"nav\").contains(\"Sign Out\").should(\"have.attr\", \"href\", \"/signout\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Cypress will favor `label`

[block:code]
{
    "codes": [
        {
            "code": "<form>\n  <label>\n    <span>Name:</span>\n    <span>\n      <input name=\"name\" />\n    </span>\n  </label>\n  <label>\n    <span>Age:</span>\n    <span>\n      <input name=\"age\" />\n    </span>\n  </label>\n  <button type=\"submit\">Submit</button>\n</form>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// even though the <span> is the deepest element which contains: \"Age\"\n// Cypress will automatically favor label elements higher in the chain\n\n// additionally we can omit the colon as long as the element\n// at least contains the text 'Age'\n\n//in this case we can easily target the input\n//because the label is returned\ncy.contains(\"Age\").find(\"input\").type(\"29\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Only the first matched element will be returned

[block:code]
{
    "codes": [
        {
            "code": "<ul id=\"header\">\n  <li>Welcome, Jane Lane</li>\n</ul>\n<div id=\"main\">\n  <span>These users have 10 connections with Jane Lane</span>\n  <ul>\n    <li>User 1</li>\n    <li>User 2</li>\n    <li>User 3</li>\n  </ul>\n</div>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// this will return the <li> in the #header since that is the first\n// element which contains the text \"Jane Lane\"\ncy.contains(\"Jane Lane\")\n\n// if you want to select the <span> inside of #main instead\n// you need to scope the contains first\n\n//now the <span> is returned\ncy.get(\"#main\").contains(\"Jane Lane\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Selector and Text Usage

> Specify a selector to return a specific element

[block:code]
{
    "codes": [
        {
            "code": "<html>\n  <body>\n    <ul>\n      <li>apples</li>\n      <li>oranges</li>\n      <li>bananas</li>\n    </ul>\n  </body>\n</html>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// technically the <html>, <body>, <ul>, and first <li> all contain \"apples\"\n\n// normally Cypress would return the first <li> since that is the deepest\n// element which contains: \"apples\"\n\n// to override this behavior, pass a 'ul' selector\n// this returns the ul element since it also contains the text\n\n// returns <ul>...</ul>\ncy.contains(\"ul\", \"apples\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

`cy.contains` is a dual command.  This means it can act as both a `parent` and a `child` command.  Read more about [`commands`](commands) if this is unfamiliar.

Because it is a dual command it can either **begin** a chain of commands or work off of an **existing** subject.

Read more about [`chaining`](chaining) here.

***

> Start a chain of commands

[block:code]
{
    "codes": [
        {
            "code": "// search from the root scope (default: document)\ncy.contains(\"some content\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Find content within an existing scope

[block:code]
{
    "codes": [
        {
            "code": "// search within an existing subject for the content\n// contains is now scoped to the <aside> element and will\n// only search its DOM descendants for the content\ncy.get(\"#main\").find(\"aside\").contains(\"Add a user\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Be wary of chaining multiple contains <br>

[block:code]
{
    "codes": [
        {
            "code": "// let's imagine a scenario where you click a user's delete button\n// and a dialog appears asking you to confirm this deletion.\n\n// the following will not work:\ncy\n  .contains(\"Delete User\").click()\n\n  // because this is chained off of the existing button subject\n  // Cypress will look inside of the existing button subject\n  // for the new content\n\n  // in other words Cypress will look inside of the element\n  // containing \"Delete User\" for the content: \"Yes I'm sure!\"\n  .contains(\"Yes, I'm sure!\").click()\n\n",
            "language": "js"
        }
    ]
}
[/block]

***

> End previous chains to get back to the root scope <br>

[block:code]
{
    "codes": [
        {
            "code": "cy\n  // explicitly .end() the previous chain\n  .contains(\"Delete User\").click().end()\n\n  // Cypress will now search the root scope\n  // for this content (default: document)\n  .contains(\"Yes, I'm sure!\").click()\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// alternatively just call cy again which\n// automatically creates a new chain from the root scope\ncy.contains(\"Delete User\").click()\ncy.contains(\"Yes I'm sure!\").click()\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// you can also do this\ncy\n  .contains(\"Delete User\").click()\n\n  // by using the parent command .get() we automatically\n  // abort previous chains and change the scope to #dialog\n  // which contains the content we're looking for\n  .get(\"#dialog\").contains(\"Yes I'm sure!\").click()\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Command Log

<img width="536" alt="screen shot 2015-11-27 at 1 43 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446973/009ac32c-950d-11e5-9eaa-09f8b8ddf086.png">

When clicking on the `contains` command within the command log, the console outputs the following:

<img width="477" alt="screen shot 2015-11-27 at 1 43 50 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446977/04b31be4-950d-11e5-811e-4fd83d364d00.png">
***

## Related
1. [get](get)
2. [within](within)
3. [root](root)