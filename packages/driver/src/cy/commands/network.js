module.exports = (Commands, Cypress) => {
  Commands.addAll({
    network: (options = {}) => {
      Cypress.automation('remote:debugger:protocol', {
        command: 'Network.enable',
      })

      Cypress.automation('remote:debugger:protocol', {
        command: 'Network.emulateNetworkConditions',
        params: {
          offline: options.offline,
          'latency': 0,
          'downloadThroughput': 0,
          'uploadThroughput': 0,
          'connectionType': 'none',
        },
      })
    },
  })
}
