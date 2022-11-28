// example Cypress support file
Cypress.Commands.add('customCommand', () => {})

function add (a: number, b: number) {
  return a + b
}

Cypress.Commands.add('add', add)
