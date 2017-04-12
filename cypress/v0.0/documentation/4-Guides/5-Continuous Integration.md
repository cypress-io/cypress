slug: continuous-integration
excerpt: Run Cypress in any CI provider

# Contents

- :fa-angle-right: [What's Supported?](#what-s-supported-)
- :fa-angle-right: [Running in CI](#running-in-ci)
  - [Your CI config file](#your-ci-config-file)
  - [Recording your runs](#recording-your-runs)
- :fa-angle-right: [Using Environment Variables](#using-environment-variables)
  - [Hide your **Record Key**](#hide-your-record-key)
  - [Install a specific version](#install-a-specific-version)
  - [Modify configuration settings](#modify-configuration-settings)
  - [Change environment variables in your tests](#change-environment-variables-in-your-tests)
- :fa-angle-right: [Optimizing CI](#optimizing-ci)
  - [Caching Cypress in Travis CI](#caching-cypress-in-travis-ci)
  - [Caching Cypress in CircleCI](#caching-cypress-in-circleci)
- :fa-angle-right: [Dependencies](#dependencies)
- :fa-angle-right: [Known Issues](#known-issues)
  - [CircleCI](#circleci)
  - [Jenkins](#jenkins)
  - [Docker](#docker)
- :fa-angle-right: [Troubleshooting](#troubleshooting)
  - [No output](#no-output)

***

# What's Supported?

Cypress should run on **all** CI providers. We currently have seen Cypress working on the following services / providers:

- Jenkins (Linux)
- TravisCI
- CircleCI
- CodeShip
- GitLab
- Docker

***

# Running in CI

Running Cypress in CI is just as easy as running it locally. You generally only need to do two things:

```shell
## 1. install the CLI tools
npm install -g cypress-cli

## 2. run cypress
cypress run
```

That's it!

This will automatically go out and install Cypress, and then run all your tests.

For a comprehensive list of all the options you can pass to `cypress run`, [refer to the CLI documentation](https://on.cypress.io/cli).

![travis-logs](https://cloud.githubusercontent.com/assets/1268976/9291527/8ea21024-4393-11e5-86b7-80e3b5d1047e.gif)

***

## Your CI Config File

Depending on which CI provider you'll need to add these two lines (above) to a config file.

For instance with TravisCI and CircleCI we have:

- `.travis.yml`
- `circle.yml`

You'll want to refer to your CI providers documentation for knowing when to run those commands.

Here's a couple example config files:

```yaml
## .travis.yml

before_install:
  - npm install -g cypress-cli

script:
  - cypress run
```

```yaml
## circle.yml

dependencies:
  post:
    - npm install -g cypress-cli

test:
  override:
    - cypress run
```

For more example config files check out any of our [example apps](https://on.cypress.io/guides/all-example-apps).

***

## Recording your runs

You can automatically have Cypress record your runs and make them available in our Dashboard.

Recorded runs will contain:

- Standard output
- Failing Tests
- Screenshots
- Videos

To record your runs:

1. [Setup your project to record](https://on.cypress.io/guides/projects)
2. [Pass the --record flag to `cypress run`](https://on.cypress.io/how-do-i-record-runs)

You can [read more about the Dashboard here](https://on.cypress.io/guides/dashboard-features).

***

# Using Environment Variables

You can set various environment variables to modify how Cypress runs.

Typically you'd want to do this to:

- [Hide your **Record Key**](#hide-your-record-key)
- [Install a specific version](#install-a-specific-version)
- [Modify configuration settings](#modify-configuration-settings)
- [Change environment variables in your tests](#change-environment-variables-in-your-tests)

***

## Hide your Record Key

If you are [recording your runs](#recording-your-runs) on a public project, you'll want to protect your Record Key. [Learn why.](https://docs.cypress.io/docs/projects#how-do-a-projectid-and-record-key-work-together-)

Instead of hard coding it into your run command like this:

```shell
cypress run --record --key <record_key>
```

You can set it as an environment variable and we'll automatically use that value.

Typically you'd set this inside of your CI provider like this:

**CircleCI**
![screen shot 2017-02-12 at 8 56 17 pm](https://cloud.githubusercontent.com/assets/1268976/22868594/cabd8152-f165-11e6-8897-0e3e57d0eafd.png)

**TravisCI**
![screen shot 2017-02-12 at 8 58 01 pm](https://cloud.githubusercontent.com/assets/1268976/22868637/05c46e00-f166-11e6-9106-682d5729acca.png)

You can now omit the `--key` flag when recording.

```shell
## weeee we don't have to pass in the key here!
cypress run --record
```

***

## Install a specific version

You can install a specific version of Cypress by setting the environment variable: `CYPRESS_VERSION`.

**Set the version to an older Cypress**
![screen shot 2016-03-28 at 11 28 26 am](https://cloud.githubusercontent.com/assets/1271364/14081365/601e2da4-f4d8-11e5-8ea8-0491ffcb0999.png)

***

## Modify configuration settings

Don't forget you can also override settings in `cypress.json` to modify Cypress's behavior.

Typical use cases would be modifying things like:

- `CYPRESS_BASE_URL`
- `CYPRESS_VIDEO_COMPRESSION`
- `CYPRESS_REPORTER`

Refer to the [configuration docs](https://on.cypress.io/guides/configuration#environment-variables) for more examples.

***

## Change environment variables in your tests

Of course you can also set environment varibables for use strictly in your tests.

These enable your code to reference dynamic values.

```shell
export "EXTERNAL_API_SERVER=https://corp.acme.co"
```

And then in your tests:

```javascript
cy
  .request({
    method: "POST",
    url: Cypress.env("EXTERNAL_API_SERVER") + "/users/1",
    body: {
      foo: "bar",
      baz: "quux"
    }
  })
```

Refer to the dedicated [Environment Variables Guide](https://on.cypress.io/guides/environment-variables) for more examples.

***

# Optimizing CI

Most CI providers allow caching of directories and dependencies between builds. This allows you to save the state of Cypress, therefore making the builds run faster.

## Caching Cypress in Travis CI

```yaml
## .travis.yml

cache:
  directories:
    - /home/travis/.cypress/Cypress
```

***

## Caching Cypress in CircleCI

```yaml
## circle.yml

## make sure you set the correct node version based on what you've installed!
dependencies:
  cache_directories:
    - /home/ubuntu/nvm/versions/node/v6.2.2/bin/cypress
    - /home/ubuntu/nvm/versions/node/v6.2.2/lib/node_modules/cypress-cli
    - /home/ubuntu/.cypress/Cypress
```

***

# Dependencies

If you're using a hosted CI service such as `Travis` or `CircleCI` then you don't have to install anything.

For **everything else** you must install these dependencies:

```shell
apt-get install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1
```

If you run `cypress run` and see no output [see this section for troubleshooting this known issue](#no-output).

***

# Known Issues

## CircleCI

You need to select their [`Ubuntu 12.04` image](https://circleci.com/docs/build-image-precise/).

![](https://cloud.githubusercontent.com/assets/1268976/20771195/6e93e9f4-b716-11e6-809b-f4fd8f6fa439.png)

The `Ubuntu 14.04` image does not have all of the required dependencies installed by default. You can likely install them yourself. [There is an open issue for this here.](https://github.com/cypress-io/cypress/issues/315)

***

## Jenkins

You need to install all of the [linux dependencies](#dependencies).

***

## Docker

We don't offer an **official** docker container, but our users have created one. [This container has all of the required dependencies installed and ready to go](https://docs.cypress.io/docs/userland-extensions#docker).

If you don't use this image you must install all of the [linux dependencies](#dependencies).

See [this issue](https://github.com/cypress-io/cypress/issues/165) for more information.

If you are running **long** runs on Docker, you need to set the `ipc` to `host` mode.

[This issue](https://github.com/cypress-io/cypress/issues/350) describes exactly what to do.

***

# Troubleshooting

## No Output

**Sympton**
After executing `cypress run` you don't see any output. In other words: nothing happens.

**Problem**
You are in 100% of the cases missing [a dependency](#dependencies) above. Please install all of the dependencies.

The reason you're not seeing any output is a longstanding issue with Cypress which [there is an open issue for](https://github.com/cypress-io/cypress/issues/317).

We are working on improving this experience!

**Seeing Errors**
Although running `cypress run` will yield no output - you can see the actual dependency failure by invoking the Cypress binary directly.

```shell
## invoke the Cypress binary directly
/home/<user>/.cypress/Cypress/Cypress
```
