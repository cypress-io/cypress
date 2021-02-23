import { saveStudio, verifyCommandLog, verifyVisit } from '../support'

Cypress.config('isTextTerminal', false)

Cypress.on('run:start', () => {
  const $document = Cypress.$(window.top.document.body)

  if ($document.find('.no-tests')[0]) {
    $document.find('.open-studio')[0].click()
  } else {
    Cypress.config('isTextTerminal', true)
    Cypress.emit('run:end')

    setTimeout(() => {
      $document.find('.runner').find('.input-active')[0].click()

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set

      nativeInputValueSetter.call($document.find('.runner').find('.input-active')[0], 'new.html')

      const changeEvent = new Event('input', { bubbles: true })

      $document.find('.runner').find('.input-active')[0].dispatchEvent(changeEvent)

      setTimeout(() => {
        $document.find('.runner').find('.btn-submit')[0].click()

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
