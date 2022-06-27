# [@cypress/react-v6.0.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.12.5...@cypress/react-v6.0.0) (2022-06-13)


### Bug Fixes

* open browser at correct time during lifecycle ([#19572](https://github.com/cypress-io/cypress/issues/19572)) ([bfc032a](https://github.com/cypress-io/cypress/commit/bfc032a2d42d0726b8a4a86aab1584bd4e69c3f0))
* scaffold correct config file ([#19776](https://github.com/cypress-io/cypress/issues/19776)) ([8f32960](https://github.com/cypress-io/cypress/commit/8f32960ef803f539f065d41f01fff33bfe33ed5d))
* scope config to current testing type ([#20677](https://github.com/cypress-io/cypress/issues/20677)) ([61f7cfc](https://github.com/cypress-io/cypress/commit/61f7cfc59284a2938e0a1c15d74ee75215ba5f8b))
* terminal error message for non migrated config ([#21467](https://github.com/cypress-io/cypress/issues/21467)) ([3274da7](https://github.com/cypress-io/cypress/commit/3274da7842f5ef1ddad62b1c630d0ff9120e4289))
* update scaffold template to use correct path ([#20047](https://github.com/cypress-io/cypress/issues/20047)) ([6e80359](https://github.com/cypress-io/cypress/commit/6e803597a379222cf936e5977c8314d693ee1912))
* wire up scaffolded indexHtml to dev servers ([#20453](https://github.com/cypress-io/cypress/issues/20453)) ([3a8797e](https://github.com/cypress-io/cypress/commit/3a8797e54db9fd0ef93a14ddc71c138ba8251e53))
* **react:** link to rerender example ([#19020](https://github.com/cypress-io/cypress/issues/19020)) ([552d3a1](https://github.com/cypress-io/cypress/commit/552d3a1c0073dae0bd1da0fc9fa8d140ec4f38dc))
* **unified-desktop-gui branch:** initial installation on windows ([#18247](https://github.com/cypress-io/cypress/issues/18247)) ([8614e97](https://github.com/cypress-io/cypress/commit/8614e978029bcbf7155b7ae98ac54feb11f2e7f3))
* **unify:** improve dev server config ergonomics ([#19957](https://github.com/cypress-io/cypress/issues/19957)) ([6a402a7](https://github.com/cypress-io/cypress/commit/6a402a70767f53e4c5ea54490a03a9983b2be10f))


### chore

* prep npm packages for use with Cypress v10 ([b924d08](https://github.com/cypress-io/cypress/commit/b924d086ee2e2ccc93303731e001b2c9e9d0af17))


### Features

* add devServer to config file ([#18962](https://github.com/cypress-io/cypress/issues/18962)) ([2573375](https://github.com/cypress-io/cypress/commit/2573375b5b6616efd2d213a94cd55fd8e0385864))
* Add typings for new devServer config ([#18797](https://github.com/cypress-io/cypress/issues/18797)) ([e018a14](https://github.com/cypress-io/cypress/commit/e018a14c211bfcbdc4568a9a737f14f5c1686e35))
* Deprecate run-ct / open-ct, and update all examples to use --ct instead ([#18422](https://github.com/cypress-io/cypress/issues/18422)) ([196e8f6](https://github.com/cypress-io/cypress/commit/196e8f62cc6d27974f235945cb5700624b3dae41))
* embedding mount into the cypress binary (real dependency) ([#20930](https://github.com/cypress-io/cypress/issues/20930)) ([3fe5f50](https://github.com/cypress-io/cypress/commit/3fe5f50e7832a4bfb20df8e71648434eb7f263d5))
* index.html configurability and storybook support ([#18242](https://github.com/cypress-io/cypress/issues/18242)) ([745b3ac](https://github.com/cypress-io/cypress/commit/745b3ac4518302983522daedf817623334feae5b))
* ProjectLifecycleManager & general launchpad cleanup ([#19347](https://github.com/cypress-io/cypress/issues/19347)) ([4626f74](https://github.com/cypress-io/cypress/commit/4626f7481c9904fec484aa167a02e0197a3095c4))
* remove testFiles reference ([#20565](https://github.com/cypress-io/cypress/issues/20565)) ([5670344](https://github.com/cypress-io/cypress/commit/567034459089d9d53dfab5556cb9369fb335c3db))
* support specPattern, deprecate integrationFolder and componentFolder ([#19319](https://github.com/cypress-io/cypress/issues/19319)) ([792980a](https://github.com/cypress-io/cypress/commit/792980ac12746ef47b9c944ebe4c6c353a187ab2))
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))
* update on-links ([#19235](https://github.com/cypress-io/cypress/issues/19235)) ([cc2d734](https://github.com/cypress-io/cypress/commit/cc2d7348185e2a090c60d92d9319ab460d8c7827))
* Use .config files ([#18578](https://github.com/cypress-io/cypress/issues/18578)) ([081dd19](https://github.com/cypress-io/cypress/commit/081dd19cc6da3da229a7af9c84f62730c85a5cd6))
* use devServer instad of startDevServer ([#20092](https://github.com/cypress-io/cypress/issues/20092)) ([8a6768f](https://github.com/cypress-io/cypress/commit/8a6768fee6f46b908c5a9daf23da8b804a6c627f))
* Use plugins on config files ([#18798](https://github.com/cypress-io/cypress/issues/18798)) ([bb8251b](https://github.com/cypress-io/cypress/commit/bb8251b752ac44f1184f9160194cf12d41fc867f))
* use supportFile by testingType ([#19364](https://github.com/cypress-io/cypress/issues/19364)) ([0366d4f](https://github.com/cypress-io/cypress/commit/0366d4fa8971e5e5189c6fd6450cc3c8d72dcfe1))
* validate specPattern root level ([#19980](https://github.com/cypress-io/cypress/issues/19980)) ([5d52758](https://github.com/cypress-io/cypress/commit/5d52758d82c47033803c69c7858fc786a900faaf))


### BREAKING CHANGES

* new version of packages for Cypress v10

# [@cypress/react-v5.12.5](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.12.4...@cypress/react-v5.12.5) (2022-05-17)


### Bug Fixes

* add support for Next.js v12.1.6 ([#21516](https://github.com/cypress-io/cypress/issues/21516)) ([72ed33c](https://github.com/cypress-io/cypress/commit/72ed33c4eaa4823366fb47f212f0c5e609fa2cf0))

# [@cypress/react-v5.12.4](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.12.3...@cypress/react-v5.12.4) (2022-03-03)


### Bug Fixes

* avoid nextjs unsafeCache and watchOptions ([#20440](https://github.com/cypress-io/cypress/issues/20440)) ([9f60901](https://github.com/cypress-io/cypress/commit/9f6090170b0675d25b26b98cd0f987a5e395ab78))

# [@cypress/react-v5.12.3](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.12.2...@cypress/react-v5.12.3) (2022-02-10)


### Bug Fixes

* set correct default when using react-scripts plugin ([#20141](https://github.com/cypress-io/cypress/issues/20141)) ([9b967e0](https://github.com/cypress-io/cypress/commit/9b967e06f5df1e8ae2c5b13d5c7f7170b069f5bc))

# [@cypress/react-v5.12.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.12.1...@cypress/react-v5.12.2) (2022-02-08)


### Bug Fixes

* remove nullish coalescing in js files to support node 12 ([#20094](https://github.com/cypress-io/cypress/issues/20094)) ([dd11945](https://github.com/cypress-io/cypress/commit/dd11945f5330c14e1540133187415f341794d6f6))

# [@cypress/react-v5.12.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.12.0...@cypress/react-v5.12.1) (2022-01-10)


### Bug Fixes

* check resolvedNodePath for Next.js 12 guard ([#19604](https://github.com/cypress-io/cypress/issues/19604)) ([6304fd7](https://github.com/cypress-io/cypress/commit/6304fd7548a0a3fee90fc8a9ba449ab81e7a7a0c))

# [@cypress/react-v5.12.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.11.0...@cypress/react-v5.12.0) (2021-12-21)


### Features

* support create-react-app v5 ([#19434](https://github.com/cypress-io/cypress/issues/19434)) ([415a7b1](https://github.com/cypress-io/cypress/commit/415a7b149aaac37ae605dc1a11007bad29187dc5))

# [@cypress/react-v5.11.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.10.3...@cypress/react-v5.11.0) (2021-12-16)


### Bug Fixes

* **react:** link to rerender example ([#19020](https://github.com/cypress-io/cypress/issues/19020)) ([2a471d6](https://github.com/cypress-io/cypress/commit/2a471d633a7cf5bd94cfa7d876ddb27cc32626d1))


### Features

* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))

# [@cypress/react-v5.10.3](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.10.2...@cypress/react-v5.10.3) (2021-11-01)


### Bug Fixes

* **@cypress/react:** throw if using Next.js swc-loader without nodeVersion=system ([#18686](https://github.com/cypress-io/cypress/issues/18686)) ([d274a5b](https://github.com/cypress-io/cypress/commit/d274a5b5d92323cb6a9c9d0af3e41bf40e679ac1))

# [@cypress/react-v5.10.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.10.1...@cypress/react-v5.10.2) (2021-10-29)


### Bug Fixes

* Next.JS 12 components testing failing with ` TypeError: Cannot read property 'traceChild' of undefined` ([#18648](https://github.com/cypress-io/cypress/issues/18648)) ([cb0cbdf](https://github.com/cypress-io/cypress/commit/cb0cbdf4c35da09a7dedcc4563a242cb4748e994))
* remove outdated registry link ([#18710](https://github.com/cypress-io/cypress/issues/18710)) ([e2a869d](https://github.com/cypress-io/cypress/commit/e2a869d2a984abb6703aec966dd9124ee693b8c1))
* **cypress/react:** disable react-refresh for craco setups ([#18517](https://github.com/cypress-io/cypress/issues/18517)) ([ea10795](https://github.com/cypress-io/cypress/commit/ea1079559473fc672b5e0e188b5b54bf8ebe2f98))

# [@cypress/react-v5.10.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.10.0...@cypress/react-v5.10.1) (2021-10-04)


### Bug Fixes

* configure proper pages directory for next application ([#18009](https://github.com/cypress-io/cypress/issues/18009)) ([70c7c36](https://github.com/cypress-io/cypress/commit/70c7c3678180d5408c144fa37f94ba5f5f8ceeb8))
* next trace error ([#18189](https://github.com/cypress-io/cypress/issues/18189)) ([db6f909](https://github.com/cypress-io/cypress/commit/db6f9096bd6668db1937d0e38d3928866f6cd5df))

# [@cypress/react-v5.10.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.9.4...@cypress/react-v5.10.0) (2021-09-10)


### Features

* allow usage of @react/plugins with cypress.config.js ([#17738](https://github.com/cypress-io/cypress/issues/17738)) ([da4b1e0](https://github.com/cypress-io/cypress/commit/da4b1e06ce33945aabddda0e6e175dc0e1b488a5))

# [@cypress/react-v5.9.4](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.9.3...@cypress/react-v5.9.4) (2021-08-10)


### Bug Fixes

* do not throw when alt path is found in next ([#17658](https://github.com/cypress-io/cypress/issues/17658)) ([ee7e203](https://github.com/cypress-io/cypress/commit/ee7e203fa059efeac45c7a18526e563643e76d77)), closes [#17476](https://github.com/cypress-io/cypress/issues/17476)

# [@cypress/react-v5.9.3](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.9.2...@cypress/react-v5.9.3) (2021-08-03)


### Bug Fixes

* plugin for next 11.0.2 moved webpack-config ([#17529](https://github.com/cypress-io/cypress/issues/17529)) ([130c086](https://github.com/cypress-io/cypress/commit/130c0864e786ae5172f2c70fdc86664dcaf93083)), closes [#17519](https://github.com/cypress-io/cypress/issues/17519) [#17476](https://github.com/cypress-io/cypress/issues/17476)

# [@cypress/react-v5.9.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.9.1...@cypress/react-v5.9.2) (2021-07-20)


### Bug Fixes

* improve React `mountHook` type ([#17241](https://github.com/cypress-io/cypress/issues/17241)) ([e40969a](https://github.com/cypress-io/cypress/commit/e40969abe39424585fd2075b17e4e7d189f53c3a))

# [@cypress/react-v5.9.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.9.0...@cypress/react-v5.9.1) (2021-06-04)


### Bug Fixes

* **cypress/react:** add default webpack config path ([#16813](https://github.com/cypress-io/cypress/issues/16813)) ([0348170](https://github.com/cypress-io/cypress/commit/03481703c997088a3e7ef5ed3b55d9fee01821a0))
* **npm/react:** webpack config sample bug ([#16737](https://github.com/cypress-io/cypress/issues/16737)) ([98fe58c](https://github.com/cypress-io/cypress/commit/98fe58cce3dd42fc6ca4616a9ed3c9da7b33794c))

# [@cypress/react-v5.9.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.8.1...@cypress/react-v5.9.0) (2021-05-31)


### Features

* react-scripts. allow parametrise webpack config path ([#16644](https://github.com/cypress-io/cypress/issues/16644)) ([c618d30](https://github.com/cypress-io/cypress/commit/c618d30f3df99394df5c0b81ea3817caf0a7eaf4))

# [@cypress/react-v5.8.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.8.0...@cypress/react-v5.8.1) (2021-05-26)


### Bug Fixes

* Prevent mount .wrap command appearing in log ([#16585](https://github.com/cypress-io/cypress/issues/16585)) ([fca9b9a](https://github.com/cypress-io/cypress/commit/fca9b9aeb052db668d054f589d7894fc4f9c6d5a))

# [@cypress/react-v5.8.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.7.0...@cypress/react-v5.8.0) (2021-05-21)


### Features

* custom webpack config for react/plugins/babel ([#16597](https://github.com/cypress-io/cypress/issues/16597)) ([75c753b](https://github.com/cypress-io/cypress/commit/75c753be0ee302fed3559b633626036905a45c4d)), closes [#16596](https://github.com/cypress-io/cypress/issues/16596)

# [@cypress/react-v5.7.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.6.0...@cypress/react-v5.7.0) (2021-05-12)


### Features

* allow to import/require files in CRA plugin out of src ([#16453](https://github.com/cypress-io/cypress/issues/16453)) ([811c7e3](https://github.com/cypress-io/cypress/commit/811c7e36074acf7b4bee9d96505d48141e9d49bf))

# [@cypress/react-v5.6.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.5.0...@cypress/react-v5.6.0) (2021-05-11)


### Bug Fixes

* accept webapck 4 & 5 as peer dependencies of @cypress/vue and @cypress/react ([#16290](https://github.com/cypress-io/cypress/issues/16290)) ([c4151fb](https://github.com/cypress-io/cypress/commit/c4151fbd9f3c10de28e3e8dd3a75d0e0973b52e2))
* remove unnecessary dependency ([#16412](https://github.com/cypress-io/cypress/issues/16412)) ([7b242ac](https://github.com/cypress-io/cypress/commit/7b242acbf6bc3134e4b2f1b1a05fc243e96dfe40))
* **npm/react:** support transpiling typescript files in support ([#16197](https://github.com/cypress-io/cypress/issues/16197)) ([60b217c](https://github.com/cypress-io/cypress/commit/60b217cccedf28c56b0573665f0b3ee81813a4cc))


### Features

* **npm/react:** Add craco plugin ([#16333](https://github.com/cypress-io/cypress/issues/16333)) ([958a9c2](https://github.com/cypress-io/cypress/commit/958a9c2691b4cdbee44053e9decbd6350b9cc7fe))

# [@cypress/react-v5.5.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.4.2...@cypress/react-v5.5.0) (2021-05-05)


### Bug Fixes

* accept webapck 4 & 5 as peer dependencies of @cypress/vue and @cypress/react ([#16290](https://github.com/cypress-io/cypress/issues/16290)) ([500cab9](https://github.com/cypress-io/cypress/commit/500cab95ef7a7d6b74b366ba8066bcf73f2955aa))
* **npm/react:** support transpiling typescript files in support ([#16197](https://github.com/cypress-io/cypress/issues/16197)) ([8a83bb1](https://github.com/cypress-io/cypress/commit/8a83bb1c71c7e46a31c6a720ea25101603fa72b4))


### Features

* **npm/react:** Add craco plugin ([#16333](https://github.com/cypress-io/cypress/issues/16333)) ([2d8f55b](https://github.com/cypress-io/cypress/commit/2d8f55bfca2daf1dca31aaf1e596751a6cd3d793))

# [@cypress/react-v5.4.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.4.1...@cypress/react-v5.4.2) (2021-04-30)


### Bug Fixes

* avoid unmounting React components twice ([#16280](https://github.com/cypress-io/cypress/issues/16280)) ([bd629d3](https://github.com/cypress-io/cypress/commit/bd629d307eca9165b2c6f44ff87164a9e07a3eb5))

# [@cypress/react-v5.4.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.4.0...@cypress/react-v5.4.1) (2021-04-29)


### Bug Fixes

* bump deps and release new version ([#16261](https://github.com/cypress-io/cypress/issues/16261)) ([bd78337](https://github.com/cypress-io/cypress/commit/bd783377520cf4038f09a7ea0e4876960d0eb4ea))

# [@cypress/react-v5.4.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.3.4...@cypress/react-v5.4.0) (2021-04-26)


### Bug Fixes

* **webpack-dev-server:** remove hard dependency on html-webpack-plugin v4  ([#16108](https://github.com/cypress-io/cypress/issues/16108)) ([4cfe4b1](https://github.com/cypress-io/cypress/commit/4cfe4b1971c615d615c05ce35b9f7dd5ef8315fc))
* Properly display unmount as a command ([#16041](https://github.com/cypress-io/cypress/issues/16041)) ([4002e4c](https://github.com/cypress-io/cypress/commit/4002e4c5fd204a3c6d1feba2b1893f92cec8ef60))
* **component-testing:** correct imports for relative paths in cypress.json  ([#16056](https://github.com/cypress-io/cypress/issues/16056)) ([10b89f8](https://github.com/cypress-io/cypress/commit/10b89f8d587d331256549c3ab7662f119df7a0f1))
* **component-testing:** Increased timeout to allow  useEffect to trigger ([#16091](https://github.com/cypress-io/cypress/issues/16091)) ([5fb5b41](https://github.com/cypress-io/cypress/commit/5fb5b41f30fd32a9fd087ecf6526d5e680d5dc24))


### Features

* **component-testing:** breaking: Add React rerender functionality ([#16038](https://github.com/cypress-io/cypress/issues/16038)) ([ee8b918](https://github.com/cypress-io/cypress/commit/ee8b918ea8ad9a4a4df501a541c9af8b8cd3c147))

# [@cypress/react-v5.3.4](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.3.3...@cypress/react-v5.3.4) (2021-04-21)


### Bug Fixes

* improve handling of userland injected styles in component testing ([#16024](https://github.com/cypress-io/cypress/issues/16024)) ([fe0b63c](https://github.com/cypress-io/cypress/commit/fe0b63c299947470c9cdce3a0d00364a1e224bdb))

# [@cypress/react-v5.3.3](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.3.2...@cypress/react-v5.3.3) (2021-04-13)


### Bug Fixes

* get next config before requiring devserver ([#15885](https://github.com/cypress-io/cypress/issues/15885)) ([6e5fd8f](https://github.com/cypress-io/cypress/commit/6e5fd8f4fc0c3b3a06318dee8d3f358e7a86e484))
* make component testing windows compatible ([#15889](https://github.com/cypress-io/cypress/issues/15889)) ([602c762](https://github.com/cypress-io/cypress/commit/602c762cfd707ae497273ac38206d7f9d8545439))
* **webpack-dev-server:** remove output.publicPath from webpack-dev-server ([#15839](https://github.com/cypress-io/cypress/issues/15839)) ([8e894a0](https://github.com/cypress-io/cypress/commit/8e894a0fdb899be8dd8993319c9297ea73c10321))

# [@cypress/react-v5.3.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.3.1...@cypress/react-v5.3.2) (2021-04-06)


### Bug Fixes

* make cypress/react public ([#15799](https://github.com/cypress-io/cypress/issues/15799)) ([df8cb03](https://github.com/cypress-io/cypress/commit/df8cb0345f7b09f393b442ac9b9cbc549eee0f23))

# [@cypress/react-v5.3.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.3.0...@cypress/react-v5.3.1) (2021-04-06)


### Bug Fixes

* unrestrict access to react/cypress ([#15798](https://github.com/cypress-io/cypress/issues/15798)) ([4c5623f](https://github.com/cypress-io/cypress/commit/4c5623fb1c83c3594f4dc3d2a73431fd2aaaae56))

# [@cypress/react-v5.3.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.2.0...@cypress/react-v5.3.0) (2021-04-05)


### Bug Fixes

* **@cypress/react:** Devtools unpredictable resets ([#15612](https://github.com/cypress-io/cypress/issues/15612)) ([b1f831a](https://github.com/cypress-io/cypress/commit/b1f831a86a8bcc6646067bc8a9e67871026ff575)), closes [#15634](https://github.com/cypress-io/cypress/issues/15634)
* **component-testing:** Fix webpack-dev-server deps validation crash ([#15708](https://github.com/cypress-io/cypress/issues/15708)) ([254eb47](https://github.com/cypress-io/cypress/commit/254eb47d91c75a9f56162e7493ab83e5be169935))


### Features

* support ct/e2e specific overrides in cypress.json ([#15526](https://github.com/cypress-io/cypress/issues/15526)) ([43c8ae2](https://github.com/cypress-io/cypress/commit/43c8ae2a7c20ba70a0bb0b45b8f6a086e2782f29))
* **deps:** update dependency electron to version 12.x 🌟 ([#15292](https://github.com/cypress-io/cypress/issues/15292)) ([b52ac98](https://github.com/cypress-io/cypress/commit/b52ac98a6944bc831221ccb730f89c6cc92a4573))

# [@cypress/react-v5.2.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.1.2...@cypress/react-v5.2.0) (2021-03-19)


### Features

* **@cypress/react:** Support react-scripts v4 ([#15488](https://github.com/cypress-io/cypress/issues/15488)) ([3e9d752](https://github.com/cypress-io/cypress/commit/3e9d7523eb6aa20773e8c87778b28d19921ae781))

# [@cypress/react-v5.1.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.1.1...@cypress/react-v5.1.2) (2021-03-16)


### Bug Fixes

* add missing script for building wizard ([#15502](https://github.com/cypress-io/cypress/issues/15502)) ([393a8ca](https://github.com/cypress-io/cypress/commit/393a8ca9cac905e0f6d8623bff889b041dd076b6))

# [@cypress/react-v5.1.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.1.0...@cypress/react-v5.1.1) (2021-03-16)


### Bug Fixes

* Revert cypress.json changes ([#15499](https://github.com/cypress-io/cypress/issues/15499)) ([237c426](https://github.com/cypress-io/cypress/commit/237c426707714a287ff20ef2bdabff5f0c39e93a))

# [@cypress/react-v5.1.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.0.1...@cypress/react-v5.1.0) (2021-03-15)


### Bug Fixes

* removing test for previous undesireable behavior ([#15458](https://github.com/cypress-io/cypress/issues/15458)) ([35dde75](https://github.com/cypress-io/cypress/commit/35dde753560e9d53d1c49131187ff30d8e31fc75))
* **@cypress/react:** Correctly unmount react components ([#15250](https://github.com/cypress-io/cypress/issues/15250)) ([6b515c7](https://github.com/cypress-io/cypress/commit/6b515c777ca2fa599f21dc47d181fd28a7eb6db0))
* **component-testing:** ensure to call unmount after each test ([#15385](https://github.com/cypress-io/cypress/issues/15385)) ([153fc51](https://github.com/cypress-io/cypress/commit/153fc515a53343758393db795879a64494374551))
* make webpack-dev-server a peer dependency ([#15163](https://github.com/cypress-io/cypress/issues/15163)) ([fa969fb](https://github.com/cypress-io/cypress/commit/fa969fba78d86494b5d920f573768677301fad13))


### Features

* support ct/e2e specific overrides in cypress.json ([#15444](https://github.com/cypress-io/cypress/issues/15444)) ([a94c9d5](https://github.com/cypress-io/cypress/commit/a94c9d5ef0da8559f20391fc14396d71fdca7a2f))
* **@cypress/react:** Make correct plugins for different adapters/bundlers ([#15337](https://github.com/cypress-io/cypress/issues/15337)) ([fc30118](https://github.com/cypress-io/cypress/commit/fc301182523f0a645bfb17ea3b541644b9732dd0)), closes [#9116](https://github.com/cypress-io/cypress/issues/9116)
* create-cypress-tests installation wizard ([#9563](https://github.com/cypress-io/cypress/issues/9563)) ([c405ee8](https://github.com/cypress-io/cypress/commit/c405ee89ef5321df6151fdeec1e917ac952c0d38)), closes [#9116](https://github.com/cypress-io/cypress/issues/9116)
* Use lazy compilation for webpack-dev-server by default  ([#15158](https://github.com/cypress-io/cypress/issues/15158)) ([f237050](https://github.com/cypress-io/cypress/commit/f237050fdb49e4e59c07a70bb178d88d0e7387a8))

# [@cypress/react-v5.0.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v5.0.0...@cypress/react-v5.0.1) (2021-02-17)

### Bug Fixes

* update dependencies of npm/react-vue ([#15095](https://github.com/cypress-io/cypress/issues/15095)) ([e028262](https://github.com/cypress-io/cypress/commit/e028262aed485865c4f40162c1f8102970ef91f8))
* **component-testing:** make content adjust to size of window ([#14876](https://github.com/cypress-io/cypress/issues/14876)) ([4cf3896](https://github.com/cypress-io/cypress/commit/4cf3896ecbb074831709f73f22768457fdaf5779))


### Features

* component testing ([#14479](https://github.com/cypress-io/cypress/issues/14479)) ([af26fbe](https://github.com/cypress-io/cypress/commit/af26fbebe6bc609132013a0493a116cc78bb1bd4))


### BREAKING CHANGES

* Added the need to install a preprocessor or a dev-server plugin
* Removed the pre-instalation of test coverage 
  * Install it manually by following [the documentation](https://on.cypress.io/code-coverage-introduction)
* removed the pre-installation of `cypress-react-selector`
  * If you use `cy.react()` in your tests, the command will not work anymore. [Install it back in your support file](https://www.npmjs.com/package/cypress-react-selector) 

# [@cypress/react-v4.16.4](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.16.3...@cypress/react-v4.16.4) (2021-01-27)


### Bug Fixes

* **deps:** update dependency debug to version 4.3.1 🌟 ([#14583](https://github.com/cypress-io/cypress/issues/14583)) ([9be6165](https://github.com/cypress-io/cypress/commit/9be61657f4150ba5dee7b67f806d810f3106d13b))

# [@cypress/react-v4.16.3](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.16.2...@cypress/react-v4.16.3) (2021-01-05)


### Bug Fixes

* typo in `@types/react` peer dependency package name ([#14261](https://github.com/cypress-io/cypress/issues/14261)) ([b87519d](https://github.com/cypress-io/cypress/commit/b87519d4f141a45b053ecd9c96facb792a47e2da))

# [@cypress/react-v4.16.2](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.16.1...@cypress/react-v4.16.2) (2021-01-05)


### Bug Fixes

* Correct typo in @types/react peerDependencyMeta entry ([#14306](https://github.com/cypress-io/cypress/issues/14306)) ([012d4f1](https://github.com/cypress-io/cypress/commit/012d4f1764345a14f06b9e5f9d26949778b3d525))
* **Component Testing:** Broken links in docs ([#14251](https://github.com/cypress-io/cypress/issues/14251)) ([a72529f](https://github.com/cypress-io/cypress/commit/a72529f396baee669c9b112d9296d314177f8cc1))
* **deps:** update dependencies in @cypress/react ([#14165](https://github.com/cypress-io/cypress/issues/14165)) ([2c4349e](https://github.com/cypress-io/cypress/commit/2c4349ea7144495db2411aef58e6e8266cf9d13b))

# [@cypress/react-v4.16.1](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.16.0...@cypress/react-v4.16.1) (2020-12-21)


### Bug Fixes

* **react:** link types from the correct directory ([#14255](https://github.com/cypress-io/cypress/issues/14255)) ([e2bc209](https://github.com/cypress-io/cypress/commit/e2bc2091a9e242b9a46276d57eddfd6daefdd4c8))

# [@cypress/react-v4.16.0](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.15.16...@cypress/react-v4.16.0) (2020-11-30)


### Features

* create-cypress-tests wizard ([#8857](https://github.com/cypress-io/cypress/issues/8857)) ([21ee591](https://github.com/cypress-io/cypress/commit/21ee591d1e9c4083a0c67f2062ced92708c0cedd))

# [@cypress/react-v4.15.16](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.15.15...@cypress/react-v4.15.16) (2020-11-23)


### Bug Fixes

* cypress/react release process ([#9284](https://github.com/cypress-io/cypress/issues/9284)) ([88e332c](https://github.com/cypress-io/cypress/commit/88e332c5303613c182e92b77b25da9604039aaa8))

# [@cypress/react-v4.15.15](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.15.14...@cypress/react-v4.15.15) (2020-11-10)


### Bug Fixes

* adding build-prod tasks to all of the npm dependencies that need artifacts ([#9045](https://github.com/cypress-io/cypress/issues/9045)) ([550c05c](https://github.com/cypress-io/cypress/commit/550c05cc3d7a2a179de21138ae5f8118277df6ef))

# [@cypress/react-v4.15.14](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.15.13...@cypress/react-v4.15.14) (2020-10-30)


### Bug Fixes

* adding build-prod tasks to all of the npm dependencies that need artifacts ([#9046](https://github.com/cypress-io/cypress/issues/9046)) ([462829b](https://github.com/cypress-io/cypress/commit/462829bea1d903b0f1666d4ef2dd85e56636b725))

# [@cypress/react-v4.15.13](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.15.12...@cypress/react-v4.15.13) (2020-10-29)


### Bug Fixes

* update bugs link in package.json ([#9015](https://github.com/cypress-io/cypress/issues/9015)) ([34186cb](https://github.com/cypress-io/cypress/commit/34186cb8b76c230a2506cabb0358d44c3205e0c4))

# [@cypress/react-v4.15.12](https://github.com/cypress-io/cypress/compare/@cypress/react-v4.15.11...@cypress/react-v4.15.12) (2020-10-14)


### Bug Fixes

* make imported @cypress/react working and pass CI ([#8718](https://github.com/cypress-io/cypress/issues/8718)) ([5e4b638](https://github.com/cypress-io/cypress/commit/5e4b6383854a78d10249621ffea9e4e20effe192))
