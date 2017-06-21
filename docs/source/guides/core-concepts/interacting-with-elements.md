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

Cypress gives you a set of commands for interacting with the DOM such as:

- {% url `.click()` click %}
- {% url `.dblclick()` dblclick %}
- {% url `.type()` type %}
- {% url `.check()` check %}
- {% url `.uncheck()` uncheck %}
- {% url `.select()` select %}

These commands simulate a user interacting with your application. Under the hood we fire the events a browser will fire thus causing your application and its event bindings to fire.

Prior to issuing any of the commands, we run the following algorithms for ensuring the element is "ready" to receive actions.

Cypress will wait for the element to pass all of these checks as per the {% url `defaultCommandTimeout` configuration#Timeouts %} described in depth in the {% url 'Default Assertions' introduction-to-cypress#Default-Assertions %} core concept guide.

***Algorithm***

- {% urlHash 'Scroll the element into view' Scrolling %}
- {% urlHash 'Ensure the element is not hidden' Visibility %}
- {% urlHash 'Ensure the element is not disabled' Disability %}
- {% urlHash 'Ensure the element is not animating' Animations %}
- {% urlHash 'Ensure the element is not covered' Covering %}
- {% urlHash 'Scroll the page if still covered by an element with fixed position' Scrolling %}
- {% urlHash 'Fire the event at a specific coordinate'  Coordinates %}

Whenever Cypress cannot interact with an element, it could fail at any of these particular steps, and generally tells you exactly why it didn't think the element was actionable.

## Visibility

We've worked very hard to come up with one of (if not the most robust) algorithm of any test framework to determine an element's visibility.

An element is considered hidden if:
- its `offsetWidth` or `offsetHeight` is `0`
- its CSS property is `visibility: hidden`
- its CSS property is `display: none`

Additionally an element is considered hidden if any of its parent ancestors:
- have a CSS property `overflow: hidden` AND...
- ...have an `offsetWidth` or `offsetHeight` of `0` AND...
- ...an element between all of the parents and the element has `position: fixed` or `position: absolute`
- OR its content is being 'clipped' by a parent element with `overflow: hidden`, or `overflow: scroll`, or `overflow: auto`

An element with 'clipped' content means that it's been positioned outside the visible bounds of a parent.

## Disability

We simply look at whether an element's property `disabled` is `true`.

We don't look at whether an element has property `readonly` (and we should). {% open_an_issue %} if you'd like us to add this.

## Animations

To calculate whether an element is animating we take a sample of the last few coordinates and calculate the element's slope. You might remember this from 8th grade algebra ;-)

If the element's slope (the distance in pixels which exceeds the configurable: {% url `animationDistanceThreshold` configuration#Animations %}) then we consider the element to be animating.

When coming up with this value, we did a few experiments to find a speed that "feels" too fast for a user to interact with. Generally this threshold will be exceeded on typical animations you've seen from dialogs sliding / animating in, or gallery banners "changing positions".

You can always increase or decrease this threshold if you'd like.

You can also turn off waiting for any kind animation with the configuration option {% url `waitForAnimations` configuration#Animations %}.

## Covering

One of the last checks we do is to ensure that the element isn't being covered by an element which **is not** a descendent.

For instance, an element will pass all of the previous checks, but a giant dialog could be covering the entire screen and make interacting with the element impossible.

However, if a **descendent / child** of the element is covering it - that's okay. In fact we'll automatically issue the events we fire to that child.

This happens pretty frequently. When we calculate the coordinate to fire the event, it's usually the center of an element.

Imagine you have a button:

```html
<button>
  <i class="fa fa-check">
  <span>Submit</span>
</button>
```

Oftentimes either the `<i>` or `<span>` element is covering the coordinate we're attempting to interact with. In those cases, its totally fine and we'll even provide note this for you in the Command Log.

## Scrolling

Before interacting with an element we will *always* scroll it into view (including all of its parent containers).

However, the scrolling algorithm works by scrolling the very top pixel to the highest scrollable point. Remember, Cypress tests are meant to be deterministic. Tests should always run the same way every time. Even if an element is 'already' visible, it could be in that position indeterminately, and therefore we always scroll it the same way.

However, when we "scroll" the page that can actually create other issues that we account for.

For instance, when we calculate that the element is currently being covered by an element other than its direct descendants / children, then we'll actually "nudge" the page by scrolling it a tiny bit.

This most often happens when you have a "sticky nav" that is fixed to the top of the page. By scrolling the element to the top, it can sometimes end up "underneath" this nav.

Our algorithm *should* detect this and will continually "nudge" the page by scrolling the page over and over until the element is no longer hidden.

This should match a real users behavior.

## Coordinates

After we verify the element is actionable, Cypress will then fire all of the appropriate events. Usually these events' coordinates are fired at the center of the element, but most commands enable you to change the position it's fired to.

```js
cy.get('button').click({ position: 'topLeft' })
```

# Debugging

It can be difficult for you (the developer) to debug problems where elements are not considered actionable by Cypress.

Although we *should* provide a nice error message, including a screenshot, nothing beats visually inspecting and poking at the DOM to understand the reason why.

When you use the Command Log to "hover" over a command, you'll notice that we will always scroll the element the command was applied to into view. Please note that this is **NOT** using the same algorithms as what we described above.

{% note success Core Concept %}
In fact we only ever scroll elements into view (when your commands are running) using the above algorithms on **action commands**. We **do not** scroll elements into view on regular DOM commands like {% url `cy.get()` get %} or {% url `.find()` find %}.

The reason we scroll an element into view when hovering over a snapshot is just to help you (the developer) to see which element(s) were found by that corresponding commands. It's a purely visual debugging feature and does not necessarily 100% accurately reflect what your page looked at when that command ran.
{% endnote %}

In other words, you cannot get a correct visual representation of what Cypress "saw" when reverting to a previous snapshot.

The only way for you to easily "see" and debug why Cypress thought an element was not visible is to use a `debugger` statement.

We recommend placing `debugger` or using the {% url `.debug()` debug %} command directly BEFORE and AFTER the action.

Make sure your **Developer Tools** are open and you can get pretty close to "seeing" the calculations Cypress is performing.

```js
// break on a debugger before the action command
cy.get('button').debug().click()
```

# Bypassing

While the above checks are super helpful at finding situations and bugs which would prevent your users from interacting with elements - sometimes they can really get in the way!

Often it's **not worth** trying to "act like a user" and get a robot to do the exact steps a user would take to interact with an element.

Imagine you have a nested navigation structure where the user must hover over and move the mouse in a specific pattern to reach the desired link.

Is this worth trying to replicate when you're testing?

No way! For these scenarios (and more) we give you a simple escape hatch to bypass all of these checks and just force events to happen!

You can simply pass `{ force: true }` to any action command.

```js
// force the click and all subsequent events
// to fire even if this element isn't 'actionable'
cy.get('button').click({ force: true })
```

{% note info "What's the difference?" %}
When you force an event to happen we'll still attempt to scroll the element into view, and still issue all applicable events, and still fire them at the right coordinates, or potentially to children descendants covering up your element.

All `{ force: true }` does is bypass the above checks for ensuring an element is in an actionable state. Therefore you still get a high degree of confidence your application is responding to events correctly.
{% endnote %}

# Firing Events

- Talk about change events, focus, blur, input, mousedown, mouseup, keyboard, etc
