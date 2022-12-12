// ***********************************************
// This example commands.js shows you how to
// create the custom commands: 'createDefaultTodos'
// and 'createTodo'.
//
// The commands.js file is a great place to
// modify existing commands and create custom
// commands for use throughout your tests.
//
// You can read more about custom commands here:
// https://on.cypress.io/commands
// ***********************************************

Cypress.Commands.add('createDefaultTodos', function () {
  let TODO_ITEM_ONE = 'buy some cheese'
  let TODO_ITEM_TWO = 'feed the cat'
  let TODO_ITEM_THREE = 'book a doctors appointment'

  // begin the command here, which by will display
  // as a 'spinning blue state' in the UI to indicate
  // the command is running
  let cmd = Cypress.log({
    name: 'create default todos',
    message: [],
    consoleProps () {
      // we're creating our own custom message here
      // which will print out to our browsers console
      // whenever we click on this command
      return {
        'Inserted Todos': [TODO_ITEM_ONE, TODO_ITEM_TWO, TODO_ITEM_THREE],
      }
    },
  })

  // additionally we pass {log: false} to all of our
  // sub-commands so none of them will output to
  // our command log
  const opts = { log: false }

  cy.get('.new-todo', opts)
  .type(`${TODO_ITEM_ONE}{enter}`, opts)
  .type(`${TODO_ITEM_TWO}{enter}`, opts)
  .type(`${TODO_ITEM_THREE}{enter}`, opts)

  cy.get('.todo-list li', { log: false })
  .should('have.length', 3)
  .and(($listItems) => {
    // check the text in each list item
    expect($listItems[0], 'first item').to.have.text(TODO_ITEM_ONE)
    expect($listItems[1], 'second item').to.have.text(TODO_ITEM_TWO)
    expect($listItems[2], 'third item').to.have.text(TODO_ITEM_THREE)
  })

  // select the elements again to avoid the alias including
  // the assertions, as they might not be passing
  // when the test code uses the alias
  cy.get('.todo-list li', { log: false }).then(function ($listItems) {
    // once we're done inserting each of the todos
    // above we want to return the .todo-list li's
    // to allow for further chaining and then
    // we want to snapshot the state of the DOM
    // and end the command so it goes from that
    // 'spinning blue state' to the 'finished state'
    cmd.set({ $el: $listItems }).snapshot().end()
  })
})

Cypress.Commands.add('createTodo', function (todo) {
  let cmd = Cypress.log({
    name: 'create todo',
    message: todo,
    consoleProps () {
      return {
        'Inserted Todo': todo,
      }
    },
  })

  // create the todo
  cy.get('.new-todo', { log: false }).type(`${todo}{enter}`, { log: false })

  // now go find the actual todo
  // in the todo list so we can
  // easily alias this in our tests
  // and set the $el so its highlighted
  cy.get('.todo-list', { log: false })
  .contains('li', todo.trim(), { log: false })
  .then(function ($li) {
    // set the $el for the command so
    // it highlights when we hover over
    // our command
    cmd.set({ $el: $li }).snapshot().end()
  })
})
