excerpt: Call properties on the current subject
slug: invoke

`cy.invoke` invokes properties which are functions on the current subject.

This works the same way as underscore's `invoke` function.

`cy.invoke` is identical to [`cy.its`](/v1.0/docs/its). `cy.its` reads better when calling regular properties which are not functions.

### [cy.invoke( *functionName* )](#function-usage)

Invokes the function on the subject and returns that new value.

```javascript
var fn = function(){
  return "bar"
}

cy.wrap({foo: fn}).invoke("foo").should("eq", "bar") // true
```

***

### [cy.invoke( *functionName*, \**arguments* )](#function-with-arguments-usage)

Invokes the function and forwards any additional arguments to the function call. There are no limits to the number of arguments.

```javascript
var fn = function(a, b, c){
  return a + b + c
}

cy
  .wrap({sum: fn})
  .invoke("sum", 2, 4, 6)
    .should("be.gt", 10) // true
    .and("be.lt", 20) // true
```

***

## Function Usage

#### Properties which are functions are invoked

```javascript
// force a hidden div to be 'display: block'
// so we can interact with its children elements
cy
  .get("div.container").should("be.hidden") // true
  .invoke("show") // call the jquery method 'show' on the 'div.container'
    .should("be.visible") // true
    .find("input").type("cypress is great")
```

***

#### Useful for 3rd party plugins

```javascript
// as a slightly verbose approach
cy.get("input").invoke("getKendoDropDownList").then(function(dropDownList){
  // the return of $input.getKendoDropDownList() has now become the new subject

  // whatever the select method returns becomes the next subject after this
  return dropDownList.select("apples")
})
```

We can rewrite the previous example in a more terse way and add an assertion.

```javascript
cy
  .get("input")
    .invoke("getKendoDropDownList")
    .invoke("select", "apples")
  .its("val").should("match", /apple/)
```

***

## Function with Arguments Usage

#### Arguments are automatically forwarded to the function

```javascript
cy.get("form").invoke("attr", "ng-show").should("not.include", "myValue")
```

***

## Related

1. [its](/v1.0/docs/its)
2. [wrap](/v1.0/docs/wrap)
3. [then](/v1.0/docs/then)