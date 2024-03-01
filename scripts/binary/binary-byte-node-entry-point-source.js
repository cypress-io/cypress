const compile = async () => {
  const bytenode = await import('bytenode')
  const path = require('path')

  await bytenode.compileFile({
    filename: path.join(__dirname, 'packages', 'server', 'index.js'),
    output: path.join(__dirname, 'packages', 'server', 'index.jsc'),
  })
}

compile().then(() => {
  process.exit()
})
