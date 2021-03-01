/* eslint-disable no-console */
import chalk from 'chalk'
import browsers from '@packages/server/lib/browsers'
import openProject from '@packages/server/lib/open_project'

export * from './src/socket-ct'

export * from './src/server-ct'

export * from './src/project-ct'

export * from './src/specs-store'

// Partial because there are probably other options that are not included in this type.
export const start = async (projectRoot: string, args: Record<string, any>) => {
  // add chrome as a default browser if none has been specified
  return browsers.ensureAndGetByNameOrPath(args.browser)
  .then((browser: Cypress.Browser) => {
    const spec = {
      name: 'All Specs',
      absolute: '__all',
      relative: '__all',
      specType: 'component',
    }

    const options = {
      browsers: [browser],
    }

    return openProject.create(projectRoot, args, options)
    .then((project) => {
      return openProject.launch(browser, spec, {
        onBrowserClose: () => {
          console.log(chalk.blue('BROWSER EXITED SAFELY'))
          console.log(chalk.blue('COMPONENT TESTING STOPPED'))
          process.exit()
        },
      })
    })
  })
}
