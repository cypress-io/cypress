slug: check
excerpt: Check a checkbox

### [cy.check()](#usage)

Checks the checkbox. Triggers events associated with check.

## Usage

#### Check the checkbox

```javascript
cy.get("[type='checkbox']").check()
```

#### Check the element with id of `saveUserName` and check it

```javascript
cy.get("#saveUserName").check()
```
***

## Command Log

```javascript
cy.get("form").find("[name='emailUser']").check()
```

The commands above will display in the command log as:

<img width="582" alt="screen shot 2015-11-29 at 12 53 25 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458925/6226b39e-9698-11e5-9a2a-debf91f5989a.png">

When clicking on `check` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 53 48 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458927/65a2526c-9698-11e5-8b33-f59e666170e2.png">

***
## Related
1. [uncheck](http://on.cypress.io/api/uncheck)