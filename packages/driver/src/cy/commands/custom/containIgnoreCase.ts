// Example custom command implementation
Cypress.Commands.add(
  'containIgnoreCase',
  { prevSubject: 'element' },
  (subject, text: string) => {
    const actualText = subject.text().toLowerCase()
    const expectedText = text.toLowerCase()
    expect(actualText).to.include(expectedText)
  }
)
