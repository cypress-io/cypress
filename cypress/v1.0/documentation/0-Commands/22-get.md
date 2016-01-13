slug: get

### [cy.get( *selector* )](#selector-usage)
Matches one or more DOM elements based on the CSS-based selector.  The selector can be any valid jQuery selector.

`cy.get(...)` will **always** query from the current scope (default: document), and ignore previous commands.

If Cypress does not find any matching element(s), it will continue to retry until the [`commandTimeout`](options) has been reached.

***

### [cy.get( *alias* )](#alias-usage)
Alternatively, pass in an '@' character to find an [aliased](aliasing) element.

Internally Cypress keeps a cache of all aliased elements.  If the element currently exists in the DOM, it is immediately returned.  If the element no longer exists, Cypress will re-query the element based on the previous selector path to find it again.

***

## Selector Usage

> Find the element with an id of `main`

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"#main\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Find the first `li` descendent within `ul`

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"ul li:first\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Find the element with class `dropdown menu`, and click it. <br>
> Break out of previous command chain and query for `#search` from the root document.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .get(\".dropdown-menu\").click()\n  .get(\"#search\").type(\"mogwai\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Find the element `form`. <br>
> Scope all new queries to within `form`. <br>
> Find the element `input` within `form`. <br>
> Type `brian` into the `input`. <br>
> Find the element `textarea` within `form`. <br>
> Type `is so cool` into the `textarea`.

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"form\").within(function(){\n  cy\n    .get(\"input\").type(\"brian\")\n    .get(\"textarea\").type(\"is so cool\")\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Specify that an element should be visible

[block:code]
{
    "codes": [
        {
            "code": "// here we are specifying to only resolve the 'get'\n// when the matched element becomes visible\ncy.get(\"#search input\", {visible: true}).type(\"brian\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Specify that an element should not be visible

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"button\", {visible: false})\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Specify that an element should not exist

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"#footer\", {exist: false})\n",
            "language": "js"
        }
    ]
}
[/block]

> Specific that a collection of elements should have length of 5

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"ul>li\", {length: 5})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Alias Usage

> Retrieve existing `todos` elements

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"ul#todos li\").as(\"todos\")\n\n//...hack hack hack...\n\n//later retreive the todos\ncy.get(\"@todos\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Alias the `submitBtn` in a `beforeEach`

[block:code]
{
    "codes": [
        {
            "code": "beforeEach(function(){\n  cy.get(\"button[type=submit]\").as(\"submitBtn\")\n})\n\nit(\"disables on click\", function(){\n  cy.get(\"@submitBtn\").click().should(\"be.disabled\")\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

For a detailed explanation of aliasing, [read more about aliasing here](aliasing).

## Command Log

<img width="524" alt="screen shot 2015-11-27 at 1 24 20 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446808/5d2f2180-950a-11e5-8645-4f0f14321f86.png">

When clicking on the `get` command within the command log, the console outputs the following:

<img width="543" alt="screen shot 2015-11-27 at 1 24 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446809/61a6f4f4-950a-11e5-9b23-a9efa1fbccfc.png">

## Related

1. [contains](contains)
2. [within](within)
3. [find](find)
4. [root](root)