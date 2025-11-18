export function tagsDisabled () {
  return process.env.ELECTRON_ENABLE_LOGGING === '1' || process.env.CYPRESS_INTERNAL_ENV === 'development'
}
