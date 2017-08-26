---
title: Writing Your First Test
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How to start testing on a new project in Cypress.
- What passing and failing tests look like.
- Testing web navigation, DOM querying, and writing assertions.
{% endnote %}

# Setup: Add a New Project

To get started, let's do a few simple steps together. We're going to:

1. Open up Cypress.
2. Create an empty folder.
3. Add this folder to Cypress.

Assuming you've successfully {% url "installed the Desktop Application" installing-cypress %} let's go ahead and open up the app by double clicking on it or running {% url "`cypress open`" command-line#cypress-open %} from your terminal.

Once Cypress is open, let's create a folder:

```shell
mkdir playground
```

Great! Now let's add this folder to Cypress by dragging the folder into the Desktop App or clicking 'select manually'.

{% img no-border /img/guides/add-your-first-project-in-guid.png "Adding an empty folder to Cypress Desktop" %}

Once you've added this folder, you should see a message explaining that we've seeded your empty project with a few folders and an `example_spec.js` file.

{% note info %}
This `example_spec.js` file is just for reference - it tests our {% url 'Kitchen Sink' kitchen-sink %} application and provides you with a preview of all the commands you can run with Cypress.
{% endnote %}

# Setup: Add a New Test File

Now it's time to write our first test. We're going to:

1. Create a `simple_spec.js` file.
2. Watch Cypress update our list of specs.
3. Launch our browser into the Cypress GUI.

Let's create a new file in the `integration` folder that was created for us:

```shell
touch playground/cypress/integration/simple_spec.js
```

Once we've created that file, you should see the Cypress Desktop Application immediately display it in the list of spec files. Cypress monitors your spec files for any changes and automatically displays any changes.

Even though we haven't written any tests yet - that's okay - let's click on the `simple_spec.js` and watch Cypress launch your browser.

{% note info %}
Cypress opens the test in a browser installed on your system. You can read more about how we do this in {% url "Launching Browsers" launching-browsers %}.
{% endnote %}

{% img /img/guides/empty-file-30fps.gif %}

We are now officially in the {% url 'Cypress GUI' overview-of-the-gui %}. This is where we'll spend the majority of our time testing.

{% note warning %}
Notice Cypress displays the message that it couldn't find any tests. This is normal - we haven't yet written any tests! Sometimes you'll also see this message if there was an error parsing your test file. You can always open your **Chrome Dev Tools** to inspect the Console for any syntax or parsing errors that prevented Cypress from reading your tests.
{% endnote %}

# A Simple Test

Now it's time to write our first test. We're going to:

1. Write our first passing test.
2. Write our first failing test.
3. Watch Cypress reload in real time.

As we continue to save our new test file you'll see the browser auto reloading in real time.

Open up your favorite IDE and add the code below to our `simple_spec.js` test file.

```js
describe('My First Test', function() {
  it('Does not do much!', function() {
    expect(true).to.equal(true)
  })
})
```

Once you saved that file you should have seen the browser reload.

Although it doesn't do anything useful, this is our first passing test! ✅

Over in the {% url 'Command Log' overview-of-the-gui#Command-Log %} you'll see Cypress display the suite, the test and your first assertion which should be passing in green.

{% img /img/guides/first-test.png %}

{% note info %}
Notice Cypress displays a message about this being the default page {% url "on the righthand side" overview-of-the-gui#Application-Under-Test %}. Cypress assumes you'll want to go out and {% url "visit" visit %} a URL on the internet - but it can also work just fine without that.
{% endnote %}

Now let's write our first failing test.

```js
describe('My First Test', function() {
  it('Does not do much!', function() {
    expect(true).to.equal(false)
  })
})
```

Once you save again, you'll see Cypress display the failing test in red since `true` does not equal `false`.

{% img /img/guides/failing-test.png "Failing test" %}

Cypress provides a nice GUI that gives you a visual structure of suites, tests, and assertions. Soon you'll also see commands, page events, and network requests.

{% img /img/guides/first-test-30fps.gif "Writing a passing and failing test in Cypress" %}

{% note info What are describe, it, and expect? %}
All of these functions come from {% url 'Bundled Tools' bundled-tools %} that Cypress bakes in.

- `describe` and `it` come from {% url 'Mocha' https://mochajs.org %}
- `expect` comes from {% url 'Chai' http://chaijs.com %}

Cypress builds on these popular tools and frameworks that you *hopefully* already have some familiarity and knowledge of. If not, that's okay too.
{% endnote %}

# A *Real* Test

**A solid test generally covers 3 phases:**

1. Set up the application state.
2. Take an action.
3. Make an assertion about the resulting application state.

You might also see this phrased as "Given, When, Then", or "Arrange, Act, Assert". The idea is simple: first you put the application into a specific state, then you take some action in the application that causes it to change, and finally you check the resulting application state.

Today, we'll take a narrow view of these steps and map them cleanly to Cypress commands:

1. Visit a web page.
2. Query for an element.
4. Interact that element.
3. Assert about the content on the page.

## {% fa fa-globe %} Step 1: Visit a Page

First, let's visit a web page. We will visit our {% url 'Kitchen Sink' kitchen-sink %} application in this example so that you can try Cypress out without needing to worry about finding a page to test.

Using {% url `cy.visit()` visit %} is easy, we just pass it the URL we want to visit. Let's replace our previous test with the one below that actually visits a page:

```js
describe('My First Test', function() {
  it('Visits the Kitchen Sink', function() {
    cy.visit('https://example.cypress.io')
  })
})
```

Save the file and switch back over to the Cypress GUI. You might notice a few things:

1. The {% url 'Command Log' overview-of-the-gui#Command-Log %} now shows the new `VISIT` action.
2. The Kitchen Sink application has been loaded into the {% url 'App Preview' overview-of-the-gui#Overview %} pane.
3. The test is green, even though we made no assertions.
4. The `VISIT` displays a **blue pending state** until the page finishes loading.

Had this request come back with a non `2xx` status code such as `404` or `500`, or if there was a JavaScript error in the application's code, the test would have failed.

{% img /img/guides/first-test-visit-30fps.gif "A real test visiting a website" %}

{% note danger Only Tests Apps You Control %}
Although in this guide we are testing our example application: {% url `https://example.cypress.io` https://example.cypress.io %} - you **shouldn't** test applications you **don't control**. Why?

- They are liable to change at any moment which will break tests.
- They may do A/B testing which makes it impossible to get consistent results.
- They may detect you are a script and block your access (Google does this).
- They may have security features enabled which prevent Cypress from working.

The point of Cypress is to be a tool you use every day to build and test **your own applications**.

Cypress is not a **general purpose** web automation tool. It is poorly suited for scripting live, production websites not under your control.
{% endnote %}

## {% fa fa-search %} Step 2: Query for an Element

Now that we've got a page loading, we need to take some action on it. Why don't we click a link on the page? Sounds easy enough, let's go look for one we like... how about `root`?

To find this element by its contents, we'll use {% url `cy.contains()` contains %}.

Let's add it to our test and see what happens:

```js
describe('My First Test', function() {
  it('finds the content "root"', function() {
    cy.visit('https://example.cypress.io')

    cy.contains('root')
  })
})
```

Our test should now display `CONTAINS` in the {% url 'Command Log' overview-of-the-gui#Command-Log %} and still be green.

Even without adding an assertion, we know that everything is okay! This is because many of Cypress' commands are built to fail if they don't find what they're expecting to find. This is known as a {% url 'Default Assertion' introduction-to-cypress#Default-Assertions %}.

To verify this, replace `root` with something not on the page, like `boot`. You'll notice the test goes red, but only after about 4 seconds!

Can you see what Cypress is doing under the hood? It's automatically waiting and retrying because it expects the content to **eventually** be found in the DOM. It doesn't immediately fail!

{% img /img/guides/first-test-failing-contains.png %}

{% note warning 'Error Messages' %}
We've taken care at Cypress to write hundreds of custom error messages that attempt to explain in simple terms what went wrong. In this case Cypress **timed out retrying** to find the content: `boot` within the entire page.
{% endnote %}

Before we add another command - let's get this test back to passing. Replace `boot` with `root`.

{% img /img/guides/first-test-contains-30fps.gif %}

## {% fa fa-mouse-pointer %} Step 3: Click an Element

Ok, now we want to click on the link we found. How do we do that? You could almost guess this one: just add a {% url "`.click()`" click %} command to the end of the previous command, like so:

```js
describe('My First Test', function() {
  it('clicks the link "root"', function() {
    cy.visit('https://example.cypress.io')

    cy.contains('root').click()
  })
})
```

You can almost read it like a little story! Cypress calls this "chaining" and we chain together commands to build tests that really express what the app does in a declarative way.

Also note that the {% url 'App Preview' overview-of-the-gui#Overview %} pane has updated further after the click, following the link and showing the destination page:

Now we can assert something about this new page!

{% img /img/guides/first-test-click-30fps.gif %}

## {% fa fa-check-square-o %} Step 4: Make an Assertion

Finally, let's make an assertion about something on the new page we clicked into. Perhaps we'd like to make sure the proper headings are present. We can do that by looking up the appropriate tags and chaining assertions to them with {% url "`.should()`" should %}.

Here's what that looks like:

```js
describe('My First Test', function() {
  it("clicking 'root' shows the right headings", function() {
    cy.visit('https://example.cypress.io')

    cy.contains('root').click()

    // Should be on a new URL which includes '/commands/querying'
    cy.url().should('include', '/commands/querying')

    // Should find the main header "Querying"
    cy.get('h1').should('contain', 'Querying')

    // Should also find a sub-header about the contains command
    cy.get('h4').should('contain', 'cy.contains()')
  })
})
```

And there you have it: a simple test in Cypress that visits a page, finds and clicks a link, then verifies the URL and resulting contents of the new page. If we read it out loud, it might sound like:

> 1. Visit: `https://example.cypress.io`
> 2. Find the element with content: `root`
> 3. Click on it
> 4. Get the URL
> 5. Assert it includes: `/commands/querying`
> 6. Then find: `<h1>`
> 7. Assert it has the content: `Querying`
> 8. Then find an: `<h4>`
> 9. Assert it has the content: `cy.contains()`

Or in the Given, When, Then syntax:

> 1. Given a user visits `https://example.cypress.io`
> 2. When they click the link labeled `root`
> 3. Then URL should include `/commands/querying`
> 4. And they should see a heading of `Querying` and a subheading of `cy.contains()`

Even your non-technical collaborators can appreciate the way this reads!

And hey, this is a very clean test! We didn't have to say anything about *how* things work, just that we'd like to verify a particular series of events and outcomes.

{% img /img/guides/first-test-assertions-30fps.gif %}

{% note info 'Page Transitions' %}
Worth noting is that this test transitioned across two different pages.

1. The initial {% url "`cy.visit()`" visit %}
2. The {% url "`.click()`" click %} to a new page

Cypress automatically detects things like a `page transition event` and will automatically **halt** running commands until the next page has **finished** loading.

Had the **next page** not finished its loading phase, Cypress would have ended the test and presented an error.

Under the hood - this means you don't have to worry about commands accidentally running against a stale page, nor do you have to worry about running commands against a partially loaded page.

We mentioned previously that Cypress waited **4 seconds** before timing out finding a DOM element - but in this case, when Cypress detects a `page transition event` it automatically increases the timeout to **60 seconds** for the single `PAGE LOAD` event.

In other words, based on the commands and the events happening, Cypress automatically alters its expected timeouts to match web application behavior.

These various timeouts are defined in the {% url 'Configuration' configuration#Timeouts %} document.
{% endnote %}

# Debugging

Cypress comes with a host of debugging tools to help you understand a test.

**We give you the ability to:**

- Travel back in time to each command's snapshot.
- See special `page events` that happened.
- Receive additional output about each command.
- Step forward / backward between multiple command snapshots.
- Pause commands and step through them iteratively.
- Visualize when hidden or multiple elements are found.

Let's see some of this in action using our existing test code.

## Time Travel

Take your mouse and **hover over** the `CONTAINS` command in the Command Log.

Do you see what happened?

{% img /img/guides/first-test-hover-contains.png %}

Cypress automatically traveled back in time to a snapshot of when that command resolved. Additionally, since {% url `cy.contains()` contains %} finds DOM elements on the page, Cypress also highlights the element and scrolls it into view (to the top of the page).

Now if you remember at the end of the test we ended up on a different URL:

> https://example.cypress.io/commands/querying

But as we hover over the `CONTAINS`, Cypress reverts back to the URL that was present when our snapshot was taken.

{% img /img/guides/first-test-url-revert.png %}

## Snapshots

Commands are also interactive. Go ahead and click on the `CLICK` command.

{% img /img/guides/first-test-click-revert.png %}

Notice it highlights in purple. This did three things worth noting...

***1. Pinned Snapshots***
We have now **pinned** this snapshot. Hovering over other commands will not revert to them. This gives us a chance to manually inspect the DOM of our application under test at the time the snapshot was taken.

***2. Event Hitbox***
Since {% url `.click()` click %} is an action command, that means we also a red hitbox at the coordinates the event took place.

***3. Snapshot Menu Panel***
There is also a new menu panel. Some commands (like action commands) will take multiple snapshots: **before** and **after**. We can now cycle through these.

The **before** snapshot is taken prior to the click event firing. The **after** snapshot is taken immediately after the click event. Although this click event caused our browser to load a new page, it's not an instantaneous transition. Depending on how fast your page loaded, you may see still see the same page, or a blank screen as the page is unloading and in transition.

## Page Events

Notice there is also a funny looking Log called: `(PAGE LOAD)`. This wasn't a command that we issued - rather Cypress itself will log out important events from your application when they occur. Notice these look different (they are gray and without a number).

{% img /img/guides/first-test-page-load.png %}

**Cypress logs out page events for:**

- Network XHR Requests
- URL hash changes
- Page Loads
- Form Submissions

## Console Output

Besides Commands being interactive, they also output additional debugging information to your console.

Open up your Dev Tools and click on the `GET` for the `h4`.

{% img /img/guides/first-test-console-output.png %}

**We can see Cypress output additional information in the console:**

- Command (that was issued)
- Returned (what was returned by this command)
- Elements (the number of elements found)
- Selector (the argument we used)

We can even expand what was returned and inspect each individual element or even right click and inspect them in the Elements panel!

## Special Commands

In addition to having a helpful UI, there are also special commands dedicated to the task of debugging.

For instance there is:

- {% url `cy.pause()` pause %}
- {% url `cy.debug()` debug %}

Let's add a {% url `cy.pause()` pause %} to our test code and see what happens.

```js
describe('My First Test', function() {
  it("clicking 'root' shows the right headings", function() {
    cy.visit('https://example.cypress.io')

    cy.pause()

    cy.contains('root').click()

    // Should be on a new URL which includes '/commands/querying'
    cy.url().should('include', '/commands/querying')

    // Should find the main header "Querying"
    cy.get('h1').should('contain', 'Querying')

    // Should also find a sub-header about the contains command
    cy.get('h4').should('contain', 'cy.contains()')
  })
})
```

Now Cypress provides us a UI (similar to debugger) to step forward through each command.

{% img /img/guides/first-test-paused.png %}

## In Action

{% img /img/guides/first-test-debugging-30fps.gif %}

<!-- ## Bonus Step: Refactor

Once we have a passing test that covers the system we're working on, we usually like to go one step further and make sure the test code itself is well-structured and maintainable. This is sometimes expressed in TDD circles as "Red, Green, Refactor", which means:

1. Write a failing test.
2. Write the code to make the test pass.
3. Clean up the code, keeping the test passing.

Regardless of how you feel about writing tests first, the refactor step is very important! We want all of our code to be maintainable and extensible so that it lives a long and productive life, *including our test code*.

To make this concrete, imagine we added a second, similar test to this suite:

```js
describe('My First Test', function() {
  it("clicking type shows the heading Actions", function() {
    cy.visit('https://example.cypress.io')

    cy.contains('type').click()

    cy.get("h1").should('have.value', "Actions")
  })

  it("clicking focus shows the heading Focus Command", function() {
    cy.visit('https://example.cypress.io')

    cy.contains("focus").click()

    cy.get("h1").should('have.value', "Focus Command")
  })
})
```

We've got some duplication here and could probably make a number of refactoring moves, but for this brief tutorial we'll do a simple and common one. Let's move that initial visit out into a `beforeEach()` block.

```js
describe('My First Test', function() {
  beforeEach(function() {
    cy.visit('https://example.cypress.io')    
  })

  it("clicking type shows the heading Actions", function() {
    cy.contains('type').click()

    cy.get("h1").should('have.value', "Actions")
  })

  it("clicking focus shows the heading Focus Command", function() {
    cy.contains("focus").click()

    cy.get("h1").should('have.value', "Focus Command")
  })
})
```

`beforeEach()` runs before each and every test in the same `describe()` block, so both of our tests in this case. Both tests still pass, and both are a bit shorter and easier to read.

-->
