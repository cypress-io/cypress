slug: invoke

`cy.invoke` invokes properties which are functions on the current subject.

This works the same way as underscore's `invoke` function.

`cy.invoke` is identical to [`cy.its`](its). `cy.its` reads better when calling regular properties which are not functions.

### [cy.invoke( *functionName* )](#function-usage)

Invokes the function on the subject and returns that new value.

[block:code]
{
    "codes": [
        {
            "code": "var fn = function(){\n  return \"bar\"\n}\n\ncy.wrap({foo: fn}).invoke(\"foo\").should(\"eq\", \"bar\") // true\n",
            "language": "js"
        }
    ]
}
[/block]

***

### [cy.invoke( *functionName*, \**arguments* )](#function-with-arguments-usage)

Invokes the function and forwards any additional arguments to the function call. There are no limits to the number of arguments.

[block:code]
{
    "codes": [
        {
            "code": "var fn = function(a, b, c){\n  return a + b + c\n}\n\ncy\n  .wrap({sum: fn})\n  .invoke(\"sum\", 2, 4, 6)\n    .should(\"be.gt\", 10) // true\n    .and(\"be.lt\", 20) // true\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Function Usage

#### Properties which are functions are invoked

[block:code]
{
    "codes": [
        {
            "code": "// force a hidden div to be 'display: block'\n// so we can interact with its children elements\ncy\n  .get(\"div.container\").should(\"be.hidden\") // true\n  .invoke(\"show\") // call the jquery method 'show' on the 'div.container'\n    .should(\"be.visible\") // true\n    .find(\"input\").type(\"cypress is great\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Useful for 3rd party plugins

[block:code]
{
    "codes": [
        {
            "code": "// as a slightly verbose approach\ncy.get(\"input\").invoke(\"getKendoDropDownList\").then(function(dropDownList){\n  // the return of $input.getKendoDropDownList() has now become the new subject\n\n  // whatever the select method returns becomes the next subject after this\n  return dropDownList.select(\"apples\")\n})\n",
            "language": "js"
        }
    ]
}
[/block]

We can rewrite the previous example in a more terse way and add an assertion.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .get(\"input\")\n    .invoke(\"getKendoDropDownList\")\n    .invoke(\"select\", \"apples\")\n  .its(\"val\").should(\"match\", /apple/)\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Function with Arguments Usage

#### Arguments are automatically forwarded to the function

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"form\").invoke(\"attr\", \"ng-show\").should(\"not.include\", \"myValue\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Related

1. [its](its)
2. [wrap](wrap)
3. [then](then)