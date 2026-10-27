import shell from 'shelljs'
import { resolve } from 'path'

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// For each npm package that is re-published via cypress/*
// make sure that it is also copied into the build directory
const npmModulesToCopy: string[] = [
  'mount-utils',
  'react',
  'vue',
  'angular',
  'svelte',
]

npmModulesToCopy.forEach((folder: string) => {
  // cli/mount-utils => cli/build/mount-utils
  const from: string = resolve(`${__dirname}/../${folder}`)
  const to: string = resolve(`${__dirname}/../build/${folder}`)

  // `cp -R` into an existing folder nests the copy inside it (build/react/react),
  // and the build runs this step again over an existing build folder
  shell.rm('-rf', to)
  shell.cp('-R', from, to)
})
