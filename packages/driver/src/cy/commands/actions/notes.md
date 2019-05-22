is coordsHistory supposed to throw the first time? [1](/home/owner/Desktop/cypress/packages/driver/src/cy/actionability.coffee#L196)

52, 15
34, 10

outer:
768, 48
802, 56

why does cy.getFocused() return null if activeElement is body?
and we should use native getters for document.activeElement and document.body

chrome/ff text:

- selectionStart/ end API

chrime/ff email/number:

- execCommand + collapse(modify)

IE:

- text: - selectionStart/End
- email/number: - use selectionStart/End since w/o

`type.js` sets `simulated:true` in `keyboard.js` if `force:true`

find `it` containing some pattern: it(?=[\s\S\r]+myString)

date inputs can no longer be have format yyyy-mm-dd
is this a good thing? probably not - cant find many reasons why typing 9132019 is better than 9-13-2019
future mobile support
things like color inputs are going to have to have abstractions anyways
IE would have to be different

Directly from textcafe http://devexpress.github.io/testcafe/documentation/test-api/actions/type-text.html#typing-into-datetime-color-and-range-inputs

| Input type | Pattern          | Example            |
|------------|------------------|--------------------|
| Date       | yyyy-mm-dd       | '2017-12-23'       |
| Week       | yyyy-Www         | '2017-W03'         |
| Month      | yyyy-mm          | '2017-08'          |
| DateTime   | yyyy-mm-ddThh:mm | '2017-11-03T05:00' |
| Time       | hh:mm            | '15:30'            |
| Color      | #rrggbb          | '#003000'          |
| Range      | n                | '45'               |


auto-focus-next:
```js
cy.get('.phone-input > input').type(770)
	.getFocused().type(419)
	.getFocused().type(0808)
```
vs
```js
cy.get('.pnone-input > input')
	.type(7704190808)
```

tab-next:
```js
cy.get('.phone-input > input')
	.type(770)
	.tab().type(419)
	.tab().type(0808)
```
vs
```js
cy.get('.pnone-input > input')
	.type(770{tab}419{tab}0808)
```
```js
cy.get('.pnone-input > input')
	.type(770{tab})
	.getFocused().type(419{tab})
	.getFocused().type(0808)
```
```js
cy.get('.pnone-input' > input')
	.type(770{tab}419{tab}0808)
```
	has to validate number input on every key



<input type="text"/>
<input type="date"/>
<input type="date"/>
<input type="time"/>
<input type="time"/>

tab-next:
```js

cy.get('#text').type('party{tab}')
.getFocused().type('2018-12-10{tab}')
.getFocused().type('2018-12-10{tab}')
.getFocused().type('15:00{tab}')
.getFocused().type('16:00{enter}')

```
```js

cy.get('#text').type('party{tab}2018-12-10{tab}2018-12-10{tab}15:00{tab}16:00{enter}')

```
```js

cy.get('#text').type('party')
.tab().type('2018-12-10')
.tab().type('2018-12-10')
.tab().type('15:00')
.tab().type('16:00{enter}')

```
```js

cy.get('#text').type('party')
.type('{tab}').getFocused().type('2018-12-10')
.type('{tab}').getFocused().type('2018-12-10')
.type('{tab}').getFocused().type('15:00')
.type('{tab}').getFocused().type('16:00{enter}')

```

with auto-focus-next:
```js

cy.get('#text').type('party')
.getFocused().type('2018-12-10')
.getFocused().type('2018-12-10')
.getFocused().type('15:00')
.getFocused().type('16:00{enter}')

```
```js

cy.get('#text').type('party2018-12-102018-12-1015:0016:00{enter}')

```

```js
cy.tab()

cy.pressKey('tab').getFocused()

cy.tab().type('foo')
cy.pressKey('tab').getFocused().type('foo')

cy.type('foo')
cy.getFocused().type('foo')
---
cy.get('input').type('foo').type('bar')

cy.get('input').type('foo')
cy.type('bar')

cy.get('input').type('foo').getFocused().type('bar')

cy.get('input').type('foo')
cy.getFocused().type('bar')
```


Can i do:

```js
	<input type="date" keyup={(e)=>if (e.target.value.length === 10) e.target.siblings[0].focus()}/>
	<input type="text"/>

	cy.get('input[type="date"]').type('2001-03-12foobarbaz')
	// I don't know if focus will be transferred after typing the date...how can i error?
	cy.get('input[type="date"]').type('2001-3-12').focused().type('foobarbaz')
	// I can validate ahead of time.
```



create issue for cross-browser
 - IE
 - FF

update issue for native-events:
	- paste in gist





overwrite Spec Iframe's console.log to send message to terminal as well. (possible to fancy tree rendering)



click
clickAll
invoke
invokeAll


.get() yields array of DOM elements
.click(`HTMLElement | Array<HTMLElement>`) -> `HTMLElement`
	if array, click first element
	return first element
.clickAll(`Array<HTMLElement>`) -> `Array<HTMLElement>`
	error if not array
	return array
invoke/invokeAll same as click/clickAll

.parent(`HTMLElement | Array<HTMLElement>`) -> `HTMLElement`
.parents(`HTMLElement | Array<HTMLElement>`) -> `Array<HTMLElement>`	





## filters down (accept el[] or el) -> el
first
last
eq, nth

## action filters down (accept el[] or el, pick el[0]) -> el
focus
click
blur
type
check
dblclick
invoke
its
trigger
hover
select

## (accept el[] or el) -> el[]
children
parents
parentsUntil
nextAll
nextUntil
prevAll
prevUntil
find
siblings
contains
parent
next
prev
closest
not, reject
filter


## action (el[] or el) -> el[]
clickAll
checkAll
dblclickAll
triggerAll

each
spread

//invokeAll
//itsAll
//blurAll
//focusAll
//typeAll

## pass along type (el[] or el) 

## pass along subject (el[] or el)
should
within

## yield subject (el[] or el)
should(()->{})
then

## yield args (el[0] or el) or any
wrap

each
map
invoke
invokeMap
prop / its

each
map(fn)
reduce(fn)
invoke
invokeAll
prop
propAll

map(v=>v.value)
reduce((a,b)=>({...a, b}), {})

invokeAll('foo', 'bar')
propAll('value')

## iterates over all
should('contain', 'foo')
	add functions for these: should.contain('foo'), should.haveProp('foo', 'bar')  ? jest matchers ?
	should return first valid ?
		NO. a should is an assertion, not a filter.
	
```js
	<ul class='fruit'>
		<li>orange</li>
		<li>peach</li>
		<li>apple</li>
		<li>grape</li>
	</ul>
	<ul class='box'>
		<li>orange box</li>
		<li>peach box</li>
		<li>apple box</li>
		<li>grape box</li>
	</ul>

	// FAIL, 3 of 4 assertions failed
	cy.get('.fruit li').should('contain', 'apples').then((els)=>)

	// FAIL, 3 of 4 assertions failed
	cy.get('.fruit').children().should('contain', 'apples').then((els)=>)

	// PASS
	cy.get('.fruit').contains('apples').then((els)=>
		expect(els[0]).toHaveText('apples')
	)
	// PASS
	cy.get('.fruit').contains('li', 'apples').then((els)=>
		expect(els[0]).toHaveText('apples')
	)
	// PASS
	cy.get('.fruit').contains('li', 'apples').then((els)=>
		expect(els).toHaveText('apples') // iterates over array - no retries
		cy.wrap(els).should('have.text', 'apples') // iterates over array - retries
	)
	// PASS
	cy.get('.fruit').contains('li', 'apples').first().then((el)=>
		expect(el).toHaveText('apples')
	)
	// PASS
	cy.contains('apples').first().parent().should('have.class', 'fruit').then(el=>)
	// .parent pass along type
	// .should pass along subject and type

	// FAIL 1 of 2 assertions failed
	// expected <ul class="box"> to have class fruit 
	cy.contains('apples').first().then().then((els)=>el=els[0])//.should('have.class', 'fruit')

	cy.contains('apples').click().then((el)=>console.log(el.length))
	//                            													~~~~ type error
	// PASS
	cy.contains('apples').clickAll().then((el)=>console.log(el.length))

	// no longer error
	// cy.contains('apples').first().each((el)=>console.log(el))
	// //                            ~~~~ type error
	// cy.contains('apples').click().each((el)=>console.log(el))
	// //                            ~~~~ type error

```

## Instead:
```js
map
invokeMap

keep multiple true

wrap element in array
 
prop  -> first().prop()
value -> first().value()
attr  -> first().attr()


map(v=>v.value)
invokeMap('val', 'foo')
map(v=>v.val('foo'))
reduce((a,b)=>({...a, b}), {})
text().should('contain', 'foobar')
map(v=>v.textContent).should('contain', 'foobar')
```


actionability check returns inner div in contenteditable
ensureElNotConvered returns element when? (contenteditable)

I got around a lot of complexity by using DOM APIs in contenteditablea and textarea.
APIs that are not in IE11

should simulated events really be this important?




IE11 .focus steals cursor from devtools
IE11 no range unless selecting text outside of input
IE11 simulated arrowkeys currently broken:
	- contenteditable: all
	- textarea: up+down
	- input: none
  

cy.hover:

Hover the mouse over an HTML element.


IE:
SendInput API is the robot framework ie driver

IEDriver
- [ ] how does it handle things like the element animating / moving? will it fire mouseover / mouseexit events?
  - only updates on mouse move, so hover remains applied
- [ ] does the windows postmessage API create 2 hid’s?
- [ ] what does firefox do?
- [ ] test how it handles the actual click event? does it actually process it?
- [ ] Make a button occur on hover and test it with click with postmessage and with sendinput
- [ ] make a div that “moves” after a settimeout where another div becomes under the pointer




```js
it('click menu item dropdown', () => {
    cy.get('.menu-item').hover()
    .find('.submenu-item').click()
});
```

yields the subject

only warn user if mouse move:
 - after hover but before click, type
 - during drag and drop

first, fix scroll behavior
cy state is function to remove event listener

event listener
on native event and on scroll, throw, else remove at end of test


cant move mouse to void after click:
- pointerleave listeners
  - can cancel those events
  - but css still affected
- can move after test teardown


tc:
```
cy.hover( selector [, options] )
```

Parameter          | Type                                                                       | Description
-------------------|----------------------------------------------------------------------------|----------------------------------------------------------------------------------
selector           | Function \| String \| Selector \| Snapshot \| Promise                      | Identifies the webpage element being hovered over. See Selecting Target Elements.
options (optional) | Object	A set of options that provide additional parameters for the action. | See Mouse Action Options.

Use this action to invoke popup elements such as hint windows, popup menus or dropdown lists that appear when hovering over other elements.





cypress proxy issues:
- https://github.com/cypress-io/cypress/issues/1311
- https://github.com/cypress-io/cypress/issues/2938



blur events when not in focus:
- https://github.com/cypress-io/cypress/issues/1176#issuecomment-446648554

after assertion fail, check other assertions before failing out of test
- what jasmine suggests
  
```js   
		describe("A spy", function() {
      var foo, bar = null;

      beforeEach(function() {
        foo = {
          setBar: function(value) {
            bar = value;
          }
        };
    
    You can define what the spy will do when invoked with and.

        spyOn(foo, 'setBar');

        foo.setBar(123);
        foo.setBar(456, 'another param');
      });
    
    The toHaveBeenCalled matcher will pass if the spy was called.

      it("tracks that the spy was called", function() {
        expect(foo.setBar).toHaveBeenCalled();
      });
    
    The toHaveBeenCalledTimes matcher will pass if the spy was called the specified number of times.

      it("tracks that the spy was called x times", function() {
        expect(foo.setBar).toHaveBeenCalledTimes(2);
      });
    
    The toHaveBeenCalledWith matcher will return true if the argument list matches any of the recorded calls to the spy.

      it("tracks all the arguments of its calls", function() {
        expect(foo.setBar).toHaveBeenCalledWith(123);
        expect(foo.setBar).toHaveBeenCalledWith(456, 'another param');
      });

      it("stops all execution on a function", function() {
        expect(bar).toBeNull();
      });
    
    You get all of the data that a spy tracks about its calls with calls

      it("tracks if it was called at all", function() {
        foo.setBar();

        expect(foo.setBar.calls.any()).toEqual(true);
      });
    });
```


click before type
- possibly tabInto command (plugin)
- same as TC
- makes sense with HID view
- can render cursor
- figure out when to leave


research click issues
- root cause issues
- open issue and tag in native events
- pointer events
- review TC algorithm, mouse state after type
  - scroll during TC mouse
- mouseover/enter/exit/mouseover events fire?
  
scrolling algos:
- for all 5 apis
- middle/middle if not in view?/ 100% in view
- use intersection Observer? vs elementFromPoint
- domQuads: is easily solved?
- mouse state
- steps/interpolation - start on 0,0
- drawing HID and testcafe mouse position at time of click

Experiments repo:
- mutation observer for capturing?


Tag all issues related to native events

Native Events: on Mon Dec 17th, added simulated rightclick and simulated hover features


old:

## `cy.click()`

- When `cy.get('input').click()`, Cypress could choose to:
  - [*x*] `A`: Throw an error, tell user to use `cy.type`?
    - [*up*] saves users who think they must `.click()` before `.type()`, messing up cursor position 
    - [*down*] users want to test eventHandlers on `input`s 
  - [*x*] `B`: allow the `click`, let the cursor end up anywhere?
    - [*up*] simple
    - [*down*] allows users to make bad mistakes by assuming cursor position after `.click()` on `input`
  - [*check*] `C`: allow the `click`, move the cursor to the end?
    - [*up*] saves users who think they must `.click()` before `.type()`, messing up cursor position 
    - [*up*] predicatable and consistent with cursor from `cy.type()`  
    - [*down*] slightly magical, harder to implement
      - [x] ensure possible in `IE11` without causing side effects




simulate focus/blur events as if window is in focus
keep state on if windowIsForcedFocus or something
by default window is forced in focus

set up test cases for focus blur events + preventDefault action on mousedown


<!-- Don't blur current element if typing into body -->

hostContenteditableOrSelf(el) is $focused

getFirstFocusableIfCaretable


dont fire mousemove/mouseover if cursor is already on the coordinate
keep internal mouse state

how to fire an action on `Cypress` from a util like `mouse` or `keyboard` ?
- should we fire an event for `mouse:move`?
- so that other parts of cypress can listen and react to it, won't have to read state on `mouse`
- many actions can cause a `mouse:move`

testcafe click events + mouse state: 
https://github.com/AlexanderMoskovkin/testcafe/blob/b3e3e5ac2386d7fc9cdc437c5dd9b8c0657a84c4/src/client/automation/playback/move.js


scrolling:
- on element snapshot, show viewport that cypress saw, but still scroll element into view to show user the element
- on command snapshot, restore to scroll position of command (since scrollIntoViewIfNeeded)


test runner- click to go to test line number in source
test runner- toggle .only on and off (show info about .only in spec file)



diff in browser (not supported by html reporter in Mocha)
- mocha 
- possible modal open to new view
￼

event for browser load:
- put native event protocol connection in there
- allow users to attach stuff to browser (puppeteer for example)

zach:
- allow mocha grep from cli
- add only from runner

git reset that ignores temps and merges
git need branchname in webhook

must assert on events INSIDE the event handlers, otherwise the dynamic property getters might not be accurate
e.g. MouseEvent.currentTarget can only be asserted on inside the event handler

verify sync

webtask.io


thenExpect:
```js
/**
 *
 * @param {any} sub
 * @returns {Chai.Assertion}
 */
const thenExpect = (sub) => {
  const thenAssertion = (commands) => {
    cy.then(() => {

      let expectation = expect(sub)

      let command = null

      while (commands.length) {
        command = commands.slice(0, 1)[0]
        commands = commands.slice(1)
        if (command.type === 'get') {
          expectation = expectation[command.args[1]]
        } else if (command.type === 'apply') {
          expectation = expectation(...command.args)
        }
      }
    })
  }

  // const command = ''
  let commands = []

  const newProxy = () => {
    new Proxy(function () {}, {
      get (...args) {
        commands = commands.concat([{ type: 'get', args }])

        return newProxy()
      },

      apply (target, thisArg, args) {
        if (!args.length) {
          return thenAssertion(commands)
        }

        commands = commands.concat([{ type: 'apply', args }])
      },
    })
  }

  return newProxy()
}

```

move on pointerdown
remove on pointerdown
cancel event


click:
- actionability(async) on `el`, possibly get child element `coordsEl` to click on
- move mouse to `coordsEl`: send events to prev element `prevEl`
- actionability(sync) on `el`, possibly get different element `coordsEl2`
- mouseDown(sync) on `coordsEl2` (`newEl`, force):
  - :no longer care about actionability of `el`:
	- pointerdown(`newEl`)
			if canceled
				return
  - if attached: mousedown(`newEl`)


if either canceled, no focus

- mouseup (`newEl`)
	- pointerup(`newEl`)
	- if attached: mouseup(`newEl`)

- click (`newEl`)
  - if attached: click(`newEl`)



caveats:
	- wont respond to movements on mouse down/up events
	- committed to sending all events to element, only focus is conditional (unless not attached)



click 2

- actionability before any event, get `coordsEl` and `x/y`
- mousemove to `x/y`, flush
- pointer/mousedown to `x/y`, flush
- pointer/mouseup to `x/y`, flush
- click if pointer/mouse hit same element, flush
- log events


`x/y` will ensure receive-ability, else do nothing and set hitEl to `null`


right click:



doubleclick:




  gnome 3.30.2
	


css prop override:
code would look like this:
```js
undoStack = []
while(elHasComputedCSS(el)):
  parent = findElWithCSSProp(el)
  undoStack.push(()=>restoreCSS(parent))
  overrideCSS(parent)
el.scrollIntoView()
undoStack.each(x=>x())
```



since Cypress is yielding `jquery` instances, you'll need to unwrap it first to access a native dom element property:


```js
cy.get('#my-el').should($el => {
  expect($el[0].outerText).to.contain(Gender)
})
```










result:
attached: 690.861083984375ms

~700ms of noop from point of addEventListener

```js
oldEL = oldEl || window.HTMLElement.prototype.addEventListener


foo = 0
window.HTMLElement.prototype.addEventListener = function(){
	const ret = oldEL.apply(this, arguments)
	if (this.matches('.owl-dt-control.owl-dt-control-button.owl-dt-container-control-button') && foo++ === 1) {
		foo = 0
		console.time('attached')
		console.log(this, arguments, ret)
		let count = 0
		const clickFn = ()=>{
			setTimeout(()=>{ 
                count++
                console.log('clicked:',count)
                this.click()
				if (count<100 && document.querySelector('.owl-dt-control.owl-dt-control-button.owl-dt-container-control-button')) return clickFn()
				console.timeEnd('attached')
        	}, 1)
		}
		clickFn()
	}

	return ret
}

```




cy.type dynamic element validation:

6 types of elements                                           | error when ?
--------------------------------------------------------------|-----------------------------
1) non-typeable & non-textlike                                |
(disabled, hidden, covered + not activeElement)               | error@validation
1) typeable & non-textlike (focusable but non typeable)       | no
2) typeable & textlike & non-inputable                        | error@validation only
3) inputable (contenteditable, input, textarea, non-readonly) | no
4) impossible (date input + non-date chars)                   | error@validation, error@type
5) impossible@validation (number input + non-number chars)    | error@validation only

errors@validation:
- 1, 3, 5, 6

errors@type:
- 5
- 1 not possible (since using activeElement)*[1]

checks needed:
- typeable (focusable)
- inputable
- textlike
- impossible




*[1]:
- can't always true document.activeElement:
  - input that turns `hidden` does **not** update activeElement back to body
- detached, disable do update activeElement in chrome



type:

- if delay:0 and simulated:true, no Promise
- if simulatedDefault, act as simulated, fire keys
- 





disabled:
- chrome: only looks at attr existence

readonly:
- chrome: only looks at attr existence