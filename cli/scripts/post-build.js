const shell = require('shelljs')
const { resolve } = require('path')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// For each npm package that is re-published via cypress/*
// make sure that it is also copied into the build directory
const npmModulesToCopy = [
  'mount-utils',
  'react',
  'react18',
  'vue',
  'vue2',
  'angular',
  'svelte',
]

npmModulesToCopy.forEach((folder) => {
  // cli/mount-utils => cli/build/mount-utils
  const from = resolve(`${__dirname}/../${folder}`)
  const to = resolve(`${__dirname}/../build/${folder}`)

  shell.cp('-R', from, to)
})
