const overrideOption = (key, wrapperFn) => pluginFn => async (pluginConfig, options) => {
  const overriddenValue = await wrapperFn(options[key]);
  return pluginFn(pluginConfig, { ...options, [key]: overriddenValue });
};

module.exports = overrideOption;
