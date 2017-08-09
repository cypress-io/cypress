# Deploy Cypress Documentation

## Table of Contents

- [Automatic Deployment](#automatic-deployment)
- [Manual Deployment](#manual-deployment)
- [Check Latest Deployed Version](#check-latest-deployed-version)

## Automatic Deployment

Any commits or PR requests merged that touch any file in the `docs` directory will trigger a deployment.

## Manual Deployment

You can only deploy the Cypress documentation manually if
you are a member of the Cypress organization.

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

## Check Latest Deployed Version

You can see the latest deployed version, including deployment date at [https://docs.cypress.io/build.json](https://docs.cypress.io/build.json)
