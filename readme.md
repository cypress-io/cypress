## Introduction

The documents in this repo are synchronized remotedly with Readme.io.

`readmeio-sync` provides this functionality. Aka this enables us to commit locally, use commit messages, and know when the hell and who the hell edited the docs!

It does somewhat complicate the process and is not quite as nice as editing `Github Wikis`, but it's still pretty great.

## Getting Started

https://github.com/mobify/readmeio-sync

## Contributing

You can make changes to our documentation in two different ways:

1. Make changes **locally** here (in markdown) and then synchronize them **remotely**.
2. Make changes **remotely** in Readme.io's UI, and then synchronize them **locally** and commit to Github.

Whatever you do, just work in staging and once all changes are done, synchronize with Readme.io. This will make sure you don't do anything accidentally destructive.

> **Note:**
> It is preferable to work locally when possible. I imagine that the accepted *Suggest Edits* feature will likely force us to use the *Working Remotely* workflow to pull in those changes though.

#### Working Locally

```bash
## use proper node version
nvm use 5.3.0

## pull in all remote files only
## if there are external changes
## not committed to this repo
readmeio-sync init

## modify local files
<hack hack hack>

## commit to github
git commit -am 'updated docs'

## deploy 'staging' changes to readme.io
readmeio-sync upload

## or deploy 'production' changes to readme.io
readmeio-sync upload --production

## clean out 'staging' deleted files on readme.io
readmeio-sync clean-remote

## or clean out 'production' deleted files on readme.io
readmeio-sync clean-remote --production
```

#### Working Remotely

```bash
## make changes remotely on readme.io's web UI
<hack hack hack>

## pull them down locally
readmeio-sync init

## commit to github
git commit -am 'updated files'
```