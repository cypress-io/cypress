# [@cypress/grep-v4.0.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.5...@cypress/grep-v4.0.0) (2023-08-29)


### breaking

* default video configuration option to false ([#27008](https://github.com/cypress-io/cypress/issues/27008)) ([9580dc2](https://github.com/cypress-io/cypress/commit/9580dc2e351d9c1583ca85333084fa61a1a4e626))


### BREAKING CHANGES

* set video to false by default (system tests need updating).

* Update cli/CHANGELOG.md

Co-authored-by: Emily Rohrbough <emilyrohrbough@users.noreply.github.com>

* chore: update type comments

* chore: update protocol snapshot

* run ci

* run ci

* set video to true for chrome browser crash test

* chore: put in workaround for failing system test spec to be fixed in 27062

* chore: allow retries on actionability tests to be at least one retry as the CI tests run faster without video on

* chore: fix flaky navigation test where done is called multiple times almsot always, but sometimes throws an error

# [@cypress/grep-v3.1.5](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.4...@cypress/grep-v3.1.5) (2023-03-15)


### Bug Fixes

* **grep:** references to cypress-grep ([#26108](https://github.com/cypress-io/cypress/issues/26108)) ([7a18b79](https://github.com/cypress-io/cypress/commit/7a18b79efae64dc1fc32fb5aaa89969e83971c6f))

# [@cypress/grep-v3.1.4](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.3...@cypress/grep-v3.1.4) (2023-02-06)

# [@cypress/grep-v3.1.3](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.2...@cypress/grep-v3.1.3) (2022-12-14)


### Bug Fixes

* **grep:** @cypress/grep types ([#24844](https://github.com/cypress-io/cypress/issues/24844)) ([55058e7](https://github.com/cypress-io/cypress/commit/55058e7783420d0946bd19eeb72a08ccf3f3a86e))

# [@cypress/grep-v3.1.2](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.1...@cypress/grep-v3.1.2) (2022-12-09)


### Bug Fixes

* declare used babel dependencies ([#24842](https://github.com/cypress-io/cypress/issues/24842)) ([910f912](https://github.com/cypress-io/cypress/commit/910f912373bf857a196e2a0d1a73606e3ee199be))

# [@cypress/grep-v3.1.1](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.0...@cypress/grep-v3.1.1) (2022-12-08)


### Bug Fixes

* fix behavior when only using inverted tags ([#24413](https://github.com/cypress-io/cypress/issues/24413)) ([b2a2e50](https://github.com/cypress-io/cypress/commit/b2a2e508638d5132fc30e01d707de81d22fde359))

# [@cypress/grep-v3.1.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.0.3...@cypress/grep-v3.1.0) (2022-10-21)


### Features

* **grep:** move cypress-grep to @cypress/grep ([#23887](https://github.com/cypress-io/cypress/issues/23887)) ([d422aad](https://github.com/cypress-io/cypress/commit/d422aadfa10e5aaac17ed0e4dd5e18a73d821490))
