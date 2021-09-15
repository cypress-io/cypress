# [@cypress/vite-dev-server-v2.1.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.8...@cypress/vite-dev-server-v2.1.0) (2021-09-10)


### Features

* allow usage of @react/plugins with cypress.config.js ([#17738](https://github.com/cypress-io/cypress/issues/17738)) ([da4b1e0](https://github.com/cypress-io/cypress/commit/da4b1e06ce33945aabddda0e6e175dc0e1b488a5))

# [@cypress/vite-dev-server-v2.0.8](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.7...@cypress/vite-dev-server-v2.0.8) (2021-08-30)


### Bug Fixes

* prevent vite from crashing where there are no support files or specs found ([#17624](https://github.com/cypress-io/cypress/issues/17624)) ([ae0ea87](https://github.com/cypress-io/cypress/commit/ae0ea87802168c524ee5cfe04d0aa59a46195a7d)), closes [#17373](https://github.com/cypress-io/cypress/issues/17373)
* publish the types for vite-dev-server ([#17786](https://github.com/cypress-io/cypress/issues/17786)) ([a94ff69](https://github.com/cypress-io/cypress/commit/a94ff69d09564140ad0cc890771175396eb351cc)), closes [#17648](https://github.com/cypress-io/cypress/issues/17648)
* repair re-run of vite-dev-server issues ([4139631](https://github.com/cypress-io/cypress/commit/4139631b159bac159bd6d2d4c020b5d8b3aa0fa7))

# [@cypress/vite-dev-server-v2.0.7](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.6...@cypress/vite-dev-server-v2.0.7) (2021-08-12)


### Bug Fixes

* **vite-dev-server:** chain update all specs when changing child  ([#17693](https://github.com/cypress-io/cypress/issues/17693)) ([66e8896](https://github.com/cypress-io/cypress/commit/66e8896b66207e9ce2d1a5dd9f66f73fe58a1e7e)), closes [#17691](https://github.com/cypress-io/cypress/issues/17691)

# [@cypress/vite-dev-server-v2.0.6](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.5...@cypress/vite-dev-server-v2.0.6) (2021-08-10)


### Bug Fixes

* prevent vite from crashing where there are no support files or s… ([#17641](https://github.com/cypress-io/cypress/issues/17641)) ([1d2b053](https://github.com/cypress-io/cypress/commit/1d2b053322eb36935928122e4552563a7f98f35d)), closes [#17624](https://github.com/cypress-io/cypress/issues/17624) [#17373](https://github.com/cypress-io/cypress/issues/17373)

# [@cypress/vite-dev-server-v2.0.5](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.4...@cypress/vite-dev-server-v2.0.5) (2021-08-04)


### Bug Fixes

* reload every spec file when support updated ([#17598](https://github.com/cypress-io/cypress/issues/17598)) ([efc38b6](https://github.com/cypress-io/cypress/commit/efc38b67497b48db5b3a636acac3be45dd930593))

# [@cypress/vite-dev-server-v2.0.4](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.3...@cypress/vite-dev-server-v2.0.4) (2021-07-31)


### Bug Fixes

* **server:** correctly include projectRoot when adding a CI project from GUI ([#17514](https://github.com/cypress-io/cypress/issues/17514)) ([e49b3a4](https://github.com/cypress-io/cypress/commit/e49b3a4b9fc99bb392235b7cad36139faff08eec))
* only rerun if current spec+deps changed ([#17269](https://github.com/cypress-io/cypress/issues/17269)) ([1433b64](https://github.com/cypress-io/cypress/commit/1433b64d25f186774471593892c1c03aa954c4e3))

# [@cypress/vite-dev-server-v2.0.3](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.2...@cypress/vite-dev-server-v2.0.3) (2021-07-27)


### Bug Fixes

* make vite re-run on supportFile change ([#17485](https://github.com/cypress-io/cypress/issues/17485)) ([6cbf4c3](https://github.com/cypress-io/cypress/commit/6cbf4c38296d6287fbcbb0ef5ecd21cf63606153))

# [@cypress/vite-dev-server-v2.0.2](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.1...@cypress/vite-dev-server-v2.0.2) (2021-07-15)


### Bug Fixes

* **vite:** autorefresh new spec files ([#17270](https://github.com/cypress-io/cypress/issues/17270)) ([99f9352](https://github.com/cypress-io/cypress/commit/99f93528c87b22656d4d732dfb2ed6843991d861))

# [@cypress/vite-dev-server-v2.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.0.0...@cypress/vite-dev-server-v2.0.1) (2021-06-18)


### Bug Fixes

* vite startDevServer needs to return close() ([#16950](https://github.com/cypress-io/cypress/issues/16950)) ([67b2b3b](https://github.com/cypress-io/cypress/commit/67b2b3b9be13437e56384e377c7d32c6e433e064))

# [@cypress/vite-dev-server-v2.0.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.7...@cypress/vite-dev-server-v2.0.0) (2021-05-31)


### Continuous Integration

* deliver vue3 on master ([#16728](https://github.com/cypress-io/cypress/issues/16728)) ([0ee001f](https://github.com/cypress-io/cypress/commit/0ee001f6250604711653caf5365d8aca063a9cad)), closes [#15100](https://github.com/cypress-io/cypress/issues/15100)


### BREAKING CHANGES

* no support for vue 2 anymore

* build: disable auto deliver of next vue

* Revert "feat(vue): vue 3 support in @cypress/vue"

This reverts commit 8f55d7baaff1f240677239ae5fdc4180c4a06475.

* Revert "build: disable auto deliver of next vue"

This reverts commit ed46c9e5c551e57901dbdc75db2e83bf194c4b18.

* chore: release @cypress/vue-v1.1.0-alpha.1

[skip ci]
* dropped support for vue 2 in favor of vue 3

* test: remove filter tests not relevant in vue 3

* build: try publishing as a private new major

* chore: release @cypress/vue-v3.0.0-alpha.1

[skip ci]

* chore: bring back access public

* fix: update dependency to webpack dev server

* chore: release @cypress/vue-v3.0.0-alpha.2

[skip ci]

* chore: remove unnecessary dependency

* fix: mistreatment of monorepo dependency

* chore: release @cypress/vue-v3.0.0-alpha.3

[skip ci]

* chore: release @cypress/vue-v3.0.0-alpha.4

[skip ci]

* fix: use __cy_root at the root element

* build: avoid using array spread (tslib imports issue)

* fix: setup for cypress vue tests

* fix: add cleanup event

* test: make sure we use the right build of compiler

* chore: downgrade VTU to rc-1

* chore: release @cypress/vue-v3.0.0

[skip ci]

* chore: upgrade vue version to 3.0.11

* fix: adjust optional peer deps

* fix: allow fo any VTU 2 version using ^

* test: ignore nuxt example

* test: update yarn lock on vue cli

* chore: release @cypress/vue-v3.0.1

[skip ci]

* ci: release vue@next on master

* test: fix vue3 examples

* ci: open only needed server in circle npm-vue

Co-authored-by: semantic-release-bot <semantic-release-bot@martynus.net>
Co-authored-by: Lachlan Miller <lachlan.miller.1990@outlook.com>

# [@cypress/vite-dev-server-v1.2.7](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.6...@cypress/vite-dev-server-v1.2.7) (2021-05-11)


### Bug Fixes

* **vite-dev-server:** only re-run tests when specs deps are updated ([#16215](https://github.com/cypress-io/cypress/issues/16215)) ([31d89a5](https://github.com/cypress-io/cypress/commit/31d89a5e1af9acf173a24c26903a48ff11cde894))

# [@cypress/vite-dev-server-v1.2.6](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.5...@cypress/vite-dev-server-v1.2.6) (2021-04-29)


### Bug Fixes

* **vite-dev-server:** only re-run tests when specs deps are updated ([#16215](https://github.com/cypress-io/cypress/issues/16215)) ([4d23476](https://github.com/cypress-io/cypress/commit/4d23476711d71711590752cada4863a03e1f777f))
* analyze deps of the specs before starting ([3f52def](https://github.com/cypress-io/cypress/commit/3f52def82e7afe9ee0942e6621924d1d6af5efa8))

# [@cypress/vite-dev-server-v1.2.5](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.4...@cypress/vite-dev-server-v1.2.5) (2021-04-27)


### Bug Fixes

* **vite-dev-server:** fix url to the client on win ([#16220](https://github.com/cypress-io/cypress/issues/16220)) ([c809d19](https://github.com/cypress-io/cypress/commit/c809d19cc139200232a4292529b3bac60d68e995))

# [@cypress/vite-dev-server-v1.2.4](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.3...@cypress/vite-dev-server-v1.2.4) (2021-04-26)


### Bug Fixes

* accept absolute paths in vite dev server ([#16148](https://github.com/cypress-io/cypress/issues/16148)) ([684730f](https://github.com/cypress-io/cypress/commit/684730fb68b0394a5c602421b38fbb4d066bf439))

# [@cypress/vite-dev-server-v1.2.3](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.2...@cypress/vite-dev-server-v1.2.3) (2021-04-22)


### Bug Fixes

* make vite-dev-server work on windows ([#16103](https://github.com/cypress-io/cypress/issues/16103)) ([a380d02](https://github.com/cypress-io/cypress/commit/a380d020a4211ddbb2f10a61308bd1a6d2e45057))

# [@cypress/vite-dev-server-v1.2.2](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.1...@cypress/vite-dev-server-v1.2.2) (2021-04-15)


### Bug Fixes

* conditionally require vue and update alias if installed ([#16000](https://github.com/cypress-io/cypress/issues/16000)) ([8b97b46](https://github.com/cypress-io/cypress/commit/8b97b4641e7e1b2af8ea38d44273dcc149267e20))

# [@cypress/vite-dev-server-v1.2.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.2.0...@cypress/vite-dev-server-v1.2.1) (2021-04-13)


### Bug Fixes

* **vite-dev-server:** Use viteConfig.server.port if defined ([#15893](https://github.com/cypress-io/cypress/issues/15893)) ([d0dcf22](https://github.com/cypress-io/cypress/commit/d0dcf221018cf2c364bc00ff6f750146eb048e7d))

# [@cypress/vite-dev-server-v1.2.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.1.0...@cypress/vite-dev-server-v1.2.0) (2021-04-05)


### Bug Fixes

* **vite-dev-server:** import cypress client script asynchronously to avoid flake ([#15778](https://github.com/cypress-io/cypress/issues/15778)) ([88a3830](https://github.com/cypress-io/cypress/commit/88a3830d68ef71290ecad3ab7ba440370f314741))
* make sure the vite server starts on a new port ([57e2988](https://github.com/cypress-io/cypress/commit/57e29886cb731a90724dc5473cfd97760b370c62))
* make vite dev server open on a free port ([#15756](https://github.com/cypress-io/cypress/issues/15756)) ([cd66b05](https://github.com/cypress-io/cypress/commit/cd66b05307ff3f40b3a8bf312a409de2e9ab9399))


### Features

* simplify vite server ([#15416](https://github.com/cypress-io/cypress/issues/15416)) ([adc2fc8](https://github.com/cypress-io/cypress/commit/adc2fc893fbf32f1f6121d18ddb8a8096e5ebf39))

# [@cypress/vite-dev-server-v1.1.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.0.2...@cypress/vite-dev-server-v1.1.0) (2021-03-15)


### Bug Fixes

* **component-testing:** ensure to call unmount after each test ([#15385](https://github.com/cypress-io/cypress/issues/15385)) ([153fc51](https://github.com/cypress-io/cypress/commit/153fc515a53343758393db795879a64494374551))
* **component-testing:** make sure vite html is published on npm ([#15379](https://github.com/cypress-io/cypress/issues/15379)) ([325a7ec](https://github.com/cypress-io/cypress/commit/325a7ec56e9dd91e25f39184407751daf3b9a371))
* **component-testing:** vite server dependency refresh ([#15366](https://github.com/cypress-io/cypress/issues/15366)) ([59dbed9](https://github.com/cypress-io/cypress/commit/59dbed90dcfd6c71d3478cd61d0228cff702087f))


### Features

* create-cypress-tests installation wizard ([#9563](https://github.com/cypress-io/cypress/issues/9563)) ([c405ee8](https://github.com/cypress-io/cypress/commit/c405ee89ef5321df6151fdeec1e917ac952c0d38)), closes [#9116](https://github.com/cypress-io/cypress/issues/9116)
* rollup-dev-server for CT ([#15215](https://github.com/cypress-io/cypress/issues/15215)) ([6f02719](https://github.com/cypress-io/cypress/commit/6f02719511459ebe682ec85eecc02f6b418d233a))

# [@cypress/vite-dev-server-v1.0.2](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.0.1...@cypress/vite-dev-server-v1.0.2) (2021-03-10)


### Bug Fixes

* trigger release of the packages ([#15405](https://github.com/cypress-io/cypress/issues/15405)) ([1ce5755](https://github.com/cypress-io/cypress/commit/1ce57554e260850472cf753de68858f47b3f7b3d))

# [@cypress/vite-dev-server-v1.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v1.0.0...@cypress/vite-dev-server-v1.0.1) (2021-02-17)


### Bug Fixes

* trigger semantic release ([#15128](https://github.com/cypress-io/cypress/issues/15128)) ([3a6f3b1](https://github.com/cypress-io/cypress/commit/3a6f3b1928277f7086062b1107f424e5a0247e00))

# @cypress/vite-dev-server-v1.0.0 (2021-02-16)


### Features

* adding vite-dev-server plugin ([#14839](https://github.com/cypress-io/cypress/issues/14839)) ([0225406](https://github.com/cypress-io/cypress/commit/022540605139545d137125dbb6a85eb995053fcb))
