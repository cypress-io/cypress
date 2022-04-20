import '@testing-library/cypress/add-commands'
import './styles.css'

before(() => {
  window.supportFileWasLoaded = true
})
