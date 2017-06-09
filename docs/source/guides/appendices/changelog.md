---
title: Changelog
comments: false
---

# 0.19.2

*Released 04/16/2017*

**Features:**

- You can now run your tests in the [Electron browser](https://on.cypress.io/guides/browser-management#section-electron-browser) that comes built with Cypress. You will see it as an option in the browser dropdown. This is the same browser that Cypress uses when running Cypress headlessly. This is useful for debugging issues that only occur during headless runs. Addresses [#452](https://github.com/cypress-io/cypress/issues/452).
- New traversal commands [`.nextAll()`](https://on.cypress.io/api/nextall), [`.nextUntil()`](https://on.cypress.io/api/nextuntil), [`.parentsUntil()`](https://on.cypress.io/api/parentsuntil), [`.prevAll()`](https://on.cypress.io/api/prevall), and [`.prevUntil()`](https://on.cypress.io/api/prevuntil) have been added. Addresses [#432](https://github.com/cypress-io/cypress/issues/432).

**Bugfixes:**

- An error is now thrown if an `undefined` value is mistakenly passed into [`cy.wait()`](https://on.cypress.io/api/wait). Previously, it would set the command timeout to an unimaginably large number of ms. Fixes [#332](https://github.com/cypress-io/cypress/issues/332)
- Fixed issue where the contents of `state.json` were emptied, which would cause a crash and loss of state information. Fixes [#473](https://github.com/cypress-io/cypress/issues/473) and [#474](https://github.com/cypress-io/cypress/issues/474).
- We no longer write the chrome extension within `node_modules`, and instead write this to the proper OS specific `appData` folder. Fixes [#290](https://github.com/cypress-io/cypress/issues/290) and [#245](https://github.com/cypress-io/cypress/issues/245).

**Misc:**

- Error handling for invalid arguments passed to [`cy.wait()`](https://on.cypress.io/api/wait) have been improved and will now suggest valid arguments that are acceptable.
- Browsers in the browser dropdown now have colored icons, which help visually distinguish the variants of Chrome.
- Increased timeout for browser to make a connection when running headlessly from 10 seconds to 30 seconds.
- Internally refactored how browsers are added and spawned in preparation of us adding cross browser support.
- Switching specs in the GUI now closes the browser and respawns it and refocuses it.

# 0.19.1

*Released 03/09/2017*

**Features:**

- Added `Cypress.version` property. Fixes [#404](https://github.com/cypress-io/cypress/issues/404).
- Selecting `<option>` inside `<optgroup>` now works with [`.select()`](https://on.cypress.io/api/select). Fixes [#367](https://github.com/cypress-io/cypress/issues/367).

**Bugfixes:**

- `EMFILE` errors have been fixed. These were being caused due to `ulimit` being too low on your OS. This should fix the file watching problems people were having. Essentially we just replaced `fs` with `graceful-fs` and crossed our fingers this works. (It did on our machines). Fixes [#369](https://github.com/cypress-io/cypress/issues/369).
- Now you can select the error text in the GUI. Fixes [#344](https://github.com/cypress-io/cypress/issues/344).
- Cypress now correctly re-bundles files even when `watchForFileChanges` is set to `false`. Fixes [#347](https://github.com/cypress-io/cypress/issues/347) and [#446](https://github.com/cypress-io/cypress/issues/446)
- Fixed file watching when changing the `integrationFolder` to something other than the default value. Fixes [#438](https://github.com/cypress-io/cypress/issues/438).
- [`.select()`](https://on.cypress.io/api/select) now works on options that have the same value. Fixes [#441](https://github.com/cypress-io/cypress/issues/441).
- Cypress no longer crashes when you click links in the on-boarding screen called "To help you get started...". Fixes [#227](https://github.com/cypress-io/cypress/issues/227).
- The `example_spec.js` file that gets seeded on a new project no longer fails on [`cy.readFile()`](https://on.cypress.io/api/readFile). Fixes [#414](https://github.com/cypress-io/cypress/issues/414).

**Misc:**

- We now preserve the Desktop GUI's position and sizing after its closed + reopened. Fixes [#443](https://github.com/cypress-io/cypress/issues/443).
- We now ignore watching `node_modules`, `bower_components` and a few other folders to reduce the number of watched files. Fixes [#437](https://github.com/cypress-io/cypress/issues/437).

# 0.19.0

*Released 02/11/2017*

**Notes:**

- We have updated all of the docs related to these changes. The [CI Docs](https://on.cypress.io/continuous-integration) got a much needed facelift.
- There is a new docs section related to the [Dashboard](https://on.cypress.io/guides/dashboard-features) and the new features.

**Overview:**

- We have officially released our [Dashboard](https://on.cypress.io/dashboard) which is our service that will display recorded runs.
- This service has now been fully integrated into the Desktop Application. There is a new on-boarding process that helps you setup projects for recording.

**Breaking Changes:**

- We have done our very best to create as little breaking changes as possible.
- You will need to download a new [`cypress-cli`](https://on.cypress.io/guides/cli) - version `0.13.1`.
- Older CLI versions will continue to work on `0.19.0` except for the [`cypress open`](https://on.cypress.io/guides/cli#section--cypress-open-) command - and will we print a warning to nudge you to upgrade.
- Newer CLI versions will not work on versions of Cypress < `0.19.0` (but we don't know why this would ever even happen).

**Features:**

- There is a new [Dashboard](https://on.cypress.io/dashboard) service that displays your recorded runs.
- The [Dashboard](https://on.cypress.io/dashboard) enables you to view your recorded runs, manage projects, create organizations, invite users and set permissions.
- Projects are either **[public](https://on.cypress.io/guides/projects#section-what-is-the-difference-between-public-and-private-projects-)** with their runs being publicly viewable by anyone, or **[private](https://on.cypress.io/guides/projects#section-what-is-the-difference-between-public-and-private-projects-)** which restricts their access to only users you've invited. All **existing** projects were set to **private** by default.
- When you [invite users](https://on.cypress.io/guides/organizations#section-inviting-users) (from the Dashboard) we will **automatically** whitelist them. This means you can invite all of your teammates (or anyone else). They can start using Cypress without talking to us.
- We now list all of the recorded runs directly in the Desktop GUI under a new `Runs` tab. Fixes [#236](https://github.com/cypress-io/cypress/issues/236).
- Your list of projects in the Desktop GUI now displays their last recorded run status - passing, failing, pending, running, etc.
- We've changed the "Config" tab to now be called "Settings". We added two new sections to the "Settings" tab which displays your [`projectId`](https://on.cypress.io/guides/projects#section-what-is-a-projectid-) and your [Record Key](https://on.cypress.io/guides/projects#section-what-is-a-record-key-). These sections do a much better job explaining what these are and how you use them.
- You no longer have to use `cypress get:key` to get your [Record Key](https://on.cypress.io/guides/projects#section-what-is-a-record-key-). We now display this in your "Settings" tab and also in the [Dashboard](https://on.cypress.io/dashboard).
- Projects will no longer automatically acquire a `projectId` when being added. There is now a very explicit **opt-in** process where you [setup your project to record](https://on.cypress.io/guides/projects#section-setting-up-a-project-to-record). This should make it much clearer what's going on behind the scenes.
- [`cypress run`](https://on.cypress.io/guides/cli#section--cypress-run-) now behaves likes `cypress ci` previously did and downloads + installs Cypress if its not already installed.
- `cypress ci` now works in OSX, and also works in Linux in Desktop flavors (like Ubuntu).

**Misc:**

- [`cypress run`](https://on.cypress.io/guides/cli#section--cypress-run-) will now download and install Cypress if its not already installed.
- We renamed `CYPRESS_CI_KEY` TO `CYPRESS_RECORD_KEY`. This makes it clearer what this key actually does - and the fact that it can be run anywhere irrespective of CI. We still look for the old named key but will print a warning if we detect it.
- We print a warning when using an older CLI tool version. Fixes [#424](https://github.com/cypress-io/cypress/issues/424).
- We've improved many of the error messages related to recording runs. Fixes [#423](https://github.com/cypress-io/cypress/issues/423).
- `cypress ci` has been deprecated. You now use [`cypress run --record --key <record_key>`](https://on.cypress.io/guides/cli#section--cypress-run-record-). The key you used to pass to `cypress ci` is the same key. We've simply consolidated these commands into just `cypress run` which makes it simpler and clearer. Their only difference is that passing `--record` to `cypress run` will **record** the build to our Dashboard. Fixes [#417](https://github.com/cypress-io/cypress/issues/417).

# 0.18.8

*Released 02/05/2017*

**Overview:**

- We have officially implemented our [Sinon.JS](http://sinonjs.org/docs/) integration: adding [`cy.stub()`](https://on.cypress.io/api/stub), [`cy.spy()`](https://on.cypress.io/api/spy), {% url `cy.clock()` clock %}, and [`cy.tick()`](https://on.cypress.io/api/tick). We've matched Sinon's API's and added `sinon-as-promised` and `chai-sinon`. In addition we've fixed Sinon performance issues, and improved the display of assertion passes and failures.
- These new API's will work well in both `unit` tests and `integration` tests.

**Features:**

- You can now use [`cy.stub()`](https://on.cypress.io/api/stub) and [`cy.spy()`](https://on.cypress.io/api/spy) synchronously. These both match the Sinon API identically. We will display `stub/spy` calls in the command log and provide the call count, arguments, context, and return values when you click on the log. Stubs are automatically reset between tests.  Fixes [#377](https://github.com/cypress-io/cypress/issues/377).
- We've added our own special aliasing flavor to [`cy.stub()`](https://on.cypress.io/api/stub) and [`cy.spy()`](https://on.cypress.io/api/spy). You can use the {% url `.as()` as %} command and we will associate spy and stub invocations (the same way we do with XHR aliasing and route matching).
- We've added {% url `cy.clock()` clock %} and [`cy.tick()`](https://on.cypress.io/api/tick) which are both asynchronous methods to modify timers in your application under test. We automatically apply clock (even if you invoke it before your first [`cy.visit()`](https://on.cypress.io/api/visit)) and will automatically reapply it after page load. [`cy.tick()`](https://on.cypress.io/api/tick) will enable you to control the amount of time you want passed in your application. This is great for controlling *throttled* or *debounced* functions.
- `sinon-as-promised` is automatically applied under the hood which extends Sinon and provides the `.resolves(...)` and `.rejects(...)` API's which makes it easy to stub promise returning functions.
- We support and display multiple sub spies when using Sinon's `.withArgs(...)` function.

**Misc:**

- We've enhanced `chai-sinon` by improving the output during passes or failures. Fixes [#31](https://github.com/cypress-io/cypress/issues/31).
- We've ripped out Sinon's argument serialization in favor of our own.
- We no longer send Sinon to the remote application under test. In other words, you'll no longer see `sinon.js` being sent as a network request.
- Deprecated the undocumented `cy.agents` function, but it will continue to work and will be officially removed later.

# 0.18.7

*Released 01/30/2017*

**Bugfixes:**

- Fixed regression in [`0.18.6`](#0186-01292017) that caused Cypress to fail when switching spec files when `baseUrl` was set in `cypress.json`. Fixes [#403](https://github.com/cypress-io/cypress/issues/403).

# 0.18.6

*Released 01/29/2017*

**Features:**

- We now launch Cypress tests directly to the `baseUrl` to avoid an initial page refresh when encountering the first [`cy.visit()`](https://on.cypress.io/api/visit) command. This should help tests run faster. Fixes [#382](https://github.com/cypress-io/cypress/issues/382).

**Bugfixes:**

- Uninstalling the last used browser no longer causes the [Desktop GUI](https://github.com/cypress-io/cypress-core-desktop-gui) to error and hang. Fixes [#371](https://github.com/cypress-io/cypress/issues/371).
- Fixed issue where `stdout` would not be displayed on a completed `cypress ci` run. Fixes [#398](https://github.com/cypress-io/cypress/issues/398).
- Fixed a longstanding issue in Cypress where logging in from another computer would kill the session on all other computers, and prevent you from accessing `cypress get:key` (amongst other things). Fixes [#400](https://github.com/cypress-io/cypress/issues/400).

**Misc:**

- We now validate all of the configuration options set in `cypress.json` to ensure it has valid types. Fixes [#399](https://github.com/cypress-io/cypress/issues/399).
- We now validate that `baseUrl` is accessible **prior** to running tests. This prevents a common situation where you may forget to boot your web server and have instantly failing tests. Fixes [#383](https://github.com/cypress-io/cypress/issues/383).
- We now show the entire scaffolded tree of files when adding a brand new project. Fixes [#401](https://github.com/cypress-io/cypress/issues/401).
- We display errors coming from `babel` with more helpful information now.
- Changed the [Desktop GUI](https://github.com/cypress-io/cypress-core-desktop-gui) to use `JWT` for authorization. **You will have to log in again**.

# 0.18.5

*Released 01/08/2017*

**Features:**

- You can now disable `videoCompression` by passing `false` in `cypress.json` or env variables. In very long runs and on CPU throttled instances compression can take a considerable amount of time, possibly as much as 50% of the time spent running actual tests. Fixes [#372](https://github.com/cypress-io/cypress/issues/372).

**Misc:**

- Improved performance when running headlessly by caching the last bundled spec. This prevents having the same spec file rebundled each time [`cy.visit()`](https://on.cypress.io/api/visit) caused a full page navigation. You should see a moderate improvement in test run time. Fixes [#370](https://github.com/cypress-io/cypress/issues/370).
- We are now capturing `stdout` and several other properties for use + display in our Dashboard on `cypress ci` runs.
- Enable [`cy.fixture()`](https://on.cypress.io/api/fixture) to send an encoding for images other than forcing the default encoding of `base64`. Fixes [#373](https://github.com/cypress-io/cypress/issues/373).
- Enable [`cy.route()`](https://on.cypress.io/api/route) to pass an `encoding` parameter when using `fx:fixture` syntax. Fixes [#374](https://github.com/cypress-io/cypress/issues/374).

# 0.18.4

*Released 12/28/2016*

**Bugfixes:**

- Prevent [`cy.url()`](https://on.cypress.io/api/url) from accessing the URL during transition phase and throwing an error. Fixes [#356](https://github.com/cypress-io/cypress/issues/356).
- Stubbed functions now serialize correctly when switching domains on a [`cy.visit()`](https://on.cypress.io/api/visit). Fixes [#354](https://github.com/cypress-io/cypress/issues/354).
- Fixed a handful of scenarios and edge cases where cookies were not properly synchronized between external requests and the browser. This led to situations where cookies were either duplicated on requests, or were not sent. Fixes [#357](https://github.com/cypress-io/cypress/issues/357) and [#361](https://github.com/cypress-io/cypress/issues/361) and [#362](https://github.com/cypress-io/cypress/issues/362).

**Misc:**

- [`cy.request()`](https://on.cypress.io/api/request) now favors `baseUrl` config over remote origin when you do not pass a fully qualified URL. Fixes [#360](https://github.com/cypress-io/cypress/issues/360).

# 0.18.3

*Released 12/18/2016*

**Features:**

- There is now a [`cy.log()`](https://on.cypress.io/api/log) command for displaying an arbitrary message and args. Useful for providing context while testing and debugging long tests. Fixes [#342](https://github.com/cypress-io/cypress/issues/342).

**Bugfixes:**

- [`cy.title()`](https://on.cypress.io/api/title) now uses the `document.title` property as opposed to querying for `<title>` elements in the `<head>`. Fixes [#331](https://github.com/cypress-io/cypress/issues/331) and [#351](https://github.com/cypress-io/cypress/issues/351).
- We now exit correctly (with status of 1) in the case of headless renderer crashes. Additionally we capture these errors properly, explain what happened, and link to external error document to suggest fixes. Fixes [#348](https://github.com/cypress-io/cypress/issues/348) and [#270](https://github.com/cypress-io/cypress/issues/270).

**Misc:**

- Improved headless performance, and added optimizations for early and often GC.

# 0.18.2

*Released 12/15/2016*

**Bugfixes:**

- Under the hood [`cy.visit()`](https://on.cypress.io/api/visit) now sets an `Accept: text/html,*/*` request header to prevent some web servers from sending back `404` in the case where they required this header. Only a small % of servers would ever do this, but `webpack-dev-server` was one of them. Fixes [#309](https://github.com/cypress-io/cypress/issues/309).
- [`cy.request()`](https://on.cypress.io/api/request) now sends an `Accept: */*` request header by default too. Fixes [#338](https://github.com/cypress-io/cypress/issues/338).

**Misc:**

- [`cy.request()`](https://on.cypress.io/api/request) now includes more debugging information (related to headers) in the error output. Fixes [#341](https://github.com/cypress-io/cypress/issues/341).
- When [`cy.request()`](https://on.cypress.io/api/request) times out, we now output much better error messages including information about the request sent. Fixes [#340](https://github.com/cypress-io/cypress/issues/340).

# 0.18.1

*Released 12/11/2016*

**Notes:**

- There is a new [recipe showcasing these new features](https://github.com/cypress-io/cypress-example-recipes).
- We are adding several other recipes to show examples of all the ways you can use [`cy.request()`](https://on.cypress.io/api/request) to improve your tests.

**Features:**

- [`cy.request()`](https://on.cypress.io/api/request) can now have its automatic redirect following turned off by passing `{followRedirect: false}`. Fixes [#308](https://github.com/cypress-io/cypress/issues/308).
- [`cy.request()`](https://on.cypress.io/api/request) now has a `qs` option that automatically appends query params to the `url` property. Fixes [#321](https://github.com/cypress-io/cypress/issues/321).
- [`cy.request()`](https://on.cypress.io/api/request) now follows redirects exactly like a real browser. Previously if you `POST`ed to an endpoint and it redirected to a `GET` then [`cy.request()`](https://on.cypress.io/api/request) would not follow it due to the `method` changing. It now follows method changing redirects by default. Fixes [#322](https://github.com/cypress-io/cypress/issues/322).
- [`cy.request()`](https://on.cypress.io/api/request) now accepts the `form` option which will convert the `body` values to urlencoded content and automatically set the `x-www-form-urlencoded` header. This means you can now use [`cy.request()`](https://on.cypress.io/api/request) to bypass your UI and login with standard form values. Fixes [#319](https://github.com/cypress-io/cypress/issues/319).
- When [`cy.request()`](https://on.cypress.io/api/request) fails, it now outputs the full request / response information. This behaves more similar to [`cy.visit()`](https://on.cypress.io/api/visit) failures. Fixes [#324](https://github.com/cypress-io/cypress/issues/324).
- [`cy.request()`](https://on.cypress.io/api/request) now prints **all** of the underlying HTTP request / response information into the Dev Tools' console (when clicking on the Command Log). This means that you will see everything you would normally see from the `Network` tab as if the request were made from the browser. We even print redirect information. Fixes [#325](https://github.com/cypress-io/cypress/issues/325).

**Bugfixes:**

- Cypress' internal `babel` will no longer attempt to load your project's `.babelrc`. This helps avoid potential version conflicts. Fixes [#312](https://github.com/cypress-io/cypress/issues/312).
- We no longer watch the `supportFile` while running headlessly. Fixes [#329](https://github.com/cypress-io/cypress/issues/329).
- `watchForFileChanges` is now correctly respected in regards to watching all files, including the `supportFile`. Fixes [#336](https://github.com/cypress-io/cypress/issues/336).
- There is no longer an error when scaffolding a new Cypress project. Fixes [#326](https://github.com/cypress-io/cypress/issues/326).
- The Runner UI no longer appears to be "running" when there is a spec bundle error in the `supportFile`.
- Cypress now correctly exits when running headlessly in `linux` when the browser fails to connect. Fixes [#333](https://github.com/cypress-io/cypress/issues/333).
- Cypress now correctly exits when running headlessly in `linux` when there is a spec bundle error. Fixes [#337](https://github.com/cypress-io/cypress/issues/337).
- Cypress now retries up to 3 times for the browser to connect when running headlessly. The warning / error messages were also updated to be clearer. Partially addresses [#334](https://github.com/cypress-io/cypress/issues/334).

**Misc:**

- Deprecated `failOnStatus` property for [`cy.request()`](https://on.cypress.io/api/request) and renamed to `failOnStatusCode`. Fixes [#323](https://github.com/cypress-io/cypress/issues/323).
- Removed the `cookies` option from [`cy.request()`](https://on.cypress.io/api/request) because cookies are now *always* get/set on requests. This option really never made any sense to have. Fixes [#320](https://github.com/cypress-io/cypress/issues/320).
- Better data reporting when recording builds in CI.
- We now collect "global" errors that may prevent any tests from running. We will be displaying these in our future CI platform.

# 0.18.0

*Released 11/27/2016*

**Notes:**

- We've created a new [example recipes repo](https://github.com/cypress-io/cypress-example-recipes) to show you common testing scenarios including how to use the new module support.

**Summary:**

- We've added automatic ES2015+, module, JSX, and CJSX support to all test files. This means you can use `require`, `import`, or `export` declarations to load other files. You can also use this to import your own application specific JavaScript modules and write unit tests for them. More of these details are yet to come. [See this issue](https://github.com/cypress-io/cypress/issues/318).
- You can now use your regularly installed `node_modules` in your project to do things like utilizing [`lodash`](https://lodash.com/) for utility functions or extending [`chai`](http://chaijs.com/) with assertion plugins.
- Because we're now processing the spec files prior to handing them off to the browser, this means we will display problems like syntax errors when something in the processing goes wrong. Additionally, we print these out when running headlessly, so you're not stuck wondering what went wrong.

**Breaking Changes:**

- Previously, we auto-magically included all files within [`cypress/support`](https://on.cypress.io/guides/writing-your-first-test#section-folder-structure). This has now [gone away](https://on.cypress.io/guides/errors#section-the-supportfolder-option-has-been-removed) and we've simplified this to automatically including a single `cypress/support/index.js` file. That single file acts as the entry point meaning you should `import` or `require` the other support files you'd like to include. Although this is still "automatic" it's much less magical and we'll be updating all of our docs to reflect this. The purpose of `cypress/support` hasn't really changed, just the implementation of it has. We will automatically seed a `cypress/support/index.js` file for you (even on existing projects). The file location of `cypress/support/index.js` can be changed with the new [`supportFile`](https://on.cypress.io/guides/configuration#section-folders) option in your `cypress.json`. This feature can also be turned off by specifying `supportFile: false`.

**Features:**

- We now support ES2015+, modules, and JSX in all spec files. Fixes [#246](https://github.com/cypress-io/cypress/issues/246).
- Spec files may now be written as `.js`, `.jsx`, `.coffee`, or `cjsx` files.
- Test files with JS syntax errors are now [handled](https://on.cypress.io/guides/errors#section-we-found-an-error-preparing-your-test-file) and we provide a GUI that points to the exact line/column number. Additionally we print these out when running headlessly and exit the process with `code 1`. Fixes [#293](https://github.com/cypress-io/cypress/issues/293).

**Misc:**

- We improved the logic around when and if we scaffold files on a new project. We're much smarter about this and not generating these forcibly every time. Fixes [#285](https://github.com/cypress-io/cypress/issues/285).
- Simplified handling of support files and made them less "magical". Fixes [#286](https://github.com/cypress-io/cypress/issues/286).
- Renamed `supportFolder` to [`supportFile`](https://on.cypress.io/guides/configuration#section-folders) in `cypress.json`. We will automatically rename your `cypress.json` if this property was present on update.

# 0.17.12

*Released 11/21/2016*

**Bugfixes:**

- You no longer have to log in again after updating. Fixes [#305](https://github.com/cypress-io/cypress/issues/305).
- Updating in app now works again. Sorry about that. Fixes [#304](https://github.com/cypress-io/cypress/issues/304).
- Headless frame rate is now correctly set to `20` instead of resetting back to `60`. Fixes [#303](https://github.com/cypress-io/cypress/issues/303).
- We now automatically drop frames that the CPU cannot keep up with while video recording headlessly. Previously we would buffer all frames in memory and it was possible to exhaust all memory due to the way that streaming backpressure works. Fixes [#302](https://github.com/cypress-io/cypress/issues/302).
- Fixed an edge case in the `driver` that could lead to memory leaks. This happened when Command Logs updated from previously run tests. Normally, in headless mode, we automatically remove references to purge memory after each test, but when logs were updated after this, their references were merged back in again and held onto forever. If you were seeing long Cypress runs die or eventually halt, this was likely the cause. We did extensive memory regression analysis on Cypress and could not find any more memory leaks. Fixes [#301](https://github.com/cypress-io/cypress/issues/301).

**Misc:**

- Improved `cypress run` and `cypress ci` headless output. Fixes [#306](https://github.com/cypress-io/cypress/issues/306).
- Improved performance by preventing `snapshots` from being taken during headless runs.

# 0.17.11

*Released 11/16/2016*

**Roadmap:**

- The changes in version [`0.17.11`](#01711-11162016) below are in preparation for Cypress’ platform service: a portal where screenshots, videos, config, and logs of your builds are accessible.

**Overview:**

- [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) now uploads build assets to our servers after a test run completes. Additionally, it tracks the `config` settings used during the build and tracks each individual test failure.
- If you do *not* want these assets to be tracked by Cypress, you need to switch to using [`cypress run`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-). We will happily remove any build assets that are accidentally uploaded to us during the update transition.
- **Read about the differences between [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) and [`cypress run`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) in our [docs](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-).**

**Features:**

- We now record videos during a headless run with both [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) and [`cypress run`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-). Fixes [#229](https://github.com/cypress-io/cypress/issues/229).
- After completing [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-), we now upload build assets (such as `screenshots` and `videos`) to be used in our upcoming admin interface. This will enable you to review assets without having to touch your CI server. Fixes [#292](https://github.com/cypress-io/cypress/issues/292).

**Misc:**

- We've redesigned the headless run `stdout` to give you more details of the run, the stats after the run, what screenshots were taken, the video that was recorded, compression settings for the video, uploading asset progress, etc.
- Screenshot names now include their parent titles, and invalid file system characters are scrubbed. Fixes [#297](https://github.com/cypress-io/cypress/issues/297).
- We no longer artificially restrict the environment [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) can run in. It can now run *anywhere*. Fixes [#296](https://github.com/cypress-io/cypress/issues/296).
- We removed scaffolding any directories on a new project (when running headlessly). Fixes [#295](https://github.com/cypress-io/cypress/issues/295).
- [`cypress run`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) no longer prompts the user for any kind of interaction, thus enabling you to use this in CI if you choose to do so. Fixes [#294](https://github.com/cypress-io/cypress/issues/294).
- There is a new [configuration](https://on.cypress.io/guides/configuration) property called: `trashAssetsBeforeHeadlessRuns` that is set to `true` by default and will automatically clear out screenshots + videos folders before each run. These files are not deleted, they are just moved to your trash.
- There are several new [configuration](https://on.cypress.io/guides/configuration) properties for video recording: `videoRecording`, `videoCompression`, and `videosFolder`.

# 0.17.10

*Released 11/07/2016*

**Bugfixes:**

- Fixed switching between two different spec files from the desktop app causing `document.domain` to be wrong. Fixes [#276](https://github.com/cypress-io/cypress/issues/276).
- Fixed inserting the string `null` into [`cy.request()`](https://on.cypress.io/api/request) urls when providing a `baseUrl` in `cypress.json` while origin could not be determined. Fixes [#274](https://github.com/cypress-io/cypress/issues/274).
- Fixed incorrect error message on reverse visibility assertions. Fixes [#275](https://github.com/cypress-io/cypress/issues/275).

**Misc:**

- We've improved the way we inject content into `<html>` responses by filtering the underlying HTTP request headers. We no longer inject content into templates which were loaded via XHR. Fixes [#257](https://github.com/cypress-io/cypress/issues/257) and [#288](https://github.com/cypress-io/cypress/issues/288).

# 0.17.9

*Released 10/22/2016*

**Bugfixes:**

- Cypress now applies cookies to the browser which were cleared between redirects. Fixes [#224](https://github.com/cypress-io/cypress/issues/224).
- Snapshots now work even when `<html>` tag has invalid attributes. Fixes [#271](https://github.com/cypress-io/cypress/issues/271).
- Cypress no longer crashes on initial `cy.visit()` when the 3rd party webserver never ends the response. Fixes [#272](https://github.com/cypress-io/cypress/issues/272).

**Misc:**

- Changed default [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) from `20000` to `30000`
- Changed default [`pageLoadTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) from `30000` to `60000`
- The internal Cypress proxy now forcibly responds to requests taking longer than `responseTimeout`. Currently this sends back `text/html` with the `ETIMEDOUT` error, but this likely needs to be configurable. The reason we are now forcibly applying timeouts is to prevent `socket pooling exhaustion` where tests are running and a 3rd party server never responds to the request.

# 0.17.8

*Released 10/13/2016*

**Bugfixes:**

- Fixed `opener of undefined` errors due to `page load` events causing snapshots prior to the `load` event of the remote application. Thanks to everyone who helped pitched in on this one! Fixes [#258](https://github.com/cypress-io/cypress/issues/258).
- Cypress now correctly sets cookies with `expirationDate` in the past. Chrome did not handle these cookies as documented and our code did not take this into account. We also added a lot more `e2e` tests around this behavior. Fixes [#266](https://github.com/cypress-io/cypress/issues/266).
- We are now taking additional precautions to prevent Cypress from trashing the wrong folder during an upgrade (with an open project). This was actually fixed in `0.17.7` but the problem was is that during an update, the new version (which was fixed) was still being passed the wrong arguments from the older (broken) application. We've now upgraded `0.17.8` to detect this, and just use the expected default install location of Cypress. If you're concerned, just *close* your currently open project before updating. Fixes [#265](https://github.com/cypress-io/cypress/issues/265).

**Misc:**

- When an in app update fails in `linux` we now provide instructions on how to manually update Cypress.
- We now properly take the `maxAge` cookie flag into account and give it preference over the `expires` flag as per the cookie spec.

# 0.17.7

*Released 10/12/2016*

**Features:**

- There is now a new [`chromeWebSecurity`](https://on.cypress.io/guides/configuration#section-browser) option you can set in `cypress.json` to turn off Chrome's Web Security features. We've written a brand new reference that details why and how you could use this. [Cypress Web Security](https://on.cypress.io/guides/web-security). This option can be used for accessing `cross origin` `<iframes>` or if your application needs to test navigation across super domains. Fixes [#262](https://github.com/cypress-io/cypress/issues/262).

**Bugfixes:**

- We now capture `cross origin` errors correctly instead of these showing as `Uncaught DOMExceptions` in the console. Fixes [#261](https://github.com/cypress-io/cypress/issues/261).
- We no longer trash the wrong folder on OSX in-app updates (when a project is open). Sorry about this! Fixes [#260](https://github.com/cypress-io/cypress/issues/260).
- [`cy.visit()`](https://on.cypress.io/api/visit) urls with domain-like segments (which weren't actually the domain) no longer cause Cypress to think you're trying to navigate to a different superdomain. Fixes [#255](https://github.com/cypress-io/cypress/issues/255).

# 0.17.6

*Released 10/04/2016*

**Features:**

- Snapshots will now be *pinned* when clicking on a command in the Command Log. This enables you to inspect the state of the DOM when the snapshot was taken. We've given you a new series of controls for turning off the element highlighting and hitboxes. Additionally we've given you the ability to manually click through each named snapshot when there are multiple states (like before and after). Fixes [#247](https://github.com/cypress-io/cypress/issues/247).

**Bugfixes:**

- Fixed a regression where tests that failed outside of a hook would incorrectly indicate themselves as a `before each` hook. In addition, in the default `spec`, reporter will now display the test name when a hook was the source of failure. Fixes [#253](https://github.com/cypress-io/cypress/issues/253).
- Fixed a deployment bug in the `core-desktop-gui`.
- We now prevent [`cy.visit()`](https://on.cypress.io/api/visit) from accidentally snapshotting twice.

**Misc:**

- [`cy.request()`](https://on.cypress.io/api/request) and [`cy.visit()`](https://on.cypress.io/api/visit) now correctly send `User-Agent` headers based on the current open browsing session. Fixes [#230](https://github.com/cypress-io/cypress/issues/230).

# 0.17.5

*Released 10/02/2016*

**Features:**

- We've added `JUnit` as a valid [built-in reporter](https://on.cypress.io/guides/reporters). Fixes [#178](https://github.com/cypress-io/cypress/issues/178).
- You can now [add or write your own custom reporters](https://on.cypress.io/guides/reporters). This means you can `npm install xyz-mocha-reporter` and we'll automatically correctly `require` that package. Alternatively you can write your own `xyz-custom_reporter.js` file. Fixes [#231](https://github.com/cypress-io/cypress/issues/231).
- The `reporter` can now be resized. We persist this state locally so it should "stick" between browser launches / app restarts. Fixes [#204](https://github.com/cypress-io/cypress/issues/204).
- Cypress now "remembers" the last browser you had open and will suggest opening that whenever a project is opened. Addresses [#193](https://github.com/cypress-io/cypress/issues/193).
- Instead of seeing `Script error.` - cross origins script errors are now handled specially and we throw a very long and exciting error explaining what just happened. Fixes [#241](https://github.com/cypress-io/cypress/issues/241).
- When uncaught errors are thrown in hooks we now indicate Mocha's behavior as part of the error - that it is skipping the remaining tests in the current suite. Fixes [#240](https://github.com/cypress-io/cypress/issues/240).

**Bugfixes:**

- The reporter now more intelligently scrolls to prevent commands from being cut off. Useful in screenshots / video recording. Fixes [#228](https://github.com/cypress-io/cypress/issues/228).
- We've improved the logic of how snapshots are restored so that it does not break the CSS when there were full page navigations in the test and the CSS changed. Fixes [#223](https://github.com/cypress-io/cypress/issues/223).
- Iframes are now correctly handled when we restore snapshots. Previously, we removed iframes which would change the page layout and the hitboxes' coordinates we drew were wrong. Now we insert iframe placeholders that prevent the page layout from changing. Fixes [#234](https://github.com/cypress-io/cypress/issues/234).
- Snapshot hitboxes no longer incorrectly draw for elements that are hidden. Fixes [#251](https://github.com/cypress-io/cypress/issues/251).
- Fixed a bug that caused commands to time out on subsequent tests whenever there was an uncaught error + an assertion conflict. Fixes [#238](https://github.com/cypress-io/cypress/issues/238).
- Fixed an edge case where assertions would incorrectly associate to a previously run assertion. Fixes [#252](https://github.com/cypress-io/cypress/issues/252).
- Cypress commands now correctly execute in `after` and `afterEach` hooks on a failed test. Previously they would only run on passing tests. Fixes [#203](https://github.com/cypress-io/cypress/issues/203).

**Misc:**

- We've bypassed Mocha's default uncaught error handling and replaced it with something much better - actually using the thrown error instances instead of creating a new arbitrary one. This means you'll see better stack traces on uncaught errors. Fixes [#193](https://github.com/cypress-io/cypress/issues/193).
- We've bypassed Mocha's default uncaught error handling in a `hook`. Normally this immediately ends the run. Instead we are skipping the remaining tests in the current suite. This prevents skipping potentially dozens or hundreds of tests downstream that are typically unrelated to the hook failure.
- We've updated `cypress-cli` package to `0.12.0`. You will need to download this new CLI version if you want to pass `--reporter-options`.
- Bumped the internal version of `mocha` from `2.2.1` to `2.4.5`.

# 0.17.4

*Released 09/12/2016*

**Breaking Changes:**

- Using subsequent [`cy.visit()`](https://on.cypress.io/api/visit)'s *in the same test* will not necessarily force a full page refresh. If all that changed was the hash of a url, then the hash changes will take affect **without** a full page refresh. This matches the behavior of a real browser. Previously [`cy.visit()`](https://on.cypress.io/api/visit) always forced a full page refresh and this was not correct.

**Features:**

- Using [`cy.visit()`](https://on.cypress.io/api/visit) now acts *exactly* how modifying the URL in a real browser works. This means that if you visit a url with a hash in it, instead of forcing a full page refresh, it will now simply modify the hash route as if you had manually changed it. This more accurately reflects real user behavior. Previously this was impossible to do with Cypress other than manually altering `window.location.hash`

**Bugfixes:**

- Fixed a regression in `0.17.2` which caused **separate** tests that were visiting the same URL not to actually visit the new URL and eventually time out. We've updated some of our internal QA processes around this because we rarely have regressions and they are a pretty big deal. Fixes [#225](https://github.com/cypress-io/cypress/issues/225).
- Fixed displaying `(null)` contentType when a [`cy.visit()`](https://on.cypress.io/api/visit) returned a `404` status code. We now only display `contentType` when one exists.

# 0.17.3

*Released 09/11/2016*

**Features:**

- When `visible` assertions such as `should('be.visible')` fail we now print the reason Cypress thought the element was invisible. Matches what Cypress prints out when attempting to interact with invisible elements. Fixes [#221](https://github.com/cypress-io/cypress/issues/221).

**Bugfixes:**

- Prevent `Host` header from having its port appended when request was for port `80` or `443` which lead to 3rd party reverse proxy problems such as with `zeit.co` hosting. Fixes [#222](https://github.com/cypress-io/cypress/issues/222).
- Send valid http response errors, and display new lines correctly. Fixes [#218](https://github.com/cypress-io/cypress/issues/218).
- Correctly inject on `5xx` http response codes. Fixes [#217](https://github.com/cypress-io/cypress/issues/217).
- Correctly inject on `4xx` and other bad http response codes when using Cypress as the file server. Fixes [#219](https://github.com/cypress-io/cypress/issues/219).
- Correctly inject on `gzip` errors from 3rd party servers doing dumb things. Fixes [#220](https://github.com/cypress-io/cypress/issues/220).

# 0.17.2

*Released 09/06/2016*

**Notes:**

- After this update if you are seeing `<iframe>` origin errors **please let us know** by [opening an issue](https://github.com/cypress-io/cypress/issues/new). We will screen-share with you to diagnose the issue. We're no longer aware of any situation where this should happen, so if you're experiencing these bugs, please help us track them down.

**Features:**

- Attempting to [`cy.visit()`](https://on.cypress.io/api/visit) a non `text/html` resource will now throw a specific error message instead of bombing on page injection with an `<iframe`> origin error. You have to visit actual `html`, you cannot visit something like a `.json` or `.png`. If you're wanting to visit an API route on your backend that does something like set cookies (thus avoiding loading your UI) you can just use [`cy.request()`](https://on.cypress.io/api/request) for this since it will now automatically get and set cookies under the hood. Fixes [#211](https://github.com/cypress-io/cypress/issues/211).

**Bugfixes:**

- Fixed a regression in `0.17.1` that was incorrectly setting `Cache` headers. This *could* cause a situation where you received an `<iframe>` origin error. Additionally we now set `No-Cache` headers whenever we inject content, but otherwise respect the headers coming from web servers. When using Cypress as the file server, we set `etags` but prevent caching.
- Most likely fixed a bug that was crashing Cypress due to `Cannot set headers after they've been sent`. We were unable to write a test for this since we could not recreate the error, but analyzed how it *may* happen and fixed the code there. [Open an issue](https://github.com/cypress-io/cypress/issues/new) if you see this error, it will be obvious since Cypress will literally crash.
- We stopped minifying `vendor.js` (for real this time). More optimizations to come around this.
- Prevented accidentally setting `domain` cookies when they were really `hostOnly` cookies, thus duplicating the number of cookies sent on requests. Kudos to [@bahmutov](https://github.com/bahmutov) for finding this one. Fixes [#207](https://github.com/cypress-io/cypress/issues/207).
- Fixed some edge cases in `cypress-core-extension` where it threw errors when attempting to `executeScript` on a tab with `about:blank` or `chrome://` urls.
- We've fixed some underlying issues with [`cy.go()`](https://on.cypress.io/api/go) while running headlessly. It always worked fine in real Chrome. Previously there were some situations where it would not navigate forward / back correctly.

**Misc:**

- No longer force [`cy.visit()`](https://on.cypress.io/api/visit) to navigate to `about:blank` prior to navigating to the real url. Fixes [#208](https://github.com/cypress-io/cypress/issues/208).
- [`cy.writeFile()`](https://on.cypress.io/api/writefile) can now accept an empty string. Fixes [#206](https://github.com/cypress-io/cypress/issues/206).
- Improved error messages for [`cy.readFile()`](https://on.cypress.io/api/readfile) and [`cy.writeFile()`](https://on.cypress.io/api/writefile).
- The full file path is now included in console output for [`cy.readFile()`](https://on.cypress.io/api/readfile) and [`cy.writeFile()`](https://on.cypress.io/api/writefile).
- The [Kitchen Sink](https://github.com/cypress-io/cypress-example-kitchensink) and `example_spec.js` have been updated to reflect the newest changes and features of `0.17.1`.

# 0.17.1

*Released 08/31/2016*

**Features:**

- You can now pass keyboard modifiers such as `ctrl`, `cmd`, `shift`, and `alt` to [`.type()`](https://on.cypress.io/api/type). In addition we've added support for not "releasing" these keys so they can affect other actions such as {% url `.click()` click %}. Addresses [#196](https://github.com/cypress-io/cypress/issues/196).
- You can now type into the `<body>` or `document` as opposed to previously *having* to target a valid focusable element. This is useful in situations where you're testing keyboard shortcuts and do not want to target a specific element. Addresses [#150](https://github.com/cypress-io/cypress/issues/150).
- There is a new command [`cy.readFile()`](https://on.cypress.io/api/readfile) that reads files on your file system and changes the subject to the contents. Addresses [#179](https://github.com/cypress-io/cypress/issues/179).
- There is a new command [`cy.writeFile()`](https://on.cypress.io/api/writefile) that creates and/or writes contents to files on your file system. Addresses [#179](https://github.com/cypress-io/cypress/issues/179).

**Bugfixes:**

- [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) now works correctly. The driver was still referencing the old `commandTimeout` value.
- The `__cypress.initial` cookie should now be removed during any [`cy.visit()`](https://on.cypress.io/api/visit), which should fix some edge cases with the proxy accidentally injecting content when it shouldn't. We also added a ton more e2e tests covering these edge cases and other behavior.
- The proxy now restricts it's injection to only `Content-Type: text/html` headers so it will not accidentally inject into the wrong responses.

**Misc:**

- All [`cy.fixture()`](https://on.cypress.io/api/fixture) extensions are now supported and Cypress will no longer throw on extensions it doesn't recognize. For known fixture extensions we'll continue to apply a default `encoding` and for everything else it will default to `utf8`. Fixes [#200](https://github.com/cypress-io/cypress/issues/200).
- [`cy.fixture()`](https://on.cypress.io/api/fixture) now accepts `encoding` as a 2nd optional argument.
- We now display a keyboard 'modifiers' column when clicking on a [`.type()`](https://on.cypress.io/api/type) in the Command Log.

# 0.17.0

*Released 08/30/2016*

**Overview:**

- The desktop application has been completely redesigned. We have moved from a tray application to a standard dock application. The list of projects is now in the same window as the list of tests in a project. As each test runs, the application highlights the currently running spec and displays the browser version running. The configuration of a project is now displayed in it's own tab. There is now a Desktop Menu where you can logout, check for updates, or view help links.
- The test [runner](https://github.com/cypress-io/cypress-core-runner) has been rebuilt from the ground up in [React.js](https://facebook.github.io/react/). The left side of the runner called the [reporter](https://github.com/cypress-io/cypress-core-reporter) is now a separate application. This, as well as other changes, markedly improved the performance of running tests. *Your tests will now run faster.* This will also enable you to test your application in full screen. Additionally this paves the way for being able to spawn multiple browsers at once and synchronize testing across them. This also means we'll be able to support mobile browsers. The UI for doing this hasn't been implemented but the vast majority of the work to accomplish this is done now.
- We have rewritten the entire proxy layer of the Cypress server to finally fix all the problems with CORS.

**Breaking Changes:**

- You cannot [`cy.visit()`](https://on.cypress.io/api/visit) two different super domains within a single test. Example: `cy.visit('https://google.com').visit('https://apple.com')`. There shouldn't be any reason you ever need to do this in a single test, if you do, you should make these two separate tests.

**Features:**

- **All CORS related issues should finally be fixed now.** Cypress now internally switches to the domain that you used in your [`cy.visit()`](https://on.cypress.io/api/visit). This means that the correct domain will display in the URL based on the application currently under test. Your application's code will run under the current domain at all times. Previously we implemented an endless amount of hacks and internal translations to figure out the domain you were *supposed* to be on without actually being on the domain. This caused code to behave different and caused subtle issues. Those issues should now be resolved. The entire proxy layer has been rewritten to handle all `https` certificates flawlessly, continue to inject (even on `https` pages), and still know when to automatically bypass injection so you can open other tabs while testing in Cypress. These new proxy changes also unlock the ability to do things like whitelisting or blacklisting specific 3rd party domains, or even be able to stub not just XHR's but any kind of `HTTP` request.
- `window.fetch` now works correctly. Stubbing these does not yet work but it is now possible for us to implement stubbing in a future version. Addresses [#95](https://github.com/cypress-io/cypress/issues/95).
- The list of tests now automatically refresh when test files are renamed, deleted, or added. In addition, because the list of tests is now displayed in the desktop application, we now synchronize the state of the current running spec.
- [`cy.visit()`](https://on.cypress.io/api/visit) has better error messages. Cypress now programmatically determines why a [`cy.visit()`](https://on.cypress.io/api/visit) failed and gives you a ridiculously accurate error message. Addresses [#138](https://github.com/cypress-io/cypress/issues/138).
- [`cy.visit()`](https://on.cypress.io/api/visit) now displays redirects and any cookies set.
- The currently running test is now scrolled into view. This behavior can be turned off by scrolling in the command log or selecting to disable auto-scroll at the top of the command log. Addresses [#194](https://github.com/cypress-io/cypress/issues/194)
- Tests in the Command Log now automatically expand when specific commands take longer than `1000ms` to run. Previously when running more than 1 test we did not expand commands until a test failed. Now they will be expanded and automatically collapsed whenever a single command is taking a long time to finish.
- We now have full blown subdomain support. This means you can now navigate to a subdomain either directly via a [`cy.visit()`](https://on.cypress.io/api/visit) or by navigating in your application naturally (such as clicking an `<a>`).
- [`cy.request()`](https://on.cypress.io/api/request) now attaches and sets cookies transparently on the browser. Even though the browser will not physically make the request, we automatically apply outgoing cookies *as if* the browser had made the request. Additionally we will automatically *set* cookies on the browser based on the response. This means you can use [`cy.request()`](https://on.cypress.io/api/request) to bypass not just CORS but handle things like automatically logging in without having to manually perform these actions in the UI.
- We now handle `HTTP` request errors much better. Previously if your web server sent us back a `4xx` or `5xx` response we would automatically send back a `500`. Now we transparently pass these through.
- Improved dozens of error messages.
- [`cy.debug()`](https://on.cypress.io/api/debug) output has been improved, and you can now easily inspect the current command's subject.
- Clicking the URL in the header of the runner now opens that URL in a new tab.

**Bugfixes:**

- Fixed URL proxy issue with subdomains. Fixes [#183](https://github.com/cypress-io/cypress/issues/183).
- Viewport size maximum has been decreased from `3001px` to `3000px` and minimum has been increased from `199px` to `200px` to match error messages. Fixes [#189](https://github.com/cypress-io/cypress/issues/189)
- Websockets are now correctly proxied through `https` and through subdomains different than the current domain under test.
- Stopped [`cy.debug()`](https://on.cypress.io/api/debug) from accidentally mutating subjects.
- Cypress now correctly injects and handles pages which are missing a `<head>`, a `<body`>, or even an `<html>` tag. Previously it would bomb on pages missing these tags.
- All commands with a long message (such as assertions) are automatically scaled down in font size and truncated properly. In addition, assertions will correctly bold the `expected` and `actual` values.

**Misc:**

- [`cypress run`](https://github.com/cypress-io/cypress-cli#cypress-run-1) no longer requires being logged in.
- Renamed configuration option `commandTimeout` to [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts). Cypress will transparently rewrite this if you have it in your `cypress.json`, so you don't have to do anything.
- Renamed `onConsole` and `onRender` Command Log options to `consoleProps` and `renderProps`. We still support the older property names for backwards compatibility.
- Added support for a command's `message` or `renderProps.message` to use markdown.
- The default value of `port` within a project's global [configuration](https://on.cypress.io/guides/configuration) has changed from `2020` to now being a random open port. You can still configure a specific `port` if needed within the [configuration](https://on.cypress.io/guides/configuration).
- We have upgraded the `Chromium` that runs headlessly on `cypress run` to version `51`.
- The internal version of `node` which is built into Cypress is now `6.1.0`.
- Cypress `.js` files are no longer minified to make them easier to debug.
- We are cleaning up internal `__cypress` cookies more so they won't get in the way of testing your application.
- We now opt into `gzip` handling instead of forcing requests to omit it.
- The runner is now responsive. It will correctly scale down URLs on smaller screen sizes instead of looking completely broken in CSS. We also designed a much better loading indicator.
- Added button to the reporter that focuses the Desktop GUI and shows the list of tests.
- The reporter now updates the duration every `100ms` instead of only when a test changes.
- In the reporter, suites that are pending or contain only pending tests have the blue "pending" indicator on the left instead of the white "processing" indicator.

# 0.16.5

*Released 07/31/2016*

**Bugfixes:**

- Force exit codes that are `null` to `0`. Fixes [#184](https://github.com/cypress-io/cypress/issues/184).

# 0.16.4

*Released 06/17/2016*

**Bugfixes:**

- Fixed regression caused by `0.16.2` where a failed {% url `cy.contains()` contains %} would not be cancelled and would continue to run and display failed assertions in between test runs (without a full page refresh). Fixes [#174](https://github.com/cypress-io/cypress/issues/174).

# 0.16.3

*Released 06/17/2016*

**Features:**

- [`cy.route()`](https://on.cypress.io/api/route) now accepts string glob patterns using [minimatch](https://github.com/isaacs/minimatch) under the hood. This means you can more easily route dynamic urls without using `regex`. Example: `cy.route('POST', '/users/*/comments', {})`
- [`Cypress.minimatch`](https://on.cypress.io/api/cypress-minimatch)  is now exposed so you can easily test globbing patterns.
- [`.type()`](https://on.cypress.io/api/type) can now be used on non-input elements that have a `tabindex` attribute. Key events will fire but no text content will change and no input based events fire. Fixes [#172](https://github.com/cypress-io/cypress/issues/172).
- There is now an [`ignoreTestFiles`](https://on.cypress.io/guides/configuration) configuration option that accepts an array of `glob` patterns. This enables you to ignore extraneous spec files that may be created during a build process. The default pattern is `*.hot-update.js` which will ignore dynamically generated webpack hot module swapping files. Fixes [#159](https://github.com/cypress-io/cypress/issues/159).

**Bugfixes:**

- Fixed a bug where Cypress could get into a weird state and continuously error due to the `before:log` event not being properly disposed. Fixes [#173](https://github.com/cypress-io/cypress/issues/173).
- Fixed a bug where invalid UTF-8 characters were being set in XHR headers which caused XHR's to fail. We now properly encode and decode all values. Fixes [#168](https://github.com/cypress-io/cypress/issues/168).
- Nested directories under `cypress/support` no longer cause a `500` when tests run. This was due to Cypress not ignoring directories and trying to serve them as regular files. Fixes [#163](https://github.com/cypress-io/cypress/issues/163).
- Fixed situations where 3rd party libraries (such as [New Relic](https://newrelic.com/) were instrumenting XHR's identical to Cypress' implementation. This caused an infinite loop which would crash the browser. We've updated how we instrument XHR's to take this into account and deployed multiple fallbacks and strategies to prevent this kind of thing from happening in the future. Fixes [#166](https://github.com/cypress-io/cypress/issues/166).

**Misc:**

- [`Cypress.Server.defaults({})`](https://on.cypress.io/api/api-server) now accepts a `urlMatchingOptions` option for passing options to [minimatch](https://github.com/isaacs/minimatch).
- [`cypress run`](https://github.com/cypress-io/cypress-cli#cypress-run-1) now exits with the number of test failures instead of always exiting with 0. This matches the same way [`cypress ci`](https://github.com/cypress-io/cypress-cli#cypress-ci-1) works. Fixes [#167](../.issues/167)
- In the [`cypress-cli`](https://github.com/cypress-io/cypress-cli) package version `0.11.1`, you can now pass the `--spec` option to [`cypress ci`](https://github.com/cypress-io/cypress-cli#cypress-ci-1). This enables you to run a specific spec file as opposed to all tests. Fixes [#161](https://github.com/cypress-io/cypress/issues/161).

# 0.16.2

*Released 06/11/2016*

**Features:**

- Added new [`cy.screenshot()`](https://on.cypress.io/api/screenshot) command which can take screenshots on demand.
- When running headlessly or in CI Cypress will now automatically take a screenshot when a test fails. You can optionally turn this off by setting [`screenshotOnHeadlessFailure`](https://on.cypress.io/guides/configuration#section-global) to `false` in your [configuration](https://on.cypress.io/guides/configuration#section-global).
- Added new [`screenshotsFolder` configuration option](https://on.cypress.io/guides/configuration#section-folders) with default of `cypress/screenshots`.
- When running in [Circle CI](https://circleci.com/), we automatically export screenshots as artifacts which makes them available directly in their web UI. If you're using Circle CI, you'll be able to see screenshots without doing anything. If you're using [Travis CI](https://travis-ci.org/), you'll need to upload artifacts to an `s3 bucket`. This is a small slice of what is coming to help diagnose and understand errors in CI. Also in `0.17.0` we will automatically scroll the tests and more intelligently and open / close test commands so you can visually see what happened. Currently you may not see the test command's failure in the Command Log due to the view not scrolling.
- Added new [`.each()`](https://on.cypress.io/api/each) command which iterates serially on a collection yielding the iteratee, the index, and the collection. Addresses [#156](https://github.com/cypress-io/cypress/issues/156).
- [`cy.route()`](https://on.cypress.io/api/route) can now accept a single function and/or you can pass a function to the `response` property. This allows you to lazily evaluate routing responses. Great for referencing [fixtures](https://on.cypress.io/guides/creating-fixtures). Addresses [#152](https://github.com/cypress-io/cypress/issues/152).
- {% url `cy.contains()` contains %} now accepts a regular expression. Addresses [#158](https://github.com/cypress-io/cypress/issues/158).
- [`.type()`](https://on.cypress.io/api/type) now accepts `{downarrow}` and `{uparrow}`. We do not move the caret but do fire all the proper events. Addresses [#157](https://github.com/cypress-io/cypress/issues/157).

**Bugfixes:**

- [`cy.exec()`](https://on.cypress.io/api/exec) now outputs additional `stderr` and `stdout` information. It additionally will automatically `source` your `$SHELL` which makes GUI apps behave as if they've been launched from your terminal. Fixes [#153](https://github.com/cypress-io/cypress/issues/153) and fixes [#154](https://github.com/cypress-io/cypress/issues/154).
- [`.then()`](https://on.cypress.io/api/then) yielding nested subjects.
- {% url `cy.contains()` contains %} no longer returns the last element found when siblings both contain the same content. Fixes [#158](https://github.com/cypress-io/cypress/issues/158).
- Cypress no longer errors when you return a raw DOM element. It now correctly wraps this as the new subject.

**Misc:**

- {% url `cy.contains()` contains %} now provides an even more specific error message when it was scoped to a particular DOM element and contained a selector. Fixes [#160](https://github.com/cypress-io/cypress/issues/160).
- You will now see a very specific error message when we detect that you've mixed up `async` and `sync` code in a [`.then()`](https://on.cypress.io/api/then) callback function. An example would be queuing up a new cypress command but then synchronously returning a different value.

# 0.16.1

*Released 05/22/2016*

**Features:**

- [`Cypress.Cookies.debug()`](https://on.cypress.io/api/cookies#section-debug-usage) now works again. Additionally it provides much more feedback than it used to.
- [`Cypress.Cookies.debug(true, {verbose: false})`](https://on.cypress.io/api/cookies#section-turn-off-verbose-debugging-output) option has been added to remove verbose cookie object logging.

**Bugfixes:**

- Copy / Paste now works when logging in on OSX. Fixes [#145](https://github.com/cypress-io/cypress/issues/145).
- Grammar: 'Login -> Log in'. Fixes [#146](https://github.com/cypress-io/cypress/issues/146).
- Cypress now uses the body instead of headers to send external requests. Fixes [#148](https://github.com/cypress-io/cypress/issues/148).
- When [`.then()`](https://on.cypress.io/api/then) throws this no longer prevents the next test from issuing any commands. Fixes [#149](https://github.com/cypress-io/cypress/issues/149).

**Misc:**

- Passing multiple arguments to [`.its()`](https://on.cypress.io/api/its) now throws and suggests you use [`.invoke()`](https://on.cypress.io/api/invoke). Fixes [#147](https://github.com/cypress-io/cypress/issues/147).

# 0.16.0

*Released 05/17/2016*

**Notes:**

- Updating through the Desktop App in **Linux** does not work. To update please run `cypress install` from the command line.
- We are still updating the docs to reflect all of these changes.
- All users must *LOG IN AGAIN* and re-add their projects. Sorry, we've changed the way we store local data.

**Overview:**

- `0.16.0` marks a significant change for Cypress. Before this we only issued commands using regular JavaScript and coordinated these with the backend server which is running. As of `0.16.0` we are now tapping into the underlying browser automation libraries which enable us to exceed the limitations of the JavaScript sandbox. This means we have total control over the browser for more powerful automation tooling. The downside is that we have only implemented these API's for Chrome, and therefore running on multiple browsers will no longer work. This is a temporary setback as we'll be adding driver support for all of the other browsers over a period of time. You can read more about our browser management [here](https://docs.cypress.io/docs/browser-management).

**Breaking Changes:**

- Running tests in Cypress now requires either Chrome, Chromium, or Canary to be installed on your OS environment. We intend to expand support for more browsers in the future, but for now, only these 3 are supported.
- Removed support for [`Cypress.Cookies.get`](https://on.cypress.io/api/cookies), [`Cypress.Cookies.set`](https://on.cypress.io/api/cookies) and [`Cypress.Cookies.remove`](https://on.cypress.io/api/cookies).
- Changed return of [`cy.getCookies()`](https://on.cypress.io/api/getcookies) to return an array of cookies, each with properties include name, value, etc.
- Changed return of {% url `cy.clearCookies()` clearcookies %} to return null (previously was returning Cookie that was cleared).
- [`Cypress.Cookies.debug`](https://on.cypress.io/api/cookies) has been temporarily disabled and will be re-enabled later.
- Browsers are spawned in a Cypress specific profile so that we can maintain a clean state apart of your regular browsing usage. You will notice that your extensions are no longer installed. This is on purpose. 3rd party extensions can often get in the way of Cypress and cause failures. However, developer specific extensions for Angular, Ember, and React do not cause any issues but you'll want to reinstall them. You only have to install them once and they will persist.
- The `whitelist` callback function of [`Cypress.Cookies.defaults`](https://on.cypress.io/api/cookies#section-defaults-usage) now receives a `cookie object` instead of just the `cookies name` as a string.

**Features:**

- When a project is initially run from the desktop app, you can now choose to run Cypress in a select number of browsers including: Chrome, Chromium, or Canary (depending on what's installed on your OS).
- Browser sessions are spawned independently of your existing profiles and we've disabled things like password saving / prompting, JavaScript popup blocking, and other features which get in the way of testing. Read more [here](https://docs.cypress.io/docs/browser-management)
- We automatically spawn Chrome in a **custom theme** so you can visually distinguish the difference between browser sessions spawned with Cypress vs your normal sessions. We know this may feel a little jarring because you're used to running Cypress alongside your other tabs. You will now see 2 chrome icons in your dock and you'll need to switch between them. We know this is problematic and confusing and we're looking into **changing the icon** of the Chrome running Cypress so it's easier to tell the Chrome sessions apart.
- Added new commands to handle getting, setting, and clearing cookies: {% url `cy.clearCookie()` clearcookie %}, [`cy.getCookie()`](https://on.cypress.io/api/getcookie), and [`cy.setCookie()`](https://on.cypress.io/api/setcookie).
- All the `cy.cookie` commands have been upgraded to take new options and can do much more powerful things outside of the JavaScript sandbox.
- Upgraded the Chromium version running headlessly and in CI from `47` to `49`.
- There is a new [`cy.exec()`](https://on.cypress.io/api/exec) command that can execute any arbitrary system command. Additionally there is a new [`execTimeout` configurable option](https://on.cypress.io/guides/configuration#section-global) which is set to `60s` by default. Fixes [#126](https://github.com/cypress-io/cypress/issues/126).
- There is a new [`numTestsKeptInMemory` configuration option](https://on.cypress.io/guides/configuration#section-global) that controls how many test's snapshots and command data is kept in memory while tests are running. Reducing this number will reduce the memory used in the browser while tests are running. Whatever this number is - is how many tests you can walk back in time when inspecting their snapshots and return values.  Addresses [#142](https://github.com/cypress-io/cypress/issues/142).

**Bugfixes:**

- Cypress taskbar icon now displays correctly in OS X dark theme. Fixes [#132](https://github.com/cypress-io/cypress/issues/132).
- Fixed issue where server error's stack traces were being truncated in the Desktop app rendering them impossible to debug. Fixes [#133](https://github.com/cypress-io/cypress/issues/133).
- woff Fonts are now properly served from a local file system when using Cypress' web server. Fixes [#135](https://github.com/cypress-io/cypress/issues/135).
- When an element's center is not visible the error message now includes the stringified element in question, and not `undefined`.
- Typing into an `input[type=tel]` now works. Fixes [#141](https://github.com/cypress-io/cypress/issues/141).
- XHR's which have their `onload` handler replaced after `XHR#send` is called is now properly accounted for. Fixes [#143](https://github.com/cypress-io/cypress/issues/143).

**Misc:**

- XHR requests for `.svg` files are no longer shown in the Command Log by default. Addresses [#131](https://github.com/cypress-io/cypress/issues/131).
- Improved error when [`cy.request()`](https://on.cypress.io/api/request) fails. The request parameters are now included in the error. Addresses [#134](https://github.com/cypress-io/cypress/issues/134).
- When running a project in the new Cypress browser environment, if a new tab is opened, a message now displays discouraging the use of multiple tabs while testing. Addresses [#9](https://github.com/cypress-io/cypress/issues/9).
- When navigating directly to `localhost:2020` outside of the new Cypress browser environment, a message now displays discouraging running tests outside of the new Cypress browser environment.
- If, for whatever reason, Cypress cannot communicate with the automation servers, your testing session will immediately end and you'll have the ability to re-spawn the browser.
- [`cy.fixture()`](https://on.cypress.io/api/fixture) now has a default timeout of `responseTimeout` which is `20s`.
- [`cy.fixture()`](https://on.cypress.io/api/fixture) can now properly time out and accepts an `options` argument that can override its default timeout.
- Improved initial Desktop Application startup performance by about `1.5s`.
- We now correctly store local data in each operating system's correct `Application Data` area. This will be more resilient to upgrades in the future.
- Running Cypress in a linux VM on VirtualBox no longer displays "black screens".
- Our internal proxy no longer strips `HttpOnly` cookie flags.
- Improved command errors and normalized many of them. Fixes [#137](https://github.com/cypress-io/cypress/issues/137).
- JavaScript popup blocking is now disabled and will not interfere with running tests. Fixes [#125](https://github.com/cypress-io/cypress/issues/125).
- We now capture synchronous errors from XHR `onreadystatechange` handlers.

# 0.15.4

*Released 04/22/2016*

**Notes:**

- The docs have not yet been updated to reflect the changes to [`.its()`](https://on.cypress.io/api/its) and [`.invoke()`](https://on.cypress.io/api/invoke).

**Breaking Changes:**

- You can no longer improperly use [`.its()`](https://on.cypress.io/api/its) and [`.invoke()`](https://on.cypress.io/api/invoke). Using [`.invoke()`](https://on.cypress.io/api/invoke) on a non function property will result in an error that tells you how to write it properly using [`.its()`](https://on.cypress.io/api/its).

**Features:**

- Our [Chat channel](https://gitter.im/cypress-io/cypress) has now been directly integrated into Cypress's nav. Clicking on the `chat` icon will immediately display the current gitter chat log.
- Added a new link to Options dropdown in Desktop app for "Chat" that goes to our [Gitter Chat channel](https://gitter.im/cypress-io/cypress).
- [`.its()`](https://on.cypress.io/api/its) and [`.invoke()`](https://on.cypress.io/api/invoke) now support **dot separated** nested properties.
- Using [`.its()`](https://on.cypress.io/api/its) on a function will now allow you to access its properties instead of automatically calling a function. Fixes [#122](https://github.com/cypress-io/cypress/issues/122).
- Error messages and command messages for [`.its()`](https://on.cypress.io/api/its) and [`.invoke()`](https://on.cypress.io/api/invoke) have been improved.
- Adding an attribute called `data-cypress-ignore` to an element will prevent the internal Cypress proxy from rewriting any of its content or attributes.

**Bugfixes:**

- When running headlessly, windows created with `window.open` will no longer physically display. They are now correctly headless. Fixes [#123](https://github.com/cypress-io/cypress/issues/123).
- The auto generated `example_spec.js` no longer errors on `cy.visit('app/index.html')` since that file would likely not locally exist.

**Misc:**

- Better error handling of unauthorized users attempting to login to Cypress with improved [Login documentation](https://on.cypress.io/guides/installing-and-running#section-logging-in).

# 0.15.3

*Released 04/10/2016*

**Features:**

- Cypress will now [display the **resolved** configuration values when you open a project](https://on.cypress.io/configuration#section-resolved-configuration). This tells you the source of all config values.
- The latest version of the [Cypress CLI](https://github.com/cypress-io/cypress-cli) now accepts passing arguments to `cypress open`. Example: `cypress open --config waitForAnimations=false --env foo=bar,baz=quux`. This enables you to set and override local `cypress.json` configuration and additionally set environment variables.
- [Environment Variables](https://on.cypress.io/guides/environment-variables#section-overriding-configuration) that match any configuration keys (such as `pageLoadTimeout` or `watchForFileChanges`) now override their values. So, if you `export CYPRESS_WATCH_FOR_FILE_CHANGES=false` it will turn off this configuration option. Also note that we'll automatically normalize environment keys so: `CYPRESS_pageLoadTimeout=100000` and `CYPRESS_PAGE_LOAD_TIMEOUT=100000` will both be correctly handled. We'll also coerce values into `Boolean` or `Number` correctly.
- Cypress now correctly proxies `Websockets` that are pointed at the local Cypress server (typically `localhost:2020`). Because most users use [Socket.io](http://socket.io/), when Socket.io could not correctly connect over Websockets it would fall back to XHR polling. You may notice many less XHR requests in your command log (which is the intended behavior).
- The tray icon in OSX will now change colors. It will turn blue when you're running a Cypress project and red on any kind of failures such as syntax errors in `cypress.json`. It will turn back black when nothing is actively running.
- The title of your project is now the title of the browser tab (so you can easily tell Cypress tabs from one another).
- There is now a link to our [Gitter Chat](https://gitter.im/cypress-io/cypress) in the navigation of the web app.

**Bugfixes:**

- The `-s` or `--spec` option now works correctly. You now must pass a relative or absolute path to your spec file. This is much less confusing, allows you to easily autocomplete entries from bash, and will support `unitFolder` later when it's added. Assuming you want to run a spec file that is located in `cypress/integration/foo_spec.js` you would pass: `cypress run --spec cypress/integration/foo_spec.js`. Previously you could just pass `--spec foo_spec.js` which now no longer works (and was broken anyway). Fixes [#120](https://github.com/cypress-io/cypress/issues/120).

**Misc:**

- Open sourced another core repo: [Cypress Core Desktop GUI](https://github.com/cypress-io/cypress-core-desktop-gui) which makes up the Cypress Desktop Application.
- Improved the [error message](https://github.com/cypress-io/cypress/issues/74#issuecomment-208422453) displayed to users on Windows attempting to download the Cypress Desktop app.

# 0.15.2

*Released 04/03/2016*

**Features:**

- The [error message when Cypress detects that a test has ended early](https://on.cypress.io/guides/errors#section-the-test-has-finished-but-cypress-still-has-commands-in-its-queue) (there are still commands left in the queue) now displays a list of these commands with a much improved explanation.
- There is now a new [configuration option](https://on.cypress.io/guides/configuration): `watchForFileChanges` that, when set to `false` in the `cypress.json`, will prevent Cypress from attempting to watch for file changes and restart your tests.
- You can now set the default [`reporter`](https://on.cypress.io/guides/configuration) in `cypress.json` for use when running headlessly or in CI.

**Bugfixes:**

- The [`--reporter`](https://github.com/cypress-io/cypress-cli#cypress-run-1) CLI option is now working again.
- the `teamcity` reporter is now also working again.

**Misc:**

- Updated favicon + logo mark

# 0.15.1

*Released 04/01/2016*

**Features:**

- [`cy.go()`](https://on.cypress.io/api/go) and [`cy.reload()`](https://on.cypress.io/api/reload) now accept a timeout option. Also, these commands would previously time out after the default `commandTimeout` of `4000ms`, but now they will timeout after `pageLoadTimeout` of `30000ms`.

**Bugfixes:**

- When an integration test file is unable to run and the `integrationFolder` is not the default path, the UI error now properly prints the integration test file's path by stripping off `integration` in the path. Fixes [#117](https://github.com/cypress-io/cypress/issues/117).
- [Cypress.Dom.isHidden()](https://on.cypress.io/api/dom#section-is-hidden-usage) will now throw error when it isn't passed a DOM element.

**Misc:**

- Renamed [configuration](https://on.cypress.io/guides/configuration) option `visitTimeout` to `pageLoadTimeout`. You don't need to change anything. If you were specifically setting `visitTimeout` in your `cypress.json` file it will be transparently rewritten `pageLoadTimeout` on the next server boot. This option was renamed because now multiple commands `cy.visit()`, `cy.go()`, and `cy.reload()` all depend on this timeout option.
- The Cypress tray icon has been updated. It's much better now.

# 0.15.0

*Released 03/28/2016*

**Overview:**

- As we get closer to a public release we've decided to focus on onboarding new users and new projects. We've made several breaking changes to help with this process.

**Features:**

- There is now an `example_spec.js` file that is scaffolded on new projects. This allows new users to instantly see Cypress successfully running on an example project and will answer many questions on writing your first tests. This `example_spec.js` file contains every single Cypress command and has approximately 70 tests.
- Added a welcome dialog for new projects that explains how Cypress scaffolds out it's folder structure. This dialog will only display if Cypress detects that you haven't written any tests or changed the initial `example_spec.js` file. The welcome dialog will no longer display after you've changed or added any tests.
- Added the ability to click on file/folder links from within the Cypress webapp that will spawn your OS file/folder finder and show you where the files are located in your project.
- There is now a default `cypress` folder that contains your test files, a `fixtures` folder with an example fixture, and a `support` folder with example support files. Inside `cypress` there is an `integration` folder that will contain your integration tests.
- You can now turn off `supportFolder` and `fixturesFolder` by passing `false` in `cypress.json`. This will automatically remove the folders the next time you open your project in Cypress. Fixes [#102](https://github.com/cypress-io/cypress/issues/102).
- Restyled the tests list.

**Breaking Changes:**

- Cypress no longer looks at your `tests` directory for test files. Now, by default, it looks in the `cypress/integration` directory.
- We've removed the [configuration option](https://on.cypress.io/guides/configuration) `testFolder` and renamed it to `integrationFolder` inside of the `cypress.json`.
- We've renamed the `cypress` npm package to be [`cypress-cli`](https://github.com/cypress-io/cypress-cli). You'll see a giant deprecation warning until your scripts have been updated to reference `cypress-cli`. [More info here](https://www.npmjs.com/package/cypress). You can also uninstall the `cypress` npm package.
- Added new `fileServerFolder` [configuration option](https://on.cypress.io/guides/configuration) that can mount a directory other than your project root when using Cypress as a webserver.

**Misc:**

- Using [`.hover()`](https://on.cypress.io/api/hover) will provide a detailed error message with a link for working around hover constraints. Addresses [#10](https://github.com/cypress-io/cypress/issues/10)
- Internal routing errors in Cypress are now gracefully handled with `x-cypress-error` and `x-cypress-stack` set on response headers.
- Updated all of the repo names to be modular.

**What you need to do**:
- We did not write an automatic migration from `tests` -> `cypress`
- You need to manually move your existing test files from `tests` into `cypress/integration`.
- [Come into the chat](https://gitter.im/cypress-io/cypress) if you have any problems or need help.

More Info:
- Why did you change the default test folder to be `cypress/integration`?
- We are adding support for unit testing in the near future and decided that there needs to be a separation between `unit` and `integration` tests. The actual runner will handle these two sets of specs very differently. It's important to make the change now so when we do add support for unit tests, you only have to create a `unit` folder inside of your `cypress` folder.

# 0.14.3

*Released 03/20/2016*

**Features:**

- Added [`cy.getCookies()`](https://on.cypress.io/api/getcookies) command for easy chain-ability. Fixes [#103](https://github.com/cypress-io/cypress/issues/103).
- Cypress now outputs its version when passed the `--version` argument
- If you are not logged in on OSX, Cypress now issues a native system notification indicating to you that Cypress is running in your tray (many users often complained they could not tell Cypress was actually running)

**Bugfixes:**

- Handle clearing cookies better when they are created on a path other than `/`. Fixes [#104](https://github.com/cypress-io/cypress/issues/104).
- Issuing Cypress Commands inside of a Promise now works. Fixes [#111](https://github.com/cypress-io/cypress/issues/111).
- 'Add Project' dialog is no longer lost on blur. Fixes [#115](https://github.com/cypress-io/cypress/issues/115).
- Desktop windows that are transparent no longer lose their box shadow.

**Misc:**

- `cy.visit()` callback functions: `onBeforeLoad` and `onLoad` are now invoked with the current runnables context instead of with `cy`. This makes accessing properties in your tests much easier.

# 0.14.2

*Released 03/14/2016*

**Bugfixes:**

- Chaining more cy commands after using [`cy.wrap()`](https://on.cypress.io/api/wrap) now works. Fixes [#114](https://github.com/cypress-io/cypress/issues/114).
- Cypress now handles events property when a DOM element is removed during a `.click()` event. As per the spec, if `mousedown` causes element removal then `mouseup` and `click` and `focus` events will not be fired. Additionally if removal happens during `mouseup` then `click` event will not be fired. Also updated the `onConsole` groups to only display and indicate the events which actually fired. Fixes [#109](https://github.com/cypress-io/cypress/issues/109).

**Misc:**

- Removed `fa-refresh` icons next to suites and tests until this behavior has been reimplemented due to ID removal.
- Removed resetting the runnable timeout when a `page load` event resolves. This prevents an edge case where the next test may show as timed out when running headlessly.

# 0.14.1

*Released 03/13/2016*

**Features:**

- Project ID's and `cypress.json` are now only generated once you start your Cypress server. Previously they were created initially when you choose the project folder. This now means you won't have to cleanup excess files if you accidentally select the wrong folder. Additionally you can now use Cypress 100% offline. Previously the GUI would block until the project had an ID but this restriction has been lifted.

**Bugfixes:**

- The proxy server can now correctly proxy content on a `ipv6` host only. We had to patch node core to get this in, as by default node prefers `ipv4`. We now concurrently test all hosts via `dns.lookup` to find the first one that responds. This updated behavior now matches how other clients, like `curl`, and browsers resolve hosts. Fixes [#112](https://github.com/cypress-io/cypress/issues/112).
- Simplified how Cypress stores projects and fixed some edge cases where Cypress would send an outdated Project ID.
- Prevent server from opening and immediately closing + re-opening when project is missing a Project ID and one is generated.
- Using Cypress as a file server and serving a file that's part of a folder that has a name containing a space now works. Fixes [#113](https://github.com/cypress-io/cypress/issues/113).
- The existing `.cy` cache and settings are now correctly copied again after an app update.

**Misc:**

- Projects without an ID now error correctly when running in CI.
- When Cypress cannot proxy http content due to a software error it will attach a `x-cypress-error` and `x-cypress-stack` to the HTTP request for easy inspection and debugging.
- Cypress will now output its internal logger directly to the console when `CYPRESS_DEBUG` env var is set.
- Replaced Ruby / Compass with `node saas`.

# 0.14.0

*Released 03/08/2016*

**Summary:**

- This update represents mostly a lot of internal structure changes. We swapped out the underlying Desktop architecture and refactored all of the backend code to prepare for an open-source release.
- If you choose to install Cypress from the [`CLI Tool`](https://github.com/cypress-io/cypress-cli) you must update to the latest version `0.9.1`. Just run `npm install -g cypress` and then you can run [`cypress install`](https://github.com/cypress-io/cypress-cli#cypress-install-1). You don't need to do anything if you update from within the Desktop GUI itself.

**Features:**

- The Desktop App has been re-skinned with misc GUI enhancements such as help text, popovers, clearer errors, better loading indicators, etc.
- The Desktop App's file size is now much smaller and unzips much faster. In the next release there will be a special `CI` build which removes the need to run `XVFB`.
- Test IDs have been removed. You will no longer see Cypress insert IDs into your test files. This was a feature we implemented on day 1 - the idea being we could track test performance and do regression analysis. Unfortunately, it will be a long time before we actually implement the data science to make this happen. For the time being, IDs presented unnecessary technical complexity and challenges with no real upside. We recommend you remove all of your existing IDs. We've added a new command to the CLI tool that can do this in one shot. [`cypress remove:ids`](https://github.com/cypress-io/cypress-cli#cypress-removeids-1) You may see IDs be reintroduced at a later time when we provide analytics.
- [`.then()`](https://on.cypress.io/api/then) now supports a `timeout` option. Fixes [#110](https://github.com/cypress-io/cypress/issues/110).
- All error messages from using the CLI have been rewritten and improved.
- Cypress will now automatically prompt you to add a project when using [`cypress run`](https://github.com/cypress-io/cypress-cli#cypress-run-1) on a project that has not yet been added.
- Domain cookies are now proxied better. There's still more work to do before they are 100% fixed but now most typical domain cookie scenarios should 'just work'.
- We've put together a new example repo called [`The Kitchen Sink`](https://github.com/cypress-io/examples-kitchen-sink). It demonstrates usage of every single Cypress command.

**Bugfixes:**

- Using [`cypress run`](https://github.com/cypress-io/cypress-cli#cypress-run-1) in OSX now works again.
- Added fs polling support to fix issues where Cypress would not detect file changes.
- Tests should reload inside of Cypress faster when they are changed.
- Better error messages when a command times out waiting for a promise to resolve. Fixes [#108](https://github.com/cypress-io/cypress/issues/108).
- [`cy.viewport('ipad-2')`](https://on.cypress.io/api/viewport) now displays by default in portrait. Landscape orientation is now properly landscape. Fixes [#100](https://github.com/cypress-io/cypress/issues/100).
- {% url `.click()` click %} will now properly click within an element's bounding box when a `position` option is passed and the calculated coordinates are a fraction. This previously forced the click to happen outside of the element. Fixes [#99](https://github.com/cypress-io/cypress/issues/99).
- `clientX` and `clientY` event properties are now correctly calculated for elements when the page is scrolled. Fixes [#98](https://github.com/cypress-io/cypress/issues/98).
- {% url `.check()` check %} and [`.uncheck()`](https://on.cypress.io/api/uncheck) now correctly filter down the subject when a value is passed as an option. Fixes [#94](https://github.com/cypress-io/cypress/issues/94).
- The desktop GUI will now display your email address when you have not set a name in GitHub.

**Misc:**

- Improved element display in Command Log when multiple elements are part of an assertion. Fixes [#96](https://github.com/cypress-io/cypress/issues/96).
- [`cy.reload()`](https://on.cypress.io/api/reload) now returns the window object of the newly reloaded page. Fixes [#105](https://github.com/cypress-io/cypress/issues/105).

Known Issues:
- Clicking the 'reload' icon next to a test that does not have an ID will not work anymore. We're reworking this feature to work without the presence of IDs.

# 0.13.9

*Released 01/28/2016*

**Bugfixes:**

- Prevent regression with not automatically scaling the viewport to fit into the window size

**Misc:**

- Update links to match new [documentation hub](https://docs.cypress.io)
- [`cy.debug()`](https://on.cypress.io/api/debug) has been zipped up - it no longer logs confusing debugging information and now logs information about the previously run command.
- [`_`](https://on.cypress.io/api/cypress-underscore), [`$`](https://on.cypress.io/api/cypress-jquery), [`Promise`](https://on.cypress.io/api/cypress-promise), [`Blob`](https://on.cypress.io/api/cypress-blob), [`moment`](https://on.cypress.io/api/cypress-moment) utilities have been moved off of `cy` and are now attached to `Cypress`. This is much more consistent with how the `cy` and `Cypress` API's work. You can continue to use these objects off of `cy` but this has been deprecated and you will see a warning message.

# 0.13.8

*Released 01/24/2016*

**Features:**

- Added [`cy.reload()`](https://on.cypress.io/api/reload) command which does a full page refresh. This is the same as the user hitting the 'Reload' button. Additionally it matches the same argument signature as `window.location.reload`.

**Bugfixes:**

- Fixed situation where [`cy.viewport()`](https://on.cypress.io/api/viewport) would not restore correctly between tests. Previously this would cause subsequent tests to be issued at the modified `cy.viewport()`. Now viewport is automatically restored to the settings in your `cypress.json` file.

**Misc:**

- Using [`.its()`](https://on.cypress.io/api/its) on a function or [`.invoke()`](https://on.cypress.io/api/its) on a property now logs a deprecation warning. In the next major release this will become a full error. It is valuable to make a distinction whether you're operating on a property vs a function, and this change improves overall readability with less confusion.
- Cypress deprecations and warnings are now prefixed with: `Cypress Warning:` to indicate this message is coming from Cypress

# 0.13.7

*Released 01/17/2016*

**Bugfixes:**

- Prevent error during element stringification on `<svg>`. Fixes [#93](https://github.com/cypress-io/cypress/issues/93).
- Clarified on errors related to not being able to run in CI. Previously there was a "catch all" error indicating your Cypress API Key was invalid. This was oftentimes incorrect. More specific errors have been added.
- [`.type()`](https://on.cypress.io/api/type) has been upgraded to handle current selection ranges. Previously if an `<input>` had a selection range as Cypress began to type, this would be ignored. Cypress now takes this into account and will type over any selected text (as native typing would do).

**Misc:**

- All Cypress related services have been updated to use `https`. We are forcing `https` redirects for everything except for `api.cypress.io`, which would be a breaking change. By the next minor release we will force that as well. Once we make this change we will remove all versions below `0.13.7`. So make sure you **are not** locking the Cypress version when running in CI. We periodically remove old Cypress versions which have security flaws and this is an example of one.

# 0.13.6

*Released 01/09/2016*

**Features:**

- All commands now retry if the the associated element is disabled until the element is no longer disabled. If the command times out a specific error message is now thrown.
- [`cy.server()`](https://on.cypress.io/api/server) and [`cy.route()`](https://on.cypress.io/api/route) now take an optional `onAbort` callback which fires anytime an XHR is aborted

**Bugfixes:**

- Fixed edge case where XHR's which were already aborted were aborted a 2nd time when tests end. Cypress now only aborts currently running XHR's which have not already been aborted.
- When passing an array of aliases to [`cy.wait()`](https://on.cypress.io/api/wait) there was an edge case where an incorrect error message was being thrown. The incorrect values were a combination of the wrong alias, the wrong timeout value, or the wrong request or response. Now Cypress correctly provides all 3 of these values.

# 0.13.5

*Released 01/03/2016*

**Features:**

- Added new command: [`cy.go()`](https://on.cypress.io/api/go) which accepts `back`, `forward`, or an arbitrary Number.
- [`cy.go()`](https://on.cypress.io/api/go) enables you to navigate back or forward in your history. Cypress intelligently handles situations where moving forward or back causing a full page refresh, and will wait for the new page to load before resolving and moving onto new commands. It additionally handles situations where a page load was not caused (such as hash routing) and will resolve immediately.

**Misc:**

- Using `{force404: false}` will now output a warning explaining this is now the default option and can be removed safely.

# 0.13.4

*Released 12/31/2015*

**Features:**

- Added `waitForAnimations` and `animationDistanceThreshold` [configuration options](https://on.cypress.io/guides/configuration)
- Cypress now automatically detects and waits for an element which is animating to stop animating. The threshold that Cypress considers *animating* is set to a distance of `5px` per `60fps`. In other words, if your element is moving too fast for a user to interact with, then Cypress considers the element animating and will wait until it finishes before attempting to interact with it. When we say 'interact' we mean apply command actions like {% url `.click()` click %}, [`.select()`](https://on.cypress.io/api/select), [`.type()`](https://on.cypress.io/api/type), {% url `.check()` check %}, etc. Waiting for animations prevents a series of edge cases and weird bugs where Cypress was interacting with elements **too** quickly which might cause undesired side effects in your application which are hard to track down. The downside to this implementation is that for every action Cypress must wait at least 2 run loops before applying actions. This slows down every action command by about `32ms`. If your app does not use animations you may wish to turn off this behavior in your `cypress.json` file.

**Bugfixes:**

- Prevent `undefined` error when attempting to {% url `.click()` click %} an element which is fixed position when it is covered by another element. Cypress now correctly provides why it cannot click the element in question. Fixes [#90](https://github.com/cypress-io/cypress/issues/90).
- Prevent infinite loop in edge cases when checking whether an element was hidden

**Misc:**

- The default behavior of [`cy.server()`](https://on.cypress.io/api/server) has changed from `force404: true` to become `force404: false`. In other words, Cypress will no longer forcibly send XHR's to 404 status when these XHR's do not match any existing [`cy.route()`](https://on.cypress.io/api/route). This change better aligns with predictable usage for most Cypress users.

# 0.13.3

*Released 12/25/2015*

**Notes:**

- Merry Christmas everyone ;-)

**Features:**

- Overhauled the entire subsystem dealing with an element's visibility state. Previously we were simply using jQuery's `.is(":visible")` selector which was ineffective at truly determining when an element is "visible". Our changes now differ significantly from jQuery, but they match what a real user would consider visible, and the rules are fairly easy to explain. In other words these rules should just "make sense".
- An element is considered visible if it can be "interactive" with a user. In other words, if the user is able to click, type, drag, or otherwise physically interact with the element it is considered visible.
- Because of the additional complexities of how Cypress considers an element `visible`, we now have added the **exact** reason why an element is not visible when throwing an error. This means you'll see errors detailing whether an element or its parents have `display: none`, `visibility: hidden`, or whether an element is considered hidden because its effective `width` or `height` is zero. Whatever the reason, Cypress will indicate why your element is considered hidden.
- Exposed [`Cypress.Dom.isHidden`](https://on.cypress.io/api/dom) which holds the logic for determining an element's visibility. Modify this to change the rules.
- Upgraded [`.select()`](https://on.cypress.io/api/select) to automatically retry when the `<select>` is disabled, its matching `<option>` is disabled, or when Cypress cannot find a matching `<option>`. This more correctly aligns with the behavior of other actions like {% url `.click()` click %}, which automatically retry until the element is ready to receive the action.

**Bugfixes:**

- Throw on [`.select()`](https://on.cypress.io/api/select) when it cannot find a matching `<option>`. Also throw when `<select>` or a matching `<option>` is disabled. Fixes [#91](https://github.com/cypress-io/cypress/issues/91).
- "Hidden" elements which actually displace height or width are now highlighted when restoring the DOM when a command is hovered.
- Margin on zero client width / client height is now displayed correctly on command hover and more accurately mimics the way Chrome Dev Tools highlights elements.
- Using `history.back`, `history.forward`, or `history.go` in CI or in headless mode now works again.

**Misc:**

- The updated hidden rules apply to all assertions like `should("be.hidden")`, and how Cypress indicates an element is hidden displays in the Command Log.
- Updated many error messages to be more explanatory and precise.
- Elements which are stringified during errors now indicate their text content (truncated to 10 characters) `<button>Save</button>` or whether they contain children elements by indicating an ellipsis `<div>...</div>`.
- The [`Routes` instrument panel](https://on.cypress.io/api/routes) now displays the column: `Stubbed` instead of `Status`, which indicates whether a route is stubbing matching XHR's.

# 0.13.2

*Released 12/20/2015*

**Notes:**

- Docs have been updated for [`cy.wait()`](https://on.cypress.io/api/wait), [`cy.route()`](https://on.cypress.io/api/route), [`cy.server()`](https://on.cypress.io/api/server), and [deprecations](https://on.cypress.io/guides/deprecations) to reflect these changes.

**Features:**

- Added `responseTimeout` [configuration](https://on.cypress.io/guides/configuration) value.
- [`cy.wait()`](https://on.cypress.io/api/wait) has been upgraded to now use two separate `timeout` values. In previous versions [`cy.wait()`](https://on.cypress.io/api/wait) used the `commandTimeout` and would automatically time out if the XHR did not achieve a response in that time frame. Now [`cy.wait()`](https://on.cypress.io/api/wait) will go through two independent timeout phases. At first [`cy.wait()`](https://on.cypress.io/api/wait) will wait for an XHR to be requested which matches its route. It will wait up to the value configured with `requestTimeout` (default 5000ms). After it sees a matching request it will then go into `response` waiting mode. It will wait up to the value configured with `responseTimeout` (default 20000ms). When [`cy.wait()`](https://on.cypress.io/api/wait) fails you now receive a much better error message indicating exactly which phase failed. Whether a request was never sent out, or whether it timed out waiting for a response. This gives you the best of both worlds and prevents situations where Cypress was timing out on slow servers. By creating new configuration values: `requestTimeout` and `responseTimeout` you can now directly control this behavior without affecting other regular commands.

**Bugfixes:**

- Prevent removing trailing new lines on fixtures after formatting
- Added cache buster to test files which forces them to be reloaded in the `Sources` panel after making modifications. In previous versions when test files were live reloaded Chrome would not display their new contents due to a bug in Dev Tools. We've now worked around this issue.

**Misc:**

- Removed `{stub: false}` option from [`cy.server()`](https://on.cypress.io/api/server) and [`cy.route()`](https://on.cypress.io/api/route). Cypress will now log a deprecation warning when you use the this option. Removing this option helps simplify the API because now Cypress can figure out whether you really want to stub the route based on whether you've provided a response or not. If you have not provided a response, the default behavior will be to not stub. If you do provide a response, Cypress will stub the route.
- Repurposed `requestTimeout` to now mean the time we wait for an XHR to be requested. Changed [`cy.request()`](https://on.cypress.io/api/request) to now use `responseTimeout` configuration value.
- Updated many error messages to be more consistent.
- Added special error messages when elements can not have actions applied to them with a suggestion to use `{force: true}`.

# 0.13.1

*Released 12/11/2015*

**Notes:**

- We are aware of issues running in CI with Linux builds, and are working through those issues.

**Bugfixes:**

- Prevent headless / CI from throwing errors on `history.pushState` and `history.replaceState`.
- Prevent edge case where `aliasing` in the command log was aliasing the wrong command
- Prevent XHR's from throwing errors on `arraybuffer` content. Properly set `xhr.responseBody` for `XML`, `blob`, and `arraybuffer`.
- Headless running is now fixed in OSX. This was due to a bug with app signing + unzipping via the CLI.

# 0.13.0

*Released 12/9/2015*

**Summary:**

- Though it may not look like much, this upgrade was a long time in the making. There were limitations in the way we were currently handling headless / CI builds which restricted our ability to make updates or fix bugs. Additionally CI runs would randomly crash for no good reason. We decided to split out the headless / CI process into it's own independent Chromium application which is now independently controlled, and is much more reliable. This upgrade enables us to handle CI features coming down the pipe and was necessary for moving forward.

**Features:**

- Upgraded `Chromium` for headless and CI runs from `41` to `45`
- You will now see better stack traces and errors when running headlessly / in CI. No more `undefined is not a function` errors.
- Ported all links to use the new Cypress CDN
- [Documentation + updates for the CLI tool](https://github.com/cypress-io/cypress-cli)

**Bugfixes:**

- New chromium upgrade prevents synchronous XHR freezes
- New chromium upgrade fixes situation where extremely long CI runs would sometimes randomly crash
- Fixed problem with rewriting content on elements which contained `<svg>` elements

**Breaking Changes:**

- Temporarily ignoring the `--reporter` option for headless / CI runs. Currently it is locked to the `spec` reporter, which is the default. This will be fixed in the next few patch releases.
- ~~Accessing `window.history.go()`, `window.history.back()`, `window.history.forward()` will throw an error when running headlessly / CI. This is a regression that will be fixed - hopefully very soon.~~ This is fixed in [`0.13.3`](#0-13-3)
- While this new Chromium application passes our internal tests, it may crop up other regressions we aren't aware of. If you're experiencing different behavior in CI vs running locally in Chrome, this may be an indication of these.

# 0.12.8

*Released 12/2/2015*

**Features:**

- There is now a new [Errors Page](https://on.cypress.io/guides/errors) which will provide additional explanation when you are getting errors from Cypress. These errors will be directly linked to (like how Angular provides errors).
- Instead of hard coding external documentation, we now link everything through a redirection portal. This will prevent any links / documentation from ever breaking due to reorganization or renaming.
- Cypress now throws a specific error message (with a link to further explanation) if you attempt to run commands outside of a test. Usually this happens accidentally when you write `cy.commands` inside of a `describe` or `context` block instead of the `it`. I've wasted too much time and almost bombed entire presentations / demos so I've finally stopped this from ever happening again. If you ever see this error message, trust me, you will forever thank me.
- The error message: `Cannot call cy.method() because the current subject has been removed or detached from the DOM.` has been rewritten to provide much clearer information on why this is happening, including a string representation of your DOM element. Additionally it will have its own error page dedicated to explaining how this happens and what you can do to prevent it.

**Misc:**

- Rewrote error message which is displayed when Cypress cannot parse your test / spec file. Now a list of suggestions are given and an external link is provided which further explains how this may happen.
- Clarified the "Default Message" page when you have not [`cy.visit()`](https://on.cypress.io/api/visit) your application yet.
- Whitelisted `.coffee`, `.scss`, `.less` XHR's from displaying in the Command Log

# 0.12.7

*Released 11/30/2015*

**Bugfixes:**

- Prevent passing `{multiple: true}` incorrectly showing up in Command Log. Fixes [#88](https://github.com/cypress-io/cypress/issues/88).
- Properly whitelist resource like XHR's which have query params such as jquery's `{cache: false}` option.
- Correctly take into account `<base>` tag on XHR's. Fixes [#89](https://github.com/cypress-io/cypress/issues/89).

# 0.12.6

*Released 11/29/2015*

**Features:**

- There are now [Getting Started](https://on.cypress.io/guides/installing-and-running) docs including [configuration options](https://on.cypress.io/guides/configuration) for `cypress.json`
- Cypress now silently restarts the server whenever it detects a change to `cypress.json` - meaning you no longer have to manually reboot the server for changes to be picked up.
- There is a new [`Cypress.config`](https://on.cypress.io/api/config) interface - akin to [`Cypress.env`](https://on.cypress.io/api/env) which provides access to configuration values.

**Bugfixes:**

- Setup/Teardown code was not properly running on nested mocha `before`hooks which caused the error: `The XHR server is unavailable or missing...`. Fixes [#80](https://github.com/cypress-io/cypress/issues/80) and [#86](https://github.com/cypress-io/cypress/issues/86).
- Prevent accidental mutation of [`cy.server()`](https://on.cypress.io/api/server) options when [`cy.route()`](https://on.cypress.io/api/route) was provided options. Fixes [#85](https://github.com/cypress-io/cypress/issues/85) and [#84](https://github.com/cypress-io/cypress/issues/84).
- Using [`cy.title()`](https://on.cypress.io/api/title) would incorrectly search the `<body>` for title elements, and is now restricted to only searching in the `<head>`
- Cross-Origin requests are now proxied by Cypress. In other words their URL's are transparently rewritten which bypasses CORS problems. This is a quick fix which should satisfy most of the problems users were having with CORS requests. However there is a much bigger change coming in `0.14.0` where the entire proxy layer will be rewritten to accommodate CORS, `window.fetch` and `domain cookies` flawlessly. As it stands Cypress is prone to errors in complex setups.

**Misc:**

- Exposed `visitTimeout` and `requestTimeout` [configuration options](https://on.cypress.io/guides/configuration)
- Increased `visitTimeout` from `20s` to `30s`
- {% url `.click()` click %} will now throw if you are attempting to click more than 1 element. Pass `{multiple: true}` to enable this behavior again. Each element will be clicked serially and inserted into the Command Log.

# 0.12.5

*Released 11/22/2015*

**Features:**

- Errors reading / writing `cypress.json` on project add are now displayed inline

**Bugfixes:**

- Prevent app crashing when `cypress.json` could not be read or written to when adding a project

**Misc:**

- App crashes now send a full stack trace (instead of 10 line truncation)
- Better error handling + error messages when trying to read / write from `cypress.json`

# 0.12.4

*Released 11/19/2015*

**Features:**

- There is a new [`Cypress.Cookies`](https://on.cypress.io/api/cookies) interface which enables you to `get`, `set`, and even `preserve` cookies throughout your test. Useful to preserve cookie-based sessions between your tests. [Documentation is written here](https://on.cypress.io/api/cookies).

**Bugfixes:**

- Removed problematic `content-security-policy` headers
- Fixed situation where Cypress was not injected correctly when `<head>` tag had attributes
- Prevent [`fixtures`](https://on.cypress.io/guides/creating-fixtures) from being accidentally overwritten and having their content blanked out. There was a very subtle chance due to node's async file writing that as a file was being written with a formatted fixture, that another call to the same fixture would read in at that exact moment. If this happened the 2nd read would resolve with zero bytes, which would then end up rewriting the file back with zero bytes.

**Misc:**

- `alerts` are automatically accepted now and a message logs to the console
- Added retina favicon. Fixes [#83](https://github.com/cypress-io/cypress/issues/83).
- Removed nested `cypress` object in the `cypress.json`. Existing `cypress.json` files are transparently rewritten on the next server boot, so you can check in the modified `cypress.json` and all will be well. Fixes [#82](https://github.com/cypress-io/cypress/issues/82).
- Improved performance of formatting fixtures

# 0.12.3

*Released 11/04/2015*

**Bugfixes:**

- Prevent [`cy.pause()`](https://on.cypress.io/api/pause) from actually pausing when running headlessly
- Fix for [`cy.request()`](https://on.cypress.io/api/request) SSL issues when host certificates were self signed

# 0.12.2

*Released 11/01/2015*

**Features:**

- There is now a `cy.cmd` and `cy.command` method which enables you to invoke commands by their string name. This is most useful when using *namespaced* custom commands. So `Cypress.addParentCommand("dashboard.setSlider", ...)` can be accessed by `cy.cmd("dashboard.setSlider", arg1, arg2)`. (Docs have not been written yet).
- `Environment Variable` support has been added and can be accessed in your tests with [`Cypress.env`](https://on.cypress.io/api/env). The docs have been written [here](https://on.cypress.io/guides/environment-variables) and [here](https://on.cypress.io/api/env).

**Misc:**

- The `URL` property on all XHR's is now completely decoded, even on URL's which were originally encoded. The reason is for easier assertions and debugging. This `URL` property is specific to Cypress and does not actually affect the underlying XHR.

# 0.12.1

*Released 10/28/2015*

**Bugfixes:**

- [`cy.route()`](https://on.cypress.io/api/route) will no longer throw that a response is needed when using [`cy.server({stub: false})`](https://on.cypress.io/api/server)
- Applying server defaults to `Cypress.Server.defaults({})` now [works as documented](https://on.cypress.io/api/api-server)
- `onRequest` and `onResponse` can now be correctly set as permanent server defaults
- XHR `URL` is now decoded to make assertions easier. Fixes [#75](https://github.com/cypress-io/cypress/issues/75).

# 0.12.0

*Released 10/23/2015*

**Summary:**

- XHR handling has been rewritten to be much more flexible, extensible, and future-proof.

**Breaking Changes:**

- The object you receive after waiting on an XHR alias is now different. Previously this was a `FakeXMLHttpRequest` object which came from `sinon`. Now it is a special `XMLHttpRequest` object which comes from Cypress. You may need to rewrite some of your assertions but we've tried to keep the signatures as close as possible.
- The XHR's `url` property will now always return you a `Fully Qualified Domain Name` including the origin, port, host, etc. Previously the `url` property represented whatever the `XHR` was opened with. We've worked around this difference by when checking whether an XHR should be stubbed, the origin is tested both as present and omitted.

Deprecations:
- Accessing `requestJSON` or `responseJSON` on XHR objects is deprecated, and will be removed in the next version. Accessing those properties will throw a warning which explains how to rewrite these.
- `cy.respond` is *temporarily* deprecated because the semantics of how this works is completely different and will require more work (mentioned later on) before this can be re-enabled again.

**Features:**

- All XHR's (regardless of whether they are stubbed or not) are now logged in the Command Log. Stubbed XHR's display as "XHR Stub" vs vanilla "XHR".
- Stubbed XHR's will now show up in the `Network Tab` in Dev Tools. In other words they will *really* go out and you'll be able to inspect them just like regular XHRs.
- Regular XHR's can now be aliased and waited on without actually being stubbed by passing `{stub: false}` to the [`cy.route()`](https://on.cypress.io/api/route).
- XHR's will continue to work correctly even *after* a test ends. In previous versions, due to replacing the entire XHR object, your application would not work correctly after a test ended. This prevented you from "navigating around" and working with your app after the tests end.
- Servers can now be disabled in the middle of a test. Previously once a server was started all XHR's would be stubbed.
- You can now disable the force sending of `404` to all XHR's which are not stubbed. This allows you to mix and match, enabling some requests to be stubbed and others to hit your server and respond normally.
- The default XHR configuration can now be overwritten in a single area.
- Many new configuration options are available for controlling how XHR's are stubbed.
- XHR's now include an `Initiator` stack regardless of whether they're stubbed. The `Initiator` stack includes the stack which caused the XHR to be created and sent.
- The `onConsole` information related to an XHR has been updated to make it easier to understand why a route was or was not stubbed, and it's associated request and response headers.
- Response headers on XHR stubs will now automatically set their `Content-Type` based on the stub response. Previously this would always set to the `Content-Type` to `application/json`. Now if you force a response to be text or html, the `Content-Type` response header will be set appropriately.
- You can now force other additional response headers to be sent on stubbed XHRs.
- XHR's now snapshot twice - when the request is made and when the response is returned.
- Removed sending `sinon` on every [`cy.visit()`](https://on.cypress.io/api/visit).
- The XHR object which is returned to you to via [`cy.wait("@xhrAlias")`](https://on.cypress.io/api/wait) is now more consistent with other return values such as [`cy.request()`](https://on.cypress.io/api/request). It should be much easier to work with `request body`, `request headers`, `response body` and `response headers`.

**Bugfixes:**

- Routes no longer display as duplicated in between test runs when [`cy.server()`](https://on.cypress.io/api/server) is started prior to a [`cy.visit()`](https://on.cypress.io/api/visit) and you cause a full page refresh, which caused all routes to be re-bound.
- Any issues related to `requestJSON` or `responseJSON` being duplicated are now fixed. Fixes [#65](https://github.com/cypress-io/cypress/issues/65).
- Fully Qualified XHR's which should be proxied are now correctly transparently rewritten to prevent CORS problems.
- [`cy.route()`](https://on.cypress.io/api/route) - `onRequest` and `onResponse` callbacks are now called with `cy` as the context.
- Whitelisting assets which should never be stubbed has been improved. Now `.jsx` templates pass-through correctly.
- CORS Network Errors are now correctly caught.

**Misc:**

- All `ng` based commands now display in the Command Log.
- The built in XHR response delay has been removed since now all requests really go over the HTTP stack, which inherently has its own delay. You can still optionally force responses to be delayed by a set amount.

Almost there:
- Support for the native `fetch` object.
- Configuration to automatically force Cypress to wait for outstanding XHR's (like it does for other Page Events). This would mean when testing more traditional apps without XHR stubbing, commands would automatically wait until all outstanding XHR's complete. The internal retry loop needs to be rewritten to make this possible, but the XHR architecture is now there.

# 0.11.13

*Released 10/08/2015*

**Bugfixes:**

- Prevent rejected promise from causing error about invalid API key during a CI run

**Misc:**

- Better error handling of rejected promises

# 0.11.12

*Released 10/07/2015*

**Features:**

- Snapshots can now be named and a command can have multiple snapshots
- Multiple snapshots are now cycled automatically on hover, and the name of the snapshot is displayed.
- Most of the action commands now take multiple snapshots (giving you a precise look at an action prior to it happening, and then afterwards)

**Bugfixes:**

- Fixed situation where an `Uncaught Error` was not being properly handled. Cypress would incorrectly continue to retry commands instead of anceling them, which lead to incorrect errors downstream in other tests.
- Fixed situation where an error being thrown from an XHR was being improperly handled (in a slightly different way than the problem above)
- Stopped sending CI data when `cypress run` was issued.

**Misc:**

- CSS Improvements

# 0.11.11

*Released 10/04/2015*

**Bugfixes:**

- Snapshots of [`.type()`](https://on.cypress.io/api/type) and [`.select()`](https://on.cypress.io/api/select) are no longer incorrect due to aking snapshot too early. Fixes [#22](https://github.com/cypress-io/cypress/issues/22).
- Passing `{force: true}` to {% url `.blur()` blur %} now logs correctly in the Command Log

**Misc:**

- Added delays on some tooltips
- The URL will now highlight in a yellow background during a revert DOM snapshot
- Moved snapshot message to be affixed to the bottom of the remote app in preparation for cycling through multiple snapshots
- Cleaned up the URL by removing some unused content

# 0.11.10

*Released 10/04/2015*

**Features:**

- {% url `.blur()` blur %} now accepts `{force: true}` which removes error checking such as validating the element is urrently in focus

**Bugfixes:**

- [`cy.pause()`](https://on.cypress.io/api/pause) is now noop when Cypress is running headlessly in `cypress run` or `cypress ci`

**Misc:**

- Removed `cy.inspect` command
- Added Cypress logo to nav
- CSS changes

# 0.11.9

*Released 10/03/2015*

**Features:**

- Added `.zip` as acceptable fixture extension. Content is sent back as `base64`.
- Added docs to nav, consolidated `organize` into `tests`
- Added favicon
- Added tooltips everywhere
- Created new debugging command: [`cy.pause()`](https://on.cypress.io/api/pause) which will pause executing commands and allow you to resume or tep into the next command one at a time.
- You can now stop and restart tests from the UI.
- Added `cy.Blob` utilities for `blob` / `string` / `base64` conversion. Useful for manually handling uploads.

**Bugfixes:**

- "Cannot revert DOM while tests are running" now removes itself correctly
- Aliased DOM objects are now correctly stored on the test's `ctx` as instances of **your** jQuery (if one exists).

**Misc:**

- Updated UI styles / tests list / run all
- Fixed alt tray icon so it shows up correctly on click

# 0.11.8

*Released 09/25/2015*

**Features:**

- Added [`cy.request()`](https://on.cypress.io/api/request) command which can issue XHR requests. The request is generated outside of the rowser, and bypasses all CORS restrictions. Great for talking to an API for seeding, querying, building, etc.

**Bugfixes:**

- Prevented edge case with [`cy.fixture()`](https://on.cypress.io/api/fixture) where it would not be able to be cancelled without throwing an nhandled rejection error.

# 0.11.7

*Released 09/25/2015*

**Bugfixes:**

- The debug window now works again.
- Changed `Linux` build strategy which fixes not saving the internal `.cy cache`. Also fixes not being able to update from the GUI. Fixes #66](https://github.com/cypress-io/cypress/issues/66).

# 0.11.6

*Released 09/25/2015*

**Bugfixes:**

- Viewport is now properly restored to the default width / height after on subsequent runs. Previously it would retain the last viewport sized sed until there was a new viewport command.
- [`cy.should('contain', '...')`](https://on.cypress.io/api/should) now correctly escapes quotes and single quotes.
- Assertion messages are no longer truncated, and instead will scale down by reducing the `font-size` and `line-height` after they exceed 110` characters. So you'll now always see the full assertion message.
- Fixed some scenarios where assertions would not be logged as a child command.
- Assertions based around the `window` or `document` object no longer cause `chai` to bomb on formatting their object structures (due to yclic references) and instead now will show up as `<window>` and `<document>`

**Misc:**

- [`cy.window()`](https://on.cypress.io/api/window) now logs out to the `Command Log` and additionally verifies upcoming assertions.
- [`cy.document()`](https://on.cypress.io/api/document) now logs out to the `Command Log` and additionally verifies upcoming assertions.
- Removed `numElements` label on assertions which indicated the number of elements found if > 1. This was annoying and redundant since the inked command already had this number.

# 0.11.5

*Released 09/20/2015*

**Features:**

- The `Linux` version of Cypress now works correctly for GUI Desktop versions (tested on Ubuntu Desktop). Previously it would only work eadlessly in server versions. The `tray` used in OSX does not work with the `Linux`, so in `Linux` we just use a standard window + menu.
- Added Desktop Icon

**Bugfixes:**

- Cypress now forces the initial [`cy.visit()`](https://on.cypress.io/api/visit) not to be cached by the browser. This was incorrectly being ached which meant when you changed the [`cy.visit()`](https://on.cypress.io/api/visit) it would not actually go out and fetch the new contents. reviously you had to check `Disable Cache` in the `Network Tab` inside of Chrome to prevent this bug. Unfortunately this has a significant erformance drawback. If you use a [`cy.visit()`](https://on.cypress.io/api/visit) before each test you will notice a degrade in performance ecause this request is no longer cached. This is a temporary problem until Cypress implements a more sophisticated caching strategy which ptimizes these concerns. There is a lot to improve in this arena but it will take more time before it's implemented.
- [`.should()`](https://on.cypress.io/api/should) will no longer throw an error when it is used as a `parent command` and has a callback unction signature, and that callback function throws outside of an assertion. Instead now it logs correctly, handles the error, and displays his error for you.

**Misc:**

- Many additional tests added to the multi-os deployment process.
- When Cypress opens other windows they are now auto-focused.

# 0.11.4

*Released 09/17/2015*

**Features:**

- [`.should()`](https://on.cypress.io/api/should) now accepts a callback function which will be retried until it does not throw. The callback unction will be retried in the exact same way as passing regular string-based chainers to [`.should()`](https://on.cypress.io/api/should). aving a callback function gives you an opportunity to *massage* the expected subject such as comparing multiple elements, creating an array of ext or classes, etc.

Deprecations:
- `cy.wait(function)` has been deprecated and you can safely rename this command to `should`.

**Misc:**

- All of the docs surrounding [Assertions](https://on.cypress.io/guides/making-assertions), [`.should()`](https://on.cypress.io/api/should), and cy.and](https://on.cypress.io/api/and) have been updated to reflect the new API.

# 0.11.3

*Released 09/16/2015*

**Features:**

- When XHR's are aborted Cypress will display the stack trace indicating where in your app the XHR was aborted. Additionally it will display s `(aborted)` in the command log.

**Bugfixes:**

- XHR's will no longer be ended early and display no status as if there was no response. Fixes [#63](https://github.com/cypress-io/cypress/issues/63).
- XHR's which are aborted no longer cause an `INVALID_STATE_ERR` to be thrown. Fixes [#62](https://github.com/cypress-io/cypress/issues/62) and [#34](https://github.com/cypress-io/cypress/issues/34).
- Cypress will no longer incorrectly revert to a previous test run's snapshot when tests are re-run.

# 0.11.2

*Released 09/14/2015*

**Bugfixes:**

- Prevented bug where the assertion message: `expected <x> element to exist` would log over and over again when Cypress retried querying for a OM element

**Misc:**

- [`.root()`](https://on.cypress.io/api/root) now outputs its subject when clicking on its command log. Fixes [#55](https://github.com/cypress-io/cypress/issues/55).

# 0.11.1

*Released 09/14/2015*

**Bugfixes:**

- Utilizing [`cy.server()`](https://on.cypress.io/api/server) across multiple tests before a [`cy.visit()`](https://on.cypress.io/api/visit) now orks correctly. As a side effect now Cypress will rebind both the `server` and all `routes` **whenever** the remote window is reloaded (for hatever reason) - even during a test itself. This means you can navigate between pages without ever having to restart the server or routes (hey will automatically rebind) when the window loads. Fixes [#59](https://github.com/cypress-io/cypress/issues/59).

**Misc:**

- Providing a "number-string" as in: `should("have.length", "1")` will no longer throw an error
- Internal API changes for `$Commands`.

# 0.11.0

*Released 09/13/2015*

**Summary:**

- This release marks a major change in the underlying algorithms used to prevent testing flake. It is a major goal of Cypress to combat and revent **all** test flake. These algorithm changes go a long way towards making this a reality, and have been months in the making.
- Cypress can now predict upcoming assertions and modifies its behavior until the intended state has been reached.
- Command options `exist` / `visible` / `length` have been deprecated, these were confusing and limiting, and the same result can now be chieved using normal assertions. The end result is much more robust and much easier to understand.

**Features:**

- Commands which precede assertions will now look downstream at those assertions and not resolve until their subject's state passes all ssertions. Previously this was **sort of** implemented using *Command Options* and the `eventually` flag, but now this is the default ehavior. *Command Options* only worked on DOM-based subjects, and now the new assertion verification works on everything else (including RL-based commands, etc). What this means is that Cypress can predict what you are requesting and automatically modifies its behavior until his state is reached. This prevents test brittleness / random test flake. Additionally this removes ever having to use [`cy.wait(Number)`](ttps://on.cypress.io/api/wait) or `cy.wait(Function)` (though this is still a valid command). As a side effect, you will now see commands + heir assertions in the spinning pending blue state. When assertions fail their associated command also fails at the same time. This visually epresents the coupling between these two concepts. Another side effect is that `timeout` options do not need to be provided on the succeeding ssertions, and can instead just be provided on the proceeding command. All of the coupled assertions will automatically be retried to the aximum `timeout` setting. Fixes [#43](https://github.com/cypress-io/cypress/issues/43).
- Action commands will now insert an artificial delay after resolving to enable modern JavaScript frameworks time to *flush* their run loops. napshots are delayed until after the action, resulting in more accurate snapshots because JavaScript frameworks would not process these DOM vents until `N` milliseconds after they occurred. This has the unfortunate side effect of *decreasing* performance by about *5-10%* but the nd result is that it is much easier to debug and Cypress is less prone to flake caused by modern JavaScript frameworks. This change comes fter collecting many data points and this was one of the easiest changes that help reduce flake. For users that don't use the latest and reatest JavaScript frameworks, this action delay can be reduced through `cypress.json` which may speed up large test suites.
- Aliasing custom commands now intelligently figures out where to apply the alias without being specified inside of the actual custom command.
- The algorithm for replaying aliased commands is now much more accurate, handles stale element references better, and will not replay ommands which have a side effect (like action commands). The end result is Cypress will now almost always find the desired element by etermining the minimum number of re-queries and is not susceptible to stale element references. Additionally using assertions on aliased lements now works (where previously using a *Command Option* on an alias would just be ignored. This was crazy difficult to implement but hould be 100% solid. Fixes [#36](https://github.com/cypress-io/cypress/issues/36).
- Assertions which actually produced 2 assertions (under the hood) such as `should("have.attr", "href", "/users/1")` will now only log the 2nd ssertion, unless the first fails.
- Previously using `eventually.have.length` was impossible (and this would throw an error), but now this works as you'd expect with the efault `should("have.length")`.

**Bugfixes:**

- Aliased commands now correctly output a command log again when they are replayed.
- Assertions that involved an `{exp}` property are no longer incorrectly substituted with the `#{this}` subject.
- Removed special logic for *Angular* which tapped into its digest cycle for queueing commands. This had unpredictable results when there was n `interval` set, and is now superseded by the new queueing system anyway (which is more performant).
- `Sinon's` formatting of failed `spy` or `stub` calls is horrendously non-performant and would sometimes choke the CPU for several seconds. his formatting has been completely removed and will be replaced by something less insane later on. At the moment you can still use the built n Cypress debugging (clicking on a command log, etc) to see what the actual values were. Fixes [#18](https://github.com/cypress-io/cypress/issues/18).

**Misc:**

- The internal retry loop of Cypress now runs at `60fps`, instead of `20fps`.
- Cypress overrides chai's default inspection function for DOM elements meaning instead of seeing `{ Object (0, length, ...) }` you will now ee the nicely formatted Cypress DOM element like: `<button#primary.btn-large>`.
- Cypress now overrides chai's `match` chainer and provides a specific error message when a non `regex` value is provided. Fixes [#58](../ssues/58).
- Cypress now handles `length` and `exist` assertion chainers in a very specific way, providing a detailed message on failure, and utomatically slices out any stale element references.
- The `contain` assertion chainer from `chai-jquery` has been extended to match the same selector logic as [`cy.contains()`](https://n.cypress.io/api/contains) - meaning it now checks the `value` of `input[type=submit]`.
- Tweaked the label for displaying the number of elements a command resolved with (now displays 0 differently than > 1).
- Removed the `eventually` flag in assertions as now this is the default behavior on normal assertions.
- Deprecated all *Command Options*. You will see a very nice and simple error message explaining how to convert these to assertions.
- [`.within()`](https://on.cypress.io/api/within) can now be silenced with `{log: false}`.
- Many error messages have been rewritten to be much more fluent and easier to understand.

**Other News:**

- Cypress is currently seeking to raise a Series A. This will enable us to grow the team and speed up development but seeking it has come at a ost for current development speed. If you have any VC connections [please send them our way](mailto:support@cypress.io)
).

# 0.10.8

*Released 08/21/2015*

**Features:**

- Reporters in CI can now be specified
- Added `teamcity` reporter

# 0.10.7

*Released 08/16/2015*

**Features:**

- Port can now be specified as a CLI argument and will override any values stored in `cypress.json`

**Misc:**

- When running through the CLI, Cypress will now display an error if the server's port is currently in use. Previously this would not output an rror and the process would just hang.

# 0.10.6

*Released 08/15/2015*

**Bugfixes:**

- Fixed edge case where Cypress would not correctly handle `POST` or `PUT` requests with a `JSON body`. These requests would just hang and ventually time out.

**Misc:**

- Project ID's can be programmatically set now.

# 0.10.5

*Released 08/13/2015*

**Bugfixes:**

- Running a specific test won't open/close immediately when starting up (fixes weird flickering effect)
- {% url `.check()` check %} and [`.uncheck()`](https://on.cypress.io/api/uncheck) commands will now correctly "end" even if hey were `noop` due to the element already being in a checked or unchecked state.

**Misc:**

- Currently running tests now display a spinner to indicate they are currently running
- Optimized performance of command lists
- Commands which were silenced with `{log: false}` will now always display in the Command Log if they were part of a replayed chain of commands ue to an alias reference becoming stale. Previously they would not display which was very confusing.
- `sinon.js` is no longer minified

# 0.10.4

*Released 08/11/2015*

**Bugfixes:**

- The OSX Cypress App was not being properly signed (since 0.10.0) due to an oversight in our deployment process. This has been fixed now and dditional checks have been added to ensure the deploy'd version is properly signed. Updating within the app was unaffected. This bug only ffected fresh downloads from the internet.
- Errors / crashes encountered when updating to newer versions through the app should be fixed now.

# 0.10.3

*Released 08/10/2015*

**Bugfixes:**

- Cypress Errors in `hooks` (beforeEach, etc) will no longer cause Mocha to fire its `end` event thus ending the entire run. In CI, this would ause the test suite to end early. Uncaught Mocha errors will however continue this behavior. Cypress does not yet have a "skipped" visual state or tests which were skipped, so at the moment it may look a little strange and unpredictable.

**Misc:**

- Tweaked clicking algorithm to re-verify an elements visibility anytime the click retries its `retry` logic. Previously this check only appened once at the beginning of the click.
- In CI, the window size (not the viewport) has been changed from `1024x768` to `1280x720`. This will only affect `screenshot` artifacts which re taken automatically with [`cy.screenshot()`](https://on.cypress.io/api/screenshot) (coming soon) or whenever a test fails (also coming soon).

# 0.10.2

*Released 08/10/2015*

**Bugfixes:**

- Memory Optimizations in CI
- Reduce noise in logs
- Prevented external NODE_ENV mutations causing problems in CI

**Misc:**

- Better error tracing

# 0.10.1

*Released 08/07/2015*

**Bugfixes:**

- Fixed missing dependency for CI

**Misc:**

- Cypress now logs out your project's API key on a failed CI run

# 0.10.0

*Released 08/06/2015*

**Summary:**

- Cypress is now able to run all the tests, run headlessly, and includes support for Linux and CI. Additionally, most of the functionality of he GUI Desktop App can now be accessed through command line arguments.
- Because each operating system requires a specific build of Cypress - a new CLI tool has been created which abstracts away these differences nd orchestrates the Desktop App regardless of which OS you are running.
- This [CLI tool is now published on NPM](https://www.npmjs.com/package/cypress), though the documentation still needs to be written.
- There is now a download service to access the latest version of Cypress and previous versions.
- Cypress aims not only to make it easier to write tests, but after you build a test harness, it will make it easier to dive into failed tests (hat run in CI). This release paves the way for providing after-run results and allowing you to dive into those failures.

**Breaking Changes:**

- Due to security upgrades, adding projects in previous versions will no longer work. Upgrade and everything should be okay.

**Features:**

- The latest version of Cypress can be downloaded here: [http://download.cypress.io/latest](http://download.cypress.io/latest)
- Cypress can alternatively be downloaded / installed / managed through the CLI utility.
- Cypress can now be run headlessly through the terminal.
- You can now run all of your tests inside of the GUI App.
- You can use the CLI tool to run Cypress in CI. The documentation for this needs to be written, but it will be very simple to do. You will robably only have to write 2 lines in your CI scripts to run Cypress.
- You can configure CI to use any reporter built into Mocha, and additionally we are adding JUnit XML output (for Jenkins) as a built in efault.
- You can write your own custom reporter which Cypress can use in CI.
- Console output from your apps is suppressed while running headlessly.

**Bugfixes:**

- Several security problems with projects have been closed in preparation for running in CI.
- Extensive memory profiling has been done and Cypress has implemented several strategies for aggressively causing garbage collection. The ebugging tools (which allow you to walk back in time through DOM snapshots, or access objects from previous tests) could exhaust all available emory in previous versions. This likely never affected most users, but if a user ran 1000's of tests (which have been written in Cypress) it ould bomb. Now Cypress only stores data for up to 50 tests, and will begin purging data past that. When run headlessly, Cypress doesn't apply ny of its debugging tools, so CI will be unaffected.
- Several instances of memory leaks were plugged up.

**Misc:**

- Everything except for the `cypress driver` is now minified.
- Some users have reported problems upgrading previous versions. This is because we changed the name from "cypress" to "Cypress" including some inaries. If your upgrade does not finish you can simply redownload the latest version of Cypress or use the CLI tool to reinstall it.
- Our build and testing processes have been upgraded to accommodate Linux builds.
- Sinon object formatting during errors has been suppressed (when using spies/stubs) due to its horrendous performance when comparing deeply nested objects. This means you won't see the (mostly) useless error output from Sinon, but given Cypress debugging tools you can still inspect objects and figure out what went wrong.

# 0.9.6

*Released 07/27/2015*

**Bugfixes:**

- Fixed server crash on improperly handled proxy error
- Upgraded logic to redirect back to the Cypress client app on manual URL changes

# 0.9.5

*Released 07/14/2015*

**Features:**

- {% url `.click()` click %}, [`.type()`](https://on.cypress.io/api/type), {% url `.clear()` clear %}, `.select()`](https://on.cypress.io/api/select), {% url `.check()` check %}, [`.uncheck()`](https://on.cypress.io/api/ncheck) now will wait for the subject to automatically become visible instead of throwing immediately if the element is not in a visible state.

**Misc:**

- Swapped out ugly nonsense `refresh` icon to `square-o` to represent a test which has not run yet.

# 0.9.4

*Released 07/06/2015*

**Features:**

- {% url `cy.contains()` contains %}, [`cy.get()`](https://on.cypress.io/api/get), and `traversal commands` will now all log out heir last known `$el` on failure. This means the `$el` will be highlight during Command Log hovering, and will display in the console on click. his should make debugging failed DOM based commands much easier. Fixes [#52](https://github.com/cypress-io/cypress/issues/52).

**Bugfixes:**

- Fixed edge case with {% url `cy.contains()` contains %} and command options `visible` and `exist` where it would always fail ven though the matched element was in the correct state.

**Misc:**

- {% url `cy.contains()` contains %} now throws when provided the command option: `length` because it will only ever return 1` element.

# 0.9.3

*Released 07/06/2015*

**Features:**

- Proxied jQuery: `$` onto `cy` as `cy.$` and specific class methods: `Event`, `Deferred`, `ajax`, `get`, `getJSON`, `getScript`, `post`
- Proxied `moment` onto `cy` as `cy.moment`
- The `url` will now automatically be restored when hovering over the Command Log to indicate the state of the URL at the time the command ran.
- {% url `.click()` click %} now accepts an optional: `position` argument (`center`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`). Center is still the default.
- {% url `.click()` click %} now accepts an optional `x` and `y` coordinate argument, which is relative to the top left corner of the element. Fixes [#50](https://github.com/cypress-io/cypress/issues/50).
- [Click docs have been updated](https://on.cypress.io/api/click) to reflect these changes.

**Bugfixes:**

- `onBeforeLoad` and `onLoad` callbacks to [`cy.visit()`](https://on.cypress.io/api/visit) are now invoked with `cy` as the context
- Cypress logo now displays in `About Page`

**Misc:**

- Internal refactoring to `Cypress.Mouse`

# 0.9.2

*Released 07/04/2015*

**Features:**

- Added `About` page in desktop application annotating the current version.
- [`cy.fixture()`](https://on.cypress.io/api/fixture) now supports these additional extensions: `.html`, `.txt`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.tif`, `.tiff`.
- Image fixtures will be sent back as a `base64` string.
- Html fixtures will be prettified and saved back over the original.

**Misc:**

- Added more tests around various areas of the desktop application and ID generator.

# 0.9.1

*Released 07/03/2015*

**Features:**

- [`cy.viewport()`](https://on.cypress.io/api/viewport) can now accept an `orientation` when providing a `preset`. Valid orientations are `landscape` and `portrait`

**Bugfixes:**

- The scaffolded `spec_helper.js` now correctly returns its object literal in the `onConsole` callback.
- [`.type()`](https://on.cypress.io/api/type) now correctly logs its message to the Command Log when provided options.
- [`.type()`](https://on.cypress.io/api/type) has been upgraded to handle situations where as it's typing, 3rd party code mutates the value either synchronously or asynchronously. The caret is automatically moved to the end position matching browser behavior.

**Misc:**

- Deprecated `Cypress.command`, instead use `Cypress.Log.command` to output a Command Log. Updated scaffolding on new projects to reflect this change.
- {% url `cy.contains()` contains %} now outputs much more explicit error messages when given command options. Fixes [#49](../ssues/49).
- [`cy.route()`](https://on.cypress.io/api/route) no longer validates `response` value when `{respond: false}` is passed in as options. Fixes [#48](https://github.com/cypress-io/cypress/issues/48).
- [`.invoke()`](https://on.cypress.io/api/invoke) and [`.its()`](https://on.cypress.io/api/its) will now log out the $el if it's a DOM object, which will now correctly highlight the $el during a command revert. Additionally if these commands have been called on a DOM object, their `onConsole` message will include the DOM objects.

# 0.9.0

*Released 07/02/2015*

**Summary:**

- [`cy.viewport()`](https://on.cypress.io/api/viewport) is a new command which will resize the viewport to a specified width and height. There is ow a default `viewport` size of `1000x660`. See [viewport docs](https://on.cypress.io/api/viewport).

**Features:**

- Your application's viewport dimensions will now automatically scale to fit regardless of your screen's size. This enables you to test resolutions larger than what your screen is capable of displaying. Additionally this fixes edge cases caused when there was a difference in viewports between users.
- The viewport's dimensions will now dynamically display accurately as they are changed in the header area.
- The viewport's scale will now dynamically display accurately as it is changed.
- Each command will automatically restore the viewport to the dimensions at the time the command was issued. In other words, scrolling over each command will restore exactly what Cypress "saw" when it issued the command.
- Several common viewport presets have been added for convenience

**Misc:**

- Cypress now requires a viewport to be issued at all times. By default it is `1000x660` but can be changed in your `cypress.json` file with he keys: `viewportWidth` and `viewportHeight`.

**Bugfixes:**

- Scrollbar styling is no longer hijacked by Cypress

**Misc:**

- Updated remote application iframe styles

# 0.8.1

*Released 06/30/2015*

**Bugfixes:**

- [`.select()`](https://on.cypress.io/api/select) will now fire a `focus` event on the `<select>` even if the window isn't in focus
- {% url `.click()` click %} has been upgraded to be more intelligent about firing `focus` events, and now takes into account the previously focused element
- [`.type()`](https://on.cypress.io/api/type) and {% url `.clear()` clear %} will not issue `change` events or `focus` events unnecessary when chaining together multiple actions which do not change the element or cause it to lose focus. Fixes [#47](https://github.com/cypress-io/cypress/issues/47).

# 0.8.0

*Released 06/26/2015*

**Summary:**

- [`.type()`](https://on.cypress.io/api/type) now implements all DOM events to simulate every aspect of typing on a real keyboard
- All of the [type docs have been updated](type) to reflect these changes

**Features:**

- [`.type()`](https://on.cypress.io/api/type) now outputs "Key Events Table" which is a `console.table` of every key typed, the `charCode`, all vents that fired, and whether any were `preventedDefault`
- [`.type()`](https://on.cypress.io/api/type) now accepts the following special character sequences: `{selectall}`, `{del}`, `{backspace}`, `{esc}`, `{% raw %}{{{% endraw %}}`, `{enter}`, `{leftarrow}`, `{rightarrow}`
- [`.type()`](https://on.cypress.io/api/type) implements `cursor` and `selection` and `range` accurately like a real keyboard
- [`.type()`](https://on.cypress.io/api/type) now fires change events exactly like real browsers when `{enter}` is used
- [`.type()`](https://on.cypress.io/api/type) will fire `textInput` and `input` events exactly like a real browser. Fixes [#7](https://github.com/cypress-io/cypress/issues/7).
- [`.type()`](https://on.cypress.io/api/type) now follows all of the spec in regards to `preventingDefault` on any event that would insert a character such as `keydown`, `keypress`, `textInput`
- [`.type()`](https://on.cypress.io/api/type) events should be `100%` identical to real browser `KeyboardEvents` including `charCode`, `which`, `keyCode`, `data`, etc
- [`.type()`](https://on.cypress.io/api/type) now inserts a small delay `10ms` between each keystroke to simulate a real user typing
- `input` events are now correctly fired when [`.select()`](https://on.cypress.io/api/select) chooses an `<option>`
- `change` events are now fired exactly how a browser does (when an input loses focus and its value has changed since its last focus event). You'll see these fire after you use {% url `.blur()` blur %} directly, or use another `action command` on another element.

**Bugfixes:**

- Using [`.type()`](https://on.cypress.io/api/type) in an `input[type=number]` will no longer prepend the value. Fixes [#26](https://github.com/cypress-io/cypress/issues/26).
- `[contenteditable]` elements can now be focused and blurred
- `aborting` during {% url `.click()` click %} / [`.dblclick()`](https://on.cypress.io/api/dblclick) now correctly cancels remaining queued click/dblclick events

**Misc:**

- `console.groups` are now collapsed by default
- [`.type()`](https://on.cypress.io/api/type) now validates the chars and will throw on anything other than a string or finite number
- [`.type()`](https://on.cypress.io/api/type) now throws on empty strings
- Removed several libs that used to handle typing simulation and rewrote typing from scratch

# 0.7.6

*Released 06/23/2015*

**Bugfixes:**

- Prevent infinite loop due to a trifecta of rare circumstances with {% url `.click()` click %}. Clicking will now retry sync after it attempts to scroll past the element covering up the desired clickable element. Fixes [#46](https://github.com/cypress-io/cypress/issues/46).

# 0.7.5

*Released 06/19/2015*

**Bugfixes:**

- {% url `.click()` click %} now takes into account being covered by a fixed positioned element and will increase the window's scroll offset to account for this. There are still more improvements to be made before this is bulletproof though.
- {% url `cy.contains()` contains %} could potentially resolve to a null subject if the matching content was split across multiple nested children elements. This has been fixed and contains will now return the first, deepest element which contains text potentially spread over multiple text nodes and/or children elements.

# 0.7.4

*Released 06/18/2015*

**Misc:**

- Attempting to {% url `.click()` click %} a select element will now throw an error. The error guides you to using the `.select()`](https://on.cypress.io/api/select) command, as that is the command you should use to change a `<select>` value.
- [`cy.route()`](https://on.cypress.io/api/route) responses are now validated. If responses are `null` or `undefined` Cypress will throw a very specific error message.
- Cypress will now display `cypress.json` parse errors when attempting to boot a project when there is a syntax error in `cypress.json`.

# 0.7.3

*Released 06/17/2015*

**Features:**

- [`.select()`](https://on.cypress.io/api/select) will now output a command log
- [`.select()`](https://on.cypress.io/api/select) will now have `click` / `focus` events fired on itself and the selected options (as per the pec)
- [`.select()`](https://on.cypress.io/api/select) is now inline with the other `Action` commands and will retry until the element naturally becomes selectable.

**Bugfixes:**

- `Action` command options are now properly formatted, instead of saying `Object{4}` they will display the overridden default options - ie: `force`, `timeout`, `interval`.
- Sending `{force: true}` to `Action` commands will no longer error out if the element is not visible. Forcing the action to take place now correctly removes all error checking prior to issuing the action and events.

**Misc:**

- Removed stack traces on `AssertionErrors` in the console since those come from `chai` and are basically useless.

# 0.7.2

*Released 06/17/2015*

**Bugfixes:**

- Removed factoring in the total time a test has been running when determining when its command timeout. This fixes a bug where commands down he chain would timeout earlier than their specified `{timeout: num}` option.

# 0.7.1

*Released 06/16/2015*

**Bugfixes:**

- DOM commands which can retry now correctly support `{timeout: num}` options which will raise the timeout beyond the standard `commandTimeout` rom `cypress.json`
- `<script>`, `<img>`, `<video>` commands or any other element which supports `crossorigin` attribute now are proxied correctly. The `crossorigin` attribute removes sending cookies with the HTTP request and now there is a fallback to figure out the `remoteHost` even in this situation.

**Misc:**

- Support for redirects with status code `303`

# 0.7.0

*Released 06/15/2015*

**Features:**

- Cypress now has first class support for `fixtures` (official docs coming soon)
- Introduced new [`cy.fixture()`](https://on.cypress.io/api/fixture) command
- Fixtures support `json`, `js`, and `coffee` files with image support coming soon
- Fixtures are automatically validated, with error messages propagating up to the client
- Fixtures are automatically formatted / indented for easy debugging
- Example fixture is automatically created with every project
- Example support files are now automatically created with every project
- [`cy.route()`](https://on.cypress.io/api/route) now accepts an **alias** as its response
- [`cy.route()`](https://on.cypress.io/api/route) additionally accepts a special `fixture:` or `fx:` keyword which automatically loads the fixture as the response

**Bugfixes:**

- Clicking giant yellow CypressError now displays associated XHR error in the console

**Misc:**

- RegExp arguments are now properly formatted in the command log
- Update `bluebird` to `2.9.27`
- Update `glob` to `5.0.10`

# 0.6.14

*Released 06/11/2015*

**Features:**

- Command logging has been upgraded to support "page events", which are different than commands. Now events which happen (XHR/page load/url change/spies/stubs/mocks) log out visually differently and do not use a command number. This should be easier to parse what was a real command and what was a page event.
- When the url changes this is now logged as a page event, and its `onConsole` logs what caused it to change

**Misc:**

- Internal refactor / improvements to support long lived runnable objects to work with page events
- Request Commands (now page events) have now been renamed to 'XHR'
- [`cy.document()`](https://on.cypress.io/api/document) now returns the raw document object instead of a jQuery wrapped document object
- When [`.its()`](https://on.cypress.io/api/its) or [`.invoke()`](https://on.cypress.io/api/invoke) fails it will include the current subject n the `onConsole` log
- [`cy.wait()`](https://on.cypress.io/api/wait) now logs out when its referenced aliases, and its `onConsole` output displays the XHR return values
- [`cy.hash()`](https://on.cypress.io/api/hash) and [`cy.url()`](https://on.cypress.io/api/url) no longer pass the return value as the command log's `message`, which made no sense and was unlike every other command

# 0.6.13

*Released 06/09/2015*

**Bugfixes:**

- Traversal methods now correctly return their `$el` even when `{log: false}` option is passed

**Misc:**

- [`.type()`](https://on.cypress.io/api/type) now works with `contenteditable` attributes

# 0.6.12

*Released 06/09/2015*

**Bugfixes:**

- When Cypress detects a `page loading` event it will now clear out the subject so the next commands cannot reference previous page DOM elements
- {% url `.check()` check %} and [`.uncheck()`](https://on.cypress.io/api/uncheck) will no longer output additional error'd commands when their associated `click` fails

**Misc:**

- [`.type()`](https://on.cypress.io/api/type), {% url `.clear()` clear %}, {% url `.check()` check %}, `.uncheck()`](https://on.cypress.io/api/uncheck) now all take `{force: true}` options to force the click to happen and skip additional clickable checks
- Now when you click the giant yellow failure messages if the error is a `CypressError` instead of logging nothing it will now find the command associated to that error and display the same message as if you clicked the failed command

# 0.6.11

*Released 06/08/2015*

**Bugfixes:**

- {% url `.clear()` clear %} and [`.type()`](https://on.cypress.io/api/type) no longer output additional error'd commands hen their associated `click` fails
- Changed scrolling elements into view to use top strategy instead of bottom which fixes times where the middle of an element was not yet in he viewport. Fixes [#42](https://github.com/cypress-io/cypress/issues/42).

**Misc:**

- [`.submit()`](https://on.cypress.io/api/submit) now errors if its been called on >1 form element. Fixes [#41](https://github.com/cypress-io/cypress/issues/41).
- Coordinates and hitboxes are now logged and displayed on {% url `.clear()` clear %} and [`.type()`](https://on.cypress.io/pi/type)

# 0.6.10

*Released 06/06/2015*

**Bugfixes:**

- Improved clicking algorithm to reduce edge cases where element could not be clicked but should have been able to be clicked.

**Misc:**

- {% url `.click()` click %} accepts `{force: true}` which will force it to issue the click event and bypass checking to ensure element is physically clickable.
- Elements which are children of a container with `overflow` are automatically scrolled prior to a click (which is an abstraction around real user behavior).
- Elements that are covering up an element you targeted for {% url `.click()` click %} are now logged out in the command console.
- All elements are now logged out as real DOM elements instead of jQuery wrapped elements. This has several upsides. Chrome will allow you to immediately interact with these elements, drilling into their contents, displaying the element box model on hover, etc. This prevents you from having to expand the jQuery elements and click "Reveal in Elements Panel".

# 0.6.9

*Released 06/06/2015*

**Bugfixes:**

- Custom commands no longer error out if they are the very first `cy` command

# 0.6.8

*Released 06/05/2015*

**Features:**

- {% url `cy.clearCookie()` clearcookie %} and {% url `cy.clearCookies()` clearcookies %} have been added as new commands.
- Cypress will automatically clear all cookies **before** each test run.
- Named the spec + app iframe so that inside of Chrome Dev Tools the iframe selector will clearly distinguish which iframe is your application versus Cypress.

**Bugfixes:**

- Hitbox is no longer covered up by element layers on DOM revert.
- Finally tracked down and fixed edge case causing empty view to display when tests were not empty. Fixes [#13](https://github.com/cypress-io/cypress/issues/13)

**Misc:**

- [`cy.visit()`](https://on.cypress.io/api/visit) now accepts `{log: false}` to prevent logging out (useful in custom commands).
- {% url `cy.contains()` contains %} is now scoped by default to the `<body>` instead of `document` which prevents it from returning elements in the `head` like `title`.

# 0.6.7

*Released 06/04/2015*

**Features:**

- When reverting the DOM, associated command elements are now automatically scrolled into view.
- Hitboxes are now displayed on the screen based on the actual coordinates where an `action command` event took place
- Click events now display event information about the `mousedown` / `mouseup` / `click` default action + propagation in the command console
- Preventing default action on `mousedown` will no longer give focus as per the spec
- Click events are now issued in the exact center of an element (taking into account 2d transforms) and provide the coordinates in the command console and in the actual event
- Click events now take into account whether the associated element is being covered up by another element, and will retry or fail with an exact error message if the click was unable to be issued due to this reason
- Click events will now intelligently provide `focus` to the first focusable element on the stack at the click coordinates, or will give `focus` to the window
- Click events will issue the click to the topmost element based on the click coordinates and not necessarily to the element you requested to e clicked (which simulates exactly how a real click works). If this happens it is noted in the command console and provides the `Actual Element Clicked`.

**Bugfixes:**

- When hover over commands element layers (2d transforms like rotation) are now taken into account and displayed correctly
- There was a bug when checking / unchecking `:checkbox` where it did not properly receive focus

**Misc:**

- Click events are now replicated *almost* identically to the W3C click spec. They should behave for all intents and purposes, identically to real clicks in the browser.

# 0.6.6

*Released 05/31/2015*

**Bugfixes:**

- Fixed regression related to [`cy.visit()`](https://on.cypress.io/api/visit) not re-visiting when current match matches remote url

# 0.6.5

*Released 05/23/2015*

**Features:**

- When Cypress detects a regular HTTP page loading event (where we're leaving the current page and requesting a new one) it will now insert a `loading` command which indicates to the user Cypress has stopped running commands until the new page loads.
- If for some reason this new page errors Cypress will display the initial 500 error messages just like [`cy.visit()`](https://on.cypress.io/api/isit)
- Cypress now waits `20s` (which matches [`cy.visit()`](https://on.cypress.io/api/visit)) for the new page to load instead of `4s` previously

**Bugfixes:**

- [`.submit()`](https://on.cypress.io/api/submit) will actually submit the form for real now, instead of just firing the submit event. Now its been upgraded to be able to be cancelled or have its returnValue set to false and will not submit the form. Don't ask how I missed this one. I as once a young naive programmer who trusted the DOM not to be the abomination it actually is.

**Misc:**

- No longer send back a 500 message when initial response status code is 4xx

# 0.6.4

*Released 05/21/2015*

**Bugfixes:**

- Host header https protocol handling fixed
- Incorrectly handling query params on redirects fixed
- Other header edge cases fixed

# 0.6.3

*Released 05/20/2015*

**Misc:**

- Cypress should work with self signed SSL certificates now

# 0.6.2

*Released 05/20/2015*

**Bugfixes:**

- Using the `length` option in `querying` or `traversal` commands now logs out in the command log. Fixes [#40](https://github.com/cypress-io/cypress/issues/40)
- Other scenarios are fixed where command options would show incorrect number of object keys due to a bug in underscore's `reduce` with an object that has a `length` key. Fixes [#35](https://github.com/cypress-io/cypress/issues/35)

# 0.6.1

*Released 05/15/2015*

**Bugfixes:**

- Using the `length` option in traversal commands works properly now. Fixes [#38](https://github.com/cypress-io/cypress/issues/38)
- Command logging now works even if no `cy` commands have been issued. Fixes [#37](https://github.com/cypress-io/cypress/issues/37)

**Misc:**

- Removed cy proxy commands: `each`, `map`. These didn't really "fit" into the concept of a command, and with [`.invoke()`](https://n.cypress.io/api/invoke) or [`.its()`](https://on.cypress.io/api/its) they're accessible anyway, so nothing is really lost.

# 0.6.0

*Released 05/14/2015*

**Features:**

- Pushstate application routing now works 100% reliably with NO hacky overrides in all browsers
- All incompatible `a` / `link` / `form` elements are transparently rewritten to be compatible including FQDN and protocol-less `href` / `src`
- Cookies are automatically cleared between page refreshes, during app startup, and leaving the test page
- 3rd Party cookies are now additionally cleared.  All cookies are now accessible to the client in preparation for [`cy.clearCookies()`](https://n.cypress.io/api/clearcookies).
- Manual navigation after tests run now works reliably
- Navigating between full page refreshes during tests now works reliably

**Bugfixes:**

- Server-side redirects are now completely transparently handled and supported
- URLs are no longer altered in any weird way
- Problematic `headers` are now automatically stripped from remote responses
- 3rd party `headers` are now properly proxied onto all responses
- Custom headers and other headers "of interest" are rewritten for transparent compatibility
- `gzip` compression now handled and proxied correctly

**Misc:**

- Completely overhauled the URL and proxy system used to serve remote applications
- Drastically simplified the architecture required for proxying
- Improved reliability for displaying the remote url
- Namespaced all cypress internal routes
- Many internal development / debugging processes improved
- Added 100+ new tests surrounding serving remote content and processing requests
- Renamed all remaining old references to `eclectus`
- All responses are now streamed using `content-encoding: chunked`

# 0.5.15

*Released 05/07/2015*

**Bugfixes:**

- Reverted `window.location` overrides. This broke things in unexpected ways and after further testing would not have worked on `Firefox` and `IE`. It's back to the drawing board (but I have some ideas).  Apps using `pushState` routing are broken again.

# 0.5.14

*Released 05/06/2015*

**Features:**

- Cypress now works with JS applications that use `pushState` and `replaceState` routing (commonly known as `HTML5 History`) without having to change any application code.
- Cypress now always updates the remote URL whenever your application changes its URL through the vast variety of ways it can do this.

**Bugfixes:**

- Removed `iframe` and `link[rel=stylesheet]` elements during DOM revert
- Server instrument now correctly displays the number of responses their corresponding routes have had
- Spies/Stubs/Mocks instrument now correctly displays the number of calls their corresponding methods have had
- When users navigate between pages with commands (like {% url `.click()` click %}), Cypress now correctly waits until the age has finished loading before running more commands. Previously this waited for the `unload` event, which did not fire synchronously, and ow we bind to `beforeunload` which does.  Additionally Cypress checks to ensure `beforeunload` did not return a non-undefined value.

**Misc:**

- More changes to prepare for server adapters

# 0.5.13

*Released 05/04/2015*

**Features:**

- New `cy.message` and `cy.msg` commands in preparation for `cypress-ruby`, `cypress-node`, `cypress-*` packages/gem to talk directly to your backend.

**Bugfixes:**

- Using `querying` or `traversal` commands will no longer throw a 2nd command error when using improper sizzle selectors.
- Argument formatting display for command messages is fixed. There were instances of leading commas, or no commas on some commands.

**Misc:**

- Changed default port from `3000` to `2020` to avoid standard port conflicts with commonly used backends. Afterall, using Cypress is testing with 2020 vision. ;-)
- Updated `bluebird` to `2.9.25`
- Began implementation in preparation for **cross browser testing** coming sometime relatively soon

# 0.5.12

*Released 04/30/2015*

**Features:**

- Introduced new **command option** `length` which cues Cypress into not resolving matched elements until their length matches the option provided.

**Bugfixes:**

- `cy.respond` will not resolve until all of the queue'd XHR's have resolved

**Misc:**

- Cypress now throws on [`.should()`](https://on.cypress.io/api/should) if any DOM member isn't in the DOM, except for `exist` assertions
- Cypress now throws on `eventually.have.length` assertions. Use implicit `{length: n}` command options instead.
- Cypress overrides chai `exist` assertion to really mean: "does this subject exist in the document?"

# 0.5.11

*Released 04/29/2015*

**Bugfixes:**

- Fixed missing `aliasType` from primitives and some DOM aliases, which prevent the background color from displaying in the UI.

**Misc:**

- Optimized performance for hovering / exiting commands. Heavily reduced the CPU on revert / restore the DOM.

# 0.5.10

*Released 04/28/2015*

**Features:**

- [`cy.server()`](https://on.cypress.io/api/server) now accepts a `delay` option which will delay all responses to requests (including 404) based on the value in ms
- [`cy.server()`](https://on.cypress.io/api/server) now accepts a `respond` option which can turn off automatic responding to requests
- [`cy.route()`](https://on.cypress.io/api/route) now accepts a `delay` option which overrides the delay option set in [`cy.server()`](https://n.cypress.io/api/server) to just matched requests
- [`cy.route()`](https://on.cypress.io/api/route) now accepts a `respond` option which will turn off automatic responding to just matched requests
- Fixes [#14](https://github.com/cypress-io/cypress/issues/14)
- [`cy.wait()`](https://on.cypress.io/api/wait) now accepts an alias property called `request`. Example: `cy.wait("@getUsers.request")` which ill resolve once the XHR is initially requested, before it is responded to.  This allows you to test things when a request is in flight.
- Added `cy.respond` command which will respond to all pending requests when `{respond: false}` is set in the `server` or `route`
- [`cy.debug()`](https://on.cypress.io/api/debug) now displays pending requests and completed requests
- The command UI now displays pending requests as a `pending command`

**Misc:**

- Updated `sinon` to `1.14.1`

# 0.5.9

*Released 04/26/2015*

**Features:**
- Added [`.spread()`](https://on.cypress.io/api/spread) method which spreads an array as individual arguments to a callback function (like [`.then()`](https://on.cypress.io/api/then)
- During an update Cypress will now display the updating message in the same coordinates as when the app was open by clicking the tray icon
- After an update Cypress will now open back up and show itself in these same coordinates
- [`cy.wait()`](https://on.cypress.io/api/wait) can now accept an array of route aliases which will wait until all have completed.  This array of resolved XHRs will become the next subject.
- Each time an alias in used with a [`cy.wait()`](https://on.cypress.io/api/wait), Cypress will not resolve until the Nth request matching the outing alias responds.  Fixes [#4](https://github.com/cypress-io/cypress/issues/4)
- [`cy.get()`](https://on.cypress.io/api/get) has been upgraded to accept a routing alias.  By default it will yield the last matched request, but also supports special alias properties which return a different request or potentially an array of requests.

# 0.5.8

*Released 04/24/2015*

**Features:**

- {% url `.as()` as %} can now alias primitives and objects other than routes or DOM
- {% url `.as()` as %} automatically assigns this alias to `runnable.ctx` which makes it available synchronously
- {% url `.as()` as %} blacklists several reserved words and will throw if you attempt to alias as one of them
- [`cy.get()`](https://on.cypress.io/api/get) can now accept all alias types and will display the labels in the UI differently based on the alias type
- Cypress now displays a message when the Desktop App update is actually being applied instead of doing nothing and looking like its crashed

**Bugfixes:**

- {% url `.as()` as %} now throws on empty strings or non string arguments
- Desktop App debug logs no longer sort in the wrong direction
- Permissions are now restored during a cypress update for the `logs` and `cache`
- Prevent 3rd party windows from gaining focus over main window

**Misc:**

- Removed `cy.assign`, this has been folded into {% url `.as()` as %}
- Updated `chokidar` to `1.0.1`

# 0.5.7

*Released 04/23/2015*

**Features:**

- The insanity that is URL parsing to figure out absolute, relative, absolute-path-relative, http, sub domains, and local files should work in most cases. In other words, Cypress has implemented the vast majority of url parsing based on the [w3c URL spec](http://www.w3.org/TR/rl-1/#url-parsing).

**Bugfixes:**

- Prevent reverting the DOM while tests are running. Fixes [#28](https://github.com/cypress-io/cypress/issues/28)
- Fix edge case with forced focusing / blurring an element when document is not in focus and the element is no longer in the DOM
- Visiting relative paths which are served from your file system works again
- Visiting absolute paths in the iframe now displays the correct URL in the address bar again

# 0.5.6

*Released 04/22/2015*

**Features:**

- Cypress now detects the difference between a forced async `done` test timeout vs a regular command timeout, and will throw the appropriate message indicating whether the user forgot to simply invoke `done` or whether the timeout happened due to a command.

**Bugfixes:**

- [`cy.visit()`](https://on.cypress.io/api/visit) now properly times out when the `load` event does not occur within the time out window
- If a page loads after a [`cy.visit()`](https://on.cypress.io/api/visit) times out it will no longer cause an exception in the `onBeforeLoad` handler

**Misc:**

- Increased [`cy.visit()`](https://on.cypress.io/api/visit) timeout from **15s** to **20s**
- [`cy.visit()`](https://on.cypress.io/api/visit) now throws a custom error message when it times out (instead of an incorrect / confusing default mocha timeout message)
- Using a `debugger` while running a test will no longer always cause the test to time out (yay!)
- Override default mocha timeout handling, replaced with custom logic. Removes many bizarre edge cases

# 0.5.5

*Released 04/20/2015*

**Features:**

- When main app window comes into focus, it will automatically focus other peripheral windows
- Added explicit error message when using child commands on a subject which has been detached or removed from the DOM
- Cypress now detects when an async test is passed and not all commands have finished running. It will throw an explicit error message in this situation.

**Misc:**

- Error messages no longer break within words

# 0.5.4

*Released 04/20/2015*

**Features:**

- Enhanced [`.should()`](https://on.cypress.io/api/should) to accept `eventually` flag to automatically retry assertions until timeout is reached

**Misc:**

- Repurposed {% url `.and()` and %} to be an alias of [`.should()`](https://on.cypress.io/api/should) for chainability
- Removed `cy.to`

# 0.5.3

*Released 04/19/2015*

**Bugfixes:**

- Handle relative path segments which walk up past the remote host `../../assets/app.css`
- Throw explicit error for `null`, `undefined`, and `""` arguments to {% url `cy.contains()` contains %}. Fixes [#24](https://github.com/cypress-io/cypress/issues/24)

Misc
- Improved `onConsole` message for [`cy.focused()`](https://on.cypress.io/api/focused) when no element was returned. Fixes [#23](https://github.com/cypress-io/cypress/issues/23)

# 0.5.2

*Released 04/17/2015*

**Bugfixes:**

- Fixed missing files from deployment. Added tests around this.

# 0.5.1

*Released 04/16/2015*

**Misc:**

- Updated dependencies: `bluebird`, `fs-extra`, `sinon-as-promised`
- Updated `nw` to `0.12.1`

# 0.5.0

*Released 04/15/2015*

**Misc:**

- Snapshot source code

# 0.4.7

*Released 04/15/2015*

**Misc:**

- Added automated functional NW tests during deployment in preparation for `0.5.0` release

# 0.4.6

*Released 04/11/2015*

**Features:**

- Added "invisible" icon to a command when its matched element(s) are invisible.
- Running a single test will now automatically expand to display its commands
- Any failing test will now automatically expand to display its commands
- Failing tests which become passing will automatically collapse again

# 0.4.5

*Released 04/10/2015*

**Features:**

- Added [`cy.wrap()`](https://on.cypress.io/api/wrap) command

**Bugfixes:**

- Improved options logging and argument logging for all commands.  Fixes [#8](https://github.com/cypress-io/cypress/issues/8)

# 0.4.4

*Released 04/09/2015*

**Features:**

- Added [`.not()`](https://on.cypress.io/api/not) traversal filtering method. Suggested in [#16](https://github.com/cypress-io/cypress/issues/16)

**Misc:**

- Improved error messages for traversal failures. Errors now include the parent context DOM element. Fixes [#11](https://github.com/cypress-io/cypress/issues/11)
- Improved error messages for invalid [`cy.route()`](https://on.cypress.io/api/route) arguments. Fixes [#20](https://github.com/cypress-io/cypress/issues/20)

# 0.4.3

*Released 04/09/2015*

**Features:**

- Added functionality which enables [`cy.server()`](https://on.cypress.io/api/server) and [`cy.route()`](https://on.cypress.io/api/route) to be created prior to [`cy.visit()`](https://on.cypress.io/api/visit). The server and routes will apply to the next page which is visited. This allows you to stub requests which happen on page load. Suggested in [#17](https://github.com/cypress-io/cypress/issues/17)
- [`cy.visit()`](https://on.cypress.io/api/visit) now takes an optional `onBeforeLoad` callback option which is invoked when your page begins to ender but prior to its load event.

**Misc:**

- Improved error message when attempting to use `cy.agents` or anything else which requires a remote sandbox.  Fixes [#12](https://github.com/cypress-io/cypress/issues/12)

# 0.4.2

*Released 04/09/2015*

**Bugfixes:**

- Remove accidental `debugger` left in `uncaught` overloads (used only in Dev)
- Prevent memory leak with Cypress helper listeners on every re-run of the tests
- Prevent memory leak with custom 3rd party Cypress listeners in spec windows on every re-run of the tests
- Prevent error from being thrown when `.only`'s are switched in between active test runs

# 0.4.1

*Released 04/08/2015*

**Features:**

- `javascripts` files can now utilize `snockets`, `browserify`, or `requirejs`

**Bugfixes:**

- Handle `javascripts` and preprocess them as we do regular specs. Fixes: [#15](https://github.com/cypress-io/cypress/issues/15)
- Fixed an edge case when writing a test with a `done` callback alongside `cy` commands.  This situation would always cause a timeout after 30 seconds even though the test would pass.

**Misc:**

- Internally refactored Cypress for easier testability / debuggability
- Organized files around in preparation for OS release
- Added lightweight module system / optimized Cypress listeners to prevent duplicated events
- Changed url strategy for sending down `spec` files

# 0.4.0

*Released 04/02/2015*

**Features:**

- `sinon-as-promised` is now a bundled extension
- tests without an `id` now run (with a random temporarily assigned id)
- tests with a duplicate `id` to another test will now run (with a random temporarily assigned id)
- tests or suites which are manually re-run from the UI now hide all of the other tests / suites

**Bugfixes:**

- Fixed hook failure associated to wrong failed current test when `grep` was set
- Async tests which used a `cy` command and had a `done` callback was always undefined.  Now its back to real mocha `function done(err)`
- Fixed bug in mocha where it incorrectly associates `hook.ctx.currentTest` to the wrong `test`. [Mocha Issue](https://github.com/mochajs/mocha/issues/1638)
- [`cy.title()`](https://on.cypress.io/api/title) no longer logs twice on a failure
- Fixed putting an `.only` on a large list of tests that would sometimes not clear the previous runnables in the UI

**Misc:**

- Optimized first test run after hard refresh
- Performance improvements on successive runnable iterations
- Aborting currently running tests performance improvement
- Live reload performance improvements when tests are changed
- Added 100+ tests covering Runner + Reporter behavior
- Aggressively cleaned up listeners after each test completion + run
- Added additional `Cypress` events for 3rd party custom handling

# 0.3.15

*Released 03/28/2015*

**Misc:**

- Drastically improved file watching on large projects with many tests.  Instead of choking the CPU at nearly 100% indefinitely we now optimally watch the current working files for changes.

# 0.3.14

*Released 03/27/2015*

**Bugfixes:**

- `Socket.io` and `chokidar` are now being cleaned up when a project is closed.  Previously `chokidar` file watchers would stick around indefinitely causing a memory leak each time any project is closed and reopened.

# 0.3.13

*Released 03/27/2015*

**Features:**

- [`cy.visit()`](https://on.cypress.io/api/visit) now detects a local url.  `localhost`, `0.0.0.0`, `127.0.0.1` can omit the `http://` protocol

**Bugfixes:**

- {% url `cy.contains()` contains %} now properly escape quotes in the text
- [`cy.visit()`](https://on.cypress.io/api/visit) now inserts a trailing slash intelligently into the correct `path` position (not after query params or hashes)
- [`cy.visit()`](https://on.cypress.io/api/visit) will no longer log 2 failed commands on error
- Hovering on commands which delay resolving their $el will now properly highlight again

**Misc:**

- [`cy.debug()`](https://on.cypress.io/api/debug) returns the current subject now
- upgraded jsUri to `1.3.0`
- [`cy.visit()`](https://on.cypress.io/api/visit) now throws when url argument isn't a string
- `Cypress.Log` instances now fire `attrs:changed` event. Removed `state:change` event.

# 0.3.12

*Released 03/26/2015*

**Bugfixes:**

- Aliases which replay their commands will no longer break the current chain and therefore not unintentionally null our their subject for the ext command
- Highlighting $el's on DOM restore now works again
- Asserting against [`cy.focused()`](https://on.cypress.io/api/focused) will indent command logs now
- Prevent failed [`.should()`](https://on.cypress.io/api/should) and `cy.to` from outputting a second error'd command log
- Removed memory leaks surrounding mocha runner
- Captured remote page uncaught errors again which fail corresponding tests
- Captured spec iframe errors again and preserve their stack trace

**Misc:**

- [`cy.focused()`](https://on.cypress.io/api/focused) is now a parent command
- Memory usage improvements

# 0.3.11

*Released 03/25/2015*

**Bugfixes:**

- Automatic command errors now properly show as errored commands
- [`.invoke()`](https://on.cypress.io/api/invoke) now correctly checks for a subject before running

**Misc:**

- `cy.Promise` (Bluebird) is now publicly available

# 0.3.10

*Released 03/24/2015*

**Bugfixes:**

- Test duration is now correct and only updates when tests finish
- Failing a hook will no longer continue to count the duration forever

**Misc:**

- Bumped Mocha to 2.2.1
- Users now see a specialized error message when Cypress could not serve static files from the file system

# 0.3.9

*Released 03/24/2015*

**Features:**

- Instead of waiting until commands resolve, commands are immediately inserted with a `pending` status
- Pending commands are now visually distinguishable
- Created new `Cypress.Log` interface for greater control over the display of commands
- Available aliases are now logged in the console on [`cy.debug()`](https://on.cypress.io/api/debug)

**Bugfixes:**

- Allow projects to be scrolled when >4 are added
- [`.type()`](https://on.cypress.io/api/type) accepts remaining `input[type=*]` that users can type into
- Cause + Effect commands are now logged in the correct order.  IE, clicking something which causes another command to insert will be inserted correctly in the order they arrived
- `numRetries` is no longer shown in commands
- {% url `.clear()` clear %} now logs a command
- `Promise.reduce` bugs are now fixed, causing events on a collection of elements in the synchronous wrong order
- `cy.chain` is now coercively returned instead of `cy` which prevents losing access to the subject in custom commands
- Trailing slashes are removed when serving initial files from the file system directly

# 0.3.8

*Released 03/22/2015*

**Features:**

- Added icons + tray icons

**Bugfixes:**

- Prevent cypress.app from showing in taskbar
- Clicking on tray twice will toggle hide/show of app

# 0.3.7

*Released 03/21/2015*

**Features:**

 - Code Signed Mac App to prevent "Unidentified Developer" message on open

# 0.3.6

*Released 03/20/2015*

**Features:**

 - Added external link to changelog when checking for updates :-)

**Bugfixes:**

 - Force trailing slash on all [`cy.visit()`](https://on.cypress.io/api/visit) to fix relative links `href="assets/app.js"`
 - Fix sourceMappingURL browser bug `http:/localhost:4200/app.css.map`
 - Fix test titles not being escaped due to refactoring

# 0.3.5

*Released 03/20/2015*

**Bugfixes:**

 - Fix missing `moment.js` from `bower.json`
 - Fix missing trailing slash from initial [`cy.visit()`](https://on.cypress.io/api/visit) requests
 - Fix missing `__initial=true` query param on initial redirects

**Misc:**

 - Updated $.simulate to 1.0.1

# 0.3.4

*Released 03/19/2015*

**Features:**
 - [`.type()`](https://on.cypress.io/api/type) now causes the subject to receive `focus` event
 - [`.type()`](https://on.cypress.io/api/type) now causes previously `focused` elements to receive `blur` event
 - Typing `{enter}` now handles form submit logic as per the HTML spec
   - Form with 1 input, no defaultButton
   - Form with 2 inputs, no defaultButton
   - Form with disabled defaultButton
   - Form with multiple defaultButtons
   - Correctly processes defaultButton click event, form submit event
   - Intelligently handle defaultPrevented events from descendants

**Bugfixes:**

 - {% url `.clear()` clear %} now returns a promise

**Misc:**

 - Updated `bluebird` to `2.9.14`

# 0.3.3

*Released 03/18/2015*

**Features:**

 - Filtered out AJAX requests for `.js`, `.html`, `.css` files by default
 - [`cy.server()`](https://on.cypress.io/api/server) can configure whether this is turned on or off

**Bugfixes:**

 - Prevent [`cy.server()`](https://on.cypress.io/api/server) from slurping up Angular async template GETs

**Misc:**

 - Inlined Google Fonts into `vendor.css`
