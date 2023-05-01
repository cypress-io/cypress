# [@cypress/webpack-preprocessor-v5.17.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.17.0...@cypress/webpack-preprocessor-v5.17.1) (2023-05-01)

# [@cypress/webpack-preprocessor-v5.17.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.16.3...@cypress/webpack-preprocessor-v5.17.0) (2023-02-15)


### Features

* Bundle cy.origin() dependencies at runtime ([#25626](https://github.com/cypress-io/cypress/issues/25626)) ([41512c4](https://github.com/cypress-io/cypress/commit/41512c416a80e5158752fef9ffbe722402a5ada4))

# [@cypress/webpack-preprocessor-v5.16.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.16.2...@cypress/webpack-preprocessor-v5.16.3) (2023-02-06)

# [@cypress/webpack-preprocessor-v5.16.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.16.1...@cypress/webpack-preprocessor-v5.16.2) (2023-02-02)


### Bug Fixes

* allow version 9 of the babel-loader peer dependency ([#25569](https://github.com/cypress-io/cypress/issues/25569)) ([5afe19f](https://github.com/cypress-io/cypress/commit/5afe19f8d17b5da53d66a0513424403006167adf))

# [@cypress/webpack-preprocessor-v5.16.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.16.0...@cypress/webpack-preprocessor-v5.16.1) (2022-12-29)


### Bug Fixes

* added missing pending data which caused incorrect mochaawesome reports ([#25264](https://github.com/cypress-io/cypress/issues/25264)) ([6fc13e6](https://github.com/cypress-io/cypress/commit/6fc13e6f20f203fd58aa18c0a736414aea5e0556))

# [@cypress/webpack-preprocessor-v5.16.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.7...@cypress/webpack-preprocessor-v5.16.0) (2022-12-19)


### Features

* create from React component ([#25168](https://github.com/cypress-io/cypress/issues/25168)) ([166b694](https://github.com/cypress-io/cypress/commit/166b69414c5e347ef825c121330b0b561a4caa3b)), closes [#24881](https://github.com/cypress-io/cypress/issues/24881) [#24954](https://github.com/cypress-io/cypress/issues/24954) [#24982](https://github.com/cypress-io/cypress/issues/24982) [#25079](https://github.com/cypress-io/cypress/issues/25079) [#25145](https://github.com/cypress-io/cypress/issues/25145)

# [@cypress/webpack-preprocessor-v5.15.7](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.6...@cypress/webpack-preprocessor-v5.15.7) (2022-12-09)


### Bug Fixes

* declare used babel dependencies ([#24842](https://github.com/cypress-io/cypress/issues/24842)) ([910f912](https://github.com/cypress-io/cypress/commit/910f912373bf857a196e2a0d1a73606e3ee199be))

# [@cypress/webpack-preprocessor-v5.15.6](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.5...@cypress/webpack-preprocessor-v5.15.6) (2022-12-02)


### Bug Fixes

* **breaking:** exclude node_modules from cross-origin-callback-loader ([#24952](https://github.com/cypress-io/cypress/issues/24952)) ([27c425d](https://github.com/cypress-io/cypress/commit/27c425dda318c316f751a000b77b39fe727999d5))

# [@cypress/webpack-preprocessor-v5.15.5](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.4...@cypress/webpack-preprocessor-v5.15.5) (2022-11-10)


### Bug Fixes

* custom reporter and experimentalSessionAndOrigin crashes ([#24630](https://github.com/cypress-io/cypress/issues/24630)) ([e9e8cad](https://github.com/cypress-io/cypress/commit/e9e8cadda4fb14d601079018b57425b221a005d9))

# [@cypress/webpack-preprocessor-v5.15.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.3...@cypress/webpack-preprocessor-v5.15.4) (2022-11-07)


### Bug Fixes

* remove some CT functions and props ([#24419](https://github.com/cypress-io/cypress/issues/24419)) ([294985f](https://github.com/cypress-io/cypress/commit/294985f8b3e0fa00ed66d25f88c8814603766074))

# [@cypress/webpack-preprocessor-v5.15.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.2...@cypress/webpack-preprocessor-v5.15.3) (2022-11-02)


### Bug Fixes

* Ensure patched merge-source-map is included in package ([#24490](https://github.com/cypress-io/cypress/issues/24490)) ([493d90c](https://github.com/cypress-io/cypress/commit/493d90c33082565a93418f39388daab348c175cf))

# [@cypress/webpack-preprocessor-v5.15.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.1...@cypress/webpack-preprocessor-v5.15.2) (2022-11-01)


### Bug Fixes

* patching packages in `npm/webpack-preprocessor` on windows builds ([#24473](https://github.com/cypress-io/cypress/issues/24473)) ([440a08b](https://github.com/cypress-io/cypress/commit/440a08bb2a67b7415fd1895118278e5dd0d8b32f))

# [@cypress/webpack-preprocessor-v5.15.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.15.0...@cypress/webpack-preprocessor-v5.15.1) (2022-10-31)


### Bug Fixes

* Fix sourcemaps when using cy.origin() dependencies ([#24367](https://github.com/cypress-io/cypress/issues/24367)) ([b916ba9](https://github.com/cypress-io/cypress/commit/b916ba9c410856582b113fcdcef69cfc6b6e9861))

# [@cypress/webpack-preprocessor-v5.15.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.14.0...@cypress/webpack-preprocessor-v5.15.0) (2022-10-19)


### Features

* Enable requiring cy.origin dependencies with require() and import() ([#24294](https://github.com/cypress-io/cypress/issues/24294)) ([1b29ce7](https://github.com/cypress-io/cypress/commit/1b29ce74aafa0bc5015a93cb618b7fbda243e07a))

# [@cypress/webpack-preprocessor-v5.14.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.13.1...@cypress/webpack-preprocessor-v5.14.0) (2022-10-04)


### Features

* same origin spec bridges ([#23885](https://github.com/cypress-io/cypress/issues/23885)) ([695dd27](https://github.com/cypress-io/cypress/commit/695dd275bcca75543fccefb92afe6bc7700f15ef))

# [@cypress/webpack-preprocessor-v5.13.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.13.0...@cypress/webpack-preprocessor-v5.13.1) (2022-10-04)


### Bug Fixes

* **webpack-preprocessor:** Move md5 from devDependencies to dependencies ([#24098](https://github.com/cypress-io/cypress/issues/24098)) ([e72d607](https://github.com/cypress-io/cypress/commit/e72d607814a08e3f6310bf91c24ecd8fc160ff3a))

# [@cypress/webpack-preprocessor-v5.13.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.12.2...@cypress/webpack-preprocessor-v5.13.0) (2022-09-29)


### Bug Fixes

* support type: module in Node.js 16.17.0+ and 18.6.0+ ([#23637](https://github.com/cypress-io/cypress/issues/23637)) ([b6dad0a](https://github.com/cypress-io/cypress/commit/b6dad0a674279936a9816939963bbf129647cee7))
* Webpack 5 automatic publicPath error ([#23760](https://github.com/cypress-io/cypress/issues/23760)) ([823ffd0](https://github.com/cypress-io/cypress/commit/823ffd0ca920c82170705d9abfa60592b8f3979a))


### Features

* Support dependencies in cy.origin() callback ([#23283](https://github.com/cypress-io/cypress/issues/23283)) ([c48b80a](https://github.com/cypress-io/cypress/commit/c48b80a0df14e9c22f17d1174372efd6a669b055))
* **webpack-preprocessor:** add support for cy.origin() dependencies ([#24006](https://github.com/cypress-io/cypress/issues/24006)) ([646f22a](https://github.com/cypress-io/cypress/commit/646f22add990e4223815ee2e6deac35c9455405c))

# [@cypress/webpack-preprocessor-v5.12.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.12.1...@cypress/webpack-preprocessor-v5.12.2) (2022-08-15)


### Bug Fixes

* clear session state when changing specs in open mode ([#23146](https://github.com/cypress-io/cypress/issues/23146)) ([f1122fc](https://github.com/cypress-io/cypress/commit/f1122fcf62c14abddc0ae96116572402c1be2372))

# [@cypress/webpack-preprocessor-v5.12.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.12.0...@cypress/webpack-preprocessor-v5.12.1) (2022-08-11)


### Bug Fixes

* retry on EMFILE always, lint sync FS calls ([#22175](https://github.com/cypress-io/cypress/issues/22175)) ([d01932b](https://github.com/cypress-io/cypress/commit/d01932bf751a6edf758451d8d19a74fe07e799ea))

# [@cypress/webpack-preprocessor-v5.12.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.11.1...@cypress/webpack-preprocessor-v5.12.0) (2022-06-01)


### Bug Fixes

* windows build ([#20854](https://github.com/cypress-io/cypress/issues/20854)) ([e6cbc5a](https://github.com/cypress-io/cypress/commit/e6cbc5ae1edef0e7f0474dba6b2d8da3030489db))


### Features

* error when updating a 9.X value in 10.X in the pluginsFile ([#20521](https://github.com/cypress-io/cypress/issues/20521)) ([1de1aa5](https://github.com/cypress-io/cypress/commit/1de1aa5ccc2989d9a22e4e6ba88573a2c5c392e1))
* merging / delegating remote queries to cloud schema ([#17875](https://github.com/cypress-io/cypress/issues/17875)) ([94541d4](https://github.com/cypress-io/cypress/commit/94541d4f18591e8fa4b8702c39e92b0a7238aa5d))
* support specPattern, deprecate integrationFolder and componentFolder ([#19319](https://github.com/cypress-io/cypress/issues/19319)) ([792980a](https://github.com/cypress-io/cypress/commit/792980ac12746ef47b9c944ebe4c6c353a187ab2))
* Use .config files ([#18578](https://github.com/cypress-io/cypress/issues/18578)) ([081dd19](https://github.com/cypress-io/cypress/commit/081dd19cc6da3da229a7af9c84f62730c85a5cd6))
* Use plugins on config files ([#18798](https://github.com/cypress-io/cypress/issues/18798)) ([bb8251b](https://github.com/cypress-io/cypress/commit/bb8251b752ac44f1184f9160194cf12d41fc867f))
* use supportFile by testingType ([#19364](https://github.com/cypress-io/cypress/issues/19364)) ([0366d4f](https://github.com/cypress-io/cypress/commit/0366d4fa8971e5e5189c6fd6450cc3c8d72dcfe1))
* validate specPattern root level ([#19980](https://github.com/cypress-io/cypress/issues/19980)) ([5d52758](https://github.com/cypress-io/cypress/commit/5d52758d82c47033803c69c7858fc786a900faaf))

# [@cypress/webpack-preprocessor-v5.11.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.11.0...@cypress/webpack-preprocessor-v5.11.1) (2022-02-08)


### Bug Fixes

* detect newly added specs in dev-server compilation ([#17950](https://github.com/cypress-io/cypress/issues/17950)) ([f9ce67c](https://github.com/cypress-io/cypress/commit/f9ce67cfb6fed74a3549e7aff7ce0a5b217d9a13))

# [@cypress/webpack-preprocessor-v5.11.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.10.0...@cypress/webpack-preprocessor-v5.11.0) (2021-12-16)


### Features

* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))

# [@cypress/webpack-preprocessor-v5.10.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.9.1...@cypress/webpack-preprocessor-v5.10.0) (2021-11-10)


### Bug Fixes

* remove outdated npm registry links ([#18727](https://github.com/cypress-io/cypress/issues/18727)) ([4ded6c9](https://github.com/cypress-io/cypress/commit/4ded6c9624134fe6203f5377d62d62809cd27cda))


### Features

* **deps:** update dependency electron to v15 🌟 ([#18317](https://github.com/cypress-io/cypress/issues/18317)) ([3095d73](https://github.com/cypress-io/cypress/commit/3095d733e92527ffd67344c6899211e058ceefa3))

# [@cypress/webpack-preprocessor-v5.9.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.9.0...@cypress/webpack-preprocessor-v5.9.1) (2021-06-24)


### Bug Fixes

* **webpack-preprocessor:** hanging issues with webpack 5 ([#15611](https://github.com/cypress-io/cypress/issues/15611)) ([56bcbb6](https://github.com/cypress-io/cypress/commit/56bcbb61e61d823f80e80c46c943b01283da2942))

# [@cypress/webpack-preprocessor-v5.9.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.8.0...@cypress/webpack-preprocessor-v5.9.0) (2021-05-26)


### Features

* **npm/webpack-preprocessor:** WIP support webpack 5 alongside webpack 4 ([#16493](https://github.com/cypress-io/cypress/issues/16493)) ([d37fa84](https://github.com/cypress-io/cypress/commit/d37fa84d327091b5bb552d7670e6bcb7fd2d3199))

# [@cypress/webpack-preprocessor-v5.8.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.7.0...@cypress/webpack-preprocessor-v5.8.0) (2021-05-13)


### Features

* **npm/webpack-preprocessor:** WIP support webpack 5 alongside webpack 4 ([#16493](https://github.com/cypress-io/cypress/issues/16493)) ([#16504](https://github.com/cypress-io/cypress/issues/16504)) ([c9fb982](https://github.com/cypress-io/cypress/commit/c9fb982ab120ed4c642466796ce4caeea14e0eb4))

# [@cypress/webpack-preprocessor-v5.7.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.6.0...@cypress/webpack-preprocessor-v5.7.0) (2021-04-05)


### Features

* create new spec file from desktop-gui ([#15335](https://github.com/cypress-io/cypress/issues/15335)) ([3700fe7](https://github.com/cypress-io/cypress/commit/3700fe7271b016f8a89c5a7a4c40d0af62155b45))

# [@cypress/webpack-preprocessor-v5.6.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.5.0...@cypress/webpack-preprocessor-v5.6.0) (2021-02-16)


### Features

* component testing ([#14479](https://github.com/cypress-io/cypress/issues/14479)) ([af26fbe](https://github.com/cypress-io/cypress/commit/af26fbebe6bc609132013a0493a116cc78bb1bd4))

# [@cypress/webpack-preprocessor-v5.5.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.4.11...@cypress/webpack-preprocessor-v5.5.0) (2020-11-30)


### Features

* **webpack-preprocessor:** Allow specifying typescript path ([#9312](https://github.com/cypress-io/cypress/issues/9312)) ([02347ef](https://github.com/cypress-io/cypress/commit/02347ef1faaef1e5442d20bbd12d520cf4c10f33))

# [@cypress/webpack-preprocessor-v5.4.11](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.4.10...@cypress/webpack-preprocessor-v5.4.11) (2020-11-10)


### Bug Fixes

* adding build-prod tasks to all of the npm dependencies that need artifacts ([#9045](https://github.com/cypress-io/cypress/issues/9045)) ([550c05c](https://github.com/cypress-io/cypress/commit/550c05cc3d7a2a179de21138ae5f8118277df6ef))

# [@cypress/webpack-preprocessor-v5.4.10](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.4.9...@cypress/webpack-preprocessor-v5.4.10) (2020-10-30)


### Bug Fixes

* adding build-prod tasks to all of the npm dependencies that need artifacts ([#9046](https://github.com/cypress-io/cypress/issues/9046)) ([462829b](https://github.com/cypress-io/cypress/commit/462829bea1d903b0f1666d4ef2dd85e56636b725))

# [@cypress/webpack-preprocessor-v5.4.9](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.4.8...@cypress/webpack-preprocessor-v5.4.9) (2020-10-29)


### Bug Fixes

* update bugs link in package.json ([#9015](https://github.com/cypress-io/cypress/issues/9015)) ([34186cb](https://github.com/cypress-io/cypress/commit/34186cb8b76c230a2506cabb0358d44c3205e0c4))
* **webpack-preprocessor:** fix webpack preprocessor potential race condition ([#8976](https://github.com/cypress-io/cypress/issues/8976)) ([5e0e5d8](https://github.com/cypress-io/cypress/commit/5e0e5d8ece2909b2436eb563b39f22e2723ddf98))

# [@cypress/webpack-preprocessor-v5.4.8](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.4.7...@cypress/webpack-preprocessor-v5.4.8) (2020-10-15)


### Bug Fixes

* reset head between tests to avoid style bleed ([#8828](https://github.com/cypress-io/cypress/issues/8828)) ([ee7b819](https://github.com/cypress-io/cypress/commit/ee7b8196c8c0e0a9a55b44885e8f43f6120d4869))

# [@cypress/webpack-preprocessor-v5.4.7](https://github.com/cypress-io/cypress/compare/@cypress/webpack-preprocessor-v5.4.6...@cypress/webpack-preprocessor-v5.4.7) (2020-10-14)


### Bug Fixes

* make imported @cypress/react working and pass CI ([#8718](https://github.com/cypress-io/cypress/issues/8718)) ([5e4b638](https://github.com/cypress-io/cypress/commit/5e4b6383854a78d10249621ffea9e4e20effe192))
