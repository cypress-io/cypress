slug: filter

### [cy.filter( *selector* )](#selector-usage)

Reduce the set of matched elements to those that match the selector.

***

## Selector Usage

> Filter the current subject to the element with class `active`.

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\".left-nav>.nav\").find(\">li\").filter(\".active\")\n",
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
            "code": "cy.get(\".left-nav>.nav\").find(\">li\").filter(\".active\")\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="522" alt="screen shot 2015-11-27 at 2 15 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447263/7176e824-9511-11e5-93cc-fa10b3b94482.png">

When clicking on the `filter` command within the command log, the console outputs the following:

<img width="503" alt="screen shot 2015-11-27 at 2 16 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447266/74b643a4-9511-11e5-8b42-6f6dfbdfb2a8.png">

## Related
1. [not](not)