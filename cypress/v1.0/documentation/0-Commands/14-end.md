slug: end

### [cy.end()](#usage)

Ends the Cypress command chain and returns `null`. This is equivalent to the jQuery `end()` method.

***

## Usage

[block:code]
{
    "codes": [
        {
            "code": "// cy.end is useful when you want to end a chain of commands\n// and force Cypress to re-query from the root element\ncy\n  .contains(\"User: Jennifer\").click().end() // ends the current chain and returns null\n\n  // queries the entire document again\n  .contains(\"User: Brian\").click()\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Related
1. [root](root)