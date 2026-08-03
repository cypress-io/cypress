# Example: HTTP `QUERY` method with `cy.request` and `cy.intercept`

A tiny, self-contained project to see how Cypress renders the HTTP **`QUERY`**
method in the command log — for both `cy.request` and `cy.intercept`.

`QUERY` is a safe, idempotent method (like `GET`) that is allowed to carry a
request body describing the query, per the IETF HTTP "safe method with body"
draft.

## What's here

```
query-method-request-intercept/
├── server.js                       # zero-dependency server; handles QUERY /api/search
├── public/index.html               # AUT: a Search button that fetch()es with method QUERY
├── cypress.config.js               # baseUrl -> http://127.0.0.1:5599
├── cypress/e2e/
│   ├── request-query.cy.js         # cy.request({ method: 'QUERY', ... })
│   └── intercept-query.cy.js       # cy.intercept('QUERY', ...) — stub and spy
└── package.json
```

## Run it

```bash
cd repros/query-method-request-intercept
npm install
npm test          # starts the server, then runs Cypress against Chrome
```

Or interactively, to watch the command log render:

```bash
npm run serve         # terminal 1
npm run cypress:open  # terminal 2
```

## What to look at in the command log

- **`cy.request`** — the `request-query.cy.js` command entry shows the method
  and URL; expand it in the log to inspect the QUERY request body and the JSON
  response.
- **`cy.intercept`** — `intercept-query.cy.js` shows:
  - a `route` command with the `QUERY` method matcher,
  - the **Routes** table (top of the reporter) listing the method/route,
  - a **request** log entry (the `(req)` marker) for each matched QUERY call,
    which you can pin to inspect the request/response, and
  - `cy.wait('@search')` resolving with the interception.

The first `intercept` test **stubs** the QUERY response; the second **spies**
on it and lets the request reach the local server, so you can compare how a
stubbed vs. real QUERY request renders.
