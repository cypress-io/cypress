require('@cypress/code-coverage/support')

beforeEach(() => {
  const container = document.getElementById('cypress-jsdom')
  if (container) {
    container.innerHTML = ''
  }
})
