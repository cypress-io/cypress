# [@cypress/vite-dev-server-v5.2.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.1.1...@cypress/vite-dev-server-v5.2.0) (2024-08-27)


### Features

* implement JIT component experiment ([#30049](https://github.com/cypress-io/cypress/issues/30049)) ([57f6110](https://github.com/cypress-io/cypress/commit/57f6110d29f0b234c969abc747f0fae29c0f4ead))

# [@cypress/vite-dev-server-v5.1.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.1.0...@cypress/vite-dev-server-v5.1.1) (2024-06-07)


### Bug Fixes

* update cypress to Typescript 5 ([#29568](https://github.com/cypress-io/cypress/issues/29568)) ([f3b6766](https://github.com/cypress-io/cypress/commit/f3b67666a5db0438594339c379cf27e1fd1e4abc))

# [@cypress/vite-dev-server-v5.1.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.7...@cypress/vite-dev-server-v5.1.0) (2024-05-21)


### Features

* support vite v5 ([#29518](https://github.com/cypress-io/cypress/issues/29518)) ([079030b](https://github.com/cypress-io/cypress/commit/079030bb5f25b0983b9046d0f692e79790d10bcf))

# [@cypress/vite-dev-server-v5.0.7](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.6...@cypress/vite-dev-server-v5.0.7) (2023-12-26)

# [@cypress/vite-dev-server-v5.0.6](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.5...@cypress/vite-dev-server-v5.0.6) (2023-08-29)


### Bug Fixes

* allow cypress config.port to override devServer.port for proxying assets ([f82fdf0](https://github.com/cypress-io/cypress/commit/f82fdf026eeab125a2b974e4257a7ac5e33640eb))

# [@cypress/vite-dev-server-v5.0.5](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.4...@cypress/vite-dev-server-v5.0.5) (2023-03-20)


### Bug Fixes

* Vite dev server add searchForWorkspaceRoot ([#26036](https://github.com/cypress-io/cypress/issues/26036)) ([6397ac6](https://github.com/cypress-io/cypress/commit/6397ac60da1bfa7149212aeab5f0ae4c5d6372d7))
* **vite-dev-server:** do not use incremental esbuild option with Vite v4.2.0+ ([#26139](https://github.com/cypress-io/cypress/issues/26139)) ([3a2b2d3](https://github.com/cypress-io/cypress/commit/3a2b2d3323310c68f72f6e42203f5e93afc1cde5))

# [@cypress/vite-dev-server-v5.0.4](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.3...@cypress/vite-dev-server-v5.0.4) (2023-02-24)


### Bug Fixes

* vite-dev-server windows ([#25889](https://github.com/cypress-io/cypress/issues/25889)) ([0981fcf](https://github.com/cypress-io/cypress/commit/0981fcf6ac3cd955dc45a554df350af5fc538b3c))

# [@cypress/vite-dev-server-v5.0.3](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.2...@cypress/vite-dev-server-v5.0.3) (2023-02-17)


### Bug Fixes

* allow running tests outside Vite project root folder ([#25801](https://github.com/cypress-io/cypress/issues/25801)) ([d54fa65](https://github.com/cypress-io/cypress/commit/d54fa65f587da2b86c8d3140f44c653888fb62ee))

# [@cypress/vite-dev-server-v5.0.2](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.1...@cypress/vite-dev-server-v5.0.2) (2022-12-09)


### Bug Fixes

* **vite-dev-server:** ensure assets are correctly reloaded ([#24965](https://github.com/cypress-io/cypress/issues/24965)) ([89c013f](https://github.com/cypress-io/cypress/commit/89c013fcedc2509850ec820f938d33f08f9cbb42))

# [@cypress/vite-dev-server-v5.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v5.0.0...@cypress/vite-dev-server-v5.0.1) (2022-12-08)


### Bug Fixes

* add v8 snapshot usage to cypress in cypress testing ([#24860](https://github.com/cypress-io/cypress/issues/24860)) ([c540284](https://github.com/cypress-io/cypress/commit/c540284f5080d46a8597e53dd2213cb6fb133078))

# [@cypress/vite-dev-server-v5.0.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v4.0.1...@cypress/vite-dev-server-v5.0.0) (2022-12-02)


### chore

* remove experimentalSessionAndOrigin flag ([#24340](https://github.com/cypress-io/cypress/issues/24340)) ([69873ae](https://github.com/cypress-io/cypress/commit/69873ae9884228f15310fd151e42cbc0cb712817))


### BREAKING CHANGES

* removed experimentalSessionAndOrigin flag. testIsolation defaults to strict

# [@cypress/vite-dev-server-v4.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v4.0.0...@cypress/vite-dev-server-v4.0.1) (2022-11-08)


### Bug Fixes

* vite-dev-server hoisting issue in binary ([#24599](https://github.com/cypress-io/cypress/issues/24599)) ([2513bea](https://github.com/cypress-io/cypress/commit/2513beac307e95267ab736a93a39cd1cd1280506))

# [@cypress/vite-dev-server-v4.0.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.4.0...@cypress/vite-dev-server-v4.0.0) (2022-11-07)


### Bug Fixes

* normalize vite config resolution ([#24369](https://github.com/cypress-io/cypress/issues/24369)) ([feba489](https://github.com/cypress-io/cypress/commit/feba489a9aeaddad3197764fe7e7405cfb4e7a56))


### BREAKING CHANGES

* vite.config.js is no longer merged when devServer.viteConfig is provided

# [@cypress/vite-dev-server-v3.4.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.3.1...@cypress/vite-dev-server-v3.4.0) (2022-11-01)


### Features

* introduce v8 snapshots to improve startup performance ([#24295](https://github.com/cypress-io/cypress/issues/24295)) ([b0c0eaa](https://github.com/cypress-io/cypress/commit/b0c0eaa508bb6dafdc1997bc00fb7ed6f5bcc160))

# [@cypress/vite-dev-server-v3.3.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.3.0...@cypress/vite-dev-server-v3.3.1) (2022-10-11)


### Bug Fixes

* CSS import in CT Support file is not working ([#24117](https://github.com/cypress-io/cypress/issues/24117)) ([5af6b27](https://github.com/cypress-io/cypress/commit/5af6b27ed972ba9bc03d4a7fa4eaaeb2c7848fc3))

# [@cypress/vite-dev-server-v3.3.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.2.0...@cypress/vite-dev-server-v3.3.0) (2022-10-06)


### Bug Fixes

* Address Vite sourcemap edge cases ([#24063](https://github.com/cypress-io/cypress/issues/24063)) ([e918fc1](https://github.com/cypress-io/cypress/commit/e918fc1a8c1b26b25207e42a6b8a879b0a3e9a2b))


### Features

* Disable file watching in component tests in run mode ([#24097](https://github.com/cypress-io/cypress/issues/24097)) ([3e01474](https://github.com/cypress-io/cypress/commit/3e014743909b35f54b697d2a759e4a2c5b67b5b7))

# [@cypress/vite-dev-server-v3.2.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.1.1...@cypress/vite-dev-server-v3.2.0) (2022-09-29)


### Bug Fixes

* support type: module in Node.js 16.17.0+ and 18.6.0+ ([#23637](https://github.com/cypress-io/cypress/issues/23637)) ([b6dad0a](https://github.com/cypress-io/cypress/commit/b6dad0a674279936a9816939963bbf129647cee7))


### Features

* allow vite/webpack config to be an async function ([#23605](https://github.com/cypress-io/cypress/issues/23605)) ([4c647f6](https://github.com/cypress-io/cypress/commit/4c647f6d5b0f58a797b50436e63c645418bc07ac))
* CT stack traces ([#23916](https://github.com/cypress-io/cypress/issues/23916)) ([bf590eb](https://github.com/cypress-io/cypress/commit/bf590eba3f1cf46b04f6a1252e51da5c5a3dc7c2))

# [@cypress/vite-dev-server-v3.1.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.1.0...@cypress/vite-dev-server-v3.1.1) (2022-08-15)


### Bug Fixes

* vite v3 not working with node >=17 ([#23048](https://github.com/cypress-io/cypress/issues/23048)) ([2226b28](https://github.com/cypress-io/cypress/commit/2226b2834aabc90eab532bd7cf86407e8c7248df))

# [@cypress/vite-dev-server-v3.1.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v3.0.0...@cypress/vite-dev-server-v3.1.0) (2022-08-11)


### Bug Fixes

* retry on EMFILE always, lint sync FS calls ([#22175](https://github.com/cypress-io/cypress/issues/22175)) ([d01932b](https://github.com/cypress-io/cypress/commit/d01932bf751a6edf758451d8d19a74fe07e799ea))


### Features

* support vite.config.mts and vite.config.cts ([#22782](https://github.com/cypress-io/cypress/issues/22782)) ([8678053](https://github.com/cypress-io/cypress/commit/8678053f7d822cda90fe653fd1aa87efd09cf769))
* update to Vite 3 ([#22915](https://github.com/cypress-io/cypress/issues/22915)) ([6adba46](https://github.com/cypress-io/cypress/commit/6adba462ea6b76dbb96f99aa3837492ca1f17ed3))

# [@cypress/vite-dev-server-v3.0.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.2.3...@cypress/vite-dev-server-v3.0.0) (2022-06-13)


### Bug Fixes

* issue with compilation failures in component testing ([#21599](https://github.com/cypress-io/cypress/issues/21599)) ([f2bce02](https://github.com/cypress-io/cypress/commit/f2bce02f5dcab7a73a2a1b8e102518d706a29c25))
* restart dev-server on config change ([#21212](https://github.com/cypress-io/cypress/issues/21212)) ([00a0f5a](https://github.com/cypress-io/cypress/commit/00a0f5a0e905fdfe5ef9f8ba71f915ed20ca4b72))
* sanitize internal vite plugins ([#22055](https://github.com/cypress-io/cypress/issues/22055)) ([3b5a245](https://github.com/cypress-io/cypress/commit/3b5a245ec4aa9bf9f348fbc4bc2f0decc7c4a692))
* supportFile path and supportFile false for vite on windows ([#21156](https://github.com/cypress-io/cypress/issues/21156)) ([dd180c8](https://github.com/cypress-io/cypress/commit/dd180c89b27546b0c96cc3f4fb4e75d983c8003e))
* UNIFY-1774 error if component config is not sourced for webpack/vite ([#21563](https://github.com/cypress-io/cypress/issues/21563)) ([566a7b1](https://github.com/cypress-io/cypress/commit/566a7b1feb0fc1a8f1ccf83a23d8ad7a94409a6b))
* use resolved port for vite ([#21490](https://github.com/cypress-io/cypress/issues/21490)) ([630e422](https://github.com/cypress-io/cypress/commit/630e4220ca5ebbaa8c39044b86d434510b3a0f1b))
* wire up scaffolded indexHtml to dev servers ([#20453](https://github.com/cypress-io/cypress/issues/20453)) ([3a8797e](https://github.com/cypress-io/cypress/commit/3a8797e54db9fd0ef93a14ddc71c138ba8251e53))


### chore

* prep npm packages for use with Cypress v10 ([b924d08](https://github.com/cypress-io/cypress/commit/b924d086ee2e2ccc93303731e001b2c9e9d0af17))


### Features

* index.html configurability ([#18242](https://github.com/cypress-io/cypress/issues/18242)) ([745b3ac](https://github.com/cypress-io/cypress/commit/745b3ac4518302983522daedf817623334feae5b))
* Set up cypress in cypress ([#19602](https://github.com/cypress-io/cypress/issues/19602)) ([ed51bcb](https://github.com/cypress-io/cypress/commit/ed51bcbdda480f90bef557f06c297098f1897499))
* Update vite dev dependency ([#17489](https://github.com/cypress-io/cypress/issues/17489)) ([e2f395e](https://github.com/cypress-io/cypress/commit/e2f395e330f384993ed1116469102a5315a21270)), closes [#17551](https://github.com/cypress-io/cypress/issues/17551)
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))
* Update "@vitejs/plugin-vue" dev dependency ([#18514](https://github.com/cypress-io/cypress/issues/18514)) ([9a2e550](https://github.com/cypress-io/cypress/commit/9a2e55071d5b6dcfd97ff750b80548b834b94d30))


### BREAKING CHANGES

* new version of packages for Cypress v10

# [@cypress/vite-dev-server-v2.2.3](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.2.2...@cypress/vite-dev-server-v2.2.3) (2022-05-10)


### Bug Fixes

* handle specs with white space in vite-dev-server ([#21386](https://github.com/cypress-io/cypress/issues/21386)) ([f1c3a9b](https://github.com/cypress-io/cypress/commit/f1c3a9b3186057dd63645fd9e617f343db5c473b))

# [@cypress/vite-dev-server-v2.2.2](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.2.1...@cypress/vite-dev-server-v2.2.2) (2021-12-16)


### Bug Fixes

* check the port is avail on all local hosts ([#19402](https://github.com/cypress-io/cypress/issues/19402)) ([4826175](https://github.com/cypress-io/cypress/commit/4826175040bfc024a36df47dc0c74f2871fa944f))

# [@cypress/vite-dev-server-v2.2.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.2.0...@cypress/vite-dev-server-v2.2.1) (2021-11-19)


### Bug Fixes

* compile npm packages for node 12 ([#18989](https://github.com/cypress-io/cypress/issues/18989)) ([30b3eb2](https://github.com/cypress-io/cypress/commit/30b3eb2376bc1ed69087ba96f60448687e8489e6))

# [@cypress/vite-dev-server-v2.2.0](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.1.1...@cypress/vite-dev-server-v2.2.0) (2021-10-15)


### Features

* normalized signatures webpack & vite servers ([#18379](https://github.com/cypress-io/cypress/issues/18379)) ([8f5308f](https://github.com/cypress-io/cypress/commit/8f5308f7068b80fb877da539ce34fb67ba497c4f))

# [@cypress/vite-dev-server-v2.1.1](https://github.com/cypress-io/cypress/compare/@cypress/vite-dev-server-v2.1.0...@cypress/vite-dev-server-v2.1.1) (2021-10-04)


### Bug Fixes

* **vite-dev-server:** remove base and root from inlineVitConfig types ([#17180](https://github.com/cypress-io/cypress/issues/17180)) ([07e7d0e](https://github.com/cypress-io/cypress/commit/07e7d0ed252bf1a2bd3224f617e1fc2e64f19a06))
* **vite-dev-server:** replace UserConfig with InlineConfig to allow correct `configFile` types ([#18167](https://github.com/cypress-io/cypress/issues/18167)) ([6e0c2c1](https://github.com/cypress-io/cypress/commit/6e0c2c1af81be750a74bad0528d52de45746a453))
* **vite-dev-server:** windows `supportFile` + preserve optimize entries ([#18286](https://github.com/cypress-io/cypress/issues/18286)) ([ea2f6a4](https://github.com/cypress-io/cypress/commit/ea2f6a45c7057e51b2fc879ff70da75538fa1002))

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
