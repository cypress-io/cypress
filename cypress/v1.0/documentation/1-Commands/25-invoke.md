slug: invoke
excerpt: Call properties on the current subject

`cy.invoke` invokes functions on the current subject. This works similar to Underscore's `_.invoke` function.

If you want to call a regular property that is not a function on the current subject, use [`cy.its`](https://on.cypress.io/api/its).

| | |
|--- | --- |
| **Returns** | the return of the invoked property |
| **Timeout** | *cannot timeout* |

***

# [cy.invoke( *functionName* )](#section-function-usage)

Invokes the function with the specified name

***

# [cy.invoke( *functionName*, \**arguments* )](#section-function-with-arguments-usage)

Invokes the function with the specified name and forwards any additional arguments to the function call. There are no limits to the number of arguments.

***

# Function Usage

## Assert on a function after invoke

```javascript
var fn = function(){
  return "bar"
}

cy.wrap({foo: fn}).invoke("foo").should("eq", "bar") // true
```

## Properties that are functions are invoked

```javascript
// force a hidden div to be 'display: block'
// so we can interact with its children elements
cy
  .get("div.container").should("be.hidden") // true

  .invoke("show") // call the jquery method 'show' on the 'div.container'
    .should("be.visible") // true
    .find("input").type("Cypress is great")
```

***

## Useful for 3rd party plugins

```javascript
// as a slightly verbose approach
cy.get("input").invoke("getKendoDropDownList").then(function(dropDownList){
  // the return of $input.getKendoDropDownList() has now become the new subject

  // whatever the select method returns becomes the next subject after this
  return dropDownList.select("apples")
})
```

## We can rewrite the previous example in a more terse way and add an assertion.

```javascript
cy
  .get("input")
    .invoke("getKendoDropDownList")
    .invoke("select", "apples")
  .its("val").should("match", /apples/)
```

***

# Function with Arguments Usage

## Send specific arguments to the function

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

## Arguments are automatically forwarded to the function

```javascript
cy
  .get("form").invoke("attr", "ng-show")
    .should("not.include", "myValue")
```

***

# Related

- [its](https://on.cypress.io/api/its)
- [wrap](https://on.cypress.io/api/wrap)
- [then](https://on.cypress.io/api/then)