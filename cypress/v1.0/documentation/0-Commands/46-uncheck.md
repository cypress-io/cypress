slug: uncheck

### [cy.uncheck()](#usage)

Unchecks a checkbox.

***

## Usage

#### Uncheck the checkbox

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\":checkbox\").uncheck()\n",
            "language": "js"
        }
    ]
}
[/block]

#### Uncheck element with id saveUserName

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"#saveUserName\").uncheck()\n",
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
            "code": "cy\n  .get(\"[data-js='choose-all']\").click()\n  .find(\"input[type='checkbox']\").first().uncheck()\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="584" alt="screen shot 2015-11-29 at 1 30 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459133/7bf25814-969d-11e5-9f03-9d2d4538fcd5.png">

When clicking on `uncheck` within the command log, the console outputs the following:

<img width="601" alt="screen shot 2015-11-29 at 1 31 04 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459134/7f29dea8-969d-11e5-9843-dfd07dfe888f.png">

***
## Related
1. [check](check)