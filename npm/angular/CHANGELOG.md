# [@cypress/angular-v1.1.0](https://github.com/cypress-io/cypress/compare/@cypress/angular-v1.0.0...@cypress/angular-v1.1.0) (2022-08-30)


### Bug Fixes

* angular 14.2 mount compilation error ([#23593](https://github.com/cypress-io/cypress/issues/23593)) ([2f337db](https://github.com/cypress-io/cypress/commit/2f337dbfa2bb212754c8fa82e3f4548a2f3a07a4))


### Features

* adding svelte component testing support ([#23553](https://github.com/cypress-io/cypress/issues/23553)) ([f6eaad4](https://github.com/cypress-io/cypress/commit/f6eaad40e1836fa9db87c60defa5ae6f390c8fd8))

# @cypress/angular-v1.0.0 (2022-08-17)


### Bug Fixes

* **angular:** set rxjs versions > 6.6.0 as dependency ([#16676](https://github.com/cypress-io/cypress/issues/16676)) ([46de81e](https://github.com/cypress-io/cypress/commit/46de81e75fd18bc37cb884e9a751106fff4d08ad))
* remove dependency causing semantic-release to fail ([#23142](https://github.com/cypress-io/cypress/issues/23142)) ([20f89bf](https://github.com/cypress-io/cypress/commit/20f89bfa32636baa8922896e719962c703129abd))
* scaffold correct config file ([#19776](https://github.com/cypress-io/cypress/issues/19776)) ([8f32960](https://github.com/cypress-io/cypress/commit/8f32960ef803f539f065d41f01fff33bfe33ed5d))
* scope config to current testing type ([#20677](https://github.com/cypress-io/cypress/issues/20677)) ([61f7cfc](https://github.com/cypress-io/cypress/commit/61f7cfc59284a2938e0a1c15d74ee75215ba5f8b))
* terminal error message for non migrated config ([#21467](https://github.com/cypress-io/cypress/issues/21467)) ([3274da7](https://github.com/cypress-io/cypress/commit/3274da7842f5ef1ddad62b1c630d0ff9120e4289))
* update scaffold template to use correct path ([#20047](https://github.com/cypress-io/cypress/issues/20047)) ([6e80359](https://github.com/cypress-io/cypress/commit/6e803597a379222cf936e5977c8314d693ee1912))


### Features

* add devServer to config file ([#18962](https://github.com/cypress-io/cypress/issues/18962)) ([2573375](https://github.com/cypress-io/cypress/commit/2573375b5b6616efd2d213a94cd55fd8e0385864))
* add template support, teardown & standalone ([#23117](https://github.com/cypress-io/cypress/issues/23117)) ([d201b37](https://github.com/cypress-io/cypress/commit/d201b37b3d6b1e37a15a8d21d853acca47bfc666))
* **angular:** angular mount ([#22858](https://github.com/cypress-io/cypress/issues/22858)) ([4131b1f](https://github.com/cypress-io/cypress/commit/4131b1fa8482ae08113bef337965baa1ac12f66c))
* Deprecate run-ct / open-ct, and update all examples to use --ct instead ([#18422](https://github.com/cypress-io/cypress/issues/18422)) ([196e8f6](https://github.com/cypress-io/cypress/commit/196e8f62cc6d27974f235945cb5700624b3dae41))
* enable Angular CT support ([#23089](https://github.com/cypress-io/cypress/issues/23089)) ([94e78eb](https://github.com/cypress-io/cypress/commit/94e78eba0430eae97529058c40611e5f24dbf140))
* ProjectLifecycleManager & general launchpad cleanup ([#19347](https://github.com/cypress-io/cypress/issues/19347)) ([4626f74](https://github.com/cypress-io/cypress/commit/4626f7481c9904fec484aa167a02e0197a3095c4))
* remove testFiles reference ([#20565](https://github.com/cypress-io/cypress/issues/20565)) ([5670344](https://github.com/cypress-io/cypress/commit/567034459089d9d53dfab5556cb9369fb335c3db))
* support specPattern, deprecate integrationFolder and componentFolder ([#19319](https://github.com/cypress-io/cypress/issues/19319)) ([792980a](https://github.com/cypress-io/cypress/commit/792980ac12746ef47b9c944ebe4c6c353a187ab2))
* support webpack-dev-server v4 ([#17918](https://github.com/cypress-io/cypress/issues/17918)) ([16e4759](https://github.com/cypress-io/cypress/commit/16e4759e0196f68c5f0525efb020211337748f94))
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))
* Use .config files ([#18578](https://github.com/cypress-io/cypress/issues/18578)) ([081dd19](https://github.com/cypress-io/cypress/commit/081dd19cc6da3da229a7af9c84f62730c85a5cd6))
* use devServer instad of startDevServer ([#20092](https://github.com/cypress-io/cypress/issues/20092)) ([8a6768f](https://github.com/cypress-io/cypress/commit/8a6768fee6f46b908c5a9daf23da8b804a6c627f))
* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))
* Use plugins on config files ([#18798](https://github.com/cypress-io/cypress/issues/18798)) ([bb8251b](https://github.com/cypress-io/cypress/commit/bb8251b752ac44f1184f9160194cf12d41fc867f))
* use supportFile by testingType ([#19364](https://github.com/cypress-io/cypress/issues/19364)) ([0366d4f](https://github.com/cypress-io/cypress/commit/0366d4fa8971e5e5189c6fd6450cc3c8d72dcfe1))

# @cypress/angular-v1.0.0 (2022-08-04)


### Bug Fixes

* **angular:** set rxjs versions > 6.6.0 as dependency ([#16676](https://github.com/cypress-io/cypress/issues/16676)) ([46de81e](https://github.com/cypress-io/cypress/commit/46de81e75fd18bc37cb884e9a751106fff4d08ad))
* scaffold correct config file ([#19776](https://github.com/cypress-io/cypress/issues/19776)) ([8f32960](https://github.com/cypress-io/cypress/commit/8f32960ef803f539f065d41f01fff33bfe33ed5d))
* scope config to current testing type ([#20677](https://github.com/cypress-io/cypress/issues/20677)) ([61f7cfc](https://github.com/cypress-io/cypress/commit/61f7cfc59284a2938e0a1c15d74ee75215ba5f8b))
* terminal error message for non migrated config ([#21467](https://github.com/cypress-io/cypress/issues/21467)) ([3274da7](https://github.com/cypress-io/cypress/commit/3274da7842f5ef1ddad62b1c630d0ff9120e4289))
* update scaffold template to use correct path ([#20047](https://github.com/cypress-io/cypress/issues/20047)) ([6e80359](https://github.com/cypress-io/cypress/commit/6e803597a379222cf936e5977c8314d693ee1912))


### Features

* add devServer to config file ([#18962](https://github.com/cypress-io/cypress/issues/18962)) ([2573375](https://github.com/cypress-io/cypress/commit/2573375b5b6616efd2d213a94cd55fd8e0385864))
* **angular:** angular mount ([#22858](https://github.com/cypress-io/cypress/issues/22858)) ([4131b1f](https://github.com/cypress-io/cypress/commit/4131b1fa8482ae08113bef337965baa1ac12f66c))
* Deprecate run-ct / open-ct, and update all examples to use --ct instead ([#18422](https://github.com/cypress-io/cypress/issues/18422)) ([196e8f6](https://github.com/cypress-io/cypress/commit/196e8f62cc6d27974f235945cb5700624b3dae41))
* ProjectLifecycleManager & general launchpad cleanup ([#19347](https://github.com/cypress-io/cypress/issues/19347)) ([4626f74](https://github.com/cypress-io/cypress/commit/4626f7481c9904fec484aa167a02e0197a3095c4))
* remove testFiles reference ([#20565](https://github.com/cypress-io/cypress/issues/20565)) ([5670344](https://github.com/cypress-io/cypress/commit/567034459089d9d53dfab5556cb9369fb335c3db))
* support specPattern, deprecate integrationFolder and componentFolder ([#19319](https://github.com/cypress-io/cypress/issues/19319)) ([792980a](https://github.com/cypress-io/cypress/commit/792980ac12746ef47b9c944ebe4c6c353a187ab2))
* support webpack-dev-server v4 ([#17918](https://github.com/cypress-io/cypress/issues/17918)) ([16e4759](https://github.com/cypress-io/cypress/commit/16e4759e0196f68c5f0525efb020211337748f94))
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))
* Use .config files ([#18578](https://github.com/cypress-io/cypress/issues/18578)) ([081dd19](https://github.com/cypress-io/cypress/commit/081dd19cc6da3da229a7af9c84f62730c85a5cd6))
* use devServer instad of startDevServer ([#20092](https://github.com/cypress-io/cypress/issues/20092)) ([8a6768f](https://github.com/cypress-io/cypress/commit/8a6768fee6f46b908c5a9daf23da8b804a6c627f))
* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))
* Use plugins on config files ([#18798](https://github.com/cypress-io/cypress/issues/18798)) ([bb8251b](https://github.com/cypress-io/cypress/commit/bb8251b752ac44f1184f9160194cf12d41fc867f))
* use supportFile by testingType ([#19364](https://github.com/cypress-io/cypress/issues/19364)) ([0366d4f](https://github.com/cypress-io/cypress/commit/0366d4fa8971e5e5189c6fd6450cc3c8d72dcfe1))

# @cypress/angular-v1.0.0 (2022-08-04)


### Bug Fixes

* **angular:** set rxjs versions > 6.6.0 as dependency ([#16676](https://github.com/cypress-io/cypress/issues/16676)) ([46de81e](https://github.com/cypress-io/cypress/commit/46de81e75fd18bc37cb884e9a751106fff4d08ad))
* scaffold correct config file ([#19776](https://github.com/cypress-io/cypress/issues/19776)) ([8f32960](https://github.com/cypress-io/cypress/commit/8f32960ef803f539f065d41f01fff33bfe33ed5d))
* scope config to current testing type ([#20677](https://github.com/cypress-io/cypress/issues/20677)) ([61f7cfc](https://github.com/cypress-io/cypress/commit/61f7cfc59284a2938e0a1c15d74ee75215ba5f8b))
* terminal error message for non migrated config ([#21467](https://github.com/cypress-io/cypress/issues/21467)) ([3274da7](https://github.com/cypress-io/cypress/commit/3274da7842f5ef1ddad62b1c630d0ff9120e4289))
* update scaffold template to use correct path ([#20047](https://github.com/cypress-io/cypress/issues/20047)) ([6e80359](https://github.com/cypress-io/cypress/commit/6e803597a379222cf936e5977c8314d693ee1912))


### Features

* add devServer to config file ([#18962](https://github.com/cypress-io/cypress/issues/18962)) ([2573375](https://github.com/cypress-io/cypress/commit/2573375b5b6616efd2d213a94cd55fd8e0385864))
* **angular:** angular mount ([#22858](https://github.com/cypress-io/cypress/issues/22858)) ([4131b1f](https://github.com/cypress-io/cypress/commit/4131b1fa8482ae08113bef337965baa1ac12f66c))
* Deprecate run-ct / open-ct, and update all examples to use --ct instead ([#18422](https://github.com/cypress-io/cypress/issues/18422)) ([196e8f6](https://github.com/cypress-io/cypress/commit/196e8f62cc6d27974f235945cb5700624b3dae41))
* ProjectLifecycleManager & general launchpad cleanup ([#19347](https://github.com/cypress-io/cypress/issues/19347)) ([4626f74](https://github.com/cypress-io/cypress/commit/4626f7481c9904fec484aa167a02e0197a3095c4))
* remove testFiles reference ([#20565](https://github.com/cypress-io/cypress/issues/20565)) ([5670344](https://github.com/cypress-io/cypress/commit/567034459089d9d53dfab5556cb9369fb335c3db))
* support specPattern, deprecate integrationFolder and componentFolder ([#19319](https://github.com/cypress-io/cypress/issues/19319)) ([792980a](https://github.com/cypress-io/cypress/commit/792980ac12746ef47b9c944ebe4c6c353a187ab2))
* support webpack-dev-server v4 ([#17918](https://github.com/cypress-io/cypress/issues/17918)) ([16e4759](https://github.com/cypress-io/cypress/commit/16e4759e0196f68c5f0525efb020211337748f94))
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))
* Use .config files ([#18578](https://github.com/cypress-io/cypress/issues/18578)) ([081dd19](https://github.com/cypress-io/cypress/commit/081dd19cc6da3da229a7af9c84f62730c85a5cd6))
* use devServer instad of startDevServer ([#20092](https://github.com/cypress-io/cypress/issues/20092)) ([8a6768f](https://github.com/cypress-io/cypress/commit/8a6768fee6f46b908c5a9daf23da8b804a6c627f))
* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))
* Use plugins on config files ([#18798](https://github.com/cypress-io/cypress/issues/18798)) ([bb8251b](https://github.com/cypress-io/cypress/commit/bb8251b752ac44f1184f9160194cf12d41fc867f))
* use supportFile by testingType ([#19364](https://github.com/cypress-io/cypress/issues/19364)) ([0366d4f](https://github.com/cypress-io/cypress/commit/0366d4fa8971e5e5189c6fd6450cc3c8d72dcfe1))
