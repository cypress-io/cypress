module.exports = (onFn, config) => {
  process.stderr.write('Plugin Loaded\n')
  process.stderr.write(`Plugin Node version: ${process.versions.node}\n`)
  process.stderr.write(`Plugin Electron version: ${process.versions.electron}\n`)
}
