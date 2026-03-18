import shell from 'shelljs'

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.cp('-R', 'dist', 'build')
