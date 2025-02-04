import '@testing-library/cypress/add-commands'
import './styles.css'

before(() => {
  // @ts-expect-error
  window.supportFileWasLoaded = true
})
