// buildBaseFullConfig
//   - validateConfigRoot
//   - grab testing type opts from config file & validate testing type opts
//   - grab testing type opts from args??? & validate testing type opts

//   merge defaults & again validate multiple levels

// type validationLevel = ''

const validateConfiguration = (validationLevel, config) => {

}

// start cypress & parse CLI arguments

const showWarningForInvalidConfig = (options) => {
  const publicConfigKeys = getPublicConfigKeys()
  const invalidConfigOptions = require('lodash').keys(options.config).reduce((invalid, option) => {
    if (!publicConfigKeys.find((configKey) => configKey === option)) {
      invalid.push(option)
    }

    return invalid
  }, [])

  if (invalidConfigOptions.length && options.invokedFromCli) {
    return require('./errors').warning('INVALID_CONFIG_OPTION', invalidConfigOptions)
  }
}
