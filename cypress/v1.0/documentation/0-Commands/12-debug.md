slug: debug

`cy.debug` will call `debugger` in JavaScript. 

Make sure you have your Chrome Dev Tools open for this to hit the breakpoint.

### [cy.debug()](#usage)

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"button[type='submit']\").debug()\n",
            "language": "js"
        }
    ]
}
[/block]
***

## Usage

[block:code]
{
    "codes": [
        {
            "code": "// Cypress will log out the current subject and other \n// useful debugging information to your console\ncy.get(\"a\").debug().should(\"have.attr\", \"href\").and(\"match\", /dashboard/)\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Related
1. [pause](pause)