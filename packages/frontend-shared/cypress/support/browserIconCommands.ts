declare global {
  namespace Cypress {
    interface Chainable {
      verifyBrowserIconSvg(
        expectedSvgData: string
      ): Chainable<JQuery<HTMLElement>>
    }
  }
}

function verifyBrowserIconSvg (
  subject: JQuery<HTMLElement>,
  expectedSvgData: string,
) {
  cy.then(() => {
    let actualSvgData = ''

    subject.each((_, el) => {
      actualSvgData += el.outerHTML
    })

    const actualNormalizedSvgData = actualSvgData
    .replaceAll('></path>', '/>')
    .replaceAll('></circle>', '/>')
    .replace(/<title>.*<\/title>/, '')

    const expectedNormalizedSvgData = expectedSvgData.replace(/<defs>.*<\/defs>/, '')

    expect(actualNormalizedSvgData).to.equal(expectedNormalizedSvgData)

    return subject
  })
}

Cypress.Commands.add(
  'verifyBrowserIconSvg',
  { prevSubject: true },
  verifyBrowserIconSvg,
)

export {}
