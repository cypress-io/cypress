import { randomComponents } from './testStubSpecs'
import * as fs from 'fs'
import * as path from 'path'

const argv = process.argv

if (argv.includes('--help') || argv.includes('-h') || argv.length < 5 || !['Spec', 'FileParts'].includes(argv[4])) {
  // eslint-disable-next-line no-console
  console.log(
    'yarn generate-stub-specs <filename> <n> <baseTypeName> [--app]\n' +
    '<baseTypeName> is Spec or FileParts',
  )

  process.exit()
}

const components = randomComponents(parseInt(argv[3]), argv[4] as ('Spec' | 'FileParts'))

const root = argv.includes('--app')
  ? path.join(__dirname, '../../app')
  : path.join(__dirname, '..')

fs.writeFile(path.join(root, 'cypress/fixtures', `${argv[2]}.json`), JSON.stringify(components, null, 2), (err) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  } else {
    // eslint-disable-next-line no-console
    console.log('fixture generation succeeded.')
  }
})
