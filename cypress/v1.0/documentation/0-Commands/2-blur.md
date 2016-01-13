slug: blur

### [cy.blur()](#usage)

Force blur of the current subject.

Returns the existing subject.

***

### [cy.blur( *options* )](#options-usage)

Blur supports these options:

Option | Default | Notes
--- | --- | ---
force | false | Forces blur, disables error checking prior to blur

***

## Usage

#### Blur the comment input.

[block:code]
{
    "codes": [
        {
            "code": "// returns the same <textarea> for further chaining\ncy.get(\"[name='comment']\").type(\"Nice Product!\").blur()\n",
            "language": "js"
        }
    ]
}
[/block]

## Options Usage

#### Blur the first input ignoring whether the input is currently focused.

[block:code]
{
    "codes": [
        {
            "code": "// returns the same <input> for further chaining\ncy.get(\"input:first\").blur({force: true})\n",
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
            "code": "cy.get(\"[name='comment']\").type(\"Nice Product!\").blur()\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 37 36 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446921/58a14e34-950c-11e5-85ba-633b7ed5d7f1.png">

When clicking on the `blur` command within the command log, the console outputs the following:

<img width="525" alt="screen shot 2015-11-27 at 1 37 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446923/5c44a2ca-950c-11e5-8080-0dc108bc4959.png">

***

## Related
1. [focused](focused)
2. [focus](focus)