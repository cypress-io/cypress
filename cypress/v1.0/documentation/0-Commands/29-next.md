slug: next

### [cy.next()](#usage)

Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.

***

### [cy.next( *selector* )](#selector-usage)

Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.

***

## Usage

#### Find the element next to `.second`

[block:code]
{
    "codes": [
        {
            "code": "<ul>\n  <li>apples</li>\n  <li class=\"second\">oranges</li>\n  <li>bananas</li>\n</ul>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "//returns <li>bananas</li>\ncy.get(\".second\").next()\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Selector Usage

#### Find the very next sibling of each li. Keep only the ones with a class `selected`.

[block:code]
{
    "codes": [
        {
            "code": "<ul>\n  <li>apples</li>\n  <li>oranges</li>\n  <li>bananas</li>\n  <li class=\"selected\">pineapples</li>\n</ul>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "//returns <li>pineapples</li>\ncy.get(\"li\").next(\".selected\")\n",
            "language": "js"
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
            "code": "cy.get(\".left-nav\").find(\"li.active\").next()\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="563" alt="screen shot 2015-11-29 at 12 42 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458857/afcfddf2-9696-11e5-9405-0cd994f70d45.png">

When clicking on `next` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 42 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458858/b30b0a0a-9696-11e5-99b9-d785b597287c.png">

***

## Related
1. [prev](prev)