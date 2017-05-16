# Cypress Documentation

The code for Cypress's Documentation, Guides, and API.

* https://docs.cypress.io

## Introduction

The documents in this repo are generated using [Hexo](https://hexo.io/).

## Contributing

### Installing Dependencies

```shell
npm install
```

### Starting the server

```shell
npm start
```

Visit [http://localhost:2222/](http://localhost:2222/)

### Writing Docs

#### Links

Links are all handled through our [cypress.on](https://github.com/cypress-io/cypress-on) api.

To link to a page on Guides:
```md
[Installing and Running](https://on.cypress.io/guides/$slug)
```

To link to a page on API:
```md
[and](https://on.cypress.io/api/$slug)
```

#### Creating New Files

When creating new files, each file requires a title followed by `---`:
```md
title: Making Assertions
<!-- Set comments to true to add Disqus -->
comments: true   
---
```

### Deploying

```shell
npm run deploy
```
