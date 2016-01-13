slug: its

`cy.its` calls properties on the current subject.

`cy.its` is identical to [`cy.invoke`](invoke), which reads better when invoking function properties.

### [cy.its( *propertyName* )](#usage)

Calls a property on the current subject and returns that new value.

[block:code]
{
    "codes": [
        {
            "code": "cy.wrap({foo: \"bar\"}).its(\"foo\").should(\"eq\", \"bar\") // true\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Usage

#### Call the `length` property on the current subject

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .get(\"ul li\") // this returns us the jquery object\n  .its(\"length\") // calls the 'length' property returning that value\n  .should(\"be.gt\", 2) // ensure this length is greater than 2\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Related
1. [invoke](invoke)
2. [wrap](wrap)
3. [then](then)