import { saveStudio, verifyCommandLog, verifyVisit } from '../support'

Cypress.config('isTextTerminal', false)

// this whole thing has to run outside of a test to get the proper 0 state
// so we bind to the start event rather than using an `it` block
Cypress.on('run:start', () => {
  const $document = Cypress.$(window.top.document.body)

  // can't use Cypress commands outside of a test so we're limited to jquery
  if ($document.find('.no-tests')[0]) {
    $document.find('.open-studio')[0].click()
  } else {
    Cypress.config('isTextTerminal', true)
    Cypress.emit('run:end')

    // use setTimeout to push to the end of the stack after render
    setTimeout(() => {
      $document.find('.runner').find('.input-active')[0].click()

      // react is super funky when it comes to event handling
      // and this is the 'simplest' way to mock an change event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set

      nativeInputValueSetter.call($document.find('.runner').find('.input-active')[0], 'new.html')

      const changeEvent = new Event('input', { bubbles: true })

      $document.find('.runner').find('.input-active')[0].dispatchEvent(changeEvent)

      setTimeout(() => {
        $document.find('.runner').find('.btn-submit')[0].click()

        // we can finally use Cypress commands which makes it super easy from here on out
        cy.get('.btn', { log: false }).click({ log: false })

        verifyVisit('new.html')

        verifyCommandLog(2, {
          selector: '.btn',
          name: 'click',
        })

        saveStudio('My New Test')
      })
    })
  }
})
