import { removeFirstElement } from '../../src/utils/removeFirstElement'

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

    const actualNormalizedSvgData = removeFirstElement(
      actualSvgData
      .replaceAll('></path>', '/>')
      .replaceAll('></circle>', '/>'),
      'title',
    )

    const expectedNormalizedSvgData = removeFirstElement(expectedSvgData, 'defs')

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
