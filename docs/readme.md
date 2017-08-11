# Cypress Documentation

The code for Cypress' Documentation including Guides, API, Examples, Dashboard & FAQ.

* https://docs.cypress.io

## Contributing

Please see our [Documentation Contributing Guideline](/CONTRIBUTING.md)

### Installing Dependencies

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
