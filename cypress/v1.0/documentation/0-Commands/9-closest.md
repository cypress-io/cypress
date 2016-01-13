slug: closest

### [cy.closest( *selector* )](#selector-usage)

For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.

## Selector Usage

> Find the closest element of subject with class `nav`

```javascript
cy.get("li.active").closest(".nav")
```

## Command Log

```javascript
cy.get("li.active").closest(".nav")
```

The commands above will display in the command log as:

<img width="530" alt="screen shot 2015-11-27 at 2 07 28 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447200/500fe9ca-9510-11e5-8c77-8afb8325d937.png">

When clicking on the `closest` command within the command log, the console outputs the following:

<img width="478" alt="screen shot 2015-11-27 at 2 07 46 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447201/535515c4-9510-11e5-9cf5-088bf21f34ac.png">

## Related
1. [parents](/v1.0/docs/parents)
2. [next](/v1.0/docs/next)