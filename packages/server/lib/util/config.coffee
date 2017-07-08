
module.exports = {
  isDefault: (config, prop) ->
    config.resolved[prop].from is "default"
}
