# Cypress Core Desktop Gui [![CircleCI](https://circleci.com/gh/cypress-io/cypress-core-desktop-gui.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-core-desktop-gui)

![core-desktop-gui](https://cloud.githubusercontent.com/assets/1271364/18134339/0fab0644-6f6c-11e6-8816-5d4528de6108.png)

The desktop GUI is the desktop application [installed](https://on.cypress.io/installing-cypress) to the user's OS using the `cypress install` command from the [Cypress CLI](https://on.cypress.io/cli) or through [direct download](http://download.cypress.io/desktop).

The desktop GUI has the following responsibilities:

- Allowing users to login through GitHub.
- Allowing users to add projects to be tested in Cypress.
- Displaying existing projects and allowing the removal of projects.
- Initializing the server to run on a specific project.
- Allowing users to choose a specific browser to run tests within.
- Displaying the resolved configuration of a running project.
- Displaying the list of tests of a running project.
- Initializing the run of a specific test file or all tests chosen by the user.
- Notifying users of updates to Cypress and initializing update process.


## Development

### Lint

```bash
npm run lint
```

### Building

#### For development

```bash
npm run build
```

#### For production

```bash
npm run build-prod
```

### Watching

```bash
npm run watch
```

### Testing

```bash
npm test-once
```

### Debugging

If you want to see the `ipc` events which are pending from Cypress tests:

- Switch to 'Your App' frame
- App.ipc() <-- returns you object with pending events


## License
MIT


## Changelog

#### 0.4.9 - *(04/20/17)*
- bump cypress deps

#### 0.4.8 - *(04/14/17)*
- properly await browser closing
- new spec data structure

#### 0.4.7 - *(04/12/17)*
- colorize browser icons
- display browser tooltip + icon
- update ipc events

#### 0.4.6 - *(03/07/17)*
- provide help links to explain orgs + access

#### 0.4.5 - *(02/11/17)*
- added --record flag

#### 0.4.4 - *(02/11/17)*
- more slug renaming

#### 0.4.3 - *(02/10/17)*
- updated content
- renamed slugs

#### 0.4.2 - *(02/10/17)*
- merged missed PR

#### 0.4.1 - *(02/10/17)*
- display runs
- new settings areas
- request access
- add project to Dashboard

#### 0.4.0 - *(01/04/17)*
- builds list, adding project for ci

#### 0.3.15 - *(01/29/17)*
- display all scaffolded files

#### 0.3.14 - *(01/29/17)*
- LGPL -> MIT
- correctly replace new lines on errors
- rename sessionToken -> authToken
- display full list of scaffolded files

#### 0.3.13 - *(11/15/16)*
- camelize session token

#### 0.3.12 - *(11/14/16)*
- fix missing lib js file

#### 0.3.11 - *(11/14/16)*
- updated config to display 'env' property instead of inaccurately named 'environmentVariables' property

#### 0.3.10 - *(10/14/16)*
- missing lib folder

#### 0.3.9 - *(10/14/16)*
- fixed errors with undefined values being called

#### 0.3.8 - *(10/13/16)*
- explain how to manually update cypress during update fail

#### 0.3.7 - *(10/05/16)*
- shrinkwrap to prevent breaking dep change

#### 0.3.6 - *(10/03/16)*
- deploy proper prod files, fix mobx action undefined values

#### 0.3.5 - *(09/13/16)*
- previously chosen browser is saved per user and selected by default

#### 0.3.4 - *(08/31/16)*
- fix github focus button

#### 0.3.3 - *(08/30/16)*
- added applying updates view

#### 0.3.2 - *(08/30/16)*
- fixes dist dir and updates.html

#### 0.3.1 - *(08/30/16)*
- fix for incorrect references in index.html

#### 0.3.0 - *(08/30/16)*
- new UI, migrated to react

#### 0.2.2
- renamed Login -> Log In

#### 0.2.1
- internal updates to cypress.json settings change notification

#### 0.2.0
- display list of launchable browsers
- handle error when no browsers available

#### 0.1.5
- updated node version to 5.10.0

#### 0.1.4
- added link to gitter chat in options popup

#### 0.1.3
- added specific error msg and link to docs on unauthed login

#### 0.1.2
- updated license

#### 0.1.1
- renamed to cypress-core-desktop-gui
- removed dead code

#### 0.1.0
- initial release
