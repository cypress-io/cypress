---
title: Changelog
comments: false
---

# 0.19.2

*Released 04/16/2017*

**Features:**

- You can now run your tests in the {% url 'Electron browser' browser-management#Electron-Browser %} that comes built with Cypress. You will see it as an option in the browser dropdown. This is the same browser that Cypress uses when running Cypress headlessly. This is useful for debugging issues that only occur during headless runs. Addresses [#452](https://github.com/cypress-io/cypress/issues/452).
- New traversal commands {% url `.nextAll()` nextall %}, {% url `.nextUntil()` nextuntil %}, {% url `.parentsUntil()` parentsuntil %}, {% url `.prevAll()` prevall %}, and {% url `.prevUntil()` prevuntil %} have been added. Addresses [#432](https://github.com/cypress-io/cypress/issues/432).

**Bugfixes:**

- An error is now thrown if an `undefined` value is mistakenly passed into {% url `cy.wait()` wait %}. Previously, it would set the command timeout to an unimaginably large number of ms. Fixes [#332](https://github.com/cypress-io/cypress/issues/332)
- Fixed issue where the contents of `state.json` were emptied, which would cause a crash and loss of state information. Fixes [#473](https://github.com/cypress-io/cypress/issues/473) and [#474](https://github.com/cypress-io/cypress/issues/474).
- We no longer write the chrome extension within `node_modules`, and instead write this to the proper OS specific `appData` folder. Fixes [#290](https://github.com/cypress-io/cypress/issues/290) and [#245](https://github.com/cypress-io/cypress/issues/245).

**Misc:**

- Error handling for invalid arguments passed to {% url `cy.wait()` wait %} have been improved and will now suggest valid arguments that are acceptable.
- Browsers in the browser dropdown now have colored icons, which help visually distinguish the variants of Chrome.
- Increased timeout for browser to make a connection when running headlessly from 10 seconds to 30 seconds.
- Internally refactored how browsers are added and spawned in preparation of us adding cross browser support.
- Switching specs in the GUI now closes the browser and respawns it and refocuses it.

# 0.19.1

*Released 03/09/2017*

**Features:**

- Added `Cypress.version` property. Fixes [#404](https://github.com/cypress-io/cypress/issues/404).
- Selecting `<option>` inside `<optgroup>` now works with {% url `.select()` select %}. Fixes [#367](https://github.com/cypress-io/cypress/issues/367).

**Bugfixes:**

- `EMFILE` errors have been fixed. These were being caused due to `ulimit` being too low on your OS. This should fix the file watching problems people were having. Essentially we just replaced `fs` with `graceful-fs` and crossed our fingers this works. (It did on our machines). Fixes [#369](https://github.com/cypress-io/cypress/issues/369).
- Now you can select the error text in the GUI. Fixes [#344](https://github.com/cypress-io/cypress/issues/344).
- Cypress now correctly re-bundles files even when `watchForFileChanges` is set to `false`. Fixes [#347](https://github.com/cypress-io/cypress/issues/347) and [#446](https://github.com/cypress-io/cypress/issues/446)
- Fixed file watching when changing the `integrationFolder` to something other than the default value. Fixes [#438](https://github.com/cypress-io/cypress/issues/438).
- {% url `.select()` select %} now works on options that have the same value. Fixes [#441](https://github.com/cypress-io/cypress/issues/441).
- Cypress no longer crashes when you click links in the on-boarding screen called "To help you get started...". Fixes [#227](https://github.com/cypress-io/cypress/issues/227).
- The `example_spec.js` file that gets seeded on a new project no longer fails on {% url `cy.readFile()` readfile %}. Fixes [#414](https://github.com/cypress-io/cypress/issues/414).

**Misc:**

- We now preserve the Desktop GUI's position and sizing after its closed + reopened. Fixes [#443](https://github.com/cypress-io/cypress/issues/443).
- We now ignore watching `node_modules`, `bower_components` and a few other folders to reduce the number of watched files. Fixes [#437](https://github.com/cypress-io/cypress/issues/437).

# 0.19.0

*Released 02/11/2017*

**Notes:**

- We have updated all of the docs related to these changes. The {% url 'CI Docs' continuous-integration %} got a much needed facelift.
- There is a new docs section related to the {% url 'Dashboard' dashboard-features %} and the new features.

**Overview:**

- We have officially released our {% url 'Dashboard' https://on.cypress.io/dashboard %} which is our service that will display recorded runs.
- This service has now been fully integrated into the Desktop Application. There is a new on-boarding process that helps you setup projects for recording.

**Breaking Changes:**

- We have done our very best to create as little breaking changes as possible.
- You will need to download a new {% url 'cypress-cli' cli-tool %} - version `0.13.1`.
- Older CLI versions will continue to work on `0.19.0` except for the {% url '`cypress open`' cli-tool#cypress-open %} command - and will we print a warning to nudge you to upgrade.
- Newer CLI versions will not work on versions of Cypress < `0.19.0` (but we don't know why this would ever even happen).

**Features:**

- There is a new {% url 'Dashboard' https://on.cypress.io/dashboard %} service that displays your recorded runs.
- The {% url 'Dashboard' https://on.cypress.io/dashboard %} enables you to view your recorded runs, manage projects, create organizations, invite users and set permissions.
- Projects are either **public** with their runs being publicly viewable by anyone, or **private** which restricts their access to only users you've invited. All **existing** projects were set to **private** by default.
- When you invite users (from the Dashboard) we will **automatically** whitelist them. This means you can invite all of your teammates (or anyone else). They can start using Cypress without talking to us.
- We now list all of the recorded runs directly in the Desktop GUI under a new `Runs` tab. Fixes [#236](https://github.com/cypress-io/cypress/issues/236).
- Your list of projects in the Desktop GUI now displays their last recorded run status - passing, failing, pending, running, etc.
- We've changed the "Config" tab to now be called "Settings". We added two new sections to the "Settings" tab which displays your `projectId` and your Record Key. These sections do a much better job explaining what these are and how you use them.
- You no longer have to use `cypress get:key` to get your Record Key. We now display this in your "Settings" tab and also in the {% url 'Dashboard' https://on.cypress.io/dashboard %}.
- Projects will no longer automatically acquire a `projectId` when being added. There is now a very explicit **opt-in** process where you setup your project to record. This should make it much clearer what's going on behind the scenes.
- {% url '`cypress run`' cli-tool#cypress-run %} now behaves likes `cypress ci` previously did and downloads + installs Cypress if its not already installed.
- `cypress ci` now works in OSX, and also works in Linux in Desktop flavors (like Ubuntu).

**Misc:**

- {% url '`cypress run`' cli-tool#cypress-run %} will now download and install Cypress if its not already installed.
- We renamed `CYPRESS_CI_KEY` TO `CYPRESS_RECORD_KEY`. This makes it clearer what this key actually does - and the fact that it can be run anywhere irrespective of CI. We still look for the old named key but will print a warning if we detect it.
- We print a warning when using an older CLI tool version. Fixes [#424](https://github.com/cypress-io/cypress/issues/424).
- We've improved many of the error messages related to recording runs. Fixes [#423](https://github.com/cypress-io/cypress/issues/423).
- `cypress ci` has been deprecated. You now use {% url '`cypress run --record --key <record_key>`' cli-tool#cypress-run-record %}. The key you used to pass to `cypress ci` is the same key. We've simply consolidated these commands into just {% url '`cypress run`' cli-tool#cypress-run %} which makes it simpler and clearer. Their only difference is that passing `--record` to {% url '`cypress run`' cli-tool#cypress-run %} will **record** the build to our Dashboard. Fixes [#417](https://github.com/cypress-io/cypress/issues/417).

# 0.18.8

*Released 02/05/2017*

**Overview:**

- We have officially implemented our [Sinon.JS](http://sinonjs.org/docs/) integration: adding {% url `cy.stub()` stub %}, {% url `cy.spy()` spy %}, {% url `cy.clock()` clock %}, and {% url `cy.tick()` tick %}. We've matched Sinon's API's and added `sinon-as-promised` and `chai-sinon`. In addition we've fixed Sinon performance issues, and improved the display of assertion passes and failures.
- These new API's will work well in both `unit` tests and `integration` tests.

**Features:**

- You can now use {% url `cy.stub()` stub %} and {% url `cy.spy()` spy %} synchronously. These both match the Sinon API identically. We will display `stub/spy` calls in the command log and provide the call count, arguments, context, and return values when you click on the log. Stubs are automatically reset between tests.  Fixes [#377](https://github.com/cypress-io/cypress/issues/377).
- We've added our own special aliasing flavor to {% url `cy.stub()` stub %} and {% url `cy.spy()` spy %}. You can use the {% url `.as()` as %} command and we will associate spy and stub invocations (the same way we do with XHR aliasing and route matching).
- We've added {% url `cy.clock()` clock %} and {% url `cy.tick()` tick %} which are both asynchronous methods to modify timers in your application under test. We automatically apply clock (even if you invoke it before your first {% url `cy.visit()` visit %}) and will automatically reapply it after page load. {% url `cy.tick()` tick %} will enable you to control the amount of time you want passed in your application. This is great for controlling *throttled* or *debounced* functions.
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

- We now launch Cypress tests directly to the `baseUrl` to avoid an initial page refresh when encountering the first {% url `cy.visit()` visit %} command. This should help tests run faster. Fixes [#382](https://github.com/cypress-io/cypress/issues/382).

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

- Improved performance when running headlessly by caching the last bundled spec. This prevents having the same spec file rebundled each time {% url `cy.visit()` visit %} caused a full page navigation. You should see a moderate improvement in test run time. Fixes [#370](https://github.com/cypress-io/cypress/issues/370).
- We are now capturing `stdout` and several other properties for use + display in our Dashboard on `cypress ci` runs.
- Enable {% url `cy.fixture()` fixture %} to send an encoding for images other than forcing the default encoding of `base64`. Fixes [#373](https://github.com/cypress-io/cypress/issues/373).
- Enable {% url `cy.route()` route %} to pass an `encoding` parameter when using `fx:fixture` syntax. Fixes [#374](https://github.com/cypress-io/cypress/issues/374).

# 0.18.4

*Released 12/28/2016*

**Bugfixes:**

- Prevent {% url `cy.url()` url %} from accessing the URL during transition phase and throwing an error. Fixes [#356](https://github.com/cypress-io/cypress/issues/356).
- Stubbed functions now serialize correctly when switching domains on a {% url `cy.visit()` visit %}. Fixes [#354](https://github.com/cypress-io/cypress/issues/354).
- Fixed a handful of scenarios and edge cases where cookies were not properly synchronized between external requests and the browser. This led to situations where cookies were either duplicated on requests, or were not sent. Fixes [#357](https://github.com/cypress-io/cypress/issues/357) and [#361](https://github.com/cypress-io/cypress/issues/361) and [#362](https://github.com/cypress-io/cypress/issues/362).

**Misc:**

- {% url `cy.request()` request %} now favors `baseUrl` config over remote origin when you do not pass a fully qualified URL. Fixes [#360](https://github.com/cypress-io/cypress/issues/360).

# 0.18.3

*Released 12/18/2016*

**Features:**

- There is now a {% url `cy.log()` log %} command for displaying an arbitrary message and args. Useful for providing context while testing and debugging long tests. Fixes [#342](https://github.com/cypress-io/cypress/issues/342).

**Bugfixes:**

- {% url `cy.title()` title %} now uses the `document.title` property as opposed to querying for `<title>` elements in the `<head>`. Fixes [#331](https://github.com/cypress-io/cypress/issues/331) and [#351](https://github.com/cypress-io/cypress/issues/351).
- We now exit correctly (with status of 1) in the case of headless renderer crashes. Additionally we capture these errors properly, explain what happened, and link to external error document to suggest fixes. Fixes [#348](https://github.com/cypress-io/cypress/issues/348) and [#270](https://github.com/cypress-io/cypress/issues/270).

**Misc:**

- Improved headless performance, and added optimizations for early and often GC.

# 0.18.2

*Released 12/15/2016*

**Bugfixes:**

- Under the hood {% url `cy.visit()` visit %} now sets an `Accept: text/html,*/*` request header to prevent some web servers from sending back `404` in the case where they required this header. Only a small % of servers would ever do this, but `webpack-dev-server` was one of them. Fixes [#309](https://github.com/cypress-io/cypress/issues/309).
- {% url `cy.request()` request %} now sends an `Accept: */*` request header by default too. Fixes [#338](https://github.com/cypress-io/cypress/issues/338).

**Misc:**

- {% url `cy.request()` request %} now includes more debugging information (related to headers) in the error output. Fixes [#341](https://github.com/cypress-io/cypress/issues/341).
- When {% url `cy.request()` request %} times out, we now output much better error messages including information about the request sent. Fixes [#340](https://github.com/cypress-io/cypress/issues/340).

# 0.18.1

*Released 12/11/2016*

**Notes:**

- There is a new [recipe showcasing these new features](https://github.com/cypress-io/cypress-example-recipes).
- We are adding several other recipes to show examples of all the ways you can use {% url `cy.request()` request %} to improve your tests.

**Features:**

- {% url `cy.request()` request %} can now have its automatic redirect following turned off by passing `{followRedirect: false}`. Fixes [#308](https://github.com/cypress-io/cypress/issues/308).
- {% url `cy.request()` request %} now has a `qs` option that automatically appends query params to the `url` property. Fixes [#321](https://github.com/cypress-io/cypress/issues/321).
- {% url `cy.request()` request %} now follows redirects exactly like a real browser. Previously if you `POST`ed to an endpoint and it redirected to a `GET` then {% url `cy.request()` request %} would not follow it due to the `method` changing. It now follows method changing redirects by default. Fixes [#322](https://github.com/cypress-io/cypress/issues/322).
- {% url `cy.request()` request %} now accepts the `form` option which will convert the `body` values to urlencoded content and automatically set the `x-www-form-urlencoded` header. This means you can now use {% url `cy.request()` request %} to bypass your UI and login with standard form values. Fixes [#319](https://github.com/cypress-io/cypress/issues/319).
- When {% url `cy.request()` request %} fails, it now outputs the full request / response information. This behaves more similar to {% url `cy.visit()` visit %} failures. Fixes [#324](https://github.com/cypress-io/cypress/issues/324).
- {% url `cy.request()` request %} now prints **all** of the underlying HTTP request / response information into the Dev Tools' console (when clicking on the Command Log). This means that you will see everything you would normally see from the `Network` tab as if the request were made from the browser. We even print redirect information. Fixes [#325](https://github.com/cypress-io/cypress/issues/325).

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

- Deprecated `failOnStatus` property for {% url `cy.request()` request %} and renamed to `failOnStatusCode`. Fixes [#323](https://github.com/cypress-io/cypress/issues/323).
- Removed the `cookies` option from {% url `cy.request()` request %} because cookies are now *always* get/set on requests. This option really never made any sense to have. Fixes [#320](https://github.com/cypress-io/cypress/issues/320).
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

- Previously, we auto-magically included all files within {% url '`cypress/support`' organizing-tests#Folder-Structure %}. This has now {% url 'gone away' error-messages %} and we've simplified this to automatically including a single `cypress/support/index.js` file. That single file acts as the entry point meaning you should `import` or `require` the other support files you'd like to include. Although this is still "automatic" it's much less magical and we'll be updating all of our docs to reflect this. The purpose of `cypress/support` hasn't really changed, just the implementation of it has. We will automatically seed a `cypress/support/index.js` file for you (even on existing projects). The file location of `cypress/support/index.js` can be changed with the new {% url `supportFile` configuration#Folders %} option in your `cypress.json`. This feature can also be turned off by specifying `supportFile: false`.

**Features:**

- We now support ES2015+, modules, and JSX in all spec files. Fixes [#246](https://github.com/cypress-io/cypress/issues/246).
- Spec files may now be written as `.js`, `.jsx`, `.coffee`, or `cjsx` files.
- Test files with JS syntax errors are now {% url 'handled' error-messages %} and we provide a GUI that points to the exact line/column number. Additionally we print these out when running headlessly and exit the process with `code 1`. Fixes [#293](https://github.com/cypress-io/cypress/issues/293).

**Misc:**

- We improved the logic around when and if we scaffold files on a new project. We're much smarter about this and not generating these forcibly every time. Fixes [#285](https://github.com/cypress-io/cypress/issues/285).
- Simplified handling of support files and made them less "magical". Fixes [#286](https://github.com/cypress-io/cypress/issues/286).
- Renamed `supportFolder` to {% url `supportFile` configuration#Folders %} in `cypress.json`. We will automatically rename your `cypress.json` if this property was present on update.

# 0.17.12

*Released 11/21/2016*

**Bugfixes:**

- You no longer have to log in again after updating. Fixes [#305](https://github.com/cypress-io/cypress/issues/305).
- Updating in app now works again. Sorry about that. Fixes [#304](https://github.com/cypress-io/cypress/issues/304).
- Headless frame rate is now correctly set to `20` instead of resetting back to `60`. Fixes [#303](https://github.com/cypress-io/cypress/issues/303).
- We now automatically drop frames that the CPU cannot keep up with while video recording headlessly. Previously we would buffer all frames in memory and it was possible to exhaust all memory due to the way that streaming backpressure works. Fixes [#302](https://github.com/cypress-io/cypress/issues/302).
- Fixed an edge case in the `driver` that could lead to memory leaks. This happened when Command Logs updated from previously run tests. Normally, in headless mode, we automatically remove references to purge memory after each test, but when logs were updated after this, their references were merged back in again and held onto forever. If you were seeing long Cypress runs die or eventually halt, this was likely the cause. We did extensive memory regression analysis on Cypress and could not find any more memory leaks. Fixes [#301](https://github.com/cypress-io/cypress/issues/301).

**Misc:**

- Improved {% url '`cypress run`' cli-tool#cypress-run %} and `cypress ci` headless output. Fixes [#306](https://github.com/cypress-io/cypress/issues/306).
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

- We now record videos during a headless run with both [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) and {% url '`cypress run`' cli-tool#cypress-run %}. Fixes [#229](https://github.com/cypress-io/cypress/issues/229).
- After completing [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-), we now upload build assets (such as `screenshots` and `videos`) to be used in our upcoming admin interface. This will enable you to review assets without having to touch your CI server. Fixes [#292](https://github.com/cypress-io/cypress/issues/292).

**Misc:**

- We've redesigned the headless run `stdout` to give you more details of the run, the stats after the run, what screenshots were taken, the video that was recorded, compression settings for the video, uploading asset progress, etc.
- Screenshot names now include their parent titles, and invalid file system characters are scrubbed. Fixes [#297](https://github.com/cypress-io/cypress/issues/297).
- We no longer artificially restrict the environment [`cypress ci`](https://docs.cypress.io/docs/continuous-integration#section-what-is-the-difference-between-cypress-run-and-cypress-ci-) can run in. It can now run *anywhere*. Fixes [#296](https://github.com/cypress-io/cypress/issues/296).
- We removed scaffolding any directories on a new project (when running headlessly). Fixes [#295](https://github.com/cypress-io/cypress/issues/295).
- {% url '`cypress run`' cli-tool#cypress-run %} no longer prompts the user for any kind of interaction, thus enabling you to use this in CI if you choose to do so. Fixes [#294](https://github.com/cypress-io/cypress/issues/294).
- There is a new {% url 'configuration' configuration %} property called: `trashAssetsBeforeHeadlessRuns` that is set to `true` by default and will automatically clear out screenshots + videos folders before each run. These files are not deleted, they are just moved to your trash.
- There are several new {% url 'configuration' configuration %} properties for video recording: `videoRecording`, `videoCompression`, and `videosFolder`.

# 0.17.10

*Released 11/07/2016*

**Bugfixes:**

- Fixed switching between two different spec files from the desktop app causing `document.domain` to be wrong. Fixes [#276](https://github.com/cypress-io/cypress/issues/276).
- Fixed inserting the string `null` into {% url `cy.request()` request %} urls when providing a `baseUrl` in `cypress.json` while origin could not be determined. Fixes [#274](https://github.com/cypress-io/cypress/issues/274).
- Fixed incorrect error message on reverse visibility assertions. Fixes [#275](https://github.com/cypress-io/cypress/issues/275).

**Misc:**

- We've improved the way we inject content into `<html>` responses by filtering the underlying HTTP request headers. We no longer inject content into templates which were loaded via XHR. Fixes [#257](https://github.com/cypress-io/cypress/issues/257) and [#288](https://github.com/cypress-io/cypress/issues/288).

# 0.17.9

*Released 10/22/2016*

**Bugfixes:**

- Cypress now applies cookies to the browser which were cleared between redirects. Fixes [#224](https://github.com/cypress-io/cypress/issues/224).
- Snapshots now work even when `<html>` tag has invalid attributes. Fixes [#271](https://github.com/cypress-io/cypress/issues/271).
- Cypress no longer crashes on initial {% url `cy.visit()` visit %} when the 3rd party webserver never ends the response. Fixes [#272](https://github.com/cypress-io/cypress/issues/272).

**Misc:**

- Changed default {% url `responseTimeout` configuration#Timeouts %} from `20000` to `30000`.
- Changed default {% url `pageLoadTimeout` configuration#Timeouts %} from `30000` to `60000`.
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

- There is now a new {% url `chromeWebSecurity` configuration#Browser %} option you can set in `cypress.json` to turn off Chrome's Web Security features. We've written a brand new reference that details why and how you could use this. {% url 'Cypress Web Security' web-security %}. This option can be used for accessing `cross origin` `<iframes>` or if your application needs to test navigation across super domains. Fixes [#262](https://github.com/cypress-io/cypress/issues/262).

**Bugfixes:**

- We now capture `cross origin` errors correctly instead of these showing as `Uncaught DOMExceptions` in the console. Fixes [#261](https://github.com/cypress-io/cypress/issues/261).
- We no longer trash the wrong folder on OSX in-app updates (when a project is open). Sorry about this! Fixes [#260](https://github.com/cypress-io/cypress/issues/260).
- {% url `cy.visit()` visit %} urls with domain-like segments (which weren't actually the domain) no longer cause Cypress to think you're trying to navigate to a different superdomain. Fixes [#255](https://github.com/cypress-io/cypress/issues/255).

# 0.17.6

*Released 10/04/2016*

**Features:**

- Snapshots will now be *pinned* when clicking on a command in the Command Log. This enables you to inspect the state of the DOM when the snapshot was taken. We've given you a new series of controls for turning off the element highlighting and hitboxes. Additionally we've given you the ability to manually click through each named snapshot when there are multiple states (like before and after). Fixes [#247](https://github.com/cypress-io/cypress/issues/247).

**Bugfixes:**

- Fixed a regression where tests that failed outside of a hook would incorrectly indicate themselves as a `before each` hook. In addition, in the default `spec`, reporter will now display the test name when a hook was the source of failure. Fixes [#253](https://github.com/cypress-io/cypress/issues/253).
- Fixed a deployment bug in the `core-desktop-gui`.
- We now prevent {% url `cy.visit()` visit %} from accidentally snapshotting twice.

**Misc:**

- {% url `cy.request()` request %} and {% url `cy.visit()` visit %} now correctly send `User-Agent` headers based on the current open browsing session. Fixes [#230](https://github.com/cypress-io/cypress/issues/230).

# 0.17.5

*Released 10/02/2016*

**Features:**

- We've added `JUnit` as a valid {% url 'built-in reporters' reporters %}. Fixes [#178](https://github.com/cypress-io/cypress/issues/178).
- You can now {% url 'add or write your own custom reporters' reporters %}. This means you can `npm install xyz-mocha-reporter` and we'll automatically correctly `require` that package. Alternatively you can write your own `xyz-custom_reporter.js` file. Fixes [#231](https://github.com/cypress-io/cypress/issues/231).
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

- Using subsequent {% url `cy.visit()` visit %}'s *in the same test* will not necessarily force a full page refresh. If all that changed was the hash of a url, then the hash changes will take affect **without** a full page refresh. This matches the behavior of a real browser. Previously {% url `cy.visit()` visit %} always forced a full page refresh and this was not correct.

**Features:**

- Using {% url `cy.visit()` visit %} now acts *exactly* how modifying the URL in a real browser works. This means that if you visit a url with a hash in it, instead of forcing a full page refresh, it will now simply modify the hash route as if you had manually changed it. This more accurately reflects real user behavior. Previously this was impossible to do with Cypress other than manually altering `window.location.hash`.

**Bugfixes:**

- Fixed a regression in `0.17.2` which caused **separate** tests that were visiting the same URL not to actually visit the new URL and eventually time out. We've updated some of our internal QA processes around this because we rarely have regressions and they are a pretty big deal. Fixes [#225](https://github.com/cypress-io/cypress/issues/225).
- Fixed displaying `(null)` contentType when a {% url `cy.visit()` visit %} returned a `404` status code. We now only display `contentType` when one exists.

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

- Attempting to {% url `cy.visit()` visit %} a non `text/html` resource will now throw a specific error message instead of bombing on page injection with an `<iframe`> origin error. You have to visit actual `html`, you cannot visit something like a `.json` or `.png`. If you're wanting to visit an API route on your backend that does something like set cookies (thus avoiding loading your UI) you can just use {% url `cy.request()` request %} for this since it will now automatically get and set cookies under the hood. Fixes [#211](https://github.com/cypress-io/cypress/issues/211).

**Bugfixes:**

- Fixed a regression in `0.17.1` that was incorrectly setting `Cache` headers. This *could* cause a situation where you received an `<iframe>` origin error. Additionally we now set `No-Cache` headers whenever we inject content, but otherwise respect the headers coming from web servers. When using Cypress as the file server, we set `etags` but prevent caching.
- Most likely fixed a bug that was crashing Cypress due to `Cannot set headers after they've been sent`. We were unable to write a test for this since we could not recreate the error, but analyzed how it *may* happen and fixed the code there. {% url 'Open an issue' https://github.com/cypress-io/cypress/issues/new %} if you see this error, it will be obvious since Cypress will literally crash.
- We stopped minifying `vendor.js` (for real this time). More optimizations to come around this.
- Prevented accidentally setting `domain` cookies when they were really `hostOnly` cookies, thus duplicating the number of cookies sent on requests. Kudos to [@bahmutov](https://github.com/bahmutov) for finding this one. Fixes [#207](https://github.com/cypress-io/cypress/issues/207).
- Fixed some edge cases in `cypress-core-extension` where it threw errors when attempting to `executeScript` on a tab with `about:blank` or `chrome://` urls.
- We've fixed some underlying issues with {% url `cy.go()` go %} while running headlessly. It always worked fine in real Chrome. Previously there were some situations where it would not navigate forward / back correctly.

**Misc:**

- No longer force {% url `cy.visit()` visit %} to navigate to `about:blank` prior to navigating to the real url. Fixes [#208](https://github.com/cypress-io/cypress/issues/208).
- {% url `cy.writeFile()` writefile %} can now accept an empty string. Fixes [#206](https://github.com/cypress-io/cypress/issues/206).
- Improved error messages for {% url `cy.readFile()` readfile %} and {% url `cy.writeFile()` writefile %}.
- The full file path is now included in console output for {% url `cy.readFile()` readfile %} and {% url `cy.writeFile()` writefile %}.
- The [Kitchen Sink](https://github.com/cypress-io/cypress-example-kitchensink) and `example_spec.js` have been updated to reflect the newest changes and features of `0.17.1`.

# 0.17.1

*Released 08/31/2016*

**Features:**

- You can now pass keyboard modifiers such as `ctrl`, `cmd`, `shift`, and `alt` to {% url `.type()` type %}. In addition we've added support for not "releasing" these keys so they can affect other actions such as {% url `.click()` click %}. Addresses [#196](https://github.com/cypress-io/cypress/issues/196).
- You can now type into the `<body>` or `document` as opposed to previously *having* to target a valid focusable element. This is useful in situations where you're testing keyboard shortcuts and do not want to target a specific element. Addresses [#150](https://github.com/cypress-io/cypress/issues/150).
- There is a new command {% url `cy.readFile()` readfile %} that reads files on your file system and changes the subject to the contents. Addresses [#179](https://github.com/cypress-io/cypress/issues/179).
- There is a new command {% url `cy.writeFile()` writefile %} that creates and/or writes contents to files on your file system. Addresses [#179](https://github.com/cypress-io/cypress/issues/179).

**Bugfixes:**

- {% url `defaultCommandTimeout` configuration#Timeouts %} now works correctly. The driver was still referencing the old `commandTimeout` value.
- The `__cypress.initial` cookie should now be removed during any {% url `cy.visit()` visit %}, which should fix some edge cases with the proxy accidentally injecting content when it shouldn't. We also added a ton more e2e tests covering these edge cases and other behavior.
- The proxy now restricts it's injection to only `Content-Type: text/html` headers so it will not accidentally inject into the wrong responses.

**Misc:**

- All {% url `cy.fixture()` fixture %} extensions are now supported and Cypress will no longer throw on extensions it doesn't recognize. For known fixture extensions we'll continue to apply a default `encoding` and for everything else it will default to `utf8`. Fixes [#200](https://github.com/cypress-io/cypress/issues/200).
- {% url `cy.fixture()` fixture %} now accepts `encoding` as a 2nd optional argument.
- We now display a keyboard 'modifiers' column when clicking on a {% url `.type()` type %} in the Command Log.

# 0.17.0

*Released 08/30/2016*

**Overview:**

- The desktop application has been completely redesigned. We have moved from a tray application to a standard dock application. The list of projects is now in the same window as the list of tests in a project. As each test runs, the application highlights the currently running spec and displays the browser version running. The configuration of a project is now displayed in it's own tab. There is now a Desktop Menu where you can logout, check for updates, or view help links.
- The test [runner](https://github.com/cypress-io/cypress-core-runner) has been rebuilt from the ground up in [React.js](https://facebook.github.io/react/). The left side of the runner called the [reporter](https://github.com/cypress-io/cypress-core-reporter) is now a separate application. This, as well as other changes, markedly improved the performance of running tests. *Your tests will now run faster.* This will also enable you to test your application in full screen. Additionally this paves the way for being able to spawn multiple browsers at once and synchronize testing across them. This also means we'll be able to support mobile browsers. The UI for doing this hasn't been implemented but the vast majority of the work to accomplish this is done now.
- We have rewritten the entire proxy layer of the Cypress server to finally fix all the problems with CORS.

**Breaking Changes:**

- You cannot {% url `cy.visit()` visit %} two different super domains within a single test. Example: `cy.visit('https://google.com').visit('https://apple.com')`. There shouldn't be any reason you ever need to do this in a single test, if you do, you should make these two separate tests.

**Features:**

- **All CORS related issues should finally be fixed now.** Cypress now internally switches to the domain that you used in your {% url `cy.visit()` visit %}. This means that the correct domain will display in the URL based on the application currently under test. Your application's code will run under the current domain at all times. Previously we implemented an endless amount of hacks and internal translations to figure out the domain you were *supposed* to be on without actually being on the domain. This caused code to behave different and caused subtle issues. Those issues should now be resolved. The entire proxy layer has been rewritten to handle all `https` certificates flawlessly, continue to inject (even on `https` pages), and still know when to automatically bypass injection so you can open other tabs while testing in Cypress. These new proxy changes also unlock the ability to do things like whitelisting or blacklisting specific 3rd party domains, or even be able to stub not just XHR's but any kind of `HTTP` request.
- `window.fetch` now works correctly. Stubbing these does not yet work but it is now possible for us to implement stubbing in a future version. Addresses [#95](https://github.com/cypress-io/cypress/issues/95).
- The list of tests now automatically refresh when test files are renamed, deleted, or added. In addition, because the list of tests is now displayed in the desktop application, we now synchronize the state of the current running spec.
- {% url `cy.visit()` visit %} has better error messages. Cypress now programmatically determines why a {% url `cy.visit()` visit %} failed and gives you a ridiculously accurate error message. Addresses [#138](https://github.com/cypress-io/cypress/issues/138).
- {% url `cy.visit()` visit %} now displays redirects and any cookies set.
- The currently running test is now scrolled into view. This behavior can be turned off by scrolling in the command log or selecting to disable auto-scroll at the top of the command log. Addresses [#194](https://github.com/cypress-io/cypress/issues/194)
- Tests in the Command Log now automatically expand when specific commands take longer than `1000ms` to run. Previously when running more than 1 test we did not expand commands until a test failed. Now they will be expanded and automatically collapsed whenever a single command is taking a long time to finish.
- We now have full blown subdomain support. This means you can now navigate to a subdomain either directly via a {% url `cy.visit()` visit %} or by navigating in your application naturally (such as clicking an `<a>`).
- {% url `cy.request()` request %} now attaches and sets cookies transparently on the browser. Even though the browser will not physically make the request, we automatically apply outgoing cookies *as if* the browser had made the request. Additionally we will automatically *set* cookies on the browser based on the response. This means you can use {% url `cy.request()` request %} to bypass not just CORS but handle things like automatically logging in without having to manually perform these actions in the UI.
- We now handle `HTTP` request errors much better. Previously if your web server sent us back a `4xx` or `5xx` response we would automatically send back a `500`. Now we transparently pass these through.
- Improved dozens of error messages.
- {% url `.debug()` debug %} output has been improved, and you can now easily inspect the current command's subject.
- Clicking the URL in the header of the runner now opens that URL in a new tab.

**Bugfixes:**

- Fixed URL proxy issue with subdomains. Fixes [#183](https://github.com/cypress-io/cypress/issues/183).
- Viewport size maximum has been decreased from `3001px` to `3000px` and minimum has been increased from `199px` to `200px` to match error messages. Fixes [#189](https://github.com/cypress-io/cypress/issues/189)
- Websockets are now correctly proxied through `https` and through subdomains different than the current domain under test.
- Stopped {% url `.debug()` debug %} from accidentally mutating subjects.
- Cypress now correctly injects and handles pages which are missing a `<head>`, a `<body`>, or even an `<html>` tag. Previously it would bomb on pages missing these tags.
- All commands with a long message (such as assertions) are automatically scaled down in font size and truncated properly. In addition, assertions will correctly bold the `expected` and `actual` values.

**Misc:**

- {% url '`cypress run`' cli-tool#cypress-run %} no longer requires being logged in.
- Renamed configuration option `commandTimeout` to {% url `defaultCommandTimeout` configuration %}. Cypress will transparently rewrite this if you have it in your `cypress.json`, so you don't have to do anything.
- Renamed `onConsole` and `onRender` Command Log options to `consoleProps` and `renderProps`. We still support the older property names for backwards compatibility.
- Added support for a command's `message` or `renderProps.message` to use markdown.
- The default value of `port` within a project's global {% url 'configuration' configuration %} has changed from `2020` to now being a random open port. You can still configure a specific `port` if needed within the {% url 'configuration' configuration %}.
- We have upgraded the `Chromium` that runs headlessly on {% url '`cypress run`' cli-tool#cypress-run %} to version `51`.
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

- {% url `cy.route()` route %} now accepts string glob patterns using [minimatch](https://github.com/isaacs/minimatch) under the hood. This means you can more easily route dynamic urls without using `regex`. Example: `cy.route('POST', '/users/*/comments', {})`.
- {% url `Cypress.minimatch` minimatch %}  is now exposed so you can easily test globbing patterns.
- {% url `.type()` type %} can now be used on non-input elements that have a `tabindex` attribute. Key events will fire but no text content will change and no input based events fire. Fixes [#172](https://github.com/cypress-io/cypress/issues/172).
- There is now an {% url `ignoreTestFiles` configuration %} configuration option that accepts an array of `glob` patterns. This enables you to ignore extraneous spec files that may be created during a build process. The default pattern is `*.hot-update.js` which will ignore dynamically generated webpack hot module swapping files. Fixes [#159](https://github.com/cypress-io/cypress/issues/159).

**Bugfixes:**

- Fixed a bug where Cypress could get into a weird state and continuously error due to the `before:log` event not being properly disposed. Fixes [#173](https://github.com/cypress-io/cypress/issues/173).
- Fixed a bug where invalid UTF-8 characters were being set in XHR headers which caused XHR's to fail. We now properly encode and decode all values. Fixes [#168](https://github.com/cypress-io/cypress/issues/168).
- Nested directories under `cypress/support` no longer cause a `500` when tests run. This was due to Cypress not ignoring directories and trying to serve them as regular files. Fixes [#163](https://github.com/cypress-io/cypress/issues/163).
- Fixed situations where 3rd party libraries (such as [New Relic](https://newrelic.com/) were instrumenting XHR's identical to Cypress' implementation. This caused an infinite loop which would crash the browser. We've updated how we instrument XHR's to take this into account and deployed multiple fallbacks and strategies to prevent this kind of thing from happening in the future. Fixes [#166](https://github.com/cypress-io/cypress/issues/166).

**Misc:**

- {% url `Cypress.Server.defaults()` cypress-server %} now accepts a `urlMatchingOptions` option for passing options to [minimatch](https://github.com/isaacs/minimatch).
- {% url '`cypress run`' cli-tool#cypress-run %} now exits with the number of test failures instead of always exiting with 0. This matches the same way `cypress ci` works. Fixes [#167](../.issues/167)
- In the {% url 'Cypress CLI tool' cli-tool %} package version `0.11.1`, you can now pass the `--spec` option to `cypress ci`. This enables you to run a specific spec file as opposed to all tests. Fixes [#161](https://github.com/cypress-io/cypress/issues/161).

# 0.16.2

*Released 06/11/2016*

**Features:**

- Added new {% url `cy.screenshot()` screenshot %} command which can take screenshots on demand.
- When running headlessly or in CI Cypress will now automatically take a screenshot when a test fails. You can optionally turn this off by setting {% url `screenshotOnHeadlessFailure` configuration#Screenshots %} to `false` in your configuration.
- Added new {% url `screenshotsFolder` configuration#Screenshots %} configuration option with default of `cypress/screenshots`.
- When running in [Circle CI](https://circleci.com/), we automatically export screenshots as artifacts which makes them available directly in their web UI. If you're using Circle CI, you'll be able to see screenshots without doing anything. If you're using [Travis CI](https://travis-ci.org/), you'll need to upload artifacts to an `s3 bucket`. This is a small slice of what is coming to help diagnose and understand errors in CI. Also in `0.17.0` we will automatically scroll the tests and more intelligently and open / close test commands so you can visually see what happened. Currently you may not see the test command's failure in the Command Log due to the view not scrolling.
- Added new {% url `.each()` each %} command which iterates serially on a collection yielding the iteratee, the index, and the collection. Addresses [#156](https://github.com/cypress-io/cypress/issues/156).
- {% url `cy.route()` route %} can now accept a single function and/or you can pass a function to the `response` property. This allows you to lazily evaluate routing responses. Great for referencing fixtures. Addresses [#152](https://github.com/cypress-io/cypress/issues/152).
- {% url `cy.contains()` contains %} now accepts a regular expression. Addresses [#158](https://github.com/cypress-io/cypress/issues/158).
- {% url `.type()` type %} now accepts `{downarrow}` and `{uparrow}`. We do not move the caret but do fire all the proper events. Addresses [#157](https://github.com/cypress-io/cypress/issues/157).

**Bugfixes:**

- {% url `cy.exec()` exec %} now outputs additional `stderr` and `stdout` information. It additionally will automatically `source` your `$SHELL` which makes GUI apps behave as if they've been launched from your terminal. Fixes [#153](https://github.com/cypress-io/cypress/issues/153) and fixes [#154](https://github.com/cypress-io/cypress/issues/154).
- {% url `.then()` then %} yielding nested subjects.
- {% url `cy.contains()` contains %} no longer returns the last element found when siblings both contain the same content. Fixes [#158](https://github.com/cypress-io/cypress/issues/158).
- Cypress no longer errors when you return a raw DOM element. It now correctly wraps this as the new subject.

**Misc:**

- {% url `cy.contains()` contains %} now provides an even more specific error message when it was scoped to a particular DOM element and contained a selector. Fixes [#160](https://github.com/cypress-io/cypress/issues/160).
- You will now see a very specific error message when we detect that you've mixed up `async` and `sync` code in a {% url `.then()` then %} callback function. An example would be queuing up a new cypress command but then synchronously returning a different value.

# 0.16.1

*Released 05/22/2016*

**Features:**

- {% url `Cypress.Cookies.debug()` cookies#Debug %} now works again. Additionally it provides much more feedback than it used to.
- {% url '`Cypress.Cookies.debug(true, {verbose: false})`' cookies#Debug %} option has been added to remove verbose cookie object logging.

**Bugfixes:**

- Copy / Paste now works when logging in on OSX. Fixes [#145](https://github.com/cypress-io/cypress/issues/145).
- Grammar: 'Login -> Log in'. Fixes [#146](https://github.com/cypress-io/cypress/issues/146).
- Cypress now uses the body instead of headers to send external requests. Fixes [#148](https://github.com/cypress-io/cypress/issues/148).
- When {% url `.then()` then %} throws this no longer prevents the next test from issuing any commands. Fixes [#149](https://github.com/cypress-io/cypress/issues/149).

**Misc:**

- Passing multiple arguments to {% url `.its()` its %} now throws and suggests you use {% url `.invoke()` invoke %}. Fixes [#147](https://github.com/cypress-io/cypress/issues/147).

# 0.16.0

*Released 05/17/2016*

**Notes:**

- Updating through the Desktop App in **Linux** does not work. To update please run {% url '`cypress install`' cli-tool#cypress-install %} from the command line.
- We are still updating the docs to reflect all of these changes.
- All users must *LOG IN AGAIN* and re-add their projects. Sorry, we've changed the way we store local data.

**Overview:**

- `0.16.0` marks a significant change for Cypress. Before this we only issued commands using regular JavaScript and coordinated these with the backend server which is running. As of `0.16.0` we are now tapping into the underlying browser automation libraries which enable us to exceed the limitations of the JavaScript sandbox. This means we have total control over the browser for more powerful automation tooling. The downside is that we have only implemented these API's for Chrome, and therefore running on multiple browsers will no longer work. This is a temporary setback as we'll be adding driver support for all of the other browsers over a period of time. You can read more about our browser management [here](https://docs.cypress.io/docs/browser-management).

**Breaking Changes:**

- Running tests in Cypress now requires either Chrome, Chromium, or Canary to be installed on your OS environment. We intend to expand support for more browsers in the future, but for now, only these 3 are supported.
- Removed support for `Cypress.Cookies.get`, `Cypress.Cookies.set` and `Cypress.Cookies.remove`.
- Changed return of {% url `cy.getCookies()` getcookies %} to return an array of cookies, each with properties include name, value, etc.
- Changed return of {% url `cy.clearCookies()` clearcookies %} to return null (previously was returning Cookie that was cleared).
- {% url `Cypress.Cookies.debug()` cookies#Debug %} has been temporarily disabled and will be re-enabled later.
- Browsers are spawned in a Cypress specific profile so that we can maintain a clean state apart of your regular browsing usage. You will notice that your extensions are no longer installed. This is on purpose. 3rd party extensions can often get in the way of Cypress and cause failures. However, developer specific extensions for Angular, Ember, and React do not cause any issues but you'll want to reinstall them. You only have to install them once and they will persist.
- The `whitelist` callback function of {% url `Cypress.Cookies.defaults()` cookies#Defaults %} now receives a `cookie object` instead of just the `cookies name` as a string.

**Features:**

- When a project is initially run from the desktop app, you can now choose to run Cypress in a select number of browsers including: Chrome, Chromium, or Canary (depending on what's installed on your OS).
- Browser sessions are spawned independently of your existing profiles and we've disabled things like password saving / prompting, JavaScript popup blocking, and other features which get in the way of testing. Read more [here](https://docs.cypress.io/docs/browser-management)
- We automatically spawn Chrome in a **custom theme** so you can visually distinguish the difference between browser sessions spawned with Cypress vs your normal sessions. We know this may feel a little jarring because you're used to running Cypress alongside your other tabs. You will now see 2 chrome icons in your dock and you'll need to switch between them. We know this is problematic and confusing and we're looking into **changing the icon** of the Chrome running Cypress so it's easier to tell the Chrome sessions apart.
- Added new commands to handle getting, setting, and clearing cookies: {% url `cy.clearCookie()` clearcookie %}, {% url `cy.getCookie()` getcookie %}, and {% url `cy.setCookie()` setcookie %}.
- All the `cy.cookie` commands have been upgraded to take new options and can do much more powerful things outside of the JavaScript sandbox.
- Upgraded the Chromium version running headlessly and in CI from `47` to `49`.
- There is a new {% url `cy.exec()` exec %} command that can execute any arbitrary system command. Additionally there is a new {% url `execTimeout` configuration#Timeouts %} configuration option which is set to `60s` by default. Fixes [#126](https://github.com/cypress-io/cypress/issues/126).
- There is a new {% url `numTestsKeptInMemory` configuration#Global %} configuration option that controls how many test's snapshots and command data is kept in memory while tests are running. Reducing this number will reduce the memory used in the browser while tests are running. Whatever this number is - is how many tests you can walk back in time when inspecting their snapshots and return values.  Addresses [#142](https://github.com/cypress-io/cypress/issues/142).

**Bugfixes:**

- Cypress taskbar icon now displays correctly in OS X dark theme. Fixes [#132](https://github.com/cypress-io/cypress/issues/132).
- Fixed issue where server error's stack traces were being truncated in the Desktop app rendering them impossible to debug. Fixes [#133](https://github.com/cypress-io/cypress/issues/133).
- woff Fonts are now properly served from a local file system when using Cypress' web server. Fixes [#135](https://github.com/cypress-io/cypress/issues/135).
- When an element's center is not visible the error message now includes the stringified element in question, and not `undefined`.
- Typing into an `input[type=tel]` now works. Fixes [#141](https://github.com/cypress-io/cypress/issues/141).
- XHR's which have their `onload` handler replaced after `XHR#send` is called is now properly accounted for. Fixes [#143](https://github.com/cypress-io/cypress/issues/143).

**Misc:**

- XHR requests for `.svg` files are no longer shown in the Command Log by default. Addresses [#131](https://github.com/cypress-io/cypress/issues/131).
- Improved error when {% url `cy.request()` request %} fails. The request parameters are now included in the error. Addresses [#134](https://github.com/cypress-io/cypress/issues/134).
- When running a project in the new Cypress browser environment, if a new tab is opened, a message now displays discouraging the use of multiple tabs while testing. Addresses [#9](https://github.com/cypress-io/cypress/issues/9).
- When navigating directly to `localhost:2020` outside of the new Cypress browser environment, a message now displays discouraging running tests outside of the new Cypress browser environment.
- If, for whatever reason, Cypress cannot communicate with the automation servers, your testing session will immediately end and you'll have the ability to re-spawn the browser.
- {% url `cy.fixture()` fixture %} now has a default timeout of `responseTimeout` which is `20s`.
- {% url `cy.fixture()` fixture %} can now properly time out and accepts an `options` argument that can override its default timeout.
- Improved initial Desktop Application startup performance by about `1.5s`.
- We now correctly store local data in each operating system's correct `Application Data` area. This will be more resilient to upgrades in the future.
- Running Cypress in a linux VM on VirtualBox no longer displays "black screens".
- Our internal proxy no longer strips `HttpOnly` cookie flags.
- Improved command errors and normalized many of them. Fixes [#137](https://github.com/cypress-io/cypress/issues/137).
- JavaScript popup blocking is now disabled and will not interfere with running tests. Fixes [#125](https://github.com/cypress-io/cypress/issues/125).
- We now capture synchronous errors from XHR `onreadystatechange` handlers.
