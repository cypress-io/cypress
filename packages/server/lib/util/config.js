module.exports = {
  isDefault (config, prop) {
    return config.resolved[prop].from === 'default'
  },
}
