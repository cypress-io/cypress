import { app } from 'electron'

process.stdout.write(`${process.version.replace('v', '')}\n`, () => {
  app.exit(0)
})
