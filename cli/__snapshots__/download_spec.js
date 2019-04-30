exports['base url from CYPRESS_DOWNLOAD_MIRROR 1'] = `
https://cypress.example.com/desktop/0.20.2?platform=OS&arch=ARCH
`

exports['base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory 1'] = `
https://cypress.example.com/example/desktop/0.20.2?platform=OS&arch=ARCH
`

exports['base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory and trailing slash 1'] = `
https://cypress.example.com/example/desktop/0.20.2?platform=OS&arch=ARCH
`

exports['base url from CYPRESS_DOWNLOAD_MIRROR with trailing slash 1'] = `
https://cypress.example.com/desktop/0.20.2?platform=OS&arch=ARCH
`

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
