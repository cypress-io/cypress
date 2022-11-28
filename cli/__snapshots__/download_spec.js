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

Does your workplace require a proxy to be used to access the Internet? If so, you must configure the HTTP_PROXY environment variable before downloading Cypress. Read more: https://on.cypress.io/proxy-configuration

Otherwise, please check network connectivity and try again:

----------

URL: https://download.cypress.io/desktop?platform=OS&arch=x64
404 - Not Found

----------

Platform: OS-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['latest desktop url 1'] = `
https://download.cypress.io/desktop?platform=OS&arch=ARCH
`

exports['specific version desktop url 1'] = `
https://download.cypress.io/desktop/0.20.2?platform=OS&arch=ARCH
`

exports['desktop url from template'] = `
https://download.cypress.io/desktop/0.20.2/OS-ARCH/cypress.zip
`

exports['desktop url from template with version'] = `
https://mycompany/0.20.2/OS-ARCH/cypress.zip
`

exports['desktop url from template with escaped dollar sign'] = `
https://download.cypress.io/desktop/0.20.2/OS-ARCH/cypress.zip
`

exports['desktop url from template wrapped in quote'] = `
https://download.cypress.io/desktop/0.20.2/OS-ARCH/cypress.zip
`

exports['desktop url from template with escaped dollar sign wrapped in quote'] = `
https://download.cypress.io/desktop/0.20.2/OS-ARCH/cypress.zip
`
