slug: select

### [cy.select( *text* )](#text-usage)

Selects an option within a `<select>` element based on the text content within the option.

***

### [cy.select( *value* )](#value-usage)

Selects an option within a `<select>` element based on the value of the option.

***

### [cy.select( *text*, *options* )](#options-usage)
### [cy.select( *value*, *options* )](#options-usage)

Select supports these options:

Option | Default | Notes
--- | --- | ---
force | false | Forces select, disables error checking prior to select
timeout | 4000 | Total time to retry the select
interval | 50 | Interval which to retry a select

***

## Text Usage

#### Select the option with the text `apples`

[block:code]
{
    "codes": [
        {
            "code": "<select>\n  <option value=\"456\">apples</option>\n  <option value=\"457\">oranges</option>\n  <option value=\"458\">bananas</option>\n</select>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"select\").select(\"apples\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Value Usage

#### Select the option with the value "456"

[block:code]
{
    "codes": [
        {
            "code": "<select>\n  <option value=\"456\">apples</option>\n  <option value=\"457\">oranges</option>\n  <option value=\"458\">bananas</option>\n</select>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"select\").select(\"456\")\n",
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
            "code": "cy.get(\"select\").select(\"Homer Simpson\")\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="575" alt="screen shot 2015-11-29 at 1 17 27 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459044/a2fd8fca-969b-11e5-8d23-3a118b82b5de.png">

When clicking on `select` within the command log, the console outputs the following:

<img width="560" alt="screen shot 2015-11-29 at 1 17 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459045/a6b3bde2-969b-11e5-9357-272ea9684987.png">

***

## Related
1. [click](click)