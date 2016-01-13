slug: pause

### [cy.pause()](#usage)

`cy.pause` will stop command execution and allow you the ability to interact with your app, resume commands when you're ready, or step into the next command.

***

## Usage

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .get(\"a\").should(\"have.attr\", \"href\").and(\"match\", /dashboard/)\n  .pause()\n  .get(\"button\").should(\"not.be.disabled\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Related
1. [debug](debug)