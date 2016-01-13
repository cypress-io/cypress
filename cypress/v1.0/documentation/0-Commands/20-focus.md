slug: focus

### [cy.focus()](#usage)

Force focus on the current subject.

Returns the existing subject.

If there is currently an `activeElement` (a different element currently with focus), Cypress will automatically issue a `blur` event to that element first, as per the w3c spec.

***

## Usage

#### Focus on the current subject.

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"[name='comment']\").focus()\n",
            "language": "js"
        }
    ]
}
[/block]

#### Focus, type, and blur the current subject.

[block:code]
{
    "codes": [
        {
            "code": "// returns the <textarea> for further chaining\ncy.get(\"[name='comment']\").focus().type(\"Nice Product!\").blur()\n",
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
            "code": "cy.get(\"[name='comment']\").focus()\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 32 37 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446856/6c2c36f4-950b-11e5-89c6-9bf14a448b23.png">

When clicking on the `focus` command within the command log, the console outputs the following:

<img width="526" alt="screen shot 2015-11-27 at 1 33 00 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446857/703fa6c2-950b-11e5-9686-ce6b558cfd92.png">

***

## Related
1. [focused](focused)
2. [blur](blur)