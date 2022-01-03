# [@cypress/webpack-dev-server-v1.8.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.7.0...@cypress/webpack-dev-server-v1.8.0) (2021-12-16)


### Features

* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))

# [@cypress/webpack-dev-server-v1.7.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.6.0...@cypress/webpack-dev-server-v1.7.0) (2021-10-15)


### Features

* normalized signatures webpack & vite servers ([#18379](https://github.com/cypress-io/cypress/issues/18379)) ([8f5308f](https://github.com/cypress-io/cypress/commit/8f5308f7068b80fb877da539ce34fb67ba497c4f))

# [@cypress/webpack-dev-server-v1.6.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.5.0...@cypress/webpack-dev-server-v1.6.0) (2021-09-10)


### Features

* allow usage of @react/plugins with cypress.config.js ([#17738](https://github.com/cypress-io/cypress/issues/17738)) ([da4b1e0](https://github.com/cypress-io/cypress/commit/da4b1e06ce33945aabddda0e6e175dc0e1b488a5))

# [@cypress/webpack-dev-server-v1.5.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.4.0...@cypress/webpack-dev-server-v1.5.0) (2021-08-30)


### Features

* support webpack-dev-server v4 ([#17918](https://github.com/cypress-io/cypress/issues/17918)) ([16e4759](https://github.com/cypress-io/cypress/commit/16e4759e0196f68c5f0525efb020211337748f94))

# [@cypress/webpack-dev-server-v1.4.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.3.1...@cypress/webpack-dev-server-v1.4.0) (2021-06-17)


### Features

* **npm/webpack-dev-server,runner-ct:** Normalize webpack errors + general React/TS improvements ([#16613](https://github.com/cypress-io/cypress/issues/16613)) ([c0fc23a](https://github.com/cypress-io/cypress/commit/c0fc23a052e53354a8300dd3f783cb161ae161e1))

# [@cypress/webpack-dev-server-v1.3.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.3.0...@cypress/webpack-dev-server-v1.3.1) (2021-05-26)


### Bug Fixes

* encodeURI to correctly load specs with white space ([#16416](https://github.com/cypress-io/cypress/issues/16416)) ([116fe64](https://github.com/cypress-io/cypress/commit/116fe649d74e54da9dd84bf126f08f4b9162c5d3))
* Properly typecheck webpack-dev-server and fix several undefined issues ([#16503](https://github.com/cypress-io/cypress/issues/16503)) ([4bb1ecd](https://github.com/cypress-io/cypress/commit/4bb1ecd077fc3724e6c127982f98e1e6b0f1bb98))

# [@cypress/webpack-dev-server-v1.3.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.2.0...@cypress/webpack-dev-server-v1.3.0) (2021-05-13)


### Features

* support webpack dev server v4 ([#16414](https://github.com/cypress-io/cypress/issues/16414)) ([0cea625](https://github.com/cypress-io/cypress/commit/0cea625f359ef554e87600ef7e7c3afa4e36da4d))

# [@cypress/webpack-dev-server-v1.2.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.6...@cypress/webpack-dev-server-v1.2.0) (2021-05-11)


### Features

* exclude html pwa plugin in webpack dev server ([#16388](https://github.com/cypress-io/cypress/issues/16388)) ([14c2292](https://github.com/cypress-io/cypress/commit/14c22929badfe56385260a49336cf29e10902470))

# [@cypress/webpack-dev-server-v1.1.6](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.5...@cypress/webpack-dev-server-v1.1.6) (2021-04-30)


### Bug Fixes

* update docs ([#16266](https://github.com/cypress-io/cypress/issues/16266)) ([72e064b](https://github.com/cypress-io/cypress/commit/72e064bd0705ae39830a2be2052534699862551a))

# [@cypress/webpack-dev-server-v1.1.5](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.4...@cypress/webpack-dev-server-v1.1.5) (2021-04-26)


### Bug Fixes

* **component-testing:** correct imports for relative paths in cypress.json  ([#16056](https://github.com/cypress-io/cypress/issues/16056)) ([10b89f8](https://github.com/cypress-io/cypress/commit/10b89f8d587d331256549c3ab7662f119df7a0f1))
* **webpack-dev-server:** remove hard dependency on html-webpack-plugin v4  ([#16108](https://github.com/cypress-io/cypress/issues/16108)) ([4cfe4b1](https://github.com/cypress-io/cypress/commit/4cfe4b1971c615d615c05ce35b9f7dd5ef8315fc))
* remove lazy-compile-webpack-plugin, make html-webpack-plugin a dependency ([#15954](https://github.com/cypress-io/cypress/issues/15954)) ([19136b6](https://github.com/cypress-io/cypress/commit/19136b6a131cffc31899c754cccce64ce1b4fb87))
* run-ct does not hang on windows anymore ([#16022](https://github.com/cypress-io/cypress/issues/16022)) ([6c12a6c](https://github.com/cypress-io/cypress/commit/6c12a6c7b706ee4f708a9d19c62f18cd0838a433))

# [@cypress/webpack-dev-server-v1.1.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.3...@cypress/webpack-dev-server-v1.1.4) (2021-04-21)


### Bug Fixes

* **webpack:** allow load custom asset on windows ([#16099](https://github.com/cypress-io/cypress/issues/16099)) ([7340851](https://github.com/cypress-io/cypress/commit/7340851097c792ca0d8d3157c3d803dccdd905d2)), closes [#16097](https://github.com/cypress-io/cypress/issues/16097)

# [@cypress/webpack-dev-server-v1.1.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.2...@cypress/webpack-dev-server-v1.1.3) (2021-04-13)


### Bug Fixes

* ensure root el mounting exists, remove userland html webpack plugin ([#15870](https://github.com/cypress-io/cypress/issues/15870)) ([726120d](https://github.com/cypress-io/cypress/commit/726120da183cb6d89c83181761d21f09844a9fc2))
* make component testing windows compatible ([#15889](https://github.com/cypress-io/cypress/issues/15889)) ([602c762](https://github.com/cypress-io/cypress/commit/602c762cfd707ae497273ac38206d7f9d8545439))
* remove lazy-compile-webpack-plugin ([#15964](https://github.com/cypress-io/cypress/issues/15964)) ([dcf3b14](https://github.com/cypress-io/cypress/commit/dcf3b14f3668cba8e19cf4eecd80db0c726f4248))
* **webpack-dev-server:** remove output.publicPath from webpack-dev-server ([#15839](https://github.com/cypress-io/cypress/issues/15839)) ([8e894a0](https://github.com/cypress-io/cypress/commit/8e894a0fdb899be8dd8993319c9297ea73c10321))


### Reverts

* Revert "fix: ensure root el mounting exists, remove userland html webpack plugin (#15870)" (#15949) ([1d271ea](https://github.com/cypress-io/cypress/commit/1d271ea209c9d5116d61ed9b147a75eda6a61210)), closes [#15870](https://github.com/cypress-io/cypress/issues/15870) [#15949](https://github.com/cypress-io/cypress/issues/15949)

# [@cypress/webpack-dev-server-v1.1.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.1...@cypress/webpack-dev-server-v1.1.2) (2021-04-06)


### Bug Fixes

* **component-testing:** Correctly specify @cypress/webpack-dev-server peerDependencies ([#15820](https://github.com/cypress-io/cypress/issues/15820)) ([519b29c](https://github.com/cypress-io/cypress/commit/519b29cb897af59b84dc2f35752f785985348f2d))

# [@cypress/webpack-dev-server-v1.1.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.1.0...@cypress/webpack-dev-server-v1.1.1) (2021-04-05)


### Bug Fixes

* **@cypress/react:** Devtools unpredictable resets ([#15612](https://github.com/cypress-io/cypress/issues/15612)) ([b1f831a](https://github.com/cypress-io/cypress/commit/b1f831a86a8bcc6646067bc8a9e67871026ff575)), closes [#15634](https://github.com/cypress-io/cypress/issues/15634)
* **component-testing:** Fix webpack-dev-server deps validation crash ([#15708](https://github.com/cypress-io/cypress/issues/15708)) ([254eb47](https://github.com/cypress-io/cypress/commit/254eb47d91c75a9f56162e7493ab83e5be169935))

# [@cypress/webpack-dev-server-v1.1.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.0.4...@cypress/webpack-dev-server-v1.1.0) (2021-03-15)


### Bug Fixes

* **@cypress/react:** Correctly unmount react components ([#15250](https://github.com/cypress-io/cypress/issues/15250)) ([6b515c7](https://github.com/cypress-io/cypress/commit/6b515c777ca2fa599f21dc47d181fd28a7eb6db0))


### Features

* Use lazy compilation for webpack-dev-server by default  ([#15158](https://github.com/cypress-io/cypress/issues/15158)) ([f237050](https://github.com/cypress-io/cypress/commit/f237050fdb49e4e59c07a70bb178d88d0e7387a8))
* webpack stop early when error in run mode ([4ec655b](https://github.com/cypress-io/cypress/commit/4ec655b784ff5f961f1d7ce371c5953d9116c576))

# [@cypress/webpack-dev-server-v1.0.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.0.3...@cypress/webpack-dev-server-v1.0.4) (2021-03-10)


### Bug Fixes

* trigger release of the packages ([#15405](https://github.com/cypress-io/cypress/issues/15405)) ([1ce5755](https://github.com/cypress-io/cypress/commit/1ce57554e260850472cf753de68858f47b3f7b3d))

# [@cypress/webpack-dev-server-v1.0.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.0.2...@cypress/webpack-dev-server-v1.0.3) (2021-02-18)


### Bug Fixes

* missing index-template.html from package.json deps for webpack-dev-server ([#15151](https://github.com/cypress-io/cypress/issues/15151)) ([36b0440](https://github.com/cypress-io/cypress/commit/36b0440b663c6a0075d23d8d23ae14d47de297c8))

# [@cypress/webpack-dev-server-v1.0.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.0.1...@cypress/webpack-dev-server-v1.0.2) (2021-02-18)


### Bug Fixes

* add webpack-dev-server to peerDependencies, improve peerDependency error handling, fix index-template.html path ([#15149](https://github.com/cypress-io/cypress/issues/15149)) ([2863e33](https://github.com/cypress-io/cypress/commit/2863e338920362cbb1ecf20c2fab28fbd3a52c33))

# [@cypress/webpack-dev-server-v1.0.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-dev-server-v1.0.0...@cypress/webpack-dev-server-v1.0.1) (2021-02-17)


### Bug Fixes

* add a trivial change to trigger semantic release ([#15127](https://github.com/cypress-io/cypress/issues/15127)) ([fb7540e](https://github.com/cypress-io/cypress/commit/fb7540e99d56e0cff89aaf2fe76065b9815bdbec))
* trigger semantic release ([#15128](https://github.com/cypress-io/cypress/issues/15128)) ([3a6f3b1](https://github.com/cypress-io/cypress/commit/3a6f3b1928277f7086062b1107f424e5a0247e00))

# @cypress/webpack-dev-server-v1.0.0 (2021-02-16)


### Features

* component testing ([#14479](https://github.com/cypress-io/cypress/issues/14479)) ([af26fbe](https://github.com/cypress-io/cypress/commit/af26fbebe6bc609132013a0493a116cc78bb1bd4))
