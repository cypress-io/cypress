exports['download status errors 1'] = `
Error: The Cypress App could not be downloaded.

Please check network connectivity and try again:
----------

URL: https://download.cypress.io/desktop?platform=OS&arch=ARCH
404 - Not Found
----------

Platform: darwin (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['latest desktop url 1'] = `
https://download.cypress.io/desktop?platform=OS&arch=ARCH
`

exports['specific version desktop url 1'] = `
https://download.cypress.io/desktop/0.20.2?platform=OS&arch=ARCH
`
