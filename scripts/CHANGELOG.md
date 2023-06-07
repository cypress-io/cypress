# internal-scripts-v1.0.0 (2023-06-06)


### Bug Fixes

* add code signing certificate details for Windows build ([#16946](https://github.com/cypress-io/cypress/issues/16946)) ([5586059](https://github.com/cypress-io/cypress/commit/55860596536a6e2508330b2eb92333d0e2e56ce4))
* add column, line, and method check to integrity check ([#25094](https://github.com/cypress-io/cypress/issues/25094)) ([8888cd9](https://github.com/cypress-io/cypress/commit/8888cd9e211e608f9bbac81478667b2877dab76e))
* Add missing header and use correct endpoint host ([#23982](https://github.com/cypress-io/cypress/issues/23982)) ([3aad5a0](https://github.com/cypress-io/cypress/commit/3aad5a03e9291b11eb86fe68261db84dd87854ea))
* add patches to package files ([#8272](https://github.com/cypress-io/cypress/issues/8272)) ([5a3e7e6](https://github.com/cypress-io/cypress/commit/5a3e7e6143a162df69fa6d0338b794337e4961cf))
* add v8 snapshot usage to cypress in cypress testing ([#24860](https://github.com/cypress-io/cypress/issues/24860)) ([c540284](https://github.com/cypress-io/cypress/commit/c540284f5080d46a8597e53dd2213cb6fb133078))
* adding build-prod tasks to all of the npm dependencies that need artifacts ([#9045](https://github.com/cypress-io/cypress/issues/9045)) ([550c05c](https://github.com/cypress-io/cypress/commit/550c05cc3d7a2a179de21138ae5f8118277df6ef))
* adding build-prod tasks to all of the npm dependencies that need artifacts ([#9046](https://github.com/cypress-io/cypress/issues/9046)) ([462829b](https://github.com/cypress-io/cypress/commit/462829bea1d903b0f1666d4ef2dd85e56636b725))
* additional cleanup of errors following merge ([6727893](https://github.com/cypress-io/cypress/commit/6727893b1e3eaef6bcde91d9c31d854db17d66e0))
* **breaking_change:** default to headless and 1280x720 for cypress run in all browsers ([#17309](https://github.com/cypress-io/cypress/issues/17309)) ([8a48488](https://github.com/cypress-io/cypress/commit/8a4848837aea88f79446c77eeac097b713a0d0a6))
* build-prod-ui deps before build-prod packages ([8eaebc3](https://github.com/cypress-io/cypress/commit/8eaebc3d1637adaea8dc3930a26a0ffb4ab2a641))
* change // -> //z to [@types](https://github.com/types) comments once on postinstall ([#19041](https://github.com/cypress-io/cypress/issues/19041)) ([a45825e](https://github.com/cypress-io/cypress/commit/a45825eafc8c82020a4bd16dfb259d38818815f0))
* change symlinks to avoid conflict ([#18507](https://github.com/cypress-io/cypress/issues/18507)) ([d52a113](https://github.com/cypress-io/cypress/commit/d52a1137f130cc4cedcc63b3111038e41857a532))
* clean up inconsistencies in UI between sentence case and title case ([#23681](https://github.com/cypress-io/cypress/issues/23681)) ([f73aef5](https://github.com/cypress-io/cypress/commit/f73aef54b041fe08d939b52e5c6fe1d133502051))
* clear session state when changing specs in open mode ([#23146](https://github.com/cypress-io/cypress/issues/23146)) ([f1122fc](https://github.com/cypress-io/cypress/commit/f1122fcf62c14abddc0ae96116572402c1be2372))
* copy yarn.lock to packages for deterministic builds ([#17218](https://github.com/cypress-io/cypress/issues/17218)) ([16516b7](https://github.com/cypress-io/cypress/commit/16516b74b1253e3b0108fbfe14a80694ca4422a6))
* ct testing support for node 17+ ([#21430](https://github.com/cypress-io/cypress/issues/21430)) ([0f786ab](https://github.com/cypress-io/cypress/commit/0f786ab893d178c2f87eed6a1334a248c6bec7a6))
* custom reporter and experimentalSessionAndOrigin crashes ([#24630](https://github.com/cypress-io/cypress/issues/24630)) ([e9e8cad](https://github.com/cypress-io/cypress/commit/e9e8cadda4fb14d601079018b57425b221a005d9))
* **deps:** update dependency electron to v13 🌟 ([#17037](https://github.com/cypress-io/cypress/issues/17037)) ([bda59dd](https://github.com/cypress-io/cypress/commit/bda59dd7cc407518ae673eeffc49576652dc4972))
* **deps:** update dependency electron to v13 🌟 ([#17408](https://github.com/cypress-io/cypress/issues/17408)) ([9df2543](https://github.com/cypress-io/cypress/commit/9df2543f88d8e3c815ffa3ff464e0654e6aaacd2))
* **deps:** update dependency jimp to version 0.13.0 🌟 ([#7618](https://github.com/cypress-io/cypress/issues/7618)) ([fedd30c](https://github.com/cypress-io/cypress/commit/fedd30cb36c3bdffe1c6e6bbd9f6c1659ca0bbf1))
* **deps:** update dependency parse-domain to version 2.3.4 🌟 ([#5726](https://github.com/cypress-io/cypress/issues/5726)) ([6bb3a48](https://github.com/cypress-io/cypress/commit/6bb3a483f9a594d2266a767a5bbdcc1726354022))
* disable npm workspace update when running semantic-release ([#23265](https://github.com/cypress-io/cypress/issues/23265)) ([c37e94c](https://github.com/cypress-io/cypress/commit/c37e94c4225057b2995953a3976735023164807d))
* disable the --inspect and --inspect-brk family of CLI options on the Cypress binary ([#25242](https://github.com/cypress-io/cypress/issues/25242)) ([c344e37](https://github.com/cypress-io/cypress/commit/c344e37f36ee171af86b600e86779f892fcba3b9))
* don't destroy browserwindow on process.exit ([#15751](https://github.com/cypress-io/cypress/issues/15751)) ([8753030](https://github.com/cypress-io/cypress/commit/87530303e4b334e59229e87b1348e46b0cf36e89))
* Fix type definitions for cy.reload() ([#25779](https://github.com/cypress-io/cypress/issues/25779)) ([5fb2167](https://github.com/cypress-io/cypress/commit/5fb2167bb46de170614a144d2e2d904cdb3eee03))
* fixes symlinking by only adding if they do not exist ([#18513](https://github.com/cypress-io/cypress/issues/18513)) ([3f32b68](https://github.com/cypress-io/cypress/commit/3f32b6844727a512e2ea7dc463b9c1b64ae6b11b))
* GH env variable for test other projects ([#18147](https://github.com/cypress-io/cypress/issues/18147)) ([863e368](https://github.com/cypress-io/cypress/commit/863e3680bb7a02de191b62028928f89d99c14d7a))
* Guard against slow requests in GraphQL Resolution (part 2) ([#21020](https://github.com/cypress-io/cypress/issues/21020)) ([b0c8db3](https://github.com/cypress-io/cypress/commit/b0c8db34348be31f32795f3f67c3408403d59ace))
* handle case of implicit plugins/index.js files during migration ([#22501](https://github.com/cypress-io/cypress/issues/22501)) ([c7f63e1](https://github.com/cypress-io/cypress/commit/c7f63e1f2973b2de6478e1fd73262ee4da627273))
* Improve uncaught error handling ([#14826](https://github.com/cypress-io/cypress/issues/14826)) ([77b9224](https://github.com/cypress-io/cypress/commit/77b922472c91df74c2edc9092900f860a75a26d2))
* issues with monorepo tools ([#8687](https://github.com/cypress-io/cypress/issues/8687)) ([4533767](https://github.com/cypress-io/cypress/commit/453376754337957574cc5e0d14eabf040caa1b83))
* **launchpad:** scaffold correct config file ([#20372](https://github.com/cypress-io/cypress/issues/20372)) ([7f8a810](https://github.com/cypress-io/cypress/commit/7f8a810e3dd6e7c7e900d6e797ee5608262ab6e8))
* limit the number of globals defined due to the v8 snapshot ([#25051](https://github.com/cypress-io/cypress/issues/25051)) ([f9541af](https://github.com/cypress-io/cypress/commit/f9541aff10efa62ffdd15f34775c2761ba78adf3))
* make NODE_ENV "production" for prod builds of launchpad ([#25320](https://github.com/cypress-io/cypress/issues/25320)) ([5f536fe](https://github.com/cypress-io/cypress/commit/5f536fef9b0962fef2373d07becba8313d5ef126))
* Migrate from listr to listr2 ([#16663](https://github.com/cypress-io/cypress/issues/16663)) ([315d845](https://github.com/cypress-io/cypress/commit/315d845432b5755f939947a978265f4f1a1742cc))
* **mistake release:** reverts last release ([0ca8eea](https://github.com/cypress-io/cypress/commit/0ca8eeadd7decdaeb1ac23dcd1d11e618f366fe9))
* move node 17 Check from Binary to CLI ([#19977](https://github.com/cypress-io/cypress/issues/19977)) ([99f2486](https://github.com/cypress-io/cypress/commit/99f24863a20f016a48e963997a0dd2982e977b78))
* patch-package is not applied in dist'ed build ([#19239](https://github.com/cypress-io/cypress/issues/19239)) ([8262f80](https://github.com/cypress-io/cypress/commit/8262f80d1f8ca72ef4317fc191811f6a46497184))
* re-enable CYPRESS_INTERNAL_VITE_DEV development ([#25364](https://github.com/cypress-io/cypress/issues/25364)) ([991c532](https://github.com/cypress-io/cypress/commit/991c53244718b9ec3fe8ed3e51df292465f3a4bc))
* remove dependence on @cypress/<dep> types ([#24415](https://github.com/cypress-io/cypress/issues/24415)) ([58e0ab9](https://github.com/cypress-io/cypress/commit/58e0ab91604618ea6f75932622f7e66e419270e6))
* remove extra bundled electron in 10.0 binary ([#20932](https://github.com/cypress-io/cypress/issues/20932)) ([d19cba8](https://github.com/cypress-io/cypress/commit/d19cba873add4d8871f12d8f0f9fe92e418d1de2))
* remove outdated npm registry links ([#18727](https://github.com/cypress-io/cypress/issues/18727)) ([4ded6c9](https://github.com/cypress-io/cypress/commit/4ded6c9624134fe6203f5377d62d62809cd27cda))
* revert [#17132](https://github.com/cypress-io/cypress/issues/17132) use hoisted yarn install in build binary ([#17215](https://github.com/cypress-io/cypress/issues/17215)) ([ca44464](https://github.com/cypress-io/cypress/commit/ca44464521102db4779312bb72d30229da10b131))
* revive type checker ([#18172](https://github.com/cypress-io/cypress/issues/18172)) ([af472b6](https://github.com/cypress-io/cypress/commit/af472b6419ecb2aec1abdb09df99b2fa5f56e033))
* **runner:** fix firefox 'Open in IDE', test against prod builds in CI ([#8551](https://github.com/cypress-io/cypress/issues/8551)) ([7ccf595](https://github.com/cypress-io/cypress/commit/7ccf59562e8b45d6f5c51c7a0ff757553a7002b4))
* **server:** fix excess debug logs from foxdriver ([#7727](https://github.com/cypress-io/cypress/issues/7727)) ([882774d](https://github.com/cypress-io/cypress/commit/882774d949372deb318722a2aefbacdac09cc147))
* support using create-cypress-tests as part of build process ([#18714](https://github.com/cypress-io/cypress/issues/18714)) ([0501452](https://github.com/cypress-io/cypress/commit/0501452fb9e2df954ee871171052ab9f01367b25))
* **unified-desktop-gui branch:** initial installation on windows ([#18247](https://github.com/cypress-io/cypress/issues/18247)) ([8614e97](https://github.com/cypress-io/cypress/commit/8614e978029bcbf7155b7ae98ac54feb11f2e7f3))
* UNIFY-1625 Runs tab not updating in real time ([#21370](https://github.com/cypress-io/cypress/issues/21370)) ([383bdb1](https://github.com/cypress-io/cypress/commit/383bdb1d3ddcae645dfabc76b65b2aeb319b6216)), closes [#21408](https://github.com/cypress-io/cypress/issues/21408) [#21412](https://github.com/cypress-io/cypress/issues/21412)
* use posix path for ts-node loader ([#22550](https://github.com/cypress-io/cypress/issues/22550)) ([c0ea9bd](https://github.com/cypress-io/cypress/commit/c0ea9bdaa566a6f9296b6b70f0894a6c62d23ae3)), closes [#22326](https://github.com/cypress-io/cypress/issues/22326) [#22445](https://github.com/cypress-io/cypress/issues/22445)
* use unique install cache folders for betas ([#20296](https://github.com/cypress-io/cypress/issues/20296)) ([3c28617](https://github.com/cypress-io/cypress/commit/3c286177cc57e699062162d9db9ba12a562e2ccf))
* windows build ([#20854](https://github.com/cypress-io/cypress/issues/20854)) ([e6cbc5a](https://github.com/cypress-io/cypress/commit/e6cbc5ae1edef0e7f0474dba6b2d8da3030489db))


### Features

* adapt app to cloud project graphql errors ([#19384](https://github.com/cypress-io/cypress/issues/19384)) ([75328b6](https://github.com/cypress-io/cypress/commit/75328b6261443a31436fa37a319da849bac924e2))
* Add graphql to unified-desktop branch ([#17305](https://github.com/cypress-io/cypress/issues/17305)) ([1550733](https://github.com/cypress-io/cypress/commit/1550733c9d68be495628713ce74059f5909e2c2c))
* add gulp makePackage, begin to scaffold data-context ([#18186](https://github.com/cypress-io/cypress/issues/18186)) ([bad700b](https://github.com/cypress-io/cypress/commit/bad700b593a0e8300906369b03e7b7ff9874513a))
* add lint-pre-commit script to lint and autfix issues before commit ([3b1d557](https://github.com/cypress-io/cypress/commit/3b1d557d0732b2bb022441ea08c9a66abeaf766a))
* add linting scripts\nfeat: lint coffeescript files ([a26be86](https://github.com/cypress-io/cypress/commit/a26be86dfad7f8d6b637588570b464e61729e337))
* add state for global mode ([#18085](https://github.com/cypress-io/cypress/issues/18085)) ([1762cac](https://github.com/cypress-io/cypress/commit/1762caccd871be6598c31d2754b65258b12d64b2))
* Adding a cache layer for remote queries, e2e test helpers ([#18652](https://github.com/cypress-io/cypress/issues/18652)) ([05887aa](https://github.com/cypress-io/cypress/commit/05887aa3dd6a7d8ec6da70c7d824a2bdef5bee45))
* **app:** run e2e tests ([#18448](https://github.com/cypress-io/cypress/issues/18448)) ([9ca177c](https://github.com/cypress-io/cypress/commit/9ca177c4be85cfd370e058d46a7750540c342a2f))
* Banner Analytics ([#23691](https://github.com/cypress-io/cypress/issues/23691)) ([9abbbe6](https://github.com/cypress-io/cypress/commit/9abbbe61af129cb81c739a4b5d4713e4f75405e2))
* build Cypress for darwin-arm64 ([#20686](https://github.com/cypress-io/cypress/issues/20686)) ([e18b0d5](https://github.com/cypress-io/cypress/commit/e18b0d567e4db04c1a25a7e4f8e533a268c9e663))
* build Cypress for linux-arm64 ([#22252](https://github.com/cypress-io/cypress/issues/22252)) ([61f19c0](https://github.com/cypress-io/cypress/commit/61f19c045034f2bdaed3848bab6ada349c6e5a42))
* Bundle cy.origin() dependencies at runtime ([#25626](https://github.com/cypress-io/cypress/issues/25626)) ([41512c4](https://github.com/cypress-io/cypress/commit/41512c416a80e5158752fef9ffbe722402a5ada4))
* change cy.intercept override behavior ([#14543](https://github.com/cypress-io/cypress/issues/14543)) ([f6a5d1e](https://github.com/cypress-io/cypress/commit/f6a5d1ea2eaace81ef97fc91f17e9945f5ee85d1))
* **cli:** install pre-release binaries by computing binary URL from NPM URL ([#8483](https://github.com/cypress-io/cypress/issues/8483)) ([fe4e11e](https://github.com/cypress-io/cypress/commit/fe4e11ec6eba717dd8ed282394f5b968a31860a2))
* component testing ([#14479](https://github.com/cypress-io/cypress/issues/14479)) ([af26fbe](https://github.com/cypress-io/cypress/commit/af26fbebe6bc609132013a0493a116cc78bb1bd4))
* **component-testing:** changes to the driver and reporter preparing for runner-ct ([#14434](https://github.com/cypress-io/cypress/issues/14434)) ([dd559d9](https://github.com/cypress-io/cypress/commit/dd559d9862b30ffb87fa7ce492deb98d333356ff))
* **deps:** electron@9.0.5 ([#7791](https://github.com/cypress-io/cypress/issues/7791)) ([ffcb036](https://github.com/cypress-io/cypress/commit/ffcb036b40f8ba9555cacd9b9c6d84ad049dd05b))
* **deps:** update dependency electron to v15 🌟 ([#18317](https://github.com/cypress-io/cypress/issues/18317)) ([3095d73](https://github.com/cypress-io/cypress/commit/3095d733e92527ffd67344c6899211e058ceefa3))
* **deps:** update dependency electron to version 11.0.2 🌟 ([#9222](https://github.com/cypress-io/cypress/issues/9222)) ([2207bb1](https://github.com/cypress-io/cypress/commit/2207bb105e67348347e9cfa35ea0949e2facb919))
* **deps:** update dependency electron to version 12.x 🌟 ([#15292](https://github.com/cypress-io/cypress/issues/15292)) ([b52ac98](https://github.com/cypress-io/cypress/commit/b52ac98a6944bc831221ccb730f89c6cc92a4573))
* detect framework, guess component glob and query files ([#18548](https://github.com/cypress-io/cypress/issues/18548)) ([e93a074](https://github.com/cypress-io/cypress/commit/e93a074abcc6a1171b4b147520949bc8dd8fba73)), closes [#18562](https://github.com/cypress-io/cypress/issues/18562)
* embedding mount into the cypress binary (real dependency) ([#20930](https://github.com/cypress-io/cypress/issues/20930)) ([3fe5f50](https://github.com/cypress-io/cypress/commit/3fe5f50e7832a4bfb20df8e71648434eb7f263d5))
* Error standardization ([#20323](https://github.com/cypress-io/cypress/issues/20323)) ([92eac2f](https://github.com/cypress-io/cypress/commit/92eac2f67e4a0391bf058f8f95b64cc731d609cf)), closes [#20410](https://github.com/cypress-io/cypress/issues/20410)
* improve component based tests approach ([#5923](https://github.com/cypress-io/cypress/issues/5923)) ([379a9e7](https://github.com/cypress-io/cypress/commit/379a9e70081649429761e3e9c8e899fcd3f56ae6))
* improve stability when recording ([#25837](https://github.com/cypress-io/cypress/issues/25837)) ([2a17efa](https://github.com/cypress-io/cypress/commit/2a17efac74111b0a723af0e5c186e73d18c688bd))
* improve vite DX ([#18937](https://github.com/cypress-io/cypress/issues/18937)) ([2eb0ff5](https://github.com/cypress-io/cypress/commit/2eb0ff551ac34bda2935daa6404bdbe08e819be2))
* improved DX and support for running component and e2e tests w/ gulp ([#18135](https://github.com/cypress-io/cypress/issues/18135)) ([d39b169](https://github.com/cypress-io/cypress/commit/d39b1694aac19fdcf557236ac421e2cc1c45da8b))
* improved DX for unified-desktop-gui ([#18099](https://github.com/cypress-io/cypress/issues/18099)) ([a851d79](https://github.com/cypress-io/cypress/commit/a851d797a842876615f2d8a05b80561108557dea))
* introduce v8 snapshots to improve startup performance ([#24295](https://github.com/cypress-io/cypress/issues/24295)) ([b0c0eaa](https://github.com/cypress-io/cypress/commit/b0c0eaa508bb6dafdc1997bc00fb7ed6f5bcc160))
* **launchpad:** open in IDE modal and feature ([#18975](https://github.com/cypress-io/cypress/issues/18975)) ([168600b](https://github.com/cypress-io/cypress/commit/168600b285fad958fb7028559bc8c4a2b337c223))
* merging / delegating remote queries to cloud schema ([#17875](https://github.com/cypress-io/cypress/issues/17875)) ([94541d4](https://github.com/cypress-io/cypress/commit/94541d4f18591e8fa4b8702c39e92b0a7238aa5d))
* **net-stubbing:** experimental full network mocking support ([#4176](https://github.com/cypress-io/cypress/issues/4176)) ([c378960](https://github.com/cypress-io/cypress/commit/c37896089b23bd083c9fae5770ea638f87b0deb8))
* prerendering data for app load ([#18704](https://github.com/cypress-io/cypress/issues/18704)) ([4e25061](https://github.com/cypress-io/cypress/commit/4e25061e8ede31ddeb9ecdb56056464e193505e0))
* print bundled Node and Electron versions in `cypress version` ([#9183](https://github.com/cypress-io/cypress/issues/9183)) ([84d1afd](https://github.com/cypress-io/cypress/commit/84d1afd27d8b1328d3a3a2ae1905b7774ee8509e))
* ProjectLifecycleManager & general launchpad cleanup ([#19347](https://github.com/cypress-io/cypress/issues/19347)) ([4626f74](https://github.com/cypress-io/cypress/commit/4626f7481c9904fec484aa167a02e0197a3095c4))
* React 18 support ([#22876](https://github.com/cypress-io/cypress/issues/22876)) ([f0d3a48](https://github.com/cypress-io/cypress/commit/f0d3a4867907bf6e60468510daa883ccc8dcfb63))
* redesign server errors ([#20072](https://github.com/cypress-io/cypress/issues/20072)) ([29841f3](https://github.com/cypress-io/cypress/commit/29841f32b9672d92264873cf97ede50cb923a768)), closes [#20023](https://github.com/cypress-io/cypress/issues/20023) [#20036](https://github.com/cypress-io/cypress/issues/20036) [#19982](https://github.com/cypress-io/cypress/issues/19982) [#20003](https://github.com/cypress-io/cypress/issues/20003) [#19995](https://github.com/cypress-io/cypress/issues/19995) [#19983](https://github.com/cypress-io/cypress/issues/19983) [#19067](https://github.com/cypress-io/cypress/issues/19067) [#19968](https://github.com/cypress-io/cypress/issues/19968)
* remove windows 32-bit support ([#18630](https://github.com/cypress-io/cypress/issues/18630)) ([e396956](https://github.com/cypress-io/cypress/commit/e3969565340271d1413a9b0cd2c1920dde7d9f11))
* Runner-CT UI Improvements ([#15327](https://github.com/cypress-io/cypress/issues/15327)) ([e69b996](https://github.com/cypress-io/cypress/commit/e69b9968912471b9ece6298afd47fc6f14728813))
* scaffold react18 projects in component setup ([#23251](https://github.com/cypress-io/cypress/issues/23251)) ([17f442d](https://github.com/cypress-io/cypress/commit/17f442d5929f2cd9719ac8c5ae7fc898e3b30517))
* set up auto prs for snapshot metafile changes ([#25052](https://github.com/cypress-io/cypress/issues/25052)) ([56bebb1](https://github.com/cypress-io/cypress/commit/56bebb109e011d644d91237f070191058249d2e5))
* setting up e2e open mode testing framework ([#18472](https://github.com/cypress-io/cypress/issues/18472)) ([bdfc4a7](https://github.com/cypress-io/cypress/commit/bdfc4a7b80b1ba4dedaef9b20f1e25afc16ab328))
* Structuring context & schema so it can be used on the client ([#17489](https://github.com/cypress-io/cypress/issues/17489)) ([e2f395e](https://github.com/cypress-io/cypress/commit/e2f395e330f384993ed1116469102a5315a21270)), closes [#17551](https://github.com/cypress-io/cypress/issues/17551)
* Support --browser cli option in Launchpad ([#18473](https://github.com/cypress-io/cypress/issues/18473)) ([a9902b2](https://github.com/cypress-io/cypress/commit/a9902b2fe6ba785ff614f92cb9b85095d411ae72))
* support test retries ([#3968](https://github.com/cypress-io/cypress/issues/3968)) ([860a20a](https://github.com/cypress-io/cypress/commit/860a20af302eb4d56077d3445809ef6519909fe3)), closes [#8006](https://github.com/cypress-io/cypress/issues/8006)
* switch json plugin to `eslint-plugin-json-format` ([929f348](https://github.com/cypress-io/cypress/commit/929f348c29c841d09f904b7bc76f48fbd0ea929b))
* switch json plugins ([17dc74f](https://github.com/cypress-io/cypress/commit/17dc74fc88c6237bb3fb170bf6a3e2b3b3342cc1))
* **unify:** removing prism and adding infrastructure for shiki ([#18514](https://github.com/cypress-io/cypress/issues/18514)) ([9a2e550](https://github.com/cypress-io/cypress/commit/9a2e55071d5b6dcfd97ff750b80548b834b94d30))
* update icons with new design ([#20338](https://github.com/cypress-io/cypress/issues/20338)) ([9f624b4](https://github.com/cypress-io/cypress/commit/9f624b4f7a2cfbae4e7a69a0b2036642a3945c2c))
* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))
* use unified app for run mode ([#19625](https://github.com/cypress-io/cypress/issues/19625)) ([721e586](https://github.com/cypress-io/cypress/commit/721e5866252b22b486ab9476603e1414845a946e)), closes [#19686](https://github.com/cypress-io/cypress/issues/19686) [#19743](https://github.com/cypress-io/cypress/issues/19743) [#19778](https://github.com/cypress-io/cypress/issues/19778)
* various v8 snapshot improvements ([#24909](https://github.com/cypress-io/cypress/issues/24909)) ([57b0eac](https://github.com/cypress-io/cypress/commit/57b0eac60d6df911213a373ee27c5aa606d81f25))
* wire up add project button ([#18320](https://github.com/cypress-io/cypress/issues/18320)) ([98f2604](https://github.com/cypress-io/cypress/commit/98f2604abdc9a2accb6798d7f5c49a6f6ef4ac04))


### BREAKING CHANGES

* **deps:** libgbm is a requirement

* update node, xcode, docker images

* lockfile

* chore(types): tsify lib/gui/windows and spec

* fix Electron extension loading

global extension loading was deprecated in 9, now has to be per-session

* make windows fns stubbable

* update electron_spec

* tsify issue_173_spec

* use upstream foxdriver to fix FF >= 75

see https://github.com/benmalka/foxdriver/issues/7

* update test

* for now, install libgbm-dev at ci time

see https://github.com/cypress-io/cypress-docker-images/pull/332

* fix open mode

* remove devtools-ext dir
* users will have to remove `@cypress/eslint-plugin-json` and install `eslint-plugin-json-format` instead.
