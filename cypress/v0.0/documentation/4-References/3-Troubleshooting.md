slug: troubleshooting
excerpt: Get help for common problems in Cypress

# Contents

- :fa-angle-right: [Installation](#section-installation)
  - [Running in CI](#section-running-in-ci)

***

# Installation

There are known problems installing on Linux for:

- [Wheezy](https://github.com/cypress-io/cypress/issues/87)
- [Jenkins](https://github.com/cypress-io/cypress-cli/issues/2)

***

## Running In CI

By default Cypress expects your CI provider to have:

- [Node installed](https://github.com/creationix/nvm)
- [XVFB installed](http://tobyho.com/2015/01/09/headless-browser-testing-xvfb/)

In addition, you should install the following libraries:

```shell
apt-get install libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3
```

Every CI service has these dependencies installed, and therefore Cypress should run on every single service. However if you're running your own `Jenkins` server, you'll likely need to install what is listed above.
