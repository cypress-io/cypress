const installCustomPercyCommand = ({ before, elementOverrides } = {}) => {
  const customPercySnapshot = (origFn, name, options = {}) => {
    return
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}

module.exports = installCustomPercyCommand
