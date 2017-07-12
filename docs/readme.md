# Cypress Documentation

The code for Cypress's Documentation, Guides, and API.

* https://docs.cypress.io

## Introduction

The documents in this repo are generated using [Hexo](https://hexo.io/).

## Contributing

### Installing Dependencies

From the `docs` directory:

```shell
npm install

npm run build
```

### Starting the server

```shell
npm start
```

Visit [http://localhost:2222/](http://localhost:2222/)

### Writing Docs

#### Links

Links are all handled through our [cypress.on](https://github.com/cypress-io/cypress-on) api.

Link all pages but their name (property key) in `source/_data/sidebar.yml`

- https://on.cypress.io/NAME_OF_PAGE
- https://on.cypress.io/and
- https://on.cypress.io/visit
- https://on.cypress.io/unit-testing-recipe
- https://on.cypress.io/introduction-to-cypress
- https://on.cypress.io/writing-your-first-test
- https://on.cypress.io/general-questions-faq

### Deploying

```shell
npm run deploy
```

You can specify all options for deploying via command line arguments.
For example to deploy to production and scrape the docs

```shell
npm run deploy -- --environment production --scrape
```

By default, only deploying from `master` branch is set, but you can force
deployment by using `--force` option.

To debug deployment actions, run with `DEBUG=deploy ...` environment variable.

**note**

on CI, the deployment and scraping configuration are passed via environment
variables `support__aws_credentials_json` and `support__circle_credentials_json`
which are just JSON files as strings.

```shell
cat support/.circle-credentials.json | pbcopy
```
