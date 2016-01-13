## Introduction

The documents in this repo are synchronized remotedly with Readme.io.

`readmeio-sync` provides this functionality. Aka this enables us to commit locally, use commit messages, and know when the hell and who the hell edited the docs!

It does somewhat complicate the process and is not quite as nice as editing `Github Wikis`, but it's still pretty great.

## Getting Started

https://github.com/mobify/readmeio-sync

## Contributing

To make changes to our documentation:

1. Make changes **locally** here (in markdown) and then synchronize them **remotely**.

#### Working Locally

You may need to login with your Readme.io credentials before working.

```bash
export README_EMAIL=<readmeio_account_email>
export README_PASSWORD=<readmeio_account_password>
```

```bash
## use proper node version
nvm use 5.3.0

## modify local files
<hack hack hack>

## commit to github
git commit -am 'updated docs'

## deploy changes to readme.io
npm run upload

## clean out deleted files on readme.io
npm run clean
```

#### Writing Docs

**Edits should NEVER be made from the Readme.io's web ui**

In Guides, to link to another page on Guides:
```md
[Installing and Running](/docs/installing-and-running)
```

In Guides, to link to another page on API:
```md
[and](/v1.0/docs/and)
```