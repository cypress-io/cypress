# 7.2.0 / 2020-05-22

## :tada: Enhancements

- [#4234](https://github.com/mochajs/mocha/issues/4234): Add ability to run tests in a mocha instance multiple times ([**@nicojs**](https://github.com/nicojs))
- [#4219](https://github.com/mochajs/mocha/issues/4219): Exposing filename in JSON, doc, and json-stream reporters ([**@Daniel0113**](https://github.com/Daniel0113))
- [#4244](https://github.com/mochajs/mocha/issues/4244): Add Root Hook Plugins ([**@boneskull**](https://github.com/boneskull))

## :bug: Fixes

- [#4258](https://github.com/mochajs/mocha/issues/4258): Fix missing dot in name of configuration file ([**@sonicdoe**](https://github.com/sonicdoe))
- [#4194](https://github.com/mochajs/mocha/issues/4194): Check if module.paths really exists ([**@ematipico**](https://github.com/ematipico))
- [#4256](https://github.com/mochajs/mocha/issues/4256): `--forbid-only` does not recognize `it.only` when `before` crashes ([**@arvidOtt**](https://github.com/arvidOtt))
- [#4152](https://github.com/mochajs/mocha/issues/4152): Bug with multiple async done() calls ([**@boneskull**](https://github.com/boneskull))
- [#4275](https://github.com/mochajs/mocha/issues/4275): Improper warnings for invalid reporters ([**@boneskull**](https://github.com/boneskull))
- [#4288](https://github.com/mochajs/mocha/issues/4288): Broken hook.spec.js test for IE11 ([**@boneskull**](https://github.com/boneskull))

## :book: Documentation

- [#4081](https://github.com/mochajs/mocha/issues/4081): Insufficient white space for API docs in view on mobile ([**@HyunSangHan**](https://github.com/HyunSangHan))
- [#4255](https://github.com/mochajs/mocha/issues/4255): Update mocha-docdash for UI fixes on API docs ([**@craigtaub**](https://github.com/craigtaub))
- [#4235](https://github.com/mochajs/mocha/issues/4235): Enable emoji on website; enable normal ul elements ([**@boneskull**](https://github.com/boneskull))
- [#4272](https://github.com/mochajs/mocha/issues/4272): Fetch sponsors at build time, show ALL non-skeevy sponsors ([**@boneskull**](https://github.com/boneskull))

## :nut_and_bolt: Other

- [#4249](https://github.com/mochajs/mocha/issues/4249): Refactoring improving encapsulation ([**@arvidOtt**](https://github.com/arvidOtt))
- [#4242](https://github.com/mochajs/mocha/issues/4242): CI add job names, add Node.js v14 to matrix ([**@boneskull**](https://github.com/boneskull))
- [#4237](https://github.com/mochajs/mocha/issues/4237): Refactor validatePlugins to throw coded errors ([**@boneskull**](https://github.com/boneskull))
- [#4236](https://github.com/mochajs/mocha/issues/4236): Better debug output ([**@boneskull**](https://github.com/boneskull))

# 7.1.2 / 2020-04-26

## :nut_and_bolt: Other

- [#4251](https://github.com/mochajs/mocha/issues/4251): Prevent karma-mocha from stalling ([**@juergba**](https://github.com/juergba))
- [#4222](https://github.com/mochajs/mocha/issues/4222): Update dependency mkdirp to v0.5.5 ([**@outsideris**](https://github.com/outsideris))

## :book: Documentation

- [#4208](https://github.com/mochajs/mocha/issues/4208): Add Wallaby logo to site ([**@boneskull**](https://github.com/boneskull))

# 7.1.1 / 2020-03-18

## :lock: Security Fixes

- [#4204](https://github.com/mochajs/mocha/issues/4204): Update dependencies mkdirp, yargs-parser and yargs ([**@juergba**](https://github.com/juergba))

## :bug: Fixes

- [#3660](https://github.com/mochajs/mocha/issues/3660): Fix `runner` listening to `start` and `end` events ([**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#4190](https://github.com/mochajs/mocha/issues/4190): Show Netlify badge on footer ([**@outsideris**](https://github.com/outsideris))

# 7.1.0 / 2020-02-26

## :tada: Enhancements

[#4038](https://github.com/mochajs/mocha/issues/4038): Add Node.js native ESM support ([**@giltayar**](https://github.com/giltayar))

Mocha supports writing your test files as ES modules:

- Node.js only v12.11.0 and above
- Node.js below v13.2.0, you must set `--experimental-modules` option
- current limitations: please check our [documentation](https://mochajs.org/#nodejs-native-esm-support)
- for programmatic usage: see [API: loadFilesAsync()](https://mochajs.org/api/mocha#loadFilesAsync)

**Note:** Node.JS native [ECMAScript Modules](https://nodejs.org/api/esm.html) implementation has status: **Stability: 1 - Experimental**

## :bug: Fixes

- [#4181](https://github.com/mochajs/mocha/issues/4181): Programmatic API cannot access retried test objects ([**@juergba**](https://github.com/juergba))
- [#4174](https://github.com/mochajs/mocha/issues/4174): Browser: fix `allowUncaught` option ([**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#4058](https://github.com/mochajs/mocha/issues/4058): Manage author list in AUTHORS instead of `package.json` ([**@outsideris**](https://github.com/outsideris))

## :nut_and_bolt: Other

- [#4138](https://github.com/mochajs/mocha/issues/4138): Upgrade ESLint v6.8 ([**@kaicataldo**](https://github.com/kaicataldo))

# 7.0.1 / 2020-01-25

## :bug: Fixes

- [#4165](https://github.com/mochajs/mocha/issues/4165): Fix exception when skipping tests programmatically ([**@juergba**](https://github.com/juergba))
- [#4153](https://github.com/mochajs/mocha/issues/4153): Restore backwards compatibility for `reporterOptions` ([**@holm**](https://github.com/holm))
- [#4150](https://github.com/mochajs/mocha/issues/4150): Fix recovery of an open test upon uncaught exception ([**@juergba**](https://github.com/juergba))
- [#4147](https://github.com/mochajs/mocha/issues/4147): Fix regression of leaking uncaught exception handler ([**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#4146](https://github.com/mochajs/mocha/issues/4146): Update copyright & trademark notices per OJSF ([**@boneskull**](https://github.com/boneskull))
- [#4140](https://github.com/mochajs/mocha/issues/4140): Fix broken links ([**@KyoungWan**](https://github.com/KyoungWan))

## :nut_and_bolt: Other

- [#4133](https://github.com/mochajs/mocha/issues/4133): Print more descriptive error message ([**@Zirak**](https://github.com/Zirak))

# 7.0.0 / 2020-01-05

## :boom: Breaking Changes

- [#3885](https://github.com/mochajs/mocha/issues/3885): **Drop Node.js v6.x support** ([**@mojosoeun**](https://github.com/mojosoeun))
- [#3890](https://github.com/mochajs/mocha/issues/3890): Remove Node.js debug-related flags `--debug`/`--debug-brk` and deprecate `debug` argument ([**@juergba**](https://github.com/juergba))
- [#3962](https://github.com/mochajs/mocha/issues/3962): Changes to command-line options ([**@ParkSB**](https://github.com/ParkSB)):
  - `--list-interfaces` replaces `--interfaces`
  - `--list-reporters` replaces `--reporters`
- Hook pattern of `this.skip()` ([**@juergba**](https://github.com/juergba)):
  - [#3859](https://github.com/mochajs/mocha/issues/3859): When conditionally skipping in a `it` test, related `afterEach` hooks are now executed
  - [#3741](https://github.com/mochajs/mocha/issues/3741): When conditionally skipping in a `beforeEach` hook, subsequent inner `beforeEach` hooks are now skipped and related `afterEach` hooks are executed
  - [#4136](https://github.com/mochajs/mocha/issues/4136): Disallow `this.skip()` within `after` hooks
- [#3967](https://github.com/mochajs/mocha/issues/3967): Remove deprecated `getOptions()` and `lib/cli/options.js` ([**@juergba**](https://github.com/juergba))
- [#4083](https://github.com/mochajs/mocha/issues/4083): Uncaught exception in `pending` test: don't swallow, but retrospectively fail the test for correct exit code ([**@juergba**](https://github.com/juergba))
- [#4004](https://github.com/mochajs/mocha/issues/4004): Align `Mocha` constructor's option names with command-line options ([**@juergba**](https://github.com/juergba))

## :tada: Enhancements

- [#3980](https://github.com/mochajs/mocha/issues/3980): Refactor and improve `--watch` mode with chokidar ([**@geigerzaehler**](https://github.com/geigerzaehler)):
  - adds command-line options `--watch-files` and `--watch-ignore`
  - removes `--watch-extensions`
- [#3979](https://github.com/mochajs/mocha/issues/3979): Type "rs\\n" to restart tests ([**@broofa**](https://github.com/broofa))

## :fax: Deprecations

These are _soft_-deprecated, and will emit a warning upon use. Support will be removed in (likely) the next major version of Mocha:

- [#3968](https://github.com/mochajs/mocha/issues/3968): Deprecate legacy configuration via `mocha.opts` ([**@juergba**](https://github.com/juergba))

## :bug: Fixes

- [#4125](https://github.com/mochajs/mocha/issues/4125): Fix timeout handling with `--inspect-brk`/`--inspect` ([**@juergba**](https://github.com/juergba))
- [#4070](https://github.com/mochajs/mocha/issues/4070): `Mocha` constructor: improve browser setup ([**@juergba**](https://github.com/juergba))
- [#4068](https://github.com/mochajs/mocha/issues/4068): XUnit reporter should handle exceptions during diff generation ([**@rgroothuijsen**](https://github.com/rgroothuijsen))
- [#4030](https://github.com/mochajs/mocha/issues/4030): Fix `--allow-uncaught` with `this.skip()` ([**@juergba**](https://github.com/juergba))

## :mag: Coverage

- [#4109](https://github.com/mochajs/mocha/issues/4109): Add Node.js v13.x to CI test matrix ([**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#4129](https://github.com/mochajs/mocha/issues/4129): Fix broken links ([**@SaeromB**](https://github.com/SaeromB))
- [#4127](https://github.com/mochajs/mocha/issues/4127): Add reporter alias names to docs ([**@khg0712**](https://github.com/khg0712))
- [#4101](https://github.com/mochajs/mocha/issues/4101): Clarify invalid usage of `done()` ([**@jgehrcke**](https://github.com/jgehrcke))
- [#4092](https://github.com/mochajs/mocha/issues/4092): Replace `:coffee:` with emoji ☕️ ([**@pzrq**](https://github.com/pzrq))
- [#4088](https://github.com/mochajs/mocha/issues/4088): Initial draft of project charter ([**@boneskull**](https://github.com/boneskull))
- [#4066](https://github.com/mochajs/mocha/issues/4066): Change `sh` to `bash` for code block in docs/index.md ([**@HyunSangHan**](https://github.com/HyunSangHan))
- [#4045](https://github.com/mochajs/mocha/issues/4045): Update README.md concerning GraphicsMagick installation ([**@HyunSangHan**](https://github.com/HyunSangHan))
- [#3988](https://github.com/mochajs/mocha/issues/3988): Fix sponsors background color for readability ([**@outsideris**](https://github.com/outsideris))

## :nut_and_bolt: Other

- [#4118](https://github.com/mochajs/mocha/issues/4118): Update node-environment-flags to 1.0.6 ([**@kylef**](https://github.com/kylef))
- [#4097](https://github.com/mochajs/mocha/issues/4097): Add GH Funding Metadata ([**@SheetJSDev**](https://github.com/SheetJSDev))
- [#4089](https://github.com/mochajs/mocha/issues/4089): Add funding information to `package.json` ([**@Munter**](https://github.com/Munter))
- [#4077](https://github.com/mochajs/mocha/issues/4077): Improve integration tests ([**@soobing**](https://github.com/soobing))

# 6.2.2 / 2019-10-18

## :bug: Fixes

- [#4025](https://github.com/mochajs/mocha/issues/4025): Fix duplicate `EVENT_RUN_END` events upon uncaught exception ([**@juergba**](https://github.com/juergba))
- [#4051](https://github.com/mochajs/mocha/issues/4051): Fix "unhide" function in `html` reporter (browser) ([**@pec9399**](https://github.com/pec9399))
- [#4063](https://github.com/mochajs/mocha/issues/4063): Fix use of [esm](https://npm.im/esm) in Node.js v8.x ([**@boneskull**](https://github.com/boneskull))
- [#4033](https://github.com/mochajs/mocha/issues/4033): Fix output when multiple async exceptions are thrown ([**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#4046](https://github.com/mochajs/mocha/issues/4046): Site accessibility fixes ([**@Mia-jeong**](https://github.com/Mia-jeong))
- [#4026](https://github.com/mochajs/mocha/issues/4026): Update docs for custom reporters in browser ([**@Lindsay-Needs-Sleep**](https://github.com/Lindsay-Needs-Sleep))
- [#3971](https://github.com/mochajs/mocha/issues/3971): Adopt new OpenJS Foundation Code of Conduct ([**@craigtaub**](https://github.com/craigtaub))

# 6.2.1 / 2019-09-29

## :bug: Fixes

- [#3955](https://github.com/mochajs/mocha/issues/3955): tty.getWindowSize is not a function inside a "worker_threads" worker ([**@1999**](https://github.com/1999))
- [#3970](https://github.com/mochajs/mocha/issues/3970): remove extraGlobals() ([**@juergba**](https://github.com/juergba))
- [#3984](https://github.com/mochajs/mocha/issues/3984): Update yargs-unparser to v1.6.0 ([**@juergba**](https://github.com/juergba))
- [#3983](https://github.com/mochajs/mocha/issues/3983): Package 'esm': spawn child-process for correct loading ([**@juergba**](https://github.com/juergba))
- [#3986](https://github.com/mochajs/mocha/issues/3986): Update yargs to v13.3.0 and yargs-parser to v13.1.1 ([**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#3886](https://github.com/mochajs/mocha/issues/3886): fix styles on mochajs.org ([**@outsideris**](https://github.com/outsideris))
- [#3966](https://github.com/mochajs/mocha/issues/3966): Remove jsdoc index.html placeholder from eleventy file structure and fix broken link in jsdoc tutorial ([**@Munter**](https://github.com/Munter))
- [#3765](https://github.com/mochajs/mocha/issues/3765): Add Matomo to website ([**@MarioDiaz98**](https://github.com/MarioDiaz98))
- [#3947](https://github.com/mochajs/mocha/issues/3947): Clarify effect of .skip() ([**@oliversalzburg**](https://github.com/oliversalzburg))

# 6.2.0 / 2019-07-18

## :tada: Enhancements

- [#3827](https://github.com/mochajs/mocha/issues/3827): Do not fork child-process if no Node flags are present ([**@boneskull**](https://github.com/boneskull))
- [#3725](https://github.com/mochajs/mocha/issues/3725): Base reporter store ref to console.log, see [mocha/wiki](https://github.com/mochajs/mocha/wiki/HOW-TO:-Correctly-stub-stdout) ([**@craigtaub**](https://github.com/craigtaub))

## :bug: Fixes

- [#3942](https://github.com/mochajs/mocha/issues/3942): Fix "No test files found" Error when file is passed via `--file` ([**@gabegorelick**](https://github.com/gabegorelick))
- [#3914](https://github.com/mochajs/mocha/issues/3914): Modify Mocha constructor to accept options `global` or `globals` ([**@pascalpp**](https://github.com/pascalpp))
- [#3894](https://github.com/mochajs/mocha/issues/3894): Fix parsing of config files with `_mocha` binary ([**@juergba**](https://github.com/juergba))
- [#3834](https://github.com/mochajs/mocha/issues/3834): Fix CLI parsing with default values ([**@boneskull**](https://github.com/boneskull), [**@juergba**](https://github.com/juergba))
- [#3831](https://github.com/mochajs/mocha/issues/3831): Fix `--timeout`/`--slow` string values and duplicate arguments ([**@boneskull**](https://github.com/boneskull), [**@juergba**](https://github.com/juergba))

## :book: Documentation

- [#3906](https://github.com/mochajs/mocha/issues/3906): Document option to define custom report name for XUnit reporter ([**@pkuczynski**](https://github.com/pkuczynski))
- [#3889](https://github.com/mochajs/mocha/issues/3889): Adds doc links for mocha-examples ([**@craigtaub**](https://github.com/craigtaub))
- [#3887](https://github.com/mochajs/mocha/issues/3887): Fix broken links ([**@toyjhlee**](https://github.com/toyjhlee))
- [#3841](https://github.com/mochajs/mocha/issues/3841): Fix anchors to configuration section ([**@trescube**](https://github.com/trescube))

## :mag: Coverage

- [#3915](https://github.com/mochajs/mocha/issues/3915), [#3929](https://github.com/mochajs/mocha/issues/3929): Increase tests coverage for `--watch` options ([**@geigerzaehler**](https://github.com/geigerzaehler))

## :nut_and_bolt: Other

- [#3953](https://github.com/mochajs/mocha/issues/3953): Collect test files later, prepares improvements to the `--watch` mode behavior ([**@geigerzaehler**](https://github.com/geigerzaehler))
- [#3939](https://github.com/mochajs/mocha/issues/3939): Upgrade for npm audit ([**@boneskull**](https://github.com/boneskull))
- [#3930](https://github.com/mochajs/mocha/issues/3930): Extract `runWatch` into separate module ([**@geigerzaehler**](https://github.com/geigerzaehler))
- [#3922](https://github.com/mochajs/mocha/issues/3922): Add `mocha.min.js` file to stacktrace filter ([**@brian-lagerman**](https://github.com/brian-lagerman))
- [#3919](https://github.com/mochajs/mocha/issues/3919): Update CI config files to use Node-12.x ([**@plroebuck**](https://github.com/plroebuck))
- [#3892](https://github.com/mochajs/mocha/issues/3892): Rework reporter tests ([**@plroebuck**](https://github.com/plroebuck))
- [#3872](https://github.com/mochajs/mocha/issues/3872): Rename `--exclude` to `--ignore` and create alias ([**@boneskull**](https://github.com/boneskull))
- [#3963](https://github.com/mochajs/mocha/issues/3963): Hide stacktrace when cli args are missing ([**@outsideris**](https://github.com/outsideris))
- [#3956](https://github.com/mochajs/mocha/issues/3956): Do not redeclare variable in docs array example ([**@DanielRuf**](https://github.com/DanielRuf))
- [#3957](https://github.com/mochajs/mocha/issues/3957): Remove duplicate line-height property in `mocha.css` ([**@DanielRuf**](https://github.com/DanielRuf))
- [#3960](https://github.com/mochajs/mocha/issues/3960): Don't re-initialize grep option on watch re-run ([**@geigerzaehler**](https://github.com/geigerzaehler))

# 6.1.4 / 2019-04-18

## :lock: Security Fixes

- [#3877](https://github.com/mochajs/mocha/issues/3877): Upgrade [js-yaml](https://npm.im/js-yaml), addressing [code injection vulnerability](https://www.npmjs.com/advisories/813) ([**@bjornstar**](https://github.com/bjornstar))

# 6.1.3 / 2019-04-11

## :bug: Fixes

- [#3863](https://github.com/mochajs/mocha/issues/3863): Fix `yargs`-related global scope pollution ([**@inukshuk**](https://github.com/inukshuk))
- [#3869](https://github.com/mochajs/mocha/issues/3869): Fix failure when installed w/ `pnpm` ([**@boneskull**](https://github.com/boneskull))

# 6.1.2 / 2019-04-08

## :bug: Fixes

- [#3867](https://github.com/mochajs/mocha/issues/3867): Re-publish v6.1.1 from POSIX OS to avoid dropped executable flags ([**@boneskull**](https://github.com/boneskull))

# 6.1.1 / 2019-04-07

## :bug: Fixes

- [#3866](https://github.com/mochajs/mocha/issues/3866): Fix Windows End-of-Line publishing issue ([**@juergba**](https://github.com/juergba) & [**@cspotcode**](https://github.com/cspotcode))

# 6.1.0 / 2019-04-07

## :lock: Security Fixes

- [#3845](https://github.com/mochajs/mocha/issues/3845): Update dependency "js-yaml" to v3.13.0 per npm security advisory ([**@plroebuck**](https://github.com/plroebuck))

## :tada: Enhancements

- [#3766](https://github.com/mochajs/mocha/issues/3766): Make reporter constructor support optional `options` parameter ([**@plroebuck**](https://github.com/plroebuck))
- [#3760](https://github.com/mochajs/mocha/issues/3760): Add support for config files with `.jsonc` extension ([**@sstephant**](https://github.com/sstephant))

## :fax: Deprecations

These are _soft_-deprecated, and will emit a warning upon use. Support will be removed in (likely) the next major version of Mocha:

- [#3719](https://github.com/mochajs/mocha/issues/3719): Deprecate `this.skip()` for "after all" hooks ([**@juergba**](https://github.com/juergba))

## :bug: Fixes

- [#3829](https://github.com/mochajs/mocha/issues/3829): Use cwd-relative pathname to load config file ([**@plroebuck**](https://github.com/plroebuck))
- [#3745](https://github.com/mochajs/mocha/issues/3745): Fix async calls of `this.skip()` in "before each" hooks ([**@juergba**](https://github.com/juergba))
- [#3669](https://github.com/mochajs/mocha/issues/3669): Enable `--allow-uncaught` for uncaught exceptions thrown inside hooks ([**@givanse**](https://github.com/givanse))

and some regressions:

- [#3848](https://github.com/mochajs/mocha/issues/3848): Fix `Suite` cloning by copying `root` property ([**@fatso83**](https://github.com/fatso83))
- [#3816](https://github.com/mochajs/mocha/issues/3816): Guard against undefined timeout option ([**@boneskull**](https://github.com/boneskull))
- [#3814](https://github.com/mochajs/mocha/issues/3814): Update "yargs" in order to avoid deprecation message ([**@boneskull**](https://github.com/boneskull))
- [#3788](https://github.com/mochajs/mocha/issues/3788): Fix support for multiple node flags ([**@aginzberg**](https://github.com/aginzberg))

## :book: Documentation

- [mochajs/mocha-examples](https://github.com/mochajs/mocha-examples): New repository of working examples of common configurations using mocha ([**@craigtaub**](https://github.com/craigtaub))
- [#3850](https://github.com/mochajs/mocha/issues/3850): Remove pound icon showing on header hover on docs ([**@jd2rogers2**](https://github.com/jd2rogers2))
- [#3812](https://github.com/mochajs/mocha/issues/3812): Add autoprefixer to documentation page CSS ([**@Munter**](https://github.com/Munter))
- [#3811](https://github.com/mochajs/mocha/issues/3811): Update doc examples "tests.html" ([**@DavidLi119**](https://github.com/DavidLi119))
- [#3807](https://github.com/mochajs/mocha/issues/3807): Mocha website HTML tweaks ([**@plroebuck**](https://github.com/plroebuck))
- [#3793](https://github.com/mochajs/mocha/issues/3793): Update config file example ".mocharc.yml" ([**@cspotcode**](https://github.com/cspotcode))

## :nut_and_bolt: Other

- [#3830](https://github.com/mochajs/mocha/issues/3830): Replace dependency "findup-sync" with "find-up" for faster startup ([**@cspotcode**](https://github.com/cspotcode))
- [#3799](https://github.com/mochajs/mocha/issues/3799): Update devDependencies to fix many npm vulnerabilities ([**@XhmikosR**](https://github.com/XhmikosR))

# 6.0.2 / 2019-02-25

## :bug: Fixes

Two more regressions fixed:

- [#3768](https://github.com/mochajs/mocha/issues/3768): Test file paths no longer dropped from `mocha.opts` ([**@boneskull**](https://github.com/boneskull))
- [#3767](https://github.com/mochajs/mocha/issues/3767): `--require` does not break on module names that look like certain `node` flags ([**@boneskull**](https://github.com/boneskull))

# 6.0.1 / 2019-02-21

The obligatory round of post-major-release bugfixes.

## :bug: Fixes

These issues were regressions.

- [#3754](https://github.com/mochajs/mocha/issues/3754): Mocha again finds `test.js` when run without arguments ([**@plroebuck**](https://github.com/plroebuck))
- [#3756](https://github.com/mochajs/mocha/issues/3756): Mocha again supports third-party interfaces via `--ui` ([**@boneskull**](https://github.com/boneskull))
- [#3755](https://github.com/mochajs/mocha/issues/3755): Fix broken `--watch` ([**@boneskull**](https://github.com/boneskull))
- [#3759](https://github.com/mochajs/mocha/issues/3759): Fix unwelcome deprecation notice when Mocha run against languages (CoffeeScript) with implicit return statements; _returning a non-`undefined` value from a `describe` callback is no longer considered deprecated_ ([**@boneskull**](https://github.com/boneskull))

## :book: Documentation

- [#3738](https://github.com/mochajs/mocha/issues/3738): Upgrade to `@mocha/docdash@2` ([**@tendonstrength**](https://github.com/tendonstrength))
- [#3751](https://github.com/mochajs/mocha/issues/3751): Use preferred names for example config files ([**@Szauka**](https://github.com/Szauka))

# 6.0.0 / 2019-02-18

## :tada: Enhancements

- [#3726](https://github.com/mochajs/mocha/issues/3726): Add ability to unload files from `require` cache ([**@plroebuck**](https://github.com/plroebuck))

## :bug: Fixes

- [#3737](https://github.com/mochajs/mocha/issues/3737): Fix falsy values from options globals ([**@plroebuck**](https://github.com/plroebuck))
- [#3707](https://github.com/mochajs/mocha/issues/3707): Fix encapsulation issues for `Suite#_onlyTests` and `Suite#_onlySuites` ([**@vkarpov15**](https://github.com/vkarpov15))
- [#3711](https://github.com/mochajs/mocha/issues/3711): Fix diagnostic messages dealing with plurality and markup of output ([**@plroebuck**](https://github.com/plroebuck))
- [#3723](https://github.com/mochajs/mocha/issues/3723): Fix "reporter-option" to allow comma-separated options ([**@boneskull**](https://github.com/boneskull))
- [#3722](https://github.com/mochajs/mocha/issues/3722): Fix code quality and performance of `lookupFiles` and `files` ([**@plroebuck**](https://github.com/plroebuck))
- [#3650](https://github.com/mochajs/mocha/issues/3650), [#3654](https://github.com/mochajs/mocha/issues/3654): Fix noisy error message when no files found ([**@craigtaub**](https://github.com/craigtaub))
- [#3632](https://github.com/mochajs/mocha/issues/3632): Tests having an empty title are no longer confused with the "root" suite ([**@juergba**](https://github.com/juergba))
- [#3666](https://github.com/mochajs/mocha/issues/3666): Fix missing error codes ([**@vkarpov15**](https://github.com/vkarpov15))
- [#3684](https://github.com/mochajs/mocha/issues/3684): Fix exiting problem in Node.js v11.7.0+ ([**@addaleax**](https://github.com/addaleax))
- [#3691](https://github.com/mochajs/mocha/issues/3691): Fix `--delay` (and other boolean options) not working in all cases ([**@boneskull**](https://github.com/boneskull))
- [#3692](https://github.com/mochajs/mocha/issues/3692): Fix invalid command-line argument usage not causing actual errors ([**@boneskull**](https://github.com/boneskull))
- [#3698](https://github.com/mochajs/mocha/issues/3698), [#3699](https://github.com/mochajs/mocha/issues/3699): Fix debug-related Node.js options not working in all cases ([**@boneskull**](https://github.com/boneskull))
- [#3700](https://github.com/mochajs/mocha/issues/3700): Growl notifications now show the correct number of tests run ([**@outsideris**](https://github.com/outsideris))
- [#3686](https://github.com/mochajs/mocha/issues/3686): Avoid potential ReDoS when diffing large objects ([**@cyjake**](https://github.com/cyjake))
- [#3715](https://github.com/mochajs/mocha/issues/3715): Fix incorrect order of emitted events when used programmatically ([**@boneskull**](https://github.com/boneskull))
- [#3706](https://github.com/mochajs/mocha/issues/3706): Fix regression wherein `--reporter-option`/`--reporter-options` did not support comma-separated key/value pairs ([**@boneskull**](https://github.com/boneskull))

## :book: Documentation

- [#3652](https://github.com/mochajs/mocha/issues/3652): Switch from Jekyll to Eleventy ([**@Munter**](https://github.com/Munter))

## :nut_and_bolt: Other

- [#3677](https://github.com/mochajs/mocha/issues/3677): Add error objects for createUnsupportedError and createInvalidExceptionError ([**@boneskull**](https://github.com/boneskull))
- [#3733](https://github.com/mochajs/mocha/issues/3733): Removed unnecessary processing in post-processing hook ([**@wanseob**](https://github.com/wanseob))
- [#3730](https://github.com/mochajs/mocha/issues/3730): Update nyc to latest version ([**@coreyfarrell**](https://github.com/coreyfarrell))
- [#3648](https://github.com/mochajs/mocha/issues/3648), [#3680](https://github.com/mochajs/mocha/issues/3680): Fixes to support latest versions of [unexpected](https://npm.im/unexpected) and [unexpected-sinon](https://npm.im/unexpected-sinon) ([**@sunesimonsen**](https://github.com/sunesimonsen))
- [#3638](https://github.com/mochajs/mocha/issues/3638): Add meta tag to site ([**@MartijnCuppens**](https://github.com/MartijnCuppens))
- [#3653](https://github.com/mochajs/mocha/issues/3653): Fix parts of test suite failing to run on Windows ([**@boneskull**](https://github.com/boneskull))

# 6.0.0-1 / 2019-01-02

## :bug: Fixes

- Fix missing `mocharc.json` in published package ([**@boneskull**](https://github.com/boneskull))

# 6.0.0-0 / 2019-01-01

**Documentation for this release can be found at [next.mochajs.org](https://next.mochajs.org)**!

Welcome [**@plroebuck**](https://github.com/plroebuck), [**@craigtaub**](https://github.com/craigtaub), & [**@markowsiak**](https://github.com/markowsiak) to the team!

## :boom: Breaking Changes

- [#3149](https://github.com/mochajs/mocha/issues/3149): **Drop Node.js v4.x support** ([**@outsideris**](https://github.com/outsideris))
- [#3556](https://github.com/mochajs/mocha/issues/3556): Changes to command-line options ([**@boneskull**](https://github.com/boneskull)):
  - `--grep` and `--fgrep` are now mutually exclusive; attempting to use both will cause Mocha to fail instead of simply ignoring `--grep`
  - `--compilers` is no longer supported; attempting to use will cause Mocha to fail with a link to more information
  - `-d` is no longer an alias for `--debug`; `-d` is currently ignored
  - [#3275](https://github.com/mochajs/mocha/issues/3275): `--watch-extensions` no longer implies `js`; it must be explicitly added ([**@TheDancingCode**](https://github.com/TheDancingCode))
- [#2908](https://github.com/mochajs/mocha/issues/2908): `tap` reporter emits error messages ([**@chrmod**](https://github.com/chrmod))
- [#2819](https://github.com/mochajs/mocha/issues/2819): When conditionally skipping in a `before` hook, subsequent `before` hooks _and_ tests in nested suites are now skipped ([**@bannmoore**](https://github.com/bannmoore))
- [#627](https://github.com/mochajs/mocha/issues/627): Emit filepath in "timeout exceeded" exceptions where applicable ([**@boneskull**](https://github.com/boneskull))
- [#3556](https://github.com/mochajs/mocha/issues/3556): `lib/template.html` has moved to `lib/browser/template.html` ([**@boneskull**](https://github.com/boneskull))
- [#2576](https://github.com/mochajs/mocha/issues/2576): An exception is now thrown if Mocha fails to parse or find a `mocha.opts` at a user-specified path ([**@plroebuck**](https://github.com/plroebuck))
- [#3458](https://github.com/mochajs/mocha/issues/3458): Instantiating a `Base`-extending reporter without a `Runner` parameter will throw an exception ([**@craigtaub**](https://github.com/craigtaub))
- [#3125](https://github.com/mochajs/mocha/issues/3125): For consumers of Mocha's programmatic API, all exceptions thrown from Mocha now have a `code` property (and some will have additional metadata). Some `Error` messages have changed. **Please use the `code` property to check `Error` types instead of the `message` property**; these descriptions will be localized in the future. ([**@craigtaub**](https://github.com/craigtaub))

## :fax: Deprecations

These are _soft_-deprecated, and will emit a warning upon use. Support will be removed in (likely) the next major version of Mocha:

- `-gc` users should use `--gc-global` instead
- Consumers of the function exported by `bin/options` should now use the `loadMochaOpts` or `loadOptions` (preferred) functions exported by the `lib/cli/options` module

Regarding the `Mocha` class constructor (from `lib/mocha`):

- Use property `color: false` instead of `useColors: false`
- Use property `timeout: false` instead of `enableTimeouts: false`

All of the above deprecations were introduced by [#3556](https://github.com/mochajs/mocha/issues/3556).

`mocha.opts` is now considered "legacy"; please prefer RC file or `package.json` over `mocha.opts`.

## :tada: Enhancements

Enhancements introduced in [#3556](https://github.com/mochajs/mocha/issues/3556):

- Mocha now supports "RC" files in JS, JSON, YAML, or `package.json`-based (using `mocha` property) format

  - `.mocharc.js`, `.mocharc.json`, `.mocharc.yaml` or `.mocharc.yml` are valid "rc" file names and will be automatically loaded
  - Use `--config /path/to/rc/file` to specify an explicit path
  - Use `--package /path/to/package.json` to specify an explicit `package.json` to read the `mocha` prop from
  - Use `--no-config` or `--no-package` to completely disable loading of configuration via RC file and `package.json`, respectively
  - Configurations are merged as applicable using the priority list:
    1. Command-line arguments
    1. RC file
    1. `package.json`
    1. `mocha.opts`
    1. Mocha's own defaults
  - Check out these [example config files](https://github.com/mochajs/mocha/tree/master/example/config)

- Node/V8 flag support in `mocha` executable:

  - Support all allowed `node` flags as supported by the running version of `node` (also thanks to [**@demurgos**](https://github.com/demurgos))
  - Support any V8 flag by prepending `--v8-` to the flag name
  - All flags are also supported via config files, `package.json` properties, or `mocha.opts`
  - Debug-related flags (e.g., `--inspect`) now _imply_ `--no-timeouts`
  - Use of e.g., `--debug` will automatically invoke `--inspect` if supported by running version of `node`

- Support negation of any Mocha-specific command-line flag by prepending `--no-` to the flag name

- Interfaces now have descriptions when listed using `--interfaces` flag

- `Mocha` constructor supports all options

- `--extension` is now an alias for `--watch-extensions` and affects _non-watch-mode_ test runs as well. For example, to run _only_ `test/*.coffee` (not `test/*.js`), you can do `mocha --require coffee-script/register --extensions coffee`.

- [#3552](https://github.com/mochajs/mocha/issues/3552): `tap` reporter is now TAP13-capable ([**@plroebuck**](https://github.com/plroebuck) & [**@mollstam**](https://github.com/mollstam))

- [#3535](https://github.com/mochajs/mocha/issues/3535): Mocha's version can now be queried programmatically via public property `Mocha.prototype.version` ([**@plroebuck**](https://github.com/plroebuck))

- [#3428](https://github.com/mochajs/mocha/issues/3428): `xunit` reporter shows diffs ([**@mlucool**](https://github.com/mlucool))

- [#2529](https://github.com/mochajs/mocha/issues/2529): `Runner` now emits a `retry` event when tests are retried (reporters can listen for this) ([**@catdad**](https://github.com/catdad))

- [#2962](https://github.com/mochajs/mocha/issues/2962), [#3111](https://github.com/mochajs/mocha/issues/3111): In-browser notification support; warn about missing prereqs when `--growl` supplied ([**@plroebuck**](https://github.com/plroebuck))

## :bug: Fixes

- [#3356](https://github.com/mochajs/mocha/issues/3356): `--no-timeouts` and `--timeout 0` now does what you'd expect ([**@boneskull**](https://github.com/boneskull))
- [#3475](https://github.com/mochajs/mocha/issues/3475): Restore `--no-exit` option ([**@boneskull**](https://github.com/boneskull))
- [#3570](https://github.com/mochajs/mocha/issues/3570): Long-running tests now respect `SIGINT` ([**@boneskull**](https://github.com/boneskull))
- [#2944](https://github.com/mochajs/mocha/issues/2944): `--forbid-only` and `--forbid-pending` now "fail fast" when encountered on a suite ([**@outsideris**](https://github.com/outsideris))
- [#1652](https://github.com/mochajs/mocha/issues/1652), [#2951](https://github.com/mochajs/mocha/issues/2951): Fix broken clamping of timeout values ([**@plroebuck**](https://github.com/plroebuck))
- [#2095](https://github.com/mochajs/mocha/issues/2095), [#3521](https://github.com/mochajs/mocha/issues/3521): Do not log `stdout:` prefix in browser console ([**@Bamieh**](https://github.com/Bamieh))
- [#3595](https://github.com/mochajs/mocha/issues/3595): Fix mochajs.org deployment problems ([**@papandreou**](https://github.com/papandreou))
- [#3518](https://github.com/mochajs/mocha/issues/3518): Improve `utils.isPromise()` ([**@fabiosantoscode**](https://github.com/fabiosantoscode))
- [#3320](https://github.com/mochajs/mocha/issues/3320): Fail gracefully when non-extensible objects are thrown in async tests ([**@fargies**](https://github.com/fargies))
- [#2475](https://github.com/mochajs/mocha/issues/2475): XUnit does not duplicate test result numbers in "errors" and "failures"; "failures" will **always** be zero ([**@mlucool**](https://github.com/mlucool))
- [#3398](https://github.com/mochajs/mocha/issues/3398), [#3598](https://github.com/mochajs/mocha/issues/3598), [#3457](https://github.com/mochajs/mocha/issues/3457), [#3617](https://github.com/mochajs/mocha/issues/3617): Fix regression wherein `--bail` would not execute "after" nor "after each" hooks ([**@juergba**](https://github.com/juergba))
- [#3580](https://github.com/mochajs/mocha/issues/3580): Fix potential exception when using XUnit reporter programmatically ([**@Lana-Light**](https://github.com/Lana-Light))
- [#1304](https://github.com/mochajs/mocha/issues/1304): Do not output color to `TERM=dumb` ([**@plroebuck**](https://github.com/plroebuck))

## :book: Documentation

- [#3525](https://github.com/mochajs/mocha/issues/3525): Improvements to `.github/CONTRIBUTING.md` ([**@markowsiak**](https://github.com/markowsiak))
- [#3466](https://github.com/mochajs/mocha/issues/3466): Update description of `slow` option ([**@finfin**](https://github.com/finfin))
- [#3405](https://github.com/mochajs/mocha/issues/3405): Remove references to bower installations ([**@goteamtim**](https://github.com/goteamtim))
- [#3361](https://github.com/mochajs/mocha/issues/3361): Improvements to `--watch` docs ([**@benglass**](https://github.com/benglass))
- [#3136](https://github.com/mochajs/mocha/issues/3136): Improve docs around globbing and shell expansion ([**@akrawchyk**](https://github.com/akrawchyk))
- [#2819](https://github.com/mochajs/mocha/issues/2819): Update docs around skips and hooks ([**@bannmoore**](https://github.com/bannmoore))
- Many improvements by [**@outsideris**](https://github.com/outsideris)

## :nut_and_bolt: Other

- [#3557](https://github.com/mochajs/mocha/issues/3557): Use `ms` userland module instead of hand-rolled solution ([**@gizemkeser**](https://github.com/gizemkeser))
- Many CI fixes and other refactors by [**@plroebuck**](https://github.com/plroebuck)
- Test refactors by [**@outsideris**](https://github.com/outsideris)

# 5.2.0 / 2018-05-18

## :tada: Enhancements

- [#3375](https://github.com/mochajs/mocha/pull/3375): Add support for comments in `mocha.opts` ([@plroebuck](https://github.com/plroebuck))

## :bug: Fixes

- [#3346](https://github.com/mochajs/mocha/pull/3346): Exit correctly from `before` hooks when using `--bail` ([@outsideris](https://github.com/outsideris))

## :book: Documentation

- [#3328](https://github.com/mochajs/mocha/pull/3328): Mocha-flavored [API docs](https://mochajs.org/api/)! ([@Munter](https://github.com/munter))

## :nut_and_bolt: Other

- [#3330](https://github.com/mochajs/mocha/pull/3330): Use `Buffer.from()` ([@harrysarson](https://github.com/harrysarson))
- [#3295](https://github.com/mochajs/mocha/pull/3295): Remove redundant folder ([@DavNej](https://github.com/DajNev))
- [#3356](https://github.com/mochajs/mocha/pull/3356): Refactoring ([@plroebuck](https://github.com/plroebuck))

# 5.1.1 / 2018-04-18

## :bug: Fixes

- [#3325](https://github.com/mochajs/mocha/issues/3325): Revert change which broke `--watch` ([@boneskull](https://github.com/boneskull))

# 5.1.0 / 2018-04-12

## :tada: Enhancements

- [#3210](https://github.com/mochajs/mocha/pull/3210): Add `--exclude` option ([@metalex9](https://github.com/metalex9))

## :bug: Fixes

- [#3318](https://github.com/mochajs/mocha/pull/3318): Fix failures in circular objects in JSON reporter ([@jeversmann](https://github.com/jeversmann), [@boneskull](https://github.com/boneskull))

## :book: Documentation

- [#3323](https://github.com/mochajs/mocha/pull/3323): Publish actual [API documentation](https://mochajs.org/api/)! ([@dfberry](https://github.com/dfberry), [@Munter](https://github.com/munter))
- [#3299](https://github.com/mochajs/mocha/pull/3299): Improve docs around exclusive tests ([@nicgirault](https://github.com/nicgirault))

## :nut_and_bolt: Other

- [#3302](https://github.com/mochajs/mocha/pull/3302), [#3308](https://github.com/mochajs/mocha/pull/3308), [#3310](https://github.com/mochajs/mocha/pull/3310), [#3315](https://github.com/mochajs/mocha/pull/3315), [#3316](https://github.com/mochajs/mocha/pull/3316): Build matrix improvements ([more info](https://boneskull.com/mocha-and-travis-ci-build-stages/)) ([@outsideris](https://github.com/outsideris), [@boneskull](https://github.com/boneskull))
- [#3272](https://github.com/mochajs/mocha/pull/3272): Refactor reporter tests ([@jMuzsik](https://github.com/jMuzsik))

# 5.0.5 / 2018-03-22

Welcome [@outsideris](https://github.com/outsideris) to the team!

## :bug: Fixes

- [#3096](https://github.com/mochajs/mocha/issues/3096): Fix `--bail` failing to bail within hooks ([@outsideris](https://github.com/outsideris))
- [#3184](https://github.com/mochajs/mocha/issues/3184): Don't skip too many suites (using `describe.skip()`) ([@outsideris](https://github.com/outsideris))

## :book: Documentation

- [#3133](https://github.com/mochajs/mocha/issues/3133): Improve docs regarding "pending" behavior ([@ematicipo](https://github.com/ematicipo))
- [#3276](https://github.com/mochajs/mocha/pull/3276), [#3274](https://github.com/mochajs/mocha/pull/3274): Fix broken stuff in `CHANGELOG.md` ([@tagoro9](https://github.com/tagoro9), [@honzajavorek](https://github.com/honzajavorek))

## :nut_and_bolt: Other

- [#3208](https://github.com/mochajs/mocha/issues/3208): Improve test coverage for AMD users ([@outsideris](https://github.com/outsideris))
- [#3267](https://github.com/mochajs/mocha/pull/3267): Remove vestiges of PhantomJS from CI ([@anishkny](https://github.com/anishkny))
- [#2952](https://github.com/mochajs/mocha/issues/2952): Fix a debug message ([@boneskull](https://github.com/boneskull))

# 5.0.4 / 2018-03-07

## :bug: Fixes

- [#3265](https://github.com/mochajs/mocha/issues/3265): Fixes regression in "watch" functionality introduced in v5.0.2 ([@outsideris](https://github.com/outsideris))

# 5.0.3 / 2018-03-06

This patch features a fix to address a potential "low severity" [ReDoS vulnerability](https://snyk.io/vuln/npm:diff:20180305) in the [diff](https://npm.im/diff) package (a dependency of Mocha).

## :lock: Security Fixes

- [#3266](https://github.com/mochajs/mocha/pull/3266): Bump `diff` to v3.5.0 ([@anishkny](https://github.com/anishkny))

## :nut_and_bolt: Other

- [#3011](https://github.com/mochajs/mocha/issues/3011): Expose `generateDiff()` in `Base` reporter ([@harrysarson](https://github.com/harrysarson))

# 5.0.2 / 2018-03-05

This release fixes a class of tests which report as _false positives_. **Certain tests will now break**, though they would have previously been reported as passing. Details below. Sorry for the inconvenience!

## :bug: Fixes

- [#3226](https://github.com/mochajs/mocha/issues/3226): Do not swallow errors that are thrown asynchronously from passing tests ([@boneskull](https://github.com/boneskull)). Example:

  \`\`\`js
  it('should actually fail, sorry!', function (done) {
  // passing assertion
  assert(true === true);

  // test complete & is marked as passing
  done();

  // ...but something evil lurks within
  setTimeout(() => {
  throw new Error('chaos!');
  }, 100);
  });
  \`\`\`

  Previously to this version, Mocha would have _silently swallowed_ the `chaos!` exception, and you wouldn't know. Well, _now you know_. Mocha cannot recover from this gracefully, so it will exit with a nonzero code.

  **Maintainers of external reporters**: _If_ a test of this class is encountered, the `Runner` instance will emit the `end` event _twice_; you _may_ need to change your reporter to use `runner.once('end')` intead of `runner.on('end')`.

- [#3093](https://github.com/mochajs/mocha/issues/3093): Fix stack trace reformatting problem ([@outsideris](https://github.com/outsideris))

## :nut_and_bolt: Other

- [#3248](https://github.com/mochajs/mocha/issues/3248): Update `browser-stdout` to v1.3.1 ([@honzajavorek](https://github.com/honzajavorek))

# 5.0.1 / 2018-02-07

...your garden-variety patch release.

Special thanks to [Wallaby.js](https://wallabyjs.com) for their continued support! :heart:

## :bug: Fixes

- [#1838](https://github.com/mochajs/mocha/issues/1838): `--delay` now works with `.only()` ([@silviom](https://github.com/silviom))
- [#3119](https://github.com/mochajs/mocha/issues/3119): Plug memory leak present in v8 ([@boneskull](https://github.com/boneskull))

## :book: Documentation

- [#3132](https://github.com/mochajs/mocha/issues/3132), [#3098](https://github.com/mochajs/mocha/issues/3098): Update `--glob` docs ([@outsideris](https://github.com/outsideris))
- [#3212](https://github.com/mochajs/mocha/pull/3212): Update [Wallaby.js](https://wallabyjs.com)-related docs ([@ArtemGovorov](https://github.com/ArtemGovorov))
- [#3205](https://github.com/mochajs/mocha/pull/3205): Remove outdated cruft ([@boneskull](https://github.com/boneskull))

## :nut_and_bolt: Other

- [#3224](https://github.com/mochajs/mocha/pull/3224): Add proper Wallaby.js config ([@ArtemGovorov](https://github.com/ArtemGovorov))
- [#3230](https://github.com/mochajs/mocha/pull/3230): Update copyright year ([@josephlin55555](https://github.com/josephlin55555))

# 5.0.0 / 2018-01-17

Mocha starts off 2018 right by again dropping support for _unmaintained rubbish_.

Welcome [@vkarpov15](https://github.com/vkarpov15) to the team!

## :boom: Breaking Changes

- **[#3148](https://github.com/mochajs/mocha/issues/3148): Drop support for IE9 and IE10** ([@Bamieh](https://github.com/Bamieh))
  Practically speaking, only code which consumes (through bundling or otherwise) the userland [buffer](https://npm.im/buffer) module should be affected. However, Mocha will no longer test against these browsers, nor apply fixes for them.

## :tada: Enhancements

- [#3181](https://github.com/mochajs/mocha/issues/3181): Add useful new `--file` command line argument ([documentation](https://mochajs.org/#--file-file)) ([@hswolff](https://github.com/hswolff))

## :bug: Fixes

- [#3187](https://github.com/mochajs/mocha/issues/3187): Fix inaccurate test duration reporting ([@FND](https://github.com/FND))
- [#3202](https://github.com/mochajs/mocha/pull/3202): Fix bad markup in HTML reporter ([@DanielRuf](https://github.com/DanielRuf))

## :sunglasses: Developer Experience

- [#2352](https://github.com/mochajs/mocha/issues/2352): Ditch GNU Make for [nps](https://npm.im/nps) to manage scripts ([@TedYav](https://github.com/TedYav))

## :book: Documentation

- [#3137](https://github.com/mochajs/mocha/issues/3137): Add missing `--no-timeouts` docs ([@dfberry](https://github.com/dfberry))
- [#3134](https://github.com/mochajs/mocha/issues/3134): Improve `done()` callback docs ([@maraisr](https://github.com/maraisr))
- [#3135](https://github.com/mochajs/mocha/issues/3135): Fix cross-references ([@vkarpov15](https://github.com/vkarpov15))
- [#3163](https://github.com/mochajs/mocha/pull/3163): Fix tpyos ([@tbroadley](https://github.com/tbroadley))
- [#3177](https://github.com/mochajs/mocha/pull/3177): Tweak `README.md` organization ([@xxczaki](https://github.com/xxczaki))
- Misc updates ([@boneskull](https://github.com/boneskull))

## :nut_and_bolt: Other

- [#3118](https://github.com/mochajs/mocha/issues/3118): Move TextMate Integration to [its own repo](https://github.com/mochajs/mocha.tmbundle) ([@Bamieh](https://github.com/Bamieh))
- [#3185](https://github.com/mochajs/mocha/issues/3185): Add Node.js v9 to build matrix; remove v7 ([@xxczaki](https://github.com/xxczaki))
- [#3172](https://github.com/mochajs/mocha/issues/3172): Markdown linting ([@boneskull](https://github.com/boneskull))
- Test & Netlify updates ([@Munter](https://github.com/munter), [@boneskull](https://github.com/boneskull))
