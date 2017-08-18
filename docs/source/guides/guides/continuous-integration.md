---
title: Continuous Integration
comments: false
---

Running Cypress tests in Continuous Integration is as easy as running tests locally. You generally only need to do two things:

  1. **Include Cypress package**

  ```shell
  npm install cypress --save-dev
  ```

  2. **Run Cypress**

  ```shell
  cypress run
  ```

That's it! This will go out and {% url 'install Cypress' installing-cypress %}, and then run all your tests.

For a comprehensive list of all the options you can pass to {% url '`cypress run`' command-line#cypress-run %}, {% url 'refer to the command line documentation' command-line %}.

{% img /img/guides/travis-ci-logs-running-cypress.gif "travis-logs" %}

# What's Supported?

Cypress should run on **all** CI providers. We currently have seen Cypress working on the following services:

- {% url "Jenkins" https://jenkins.io/ %} (Linux)
- {% url "TravisCI" https://travis-ci.org/ %}
- {% url "CircleCI" https://circleci.com %}
- {% url "CodeShip" https://codeship.com/ %}
- {% url "GitLab" https://gitlab.com %}
- {% url "Docker" https://www.docker.com/ %}

# Setting Up CI

Depending on which CI provider you use, you may need a config file. You'll want to refer to your CI provider's documentation to know where to add the commands to install and run Cypress. For more example config files check out any of our {% url "example apps" unit-testing-recipe %}.

## Travis

***Example `.travis.yml` config file***

```yaml
script:
  - cypress run --record
```

## CircleCI

***Example `circle.yml` config file***

```yaml
test:
  override:
    - cypress run --record
```

## Docker

We have {% url 'created' https://github.com/cypress-io/docker %} an official {% url 'cypress/base' 'https://hub.docker.com/r/cypress/base/' %} container with all of the required dependencies installed. Just add Cypress and go! As an experiment we have also created a complete {% url 'cypress/internal:cy' 'https://hub.docker.com/r/cypress/internal/tags/' %} image with pre-installed Cypress; just call {% url '`cypress run`' command-line#cypress-run %}.

If you don't use this image you must install all of the {% url 'linux dependencies' continuous-integration#Dependencies %}. See {% issue 165 'this issue' %} for more information.

***Docker CI examples***

* {% url "GitLab" https://gitlab.com/cypress-io/cypress-example-docker-gitlab %}
* {% url "Codeship" https://github.com/cypress-io/cypress-example-docker-codeship %}
* {% url "CircleCI" https://github.com/cypress-io/cypress-example-docker-circle %}
* {% url "CircleCI with Workflows" https://github.com/cypress-io/cypress-example-docker-circle-workflows %}

# Dependencies

If you are not using one of the above CI providers then make sure your system has these dependencies installed.

```shell
apt-get install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound
```

If you run {% url '`cypress run`' command-line#cypress-run %} and see no output {% url 'see this section for troubleshooting this known issue' continuous-integration#Troubleshooting %}.

# Recording Tests in CI

Cypress can record your tests running and make them available in our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

***Recorded tests allow you to:***

- See the number of failed, pending and passing tests.
- Get the entire stack trace of failed tests.
- View screenshots taken when tests fail and when using {% url `cy.screenshot()` screenshot %}.
- Watch a video of your entire test run or a clip at the point of test failure.

***To record tests running:***

1. {% url 'Setup your project to record' projects-dashboard#Set-up-a-Project-to-Record %}
2. {% url 'Pass the `--record` flag to `cypress run`' command-line#cypress-run %}

You can {% url 'read more about the Dashboard here' features-dashboard %}.

# Environment Variables

You can set various environment variables to modify how Cypress runs.

## Record Key

If you are {% url 'recording your runs' continuous-integration#Recording-Tests-in-CI %} on a public project, you'll want to protect your Record Key. {% url 'Learn why.' projects-dashboard#Authentication %}

Instead of hard coding it into your run command like this:

```shell
cypress run --record --key <record_key>
```

You can set the record key as the environment variable, `CYPRESS_RECORD_KEY`, and we'll automatically use that value. You can now omit the `--key` flag when recording.

```shell
cypress run --record
```

Typically you'd set this inside of your CI provider.

***CircleCI Environment Variable***

![Record key environment variable](/img/guides/cypress-record-key-as-environment-variable.png)

***TravisCI Environment Variable***

![Travis key environment variable](/img/guides/cypress-record-key-as-env-var-travis.png)

## Other Configuration Values

You can set any configuration value as an environment variable. This overrides values in your `cypress.json`.

***Typical use cases would be modifying things like:***

- `CYPRESS_BASE_URL`
- `CYPRESS_VIDEO_COMPRESSION`
- `CYPRESS_REPORTER`

{% note info %}
Refer to the {% url 'configuration' configuration#Environment-Variables %} for more examples.
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
Refer to the dedicated {% url 'Environment Variables Guide' environment-variables %} for more examples.
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

You need to select their {% url "`Ubuntu 12.04` image" https://circleci.com/docs/build-image-precise/ %}. The `Ubuntu 14.04` image does not have all of the required dependencies installed by default. You can likely install them yourself. {% issue 315 'There is an open issue for this here.' %}

![Ubuntu build environment in circle](/img/guides/ubuntu-build-environment-in-circle-ci.png)

## Jenkins

You need to install all of the {% url 'linux dependencies' continuous-integration#Dependencies %}.

## Docker

If you are running long runs on Docker, you need to set the `ipc` to `host` mode. {% issue 350 'This issue' %} describes exactly what to do.

# Troubleshooting

## No Output

***Symptom***

After executing {% url '`cypress run`' command-line#cypress-run %} you don't see any output. In other words: nothing happens.

***Problem***

You are missing  {% url 'a dependency' continuous-integration#Dependencies %} above. *Please install all of the dependencies.*

The reason you're not seeing any output is a longstanding issue with Cypress which {% issue 317 'there is an open issue for' %}. We are working on improving this experience!

***Seeing Errors***

Although running {% url '`cypress run`' command-line#cypress-run %} will yield no output - you can see the actual dependency failure by invoking the Cypress binary directly.

***Invoke the Cypress binary directly***

```shell
/home/YOUR_USER/.cypress/Cypress/Cypress
```
