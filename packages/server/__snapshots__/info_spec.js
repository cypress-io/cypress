exports['two browsers with firefox having profile folder'] = `
Displaying Cypress info...

Detected 2 browsers installed:

1. Chrome
  - Name: chrome
  - Channel: stable
  - Version: 12.34.56
  - Executable: /path/to/google-chrome

2. Firefox Dev
  - Name: firefox
  - Channel: dev
  - Version: 79.0a1
  - Executable: /path/to/firefox
  - Profile: /path/to/user/firefox/profile

Note: to run these browsers, pass <name>:<channel> to the '--browser' field

Examples:
- cypress run --browser chrome
- cypress run --browser firefox:dev

Learn More: https://on.cypress.io/launching-browsers

`

exports['output without any browsers'] = `
Displaying Cypress info...

Detected no known browsers installed


`

exports['single chrome:stable'] = `
Displaying Cypress info...

Detected 1 browser installed:

1. Chrome
  - Name: chrome
  - Channel: stable
  - Version: 12.34.56
  - Executable: /path/to/google-chrome

Note: to run these browsers, pass <name>:<channel> to the '--browser' field

Examples:
- cypress run --browser chrome

Learn More: https://on.cypress.io/launching-browsers

`

exports['two browsers'] = `
Displaying Cypress info...

Detected 2 browsers installed:

1. Chrome
  - Name: chrome
  - Channel: stable
  - Version: 12.34.56
  - Executable: /path/to/google-chrome

2. Firefox Dev
  - Name: firefox
  - Channel: dev
  - Version: 79.0a1
  - Executable: /path/to/firefox

Note: to run these browsers, pass <name>:<channel> to the '--browser' field

Examples:
- cypress run --browser chrome
- cypress run --browser firefox:dev

Learn More: https://on.cypress.io/launching-browsers

`
