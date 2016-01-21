slug: troubleshooting
excerpt: Get help for common problems in Cypress

# Installation

There are known problems installing on Linux for:

- [Wheezy](https://github.com/cypress-io/cypress/issues/87)
- [Jenkins](https://github.com/cypress-io/cypress-cli/issues/2)

## Running In CI

By default Cypress expects your CI provider to have:

- [Node installed](https://github.com/creationix/nvm)
- [XVFB installed](https://csshyamsundar.wordpress.com/2011/07/07/installing-xvfb-on-ubuntu/)

Every CI service has these dependencies installed, and therefore Cypress should run on every single service.

However if you're running your own `Jenkins` server, you'll likely need to install what is listed above.
