export function load ({ support, specs }, specKey) {
  return support.load()
  .then(specs[specKey].load)
  .then(() => console.info(`Loaded ${specKey} successfully`))
  .catch((err) => console.error(`Failed to load ${specKey}`, err))
}
