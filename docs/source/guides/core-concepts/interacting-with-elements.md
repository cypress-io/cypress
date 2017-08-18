---
title: Interacting with Elements
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How Cypress calculates visibility
- How Cypress ensures elements are actionable
- How Cypress deals with animating elements
- How you can bypass these checks and force events
{% endnote %}

# Actionability

Some commands in Cypress are for interacting with the DOM such as:

- {% url `.click()` click %}
- {% url `.dblclick()` dblclick %}
- {% url `.type()` type %}
- {% url `.clear()` clear %}
- {% url `.check()` check %}
- {% url `.uncheck()` uncheck %}
- {% url `.select()` select %}
- {% url `.scrollTo()` scrollto %}
- {% url `.scrollIntoView()` scrollintoview %}

These commands simulate a user interacting with your application. Under the hood Cypress fires the events a browser would fire thus causing your application's event bindings to fire.

Prior to issuing any of the commands, we check the current state of the DOM and take some actions to ensure the DOM element is "ready" to receive the action.

Cypress will wait for the element to pass all of these checks for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %} (described in depth in the {% url 'Default Assertions' introduction-to-cypress#Default-Assertions %} core concept guide).

***Checks and Actions Performed***

- {% urlHash 'Scroll the element into view.' Scrolling %}
- {% urlHash 'Ensure the element is not hidden.' Visibility %}
- {% urlHash 'Ensure the element is not disabled.' Disability %}
- {% urlHash 'Ensure the element is not animating.' Animations %}
- {% urlHash 'Ensure the element is not covered.' Covering %}
- {% urlHash 'Scroll the page if still covered by an element with fixed position.' Scrolling %}
- {% urlHash 'Fire the event at a specific coordinate.'  Coordinates %}

Whenever Cypress cannot interact with an element, it could fail at any of the above steps. You will usually get an error explaining why the element was not found to be actionable.

## Visibility

Cypress checks a lot of things to determine an element's visibility.

***An element is considered hidden if:***

- Its `offsetWidth` or `offsetHeight` is `0`.
- Its CSS property is `visibility: hidden`.
- Its CSS property is `display: none`.

***Additionally an element is considered hidden if:***

- Any of its ancestors have a CSS property `overflow: hidden`
  - AND have an `offsetWidth` or `offsetHeight` of `0`
  - AND an element between that ancestor and the element has `position: fixed` or `position: absolute`
- Any of its ancestors have `overflow: hidden`, `overflow: scroll`, or `overflow: auto`
  - AND it is positioned outside that ancestor's bounds

## Disability

Cypress checks whether an element's `disabled` property is `true`.

We don't look at whether an element has property `readonly` (but we probably should). {% open_an_issue %} if you'd like us to add this.

## Animations

Cypress will automatically determine if an element is animating and wait until it stops.

To calculate whether an element is animating we take a sample of the last positions it was at and calculate the element's slope. You might remember this from 8th grade algebra. 😉

If the element's slope (the distance between its previous position and its current position) exceeds the {% url `animationDistanceThreshold` configuration#Animations %} then we consider the element to be animating.

When coming up with this value, we did a few experiments to find a speed that "feels" too fast for a user to interact with. You can always {% url "increase or decrease this threshold" configuration#Animations %}.

You can also turn off our checks for animations with the configuration option {% url `waitForAnimations` configuration#Animations %}.

## Covering

We also ensure that the element we're attempting to interact with isn't covered by a parent element.

For instance, an element could pass all of the previous checks, but a giant dialog could be covering the entire screen making interacting with the element impossible for any real user.

If a *child* of the element is covering it - that's okay. In fact we'll automatically issue the events we fire to that child.

Imagine you have a button:

```html
<button>
  <i class="fa fa-check">
  <span>Submit</span>
</button>
```

Oftentimes either the `<i>` or `<span>` element is covering the exact coordinate we're attempting to interact with. In those cases, the event fires on the child. We even note this for you in the {% url "Command Log" overview-of-the-gui#Command-Log %}.

## Scrolling

Before interacting with an element we will *always* scroll it into view (including any of its parent containers). Even if the element was visible without scrolling, we perform the scrolling algorithm in order to reproduce the same behavior every time the command is run.

{% note info %}
This scrolling logic only applies to {% urlHash "commands that are actionable above" Actionability %}. **We do not scroll elements** into view when using DOM commands such as {% url "`cy.get()`" get %} or {% url "`.find()`" find %}.
{% endnote %}

The scrolling algorithm works by scrolling the top, leftmost point of the element we issued the command on to the top, leftmost scrollable point of it's scrollable container.

However, this scrolling behavior can sometimes create other issues. For instance, when Cypress calculates that the element to interact with is being covered by a parent element, then we "nudge" it's container by scrolling it a tiny bit.

This most often happens when you have a "sticky nav" that is fixed to the top of the page. By Cypress scrolling the element to the top, it can sometimes end up "underneath" this nav. Our algorithm *should* detect this and scroll until the element is no longer covered.

## Coordinates

After we verify the element is actionable, Cypress will then fire all of the appropriate events and corresponding default actions. Usually these events' coordinates are fired at the center of the element, but most commands enable you to change the position it's fired to.

```js
cy.get('button').click({ position: 'topLeft' })
```

The coordinates we fired the event at will generally be available when clicking the command in the {% url 'Command Log' overview-of-the-gui %}.

![event coordinates](/img/guides/coords.png)

Additionally we'll display a red "hitbox" - which is a dot indicating the coordinates of the event.

![hitbox](/img/guides/hitbox.png)

# Debugging

It can be difficult to debug problems when elements are not considered actionable by Cypress.

Although you *should* see a nice error message, nothing beats visually inspecting and poking at the DOM yourself to understand the reason why.

When you use the {% url "Command Log" overview-of-the-gui#Command-Log %} to hover over a command, you'll notice that we will always scroll the element the command was applied to into view. Please note that this is *NOT* using the same algorithms that we described above.

In fact we only ever scroll elements into view when actionable commands are running using the above algorithms. We *do not* scroll elements into view on regular DOM commands like {% url `cy.get()` get %} or {% url `.find()` find %}.

The reason we scroll an element into view when hovering over a snapshot is just to help you to see which element(s) were found by that corresponding command. It's a purely visual feature and does not necessarily reflect what your page looked like when the command ran.

In other words, you cannot get a correct visual representation of what Cypress "saw" when looking at a previous snapshot.

The only way for you to easily "see" and debug why Cypress thought an element was not visible is to use a `debugger` statement.

We recommend placing `debugger` or using the {% url `.debug()` debug %} command directly BEFORE the action.

Make sure your Developer Tools are open and you can get pretty close to "seeing" the calculations Cypress is performing.

```js
// break on a debugger before the action command
cy.get('button').debug().click()
```

# Forcing

While the above checks are super helpful at finding situations that would prevent your users from interacting with elements - sometimes they can get in the way!

Sometimes it's not worth trying to "act like a user" to get a robot to do the exact steps a user would to interact with an element.

Imagine you have a nested navigation structure where the user must hover over and move the mouse in a very specific pattern to reach the desired link.

Is this worth trying to replicate when you're testing?

Maybe not! For these scenarios  we give you a simple escape hatch to bypass all of the checks above and just force events to happen!

You can simply pass `{force: true}` to most action commands.

```js
// force the click and all subsequent events
// to fire even if this element isn't considered 'actionable'
cy.get('button').click({ force: true })
```

{% note info "What's the difference?" %}
When you force an event to happen we still

- Attempt to scroll the element into view
- Issue all applicable events
- Fire them at the right coordinates

All `{force: true}` does is bypass the other checks for ensuring an element is in an actionable state. Therefore you still get a high degree of confidence your application is responding to events correctly.
{% endnote %}

<!-- # Firing Events

- Talk about change events, focus, blur, input, mousedown, mouseup, keyboard, etc -->
