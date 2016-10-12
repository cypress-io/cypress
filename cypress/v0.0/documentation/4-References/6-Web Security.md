slug: web-security
excerpt: How Cypress handles same-origin policy

# Contents

- :fa-angle-right: [Overview](#section-overview)
- :fa-angle-right: [Limitations](#section-limitations)
  - [One Superdomain per Test](#section-one-superdomain-per-test)
  - [Cross Origin Iframes](#section-cross-origin-iframes)
  - [Insecure Content](#section-insecure-content)
- :fa-angle-right: [Common Workarounds](#section-common-workarounds)
  - [External Navigation](#section-external-navigation)
  - [Form Submission Redirects](#section-form-submission-redirects)
  - [JavaScript Redirects](#section-javascript-redirects)
- :fa-angle-right: [Disabling Web Security](#section-disabling-web-security)

***

# Overview

Browsers adhere to a strict `same-origin policy`. This means that browser restrict access between `<iframes>` when their origin policies do not match.

Because Cypress's internal architecture is completely different than that of Selenium, Cypress must be able to directly communicate with your remote application at all times. Unfortunately, browsers naturally try to prevent how Cypress works.

To get around these restrictions, Cypress implements a slew of strategies involving regular `JavaScript` code, internal browser `Automation APIs`, and `network proxying` to **play by the rules** of `same-origin policy`. It is our goal to fully automate your application without you making modifications to any code - and we are *mostly* able to do that.

Here are some examples of what Cypress does under the hood:
  - it injects `document.domain` into `text/html` pages
  - it proxies all `HTTP` / `HTTPS` traffic
  - it changes the hosted url to match that of the application under test
  - it taps into the browser automation APIs for network level traffic

When Cypress first loads you will see that the internal Cypress web application is hosted on a random port: something like `http://localhost:65874/__/`.

After you issue your first `cy.visit` in each test, Cypress will automatically change its URL to match the origin of your remote application, thereby solving the first major hurdle of `same-origin policy`. Your application's code will execute the same way as outside of Cypress, and everything will work as expected.

[block:callout]
{
  "type": "info",
  "title": "How is HTTPS supported?",
  "body": "Cypress does some pretty crazy wizardry under the hood to make testing HTTPs sites work - but it should work flawlessly. Cypress enables you to control and stub at the network level and therefore it must assign and manage the browser certificates to be able to modify the traffic in real time. You'll notice Chrome displays a warning that the SSL certificate does not match. This is normal and correct. Under the hood we act as our own CA authority and issue certificates dynamically in order to intercept requests otherwise impossible to access. We only do this for the superdomain currently under test, and bypass other traffic. That's why if you open a tab in Cypress to another host, the certificates match as expected."
}
[/block]

***

# Limitations

It's important to note that although we do our *very best* to ensure your application works as normal inside of Cypress there **are** some limitations you need to be aware of.

***

## One Superdomain per Test

Because Cypress changes its own host URL to match that of your application, it enforces that your application must remain on this superdomain for the entirety of a single test.

When you attempt to visit two different superdomains Cypress will immediately error. Note that visiting subdomains are just fine, but two different superdomains are not. You can also visit different superdomains in *different* tests, just not the *same* test.


```javascript
cy
  .visit("https://www.cypress.io")
  .visit("https://docs.cypress.io") // yup all good
```

```javascript
cy
  .visit("https://apple.com")
  .visit("https://google.com") // bad, this will immediately error

```

Although Cypress tries to enforce this limitation, it is possible for your application to bypass Cypress's ability to detect this.

For instance in your application you might do the following:

1. Click an `<a>` with an `href` to a different superdomain
2. Submit a `<form>` which causes your webserver to redirect to you a different superdomain
3. Use a javascript redirect such as `window.location.href = '...'` to a different superdomain

In each of these situations, Cypress will lose the ability to automate your application and will immediately error.

Read on to learn about [working around these common problems](#section-common-workarounds) or even [disabling web security](#section-disabling-web-security) altogether.

***

## Cross Origin Iframes

If your site embeds an `<iframe>` that is a cross-origin frame, Cypress will not be able to automate or communicate with this `<iframe>`.

Examples might include:

- embedding a `Vimeo` or `Youtube` video
- displaying a credit card form from `Stripe` or `Braintree`

It's actually *possible* for Cypress to accomodate these situations in the exact same way Selenium does, but you will never have **native** access to these iframes from inside of Cypress. Instead we'll have to return `proxy` objects which don't represent their native DOM counterparts.

As a workaround, it's possible you may be able to use `window.postMessage` to directly communicate with these iframes and control them (if the 3rd party iframe supports it).

Other than that, you'll have to wait for us to implement API's to support this, or instead you can read on and [disable web security](#section-disabling-web-security).

***

## Insecure Content

Because of the way Cypress is designed, if you are testing an `HTTPS` site, Cypress will die anytime you attempt to navigate back to an `HTTP` site. This is actually a good thing, in fact it highlights a *pretty serious* security problem with your application.

Here's an example:

Say we are testing your secure application:

```javascript
cy.visit("https://app.corp.com")
```

As part of this application, you set `cookies` and store a session on the browser.

Now let's imagine you have a single `insecure` link (or javascript redirect).

```html
<html>
  <a href="http://app.corp.com/page2">Page 2</a>
</html>
```

Cypress will immediately fail with the following test code:

```javascript
cy
  .visit("https://app.corp.com")
  .get("a").click() // will immediately fail
```

This is because browsers will refuse to display insecure content on a secure page. Because Cypress initially changed its URL to match `https://app.corp.com` when the browser follows the `href` to `http://app.corp.com/page2` the browser will refuse to display the contents.

Now you may be wondering... this sounds like a problem with Cypress, because when you work with your application outside of Cypress it works just fine.

However, the truth is, Cypress is actually exposing a **security vulnerability** in your application, and you *want* it to fail in Cypress.

Unless every single session cookie had its `secure` flag set to `true`, when the browser navigates to the insecure URL, all of the session information would be in clear text. This would be trivial to then steal with what is known as session hijacking.

This security vulnerability exists **even if** your webserver forces a `301 redirect` back to the `HTTPS` site. The original `HTTP` request was still made once, exposing your session.

The solution here is to simply update your `HTML` or `JavaScript` code not to navigate to insecure `HTTP` pages and instead only use `HTTPS`. Additionally make sure that cookies have their `secure` flag set to `true`.

Finally, if you're in the situation where you don't control the code, or are otherwise cannot work around this, you can simply bypass this restriction in Cypress by reading how to [disable web security](#section-dislabing-web-security).
***

# Common Workarounds

Let's investigate how you might encounter `cross origin` errors in your test code. We'll break down the ways to work around them in Cypress.

***

## External Navigation

Likely the most common situation where you encounter this error is when you click through an `<a>` to another superdomain.

Let's imagine some HTML code that is served by your application from `localhost:8080`.

```html
<html>
  <a href="https://google.com">Google</a>
</html>
```

```javascript
cy
  .visit("http://localhost:8080") // where your webserver + HTML is hosted
  .get("a").click() // browser attempts to load google.com and Cypress errors
```

If you're new to Cypress (or even e2e testing in general) your first thought process may be to *act like a user*. Don't limit yourself! You're using Cypress! You're not bound to the same rules and restrictions as you were with Selenium. In fact you have **so much more control** over everything.

There is essentially never any reason to visit a site that you don't control. That would be a waste of a test, it's prone to error, and it's slow.

Instead, in this situation all you need to test is that the `href` property is correct!

```javascript
// this is much easier to do and
// will run considerably faster
cy
  .visit("http://localhost:8080")
  .get("a").should("have.href", "https://google.com") // pass with no page load!
```

Okay but let's say you're worried about `google.com` serving up the right HTML content. How would you test that? Easy! Just make a `cy.request` directly to it.

`cy.request` is super special because it is **NOT bound to CORS or same-origin policy**. You should be using it everywhere.

```javascript
cy
  .visit("http://localhost:8080")
  .get("a").then(function($a){
    // pull off the fully qualified href
    // from the <a>
    var url = $a.prop("href")

    // make a cy.request to it
    cy.request(url).its("body").should("include", "</html>") // true
  })
```

Still not satisfied? Do you really want to click through to another application? Okay then read about [disabling web security](#section-disabling-web-security).

***

## Form Submission Redirects

When you submit a regular HTML form, the browser will follow this `HTTP(s) request`.

Let's imagine some HTML code that is served by your application from `localhost:8080`.

```html
<html>
  <form method="POST" action="/submit">
    <input type="text" name="foo" />
    <input type="submit" value="Submit" />
  </form>
</html>
```

```javascript
cy
  .visit("http://localhost:8080")
  .get("form").submit() // submit the form!
```

The problem here is that if your backend server handling the `/submit` route does a `30x` redirect to a different superdomain you will get a `cross origin` error.

```javascript
// imagine this is some node / express code
// that your localhost:8080 server has

app.post("/submit", function(req, res){
  // redirect the browser to google.com
  res.redirect("https://google.com")
})
```

The only use case we've ever encountered for this is `Single sign-on (SSO)`. In that situation you may `POST` to a different server and are redirected elsewhere (typically with the session token in the URL).

If that's the case, don't worry - you can work around it!

We are putting together a fully fledged example, but in the mean time, `cy.request` to the rescue!

`cy.request` is super special because it is **NOT bound to CORS or same-origin policy**. You should be using it everywhere.

In fact we can likely bypass the initial visit altogether and just `POST` directly to your `SSO` server.

```javascript
cy
  .request("POST", "https://sso.corp.com/auth", {username: "foo", password: "bar"})
  .then(function(response){
    // pull out the location redirect
    var loc = response.headers["Location"]

    // parse out the token from the url (assuming its in there)
    var token = parseOutMyToken(loc)

    // do something with the token that your web application expects.
    // likely the same behavior as what your SSO does under the hood
    // assuming it handles query string tokens like this
    cy.visit("http://localhost:8080?token=" + token)

    // if you don't need to work with the token you can sometimes
    // just visit the location header directly
    cy.visit(loc)
  })
```

Not working for you? Don't know how to set your token? If you still need to be able to be redirected to your SSO server you can read about [disabling web security](#section-disabling-web-security).

***

## Javascript Redirects

This is probably the hardest situation to deal with because it's usually happening due to another cause.

Perhaps you're not logged in, and you'll need to handle that setup elsewhere?

Perhaps you're using a `Single sign-on (SSO)` server and you just need to read the previous section about working around that?

If you can't figure out why your JS code is redirecting you to a different superdomain then you might want to just read about [disabling web security](#section-disabling-websecurity).

***

# Disabling Web Security

So you cannot work around any of these issues and want to disable web security?

One last thing to consider here is that every once in awhile we discover bugs in Cypress which lead to `cross origin` errors that can otherwise be fixed.

If you think you're experiencing a bug, [come into gitter](https://gitter.im/cypress-io/cypress) or [open an issue](https://github.com/cypress-io/cypress/issues/new).

There is one last issue to be aware of. **Not all browsers expose a way to turn off web security**.

Some do, some don't, and while Cypress *currently* only works in Chrome (as of October 2016), we will be adding support for other browsers. If you rely on disabling web security you will not be able to run tests on other browsers which do not support this feature.

Still here? That's cool, let's disable web security!

This works whether you're running headlessly in Cypress or in the browser GUI mode.

Simply turn off this option in `cypress.json` and we'll take care of the rest.

```javascript
// cypress.json
{
  chromeWebSecurity: false
}
```

The browser will now display insecure content, you can now navigate to any superdomain without cross origin errors, and you can access cross origin iframes which are embedded in your application.

One thing you may notice though is that Cypress still enforces visiting a single superdomain with `cy.visit`. This is an artification limitation (and one that can be removed). You should [open an issue](https://github.com/cypress-io/cypress/issues/new) and tell us what you're trying to do!
