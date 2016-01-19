slug: and
excerpt: Enables chaining multiple assertions together

## [cy.and()](#usage)

`cy.and` makes assertions about the current subject.

When chaining multiple assertions together, `cy.and` sometimes reads better than [`cy.should`](http://on.cypress.io/api/should).

`cy.and` is identical to [`cy.should`](http://on.cypress.io/api/should).

[block:callout]
{
  "type": "info",
  "body": "[Read about making assertions first.](http://on.cypress.io/guides/making-assertions)",
  "title": "New to Cypess?"
}
[/block]

***

## Usage

```javascript
cy.get("button").should("have.class", "active").and("not.be.disabled")
```

```html
<!-- App Code -->
<ul>
  <li>
    <a href="users/123/edit">Edit User</a>
  </li>
</ul>
```

```javascript
cy
  // subject is now <a>
  .get("a")

  // assert <a> contains text: "Edit User"
  // subject is still the <a>
  .should("contain", "Edit User")

  // assert subject has 'href' attribute
  // subject now changes to return value from the 'href' attribute
  .and("have.attr", "href")

  // assert that the string returned from 'href'
  // matches the RegExp /users/
  // the subject is still the same string
  .and("match", /users/)

  // assert that the string does not
  // have a '#' character within it
  .and("not.include", "#")
```

***

## Notes

If you've worked in [Chai](http://chaijs.com/) before, you will recognize that `cy.and` matches the same fluent assertion syntax.

Take this *explicit* assertion for example:

```javascript
expect({foo: "bar"}).to.have.property("foo").and.eq("bar")
```

`cy.and` reproduces this same assertion behavior.

***

## Command Log

```javascript
  .find("input[type='checkbox']")
    .should("be.checked")
    .and("not.be.disabled")
```


[block:html]
{
  "html": "<ul class=\"runnables\">\n<li class=\"test runnable passed\">\n<div class=\"runnable-wrapper\">\n  <ul class=\"runnables\">\n    <li class=\"test runnable passed\">\n  <div class=\"runnable-content-region\">\n    <div>\n      <div class=\"runnable-state\">\n        <span class=\"test-state\">\n          <i class=\"fa\"></i>\n        </span>\n        <span class=\"test-title\">\n          foo bar baz\n        </span>\n      </div>\n    </div>\n  </div>\n  <div class=\"runnable-instruments\">\n    <div class=\"runnable-agents-region\"></div>\n    <div class=\"runnable-routes-region\"></div>\n    <div class=\"runnable-commands-region\">\n      <ul class=\"hooks-container\">\n        <li class=\"hook-item\">\n          <span class=\"hook-name\">\n  \t\t\t\t\t<i class=\"fa fa-caret-down\"></i>\n  \t\t\t\t\tbefore all\n\t\t\t\t\t</span>\n\t\t\t\t\t<ul class=\"commands-container\">\n            <li class=\"command-type-parent command-name-visit command-parent\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                  <span>1</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      visit\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">views/index.html</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n\t\t\t\t\t\t\t</div>\n            </li>\n          </ul>\n        </li>\n        <li class=\"hook-item\">\n          <span class=\"hook-name\">\n            <i class=\"fa fa-caret-down\"></i>\n            before each\n          </span>\n\t\t\t\t\t<ul class=\"commands-container\">\n            <li class=\"command-type-parent command-name-stub-1 command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (stub-1)\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">fetchAndThen(arg1)</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-new-url command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (new url)\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">/views/index.html#accounts/6293</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-xhr command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (xhr stub)\n                  </span>\n                </span>\n                <span class=\"command-message\"><i class=\"fa fa-circle successful\"></i>GET 200 /accounts/6293?inclu...</span>\n                <span class=\"command-controls\">\n                    <span class=\"command-alias route\" data-toggle=\"tooltip\" title=\"\" data-original-title=\" aliased as: 'account'\">\n                      account\n                    </span>\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-xhr command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (xhr stub)\n                  </span>\n                </span>\n                <span class=\"command-message\"><i class=\"fa fa-circle successful\"></i>GET 200 /teams?includeUsersC...</span>\n                <span class=\"command-controls\">\n                <span class=\"command-alias route\" data-toggle=\"tooltip\" title=\"\" data-original-title=\" aliased as: 'teams'\">\n                  teams\n                </span>\n            \t\t</span>\n          \t\t</div>\n            </li>\n            <li class=\"command-type-parent command-name-wait command-parent\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>1</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      wait\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                      <span class=\"command-alias route\">@account</span>\n                      <span class=\"command-alias route\">@teams</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-xhr command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (xhr)\n                  </span>\n                </span>\n                <span class=\"command-message\"><i class=\"fa fa-circle bad\"></i>GET 500 /accounts/6293/answe...</span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-xhr command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (xhr)\n                  </span>\n                </span>\n                <span class=\"command-message\"><i class=\"fa fa-circle bad\"></i>GET 500 /priorities</span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-region command-parent\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>2</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      get\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">#main-region</span>\n                </span>\n                <span class=\"command-controls\">\n                    <span class=\"command-alias dom\">\n                      mainRegion\n                    </span>\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-get command-parent\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                <span>3</span>\n                </span>\n                  <span class=\"command-method\" style=\"padding-left: 0px;\">\n                    <span>\n                        get\n                    </span>\n                  </span>\n                  <span class=\"command-message\">\n                      <span data-js=\"message\">foo bar baz</span>\n                  </span>\n                  <span class=\"command-controls\">\n                  </span>\n                </div>\n            </li>\n            <li class=\"command-type-child command-name-click command-child\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>4</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 5px;\">\n                  <span>\n                      click\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\"></span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-xhr command-parent command-event\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      (xhr stub)\n                  </span>\n                </span>\n                <span class=\"command-message\"><i class=\"fa fa-circle successful\"></i>GET 200 /company</span>\n                <span class=\"command-controls\">\n                    <span class=\"command-alias route\">\n                      company\n                    </span>\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-parent command-name-region command-parent\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>5</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      get\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">#dialog-region</span>\n                </span>\n                <span class=\"command-controls\">\n                    <span class=\"command-alias dom\">\n                      dialogRegion\n                    </span>\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-child command-name-find command-child\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>6</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 5px;\">\n                  <span>\n                      find\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">.modal-title</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-child command-name-assert command-child command-assertion-passed\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>7</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 5px;\">\n                  <span>\n                      assert\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\">expected: <strong>h4.modal-title</strong> to be visible</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n          </ul>\n        </li>\n        <li class=\"hook-item\">\n          <span class=\"hook-name\">\n            <i class=\"fa fa-caret-down\"></i>\n            test\n          </span>\n          <ul class=\"commands-container\">\n            <li class=\"command-type-parent command-name-get command-parent\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>1</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 0px;\">\n                  <span>\n                      get\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                      <span class=\"command-alias dom\">@dialogRegion</span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-child command-name-parent command-child\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>2</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 5px;\">\n                  <span>\n                      parent\n                  </span>\n                </span>\n                <span class=\"command-message\">\n                    <span data-js=\"message\"></span>\n                </span>\n                <span class=\"command-controls\">\n                </span>\n              </div>\n            </li>\n            <li class=\"command-type-child command-name-contains command-child\">\n              <div class=\"command-wrapper\">\n                <span class=\"command-number\">\n                      <span>3</span>\n                </span>\n                <span class=\"command-method\" style=\"padding-left: 5px;\">\n                  <span>\n                      contains\n                  </span>\n                </span>\n              </div>\n            </div>\n    \t\t\t</li>\n  \t\t\t</ul>\n\t\t\t</div>\n\t\t</li>\n</ul>\n<style></style>"
}
[/block]


The commands above will display in the command log as:

<img width="530" alt="screen shot 2015-11-29 at 12 16 46 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458700/36d1e646-9693-11e5-8771-158230530fdc.png">

When clicking on `assert` within the command log, the console outputs the following:

<img width="636" alt="screen shot 2015-11-29 at 12 17 03 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458702/3b6873be-9693-11e5-88f7-a928ebdac80c.png">

***

## Related
1. [should](http://on.cypress.io/api/should)
2. [Assertions](http://on.cypress.io/guides/making-assertions)