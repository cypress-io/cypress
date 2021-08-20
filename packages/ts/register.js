// prevent esbuild from including snapshot related modules
const hook = './hook'

// Ensuring we only hook the require once
if (require.name !== 'customRequire') {
  require(`${hook}-require`)
}
