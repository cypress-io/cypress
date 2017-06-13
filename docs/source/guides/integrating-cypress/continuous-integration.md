---
title: Continuous Integration
comments: false
---

Running Cypress tests in Continous Integration is as easy as running tests locally. You generally only need to do two things:

  1. **Install the CLI tools**

  ```shell
  npm install -g cypress-cli
  ```

  2. **Run Cypress**

  ```shell
  cypress run
  ```

That's it! This will go out and [install Cypress](https://on.cypress.io/installing-cypress), and then run all your tests.

For a comprehensive list of all the options you can pass to {% url '`cypress run`' cli-tool#cypress-run %}, {% url 'refer to the CLI documentation' cli-tool %}.

![travis-logs](https://cloud.githubusercontent.com/assets/1268976/9291527/8ea21024-4393-11e5-86b7-80e3b5d1047e.gif)

# What's Supported?

Cypress should run on **all** CI providers. We currently have seen Cypress working on the following services:

- [Jenkins](https://jenkins.io/) (Linux)
- [TravisCI](https://travis-ci.org/)
- [CircleCI](https://circleci.com)
- [CodeShip](https://codeship.com/)
- [GitLab](https://gitlab.com)
- [Docker](https://www.docker.com/)

# Setting Up CI

Depending on which CI provider you use, you may need a config file. You'll want to refer to your CI provider's documentation to know where to add the commands to install and run Cypress. For more example config files check out any of our [example apps](https://on.cypress.io/guides/all-example-apps).

## Travis

**Example `.travis.yml` config file**

```yaml
before_install:
  - npm install -g cypress-cli
script:
  - cypress run --record
```

## CircleCI

**Example `circle.yml` config file**

```yaml
dependencies:
  post:
    - npm install -g cypress-cli
test:
  override:
    - cypress run --record
```

## Docker

We have [created](https://github.com/cypress-io/docker) an official [cypress/base](https://hub.docker.com/r/cypress/base/) container with all of the required dependencies installed. Just add Cypress and go! As an experiment we have also created a complete [cypress/internal:cy](https://hub.docker.com/r/cypress/internal/tags/) image with pre-installed Cypress; just call {% url '`cypress run`' cli-tool#cypress-run %}.

If you don't use this image you must install all of the [linux dependencies](https://on.cypress.io/continuous-integration#section-dependencies). See [this issue](https://github.com/cypress-io/cypress/issues/165) for more information.

**Docker CI examples**

* [GitLab](https://gitlab.com/cypress-io/cypress-example-docker-gitlab)
* [Codeship](https://github.com/cypress-io/cypress-example-docker-codeship)
* [CircleCI](https://github.com/cypress-io/cypress-example-docker-circle)

## Other

You must install these dependencies:

```shell
apt-get install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1
```

If you run {% url '`cypress run`' cli-tool#cypress-run %} and see no output [see this section for troubleshooting this known issue](#section-no-output).

# Recording Tests in CI

Cypress can record your tests running and make them available in our [Dashboard](https://on.cypress.io/dashboard).

**Recorded tests allow you to:**

- See the number of failed, pending and passing tests.
- Get the entire stack trace of failed tests.
- View screenshots taken when tests fail and when using {% url `cy.screenshot()` screenshot %}.
- Watch a video of your entire test run or a clip at the point of test failure.

**To record tests running:**

1. [Setup your project to record](https://on.cypress.io/guides/projects)
2. [Pass the `--record` flag to `cypress run`](https://on.cypress.io/how-do-i-record-runs)

You can [read more about the Dashboard here](https://on.cypress.io/guides/dashboard-features).

# Environment Variables

You can set various environment variables to modify how Cypress runs.

## Record Key

If you are [recording your runs](#recording-your-runs) on a public project, you'll want to protect your Record Key. [Learn why.](https://docs.cypress.io/docs/projects#section-how-do-a-projectid-and-record-key-work-together-)

Instead of hard coding it into your run command like this:

```shell
cypress run --record --key <record_key>
```

You can set the record key as the environment variable, `CYPRESS_RECORD_KEY`, and we'll automatically use that value. You can now omit the `--key` flag when recording.

```shell
cypress run --record
```

Typically you'd set this inside of your [CI provider](https://on.cypress.io/continuous-integration).

**CircleCI Environment Variable**

![Record key environment variable](https://cloud.githubusercontent.com/assets/1268976/22868594/cabd8152-f165-11e6-8897-0e3e57d0eafd.png)

**TravisCI Environment Variable**

![Travis key environment variable](https://cloud.githubusercontent.com/assets/1268976/22868637/05c46e00-f166-11e6-9106-682d5729acca.png)

## Version

You can install a specific version of Cypress by setting the environment variable, `CYPRESS_VERSION`.

**Set the version to an older version of Cypress in CI**

![screen shot 2016-03-28 at 11 28 26 am](https://cloud.githubusercontent.com/assets/1271364/14081365/601e2da4-f4d8-11e5-8ea8-0491ffcb0999.png)

## Other Configuration Values

You can set any configuration value as an environment variable. This overrides values in your `cypress.json`.

**Typical use cases would be modifying things like:**

- `CYPRESS_BASE_URL`
- `CYPRESS_VIDEO_COMPRESSION`
- `CYPRESS_REPORTER`

{% note info %}
Refer to the [configuration docs](https://on.cypress.io/guides/configuration#section-environment-variables) for more examples.
{% endnote %}

## Custom Environment Variables

You can also set custom environment variables for use in your tests. These enable your code to reference dynamic values.

```shell
export "EXTERNAL_API_SERVER=https://corp.acme.co"
```

And then in your tests:

```javascript
cy.request({
  method: 'POST',
  url: Cypress.env('EXTERNAL_API_SERVER') + '/users/1',
  body: {
    foo: 'bar',
    baz: 'quux'
  }
})
```

{% note info %}
Refer to the dedicated [Environment Variables Guide](https://on.cypress.io/guides/environment-variables) for more examples.
{% endnote %}

# Optimizing CI with Caching

Most CI providers allow caching of directories or dependencies between builds. This allows you to cache the state of Cypress and make the builds run faster.

## Travis CI

***.travis.yml***

```yaml
cache:
  directories:
    - /home/travis/.cypress/Cypress
```

## CircleCI

***circle.yml***

```yaml
## make sure you set the correct node version based on what you've installed!
dependencies:
  cache_directories:
    - /home/ubuntu/nvm/versions/node/v6.2.2/bin/cypress
    - /home/ubuntu/nvm/versions/node/v6.2.2/lib/node_modules/cypress-cli
    - /home/ubuntu/.cypress/Cypress
```

# Known Issues

## CircleCI

You need to select their [`Ubuntu 12.04` image](https://circleci.com/docs/build-image-precise/). The `Ubuntu 14.04` image does not have all of the required dependencies installed by default. You can likely install them yourself. [There is an open issue for this here.](https://github.com/cypress-io/cypress/issues/315)

![Ubuntu build environment in circle](https://cloud.githubusercontent.com/assets/1268976/20771195/6e93e9f4-b716-11e6-809b-f4fd8f6fa439.png)

## Jenkins

You need to install all of the [linux dependencies](#section-dependencies).

## Docker

If you are running long runs on Docker, you need to set the `ipc` to `host` mode. [This issue](https://github.com/cypress-io/cypress/issues/350) describes exactly what to do.

# Troubleshooting

## No Output

**Symptom**

After executing {% url '`cypress run`' cli-tool#cypress-run %} you don't see any output. In other words: nothing happens.

**Problem**

You are missing [a dependency](#Dependencies) above. *Please install all of the dependencies.*

The reason you're not seeing any output is a longstanding issue with Cypress which [there is an open issue for](https://github.com/cypress-io/cypress/issues/317). We are working on improving this experience!

**Seeing Errors**

Although running {% url '`cypress run`' cli-tool#cypress-run %} will yield no output - you can see the actual dependency failure by invoking the Cypress binary directly.

***Invoke the Cypress binary directly***

```shell
/home/<user>/.cypress/Cypress/Cypress
```
