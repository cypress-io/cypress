---
title: Web Security
comments: false
---

Browsers adhere to a strict {% url "`same-origin policy`" https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy %}. This means that browsers restrict access between `<iframes>` when their origin policies do not match.

Because Cypress works from within the browser, Cypress must be able to directly communicate with your remote application at all times. Unfortunately, browsers naturally try to prevent Cypress from doing this.

To get around these restrictions, Cypress implements some strategies involving JavaScript code, the browser's internal APIs, and `network proxying` to *play by the rules* of `same-origin policy`. It is our goal to fully automate the application under test without you needing to modify your application's code - and we are *mostly* able to do this.

***Examples of what Cypress does under the hood:***

  - Injects {% url "`document.domain`" https://developer.mozilla.org/en-US/docs/Web/API/Document/domain %} into `text/html` pages.
  - Proxies all `HTTP`/`HTTPS` traffic.
  - Changes the hosted url to match that of the application under test.
  - Uses the browser's internal APIs for network level traffic.

When Cypress first loads, the internal Cypress web application is hosted on a random port: something like `http://localhost:65874/__/`.

After the first {% url `cy.visit()` visit %} command is issued in a test, Cypress changes its URL to match the origin of your remote application, thereby solving the first major hurdle of `same-origin policy`. Your application's code executes the same as it does outside of Cypress, and everything works as expected.

{% note info How is HTTPS supported? %}
Cypress does some pretty interesting things under the hood to make testing HTTPs sites work. Cypress enables you to control and stub at the network level. Therefore, Cypress must assign and manage browser certificates to be able to modify the traffic in real time. You'll notice Chrome display a warning that the 'SSL certificate does not match'. This is normal and correct. Under the hood we act as our own CA authority and issue certificates dynamically in order to intercept requests otherwise impossible to access. We only do this for the superdomain currently under test, and bypass other traffic. That's why if you open a tab in Cypress to another host, the certificates match as expected.
{% endnote %}

# Limitations

It's important to note that although we do our **very best** to ensure your application works normally inside of Cypress, there *are* some limitations you need to be aware of.

## One Superdomain per Test

Because Cypress changes its own host URL to match that of your applications, it requires that your application remain on the same superdomain for the entirety of a single test.

If you attempt to visit two different superdomains, Cypress will error. Visiting subdomains works fine. You can visit different superdomains in *different* tests, just not the *same* test.

```javascript
cy.visit('https://www.cypress.io')
cy.visit('https://docs.cypress.io') // yup all good
```

```javascript
cy.visit('https://apple.com')
cy.visit('https://google.com')      // this will immediately error
```

Although Cypress tries to enforce this limitation, it is possible for your application to bypass Cypress's ability to detect this.

***Examples of test cases that will error due to superdomain limitations:***

1. {% url `.click()` click %} an `<a>` with an `href` to a different superdomain.
2. {% url `.submit()` submit %} a `<form>` that causes your web server to redirect to you a different superdomain.
3. Issue a JavaScript redirect in your application, such as `window.location.href = '...'`, to a different superdomain.

In each of these situations, Cypress will lose the ability to automate your application and will immediately error.

Read on to learn about {% url "working around these common problems" web-security#Common-Workarounds %} or even {% url "disabling web security" web-security#Disabling-Web-Security %} altogether.

## Cross Origin Iframes

If your site embeds an `<iframe>` that is a cross-origin frame, Cypress will not be able to automate or communicate with this `<iframe>`.

***Examples of uses for cross-origin iframes:***

- Embedding a Vimeo or Youtube video.
- Displaying a credit card form from Stripe or Braintree.
- Displaying an embedded login form from Auth0.
- Showing comments from Disqus.

It's actually *possible* for Cypress to accommodate these situations the same way Selenium does, but you will never have *native* access to these iframes from inside of Cypress.

As a workaround, you may be able to use {% url "`window.postMessage`" https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage %} to directly communicate with these iframes and control them (if the 3rd party iframe supports it).

Other than that, you'll have to wait for us to implement API's to support this (check our {% issue 136 'open issue' %}), or you can {% url "disable web security" web-security#Disabling-Web-Security %}.

## Insecure Content

Because of the way Cypress is designed, if you are testing an `HTTPS` site, Cypress will error anytime you attempt to navigate back to an `HTTP` site. This behavior helps highlight a *pretty serious security problem* with your application.

***Example of accessing insecure content:***

***Test code***

```javascript
cy.visit('https://app.corp.com')
```

In your application code, you set `cookies` and store a session on the browser. Now let's imagine you have a single `insecure` link (or JavaScript redirect) in your application code.

***Application code***

```html
<html>
  <a href="http://app.corp.com/page2">Page 2</a>
</html>
```

Cypress will immediately fail with the following test code:

***Test code***

```javascript
cy.visit('https://app.corp.com')
cy.get('a').click()               // will immediately fail
```

Browsers refuse to display insecure content on a secure page. Because Cypress initially changed its URL to match `https://app.corp.com` when the browser followed the `href` to `http://app.corp.com/page2`, the browser will refuse to display the contents.

Now you may be thinking, *This sounds like a problem with Cypress because when I work with my application outside of Cypress it works just fine.*😒

However, the truth is, Cypress is exposing a *security vulnerability* in your application, and you *want* it to fail in Cypress.

`cookies` that do not have their `secure` flag set to `true` will be sent as clear text to the insecure URL. This leaves your application vulnerable to session hijacking.

This security vulnerability exists **even if** your webserver forces a `301 redirect` back to the `HTTPS` site. The original `HTTP` request was still made once, exposing insecure session information.

***The Solution***

Simply update your `HTML` or `JavaScript` code to not navigate to an insecure `HTTP` page and instead only use `HTTPS`. Additionally make sure that cookies have their `secure` flag set to `true`.

If you're in a situation where you don't control the code, or otherwise cannot work around this, you can bypass this restriction in Cypress by {% url "disabling web security" web-security#Disabling-Web-Security %}.

# Common Workarounds

Let's investigate how you might encounter `cross origin` errors in your test code and break down how to work around them in Cypress.

## External Navigation

The most common situation where you might encounter this error is when you click on an `<a>` that navigates to another superdomain.

***Application code that is served at `localhost:8080`***

```html
<html>
  <a href="https://google.com">Google</a>
</html>
```

***Test code***

```javascript
cy.visit('http://localhost:8080') // where your webserver + HTML is hosted
cy.get('a').click()               // browser attempts to load google.com, Cypress errors
```

There is essentially never any reason to visit a site that you don't control in your tests. It's prone to error and slow.

Instead, all you need to test is that the `href` property is correct!

```javascript
// this is much easier to do and will run considerably faster
cy.visit('http://localhost:8080')
cy.get('a').should('have.attr', 'href', 'https://google.com') // no page load!
```

Okay but let's say you're worried about `google.com` serving up the right HTML content. How would you test that? Easy! Just make a {% url `cy.request()` request %} directly to it. {% url `cy.request()` request %} is *NOT bound to CORS or same-origin policy*.

```javascript
cy.visit('http://localhost:8080')
cy.get('a').then(function($a) {
  // pull off the fully qualified href from the <a>
  var url = $a.prop('href')

  // make a cy.request to it
  cy.request(url).its('body').should('include', '</html>')
})
```

Still not satisfied? Do you really want to click through to another application? Okay then read about {% url "disabling web security" web-security#Disabling-Web-Security %}.

## Form Submission Redirects

When you submit a regular HTML form, the browser will follow this `HTTP(s) request`.

***Application code that is served at `localhost:8080`***

```html
<html>
  <form method="POST" action="/submit">
    <input type="text" name="email" />
    <input type="submit" value="Submit" />
  </form>
</html>
```

```javascript
cy.visit('http://localhost:8080')
cy.get('form').submit()           // submit the form!
```

If your backend server handling the `/submit` route does a `30x` redirect to a different superdomain, you will get a `cross origin` error.

```javascript
// imagine this is some node / express code
// on your localhost:8080 server

app.post('/submit', function(req, res) {
  // redirect the browser to google.com
  res.redirect('https://google.com')
})
```

A commone use case for this is `Single sign-on (SSO)`. In that situation you may `POST` to a different server and are redirected elsewhere (typically with the session token in the URL).

If that's the case, don't worry - you can work around it with {% url `cy.request()` request %}. {% url `cy.request()` request %} is special because it is **NOT bound to CORS or same-origin policy**.

In fact we can likely bypass the initial visit altogether and just `POST` directly to your `SSO` server.

```javascript
cy.request('POST', 'https://sso.corp.com/auth', {username: 'foo', password: 'bar'})
  .then(function(response) {
    // pull out the location redirect
    var loc = response.headers['Location']

    // parse out the token from the url (assuming its in there)
    var token = parseOutMyToken(loc)

    // do something with the token that your web application expects
    // likely the same behavior as what your SSO does under the hood
    // assuming it handles query string tokens like this
    cy.visit('http://localhost:8080?token=' + token)

    // if you don't need to work with the token you can sometimes
    // just visit the location header directly
    cy.visit(loc)
  })
```

Not working for you? Don't know how to set your token? If you still need to be able to be redirected to your SSO server you can read about {% url "disabling web security" web-security#Disabling-Web-Security %}.

## JavaScript Redirects

When we say *JavaScript Redirects* we are talking about any kind of code that does something like this:

```javascript
window.location.href = 'http://some.superdomain.com'
```

This is probably the hardest situation to test because it's usually happening due to another cause. You will need to figure out why your JavaScript code is redirecting. Perhaps you're not logged in, and you need to handle that setup elsewhere? Perhaps you're using a `Single sign-on (SSO)` server and you just need to read the previous section about working around that?

If you can't figure out why your JavaScript code is redirecting you to a different superdomain then you might want to just read about {% url "disabling web security" web-security#Disabling-Web-Security %}.

# Disabling Web Security

So if you cannot work around any of the issues using the suggested workarounds above, you may want to disable web security.

One last thing to consider here is that every once in a while we discover bugs in Cypress that lead to `cross origin` errors that can otherwise be fixed. If you think you're experiencing a bug, {% url "come into our chat" https://gitter.im/cypress-io/cypress %} or {% open_an_issue 'open an issue' %>.

To start, you will need to understand that *not all browsers expose a way to turn off web security*. Some do, some don't. If you rely on disabling web security, you will not be able to run tests on browsers that do not support this feature.

Still here? That's cool, let's disable web security!

***Set `chromeWebSecurity` to `false` in `cypress.json` and we'll take care of the rest.***

```json
{
  "chromeWebSecurity": false
}
```

The browser will now display insecure content, you can now navigate to any superdomain without cross origin errors, and you can access cross origin iframes that are embedded in your application.

One thing you may notice though is that Cypress still enforces visiting a single superdomain with {% url `cy.visit()` visit %}. This is an artificial limitation (and one that can be removed). You should {% open_an_issue 'open an issue' %> and tell us what you're trying to do!
