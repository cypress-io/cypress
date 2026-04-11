import CryptoJS from 'crypto-js'

// NOTE: in order to run these tests, the following config flags need to be set
//    experimentalModifyObstructiveThirdPartyCode=true
describe('Integrity Preservation', { browser: '!webkit' }, () => {
  // Add common SRI hashes used when setting script/link integrity.
  // These are the ones supported by SRI (see https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity#using_subresource_integrity)
  // For our tests, we will use CryptoJS to calculate these hashes as they can regenerate the integrity without us having to do it manually every
  // single time the file changes. But if needed, this can be generated manually in the console by running simply run:
  //     cat integrity.js|css | openssl dgst -sha384 -binary | openssl base64 -A
  // the outputted hash is appended to the algorithm name, all lowercase with a trailing dash. For example:
  //     sha256-MGkilwijzWAi/LutxKC+CWhsXXc6t1tXTMqY1zakP8c=
  // See https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity on SRI integrity.

  const availableDigests = ['SHA256', 'SHA384', 'SHA512']
  const integrityJSDigests: {[key: string]: string} = {}
  const integrityCSSDigests: {[key: string]: string} = {}

  const renderTemplate = (data: {
    staticScriptInjection?: boolean
    dynamicScriptInjection?: boolean
    staticLinkInjection?: boolean
    dynamicLinkInjection?: boolean
    integrityValue: string
  }) => {
    let html = `<!DOCTYPE html>
<!-- NOTE: This is an EJS template used by the origin/integrity.cy.ts to test regex rewriting integrity -->
<!-- using this fixture without compiling and rendering the template will cause errors -->
<html>
  <head>
    <title>DOM Fixture</title>
  </head>
  <body>
    <h1 data-cy="integrity-header">Integrity Scripts</h1>
  </body>`

    if (data && data.staticLinkInjection) {
      html += `
    <!-- static link injection -->
    <!-- the actual integrity of the file is: ${data.integrityValue} -->
    <link id="static-set-integrity-link" rel="stylesheet" href="integrity.css" integrity="${data.integrityValue}">`
    }

    if (data && data.staticScriptInjection) {
      html += `
    <!-- static script injection -->
    <!-- the actual integrity of the file is: ${data.integrityValue} -->
    <script id="static-set-integrity-script" type="text/javascript" src="integrity.js" data-script-type="static" crossorigin="anonymous" integrity="${data.integrityValue}"></script>`
    }

    if (data && data.dynamicScriptInjection) {
      html += `
    <!-- dynamic script injection-->
    <script type="text/javascript">
      const dynamicIntegrityScript = document.createElement('script')
      dynamicIntegrityScript.id = 'dynamic-set-integrity-script'
      dynamicIntegrityScript.type = 'text/javascript'
      dynamicIntegrityScript.src = 'integrity.js'
      dynamicIntegrityScript.setAttribute('crossorigin', "anonymous")
      dynamicIntegrityScript.setAttribute('data-script-type', 'dynamic')
      // the actual integrity of the file is: ${data.integrityValue}
      dynamicIntegrityScript.setAttribute('integrity', "${data.integrityValue}")
      ${''}
      document.querySelector('head').appendChild(dynamicIntegrityScript)
    </script>`
    }

    if (data && data.dynamicLinkInjection) {
      html += `
    <!-- dynamic link injection -->
    <script id="dynamic-link-injection" type="text/javascript">
      const dynamicIntegrityScript = document.createElement('link')
      dynamicIntegrityScript.id = 'dynamic-set-integrity-link'
      dynamicIntegrityScript.rel = "stylesheet"
      dynamicIntegrityScript.href = 'integrity.css'
      dynamicIntegrityScript.setAttribute('crossorigin', "anonymous")
      // the actual integrity of the file is: ${data.integrityValue}
      dynamicIntegrityScript.setAttribute('integrity', "${data.integrityValue}")
      ${''}
      document.querySelector('head').appendChild(dynamicIntegrityScript)
    </script>`
    }

    html += `
</html>`

    return html
  }

  before(() => {
    // Before running our tests, we need to build out digests to inject into our HTML ejs template
    // so we can set the integrity tag appropriately for the digest.

    // This requires building digests for the integrity JS file that the regex-rewriter will rewrite.
    cy.readFile('cypress/fixtures/integrity.js').then((integrityJS) => {
      availableDigests.forEach((algo) => {
        const hash = CryptoJS[algo](integrityJS)
        const stringifiedBase64 = hash.toString(CryptoJS.enc.Base64)

        integrityJSDigests[algo] = stringifiedBase64
      })
    })

    // And building digests for the integrity CSS file that SHOULDN'T be impacted, but important to test against.
    cy.readFile('cypress/fixtures/integrity.css').then((integrityCSS) => {
      availableDigests.forEach((algo) => {
        const hash = CryptoJS[algo](integrityCSS)
        const stringifiedBase64 = hash.toString(CryptoJS.enc.Base64)

        integrityCSSDigests[algo] = stringifiedBase64
      })
    })
  })

  describe('<script> tags', () => {
    availableDigests.forEach((algo) => {
      it(`preserves integrity with static <script> in HTML with ${algo} integrity.`, () => {
        cy.then(() => {
          const compiledTemplate = renderTemplate({
            staticScriptInjection: true,
            integrityValue: `${algo.toLowerCase()}-${integrityJSDigests[algo]}`,
          })

          cy.intercept('http://www.foobar.com:3500/fixtures/scripts-with-integrity.html', compiledTemplate)
        })

        cy.visit('fixtures/primary-origin.html')
        cy.get('[data-cy="integrity-link"]').click()
        cy.origin('http://www.foobar.com:3500', () => {
          // The added script, if integrity matches, should execute and
          // add a <p> element with 'integrity script loaded' as the text
          cy.get('#integrity', {
            timeout: 1000,
          }).should('contain', 'integrity script loaded')

          cy.get('#static-set-integrity-script').should('have.attr', 'cypress-stripped-integrity')
        })
      })

      it(`preserves integrity with dynamically added <script> in HTML with ${algo} integrity.`, () => {
        cy.then(() => {
          const compiledTemplate = renderTemplate({
            dynamicScriptInjection: true,
            integrityValue: `${algo.toLowerCase()}-${integrityJSDigests[algo]}`,
          })

          cy.intercept('http://www.foobar.com:3500/fixtures/scripts-with-integrity.html', compiledTemplate)
        })

        cy.visit('fixtures/primary-origin.html')
        cy.get('[data-cy="integrity-link"]').click()
        cy.origin('http://www.foobar.com:3500', () => {
          // The added script, if integrity matches, should execute and
          // add a <p> element with 'integrity script loaded' as the text
          cy.get('#integrity', {
            timeout: 1000,
          }).should('contain', 'integrity script loaded')

          cy.get('#dynamic-set-integrity-script').should('have.attr', 'cypress-stripped-integrity')
        })
      })
    })
  })

  describe('<link> tags', () => {
    availableDigests.forEach((algo) => {
      it(`preserves integrity with static <link> in HTML with ${algo} integrity.`, () => {
        cy.then(() => {
          const compiledTemplate = renderTemplate({
            staticLinkInjection: true,
            integrityValue: `${algo.toLowerCase()}-${integrityCSSDigests[algo]}`,
          })

          cy.intercept('http://www.foobar.com:3500/fixtures/scripts-with-integrity.html', compiledTemplate)
        })

        cy.visit('fixtures/primary-origin.html')
        cy.get('[data-cy="integrity-link"]').click()
        cy.origin('http://www.foobar.com:3500', () => {
          cy.get('[data-cy="integrity-header"]', {
            timeout: 1000,
          }).then((integrityHeader) => {
            // The added link, if integrity matches, should execute and
            // add a color 'red' to the data-cy="integrity-header" element
            expect(window.getComputedStyle(integrityHeader[0]).getPropertyValue('color')).to.equal('rgb(255, 0, 0)')
          })

          cy.get('#static-set-integrity-link').should('have.attr', 'cypress-stripped-integrity')
        })
      })

      it(`preserves integrity with dynamically added <link> in HTML with ${algo} integrity.`, () => {
        cy.then(() => {
          const compiledTemplate = renderTemplate({
            dynamicLinkInjection: true,
            integrityValue: `${algo.toLowerCase()}-${integrityCSSDigests[algo]}`,
          })

          cy.intercept('http://www.foobar.com:3500/fixtures/scripts-with-integrity.html', compiledTemplate)
        })

        cy.visit('fixtures/primary-origin.html')
        cy.get('[data-cy="integrity-link"]').click()
        cy.origin('http://www.foobar.com:3500', () => {
          cy.get('[data-cy="integrity-header"]', {
            timeout: 1000,
          }).then((integrityHeader) => {
            // The added link, if integrity matches, should execute and
            // add a color 'red' to the data-cy="integrity-header" element
            expect(window.getComputedStyle(integrityHeader[0]).getPropertyValue('color')).to.equal('rgb(255, 0, 0)')
          })

          cy.get('#dynamic-set-integrity-link').should('have.attr', 'cypress-stripped-integrity')
        })
      })
    })
  })
})
