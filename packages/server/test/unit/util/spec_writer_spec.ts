import { builders as b } from 'ast-types'
import Promise from 'bluebird'
import * as recast from 'recast'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'
import { expect } from 'chai'

import Fixtures from '../../support/helpers/fixtures'
import { fs } from '../../../lib/util/fs'
import {
  generateCypressCommand,
  addCommandsToBody,
  convertCommandsToText,
  generateTest,
  appendCommandsToTest,
  createNewTestInSuite,
  createNewTestInFile,
  createFile,
  countStudioUsage,
} from '../../../lib/util/spec_writer'

const mockSpec = Fixtures.get('projects/studio/cypress/integration/unwritten.spec.js')
const emptyCommentsSpec = Fixtures.get('projects/studio/cypress/integration/empty-comments.spec.js')
const writtenSpec = Fixtures.get('projects/studio/cypress/integration/written.spec.js')

const exampleTestCommands = [
  {
    selector: '.input',
    name: 'type',
    message: 'typed text',
  }, {
    selector: '.btn',
    name: 'click',
  },
]

const verifyOutput = (ast) => {
  const { code } = recast.print(ast)

  snapshot(code)
}

describe('lib/util/spec_writer', () => {
  let readFile

  // recast doesn't play nicely with mockfs so we do it manually
  beforeEach(() => {
    readFile = sinon.stub(fs, 'readFile').resolves(mockSpec)
    sinon.stub(fs, 'writeFile').callsFake((path, output) => {
      snapshot(output)

      return Promise.resolve()
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('#generateCypressComand', () => {
    it('can generate a full command', () => {
      const command = generateCypressCommand({
        selector: '.input',
        name: 'type',
        message: 'typed text',
      })

      verifyOutput(command)
    })

    it('can generate a command with no message', () => {
      const command = generateCypressCommand({
        selector: '.btn',
        name: 'click',
      })

      verifyOutput(command)
    })

    it('can generate a command with an array as message', () => {
      const command = generateCypressCommand({
        selector: '.select',
        name: 'select',
        message: ['one', 'two', 'three'],
      })

      verifyOutput(command)
    })

    it('can generate a command with no selector', () => {
      const command = generateCypressCommand({
        name: 'visit',
        message: 'the://url',
      })

      verifyOutput(command)
    })
  })

  describe('#addCommandsToBody', () => {
    it('adds commands with comments', () => {
      const program = b.program([])

      addCommandsToBody(program.body, exampleTestCommands)

      verifyOutput(program)
    })
  })

  describe('#convertCommandsToText', () => {
    it('converts studio commands to resulting text', () => {
      const code = convertCommandsToText(exampleTestCommands)

      snapshot(code)
    })
  })

  describe('#generateTest', () => {
    it('creates a new test with body', () => {
      const testBody = b.blockStatement([])

      addCommandsToBody(testBody.body, exampleTestCommands)

      const test = generateTest('my new test', testBody)

      verifyOutput(test)
    })
  })

  describe('#appendCommandsToTest', () => {
    context('by file details', () => {
      it('can add commands to an existing test defined with it', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 3,
            column: 5,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can add commands to an existing test defined with specify', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 7,
            column: 5,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can add commands to an existing test defined with it only', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 12,
            column: 8,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can add commands to an existing test with config', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 16,
            column: 8,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })
    })

    context('by test title', () => {
      it('can add commands to an existing test defined with it', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'test with it',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can add commands to an existing test defined with specify', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'test with specify',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can add commands to an existing test defined with it only', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'test with it only',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can add commands to an existing test with config', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'test with config',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('returns false when there are multiple tests with given title', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'test with same title',
          commands: exampleTestCommands,
        }

        return appendCommandsToTest(saveDetails).then((success) => {
          expect(success).to.be.false
        })
      })
    })
  })

  describe('#createNewTestInSuite', () => {
    context('by file details', () => {
      it('can create a new test in a suite defined with describe', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 2,
            column: 3,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
          testName: 'test added to describe',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can create a new test in a suite defined with context', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 21,
            column: 3,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
          testName: 'test added to context',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can create a new test in a suite defined with describe only', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 26,
            column: 12,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
          testName: 'test added to describe only',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can create a new test in a suite with config', () => {
        const saveDetails = {
          fileDetails: {
            absoluteFile: '',
            line: 30,
            column: 12,
          },
          absoluteFile: '',
          runnableTitle: '',
          commands: exampleTestCommands,
          testName: 'test added to describe with config',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })
    })

    context('by suite title', () => {
      it('can create a new test in a suite defined with describe', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'inner suite with describe',
          commands: exampleTestCommands,
          testName: 'test added to describe',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can create a new test in a suite defined with context', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'inner suite with context',
          commands: exampleTestCommands,
          testName: 'test added to context',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can create a new test in a suite defined with describe only', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'inner suite with describe only',
          commands: exampleTestCommands,
          testName: 'test added to describe only',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('can create a new test in a suite with config', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'suite with config',
          commands: exampleTestCommands,
          testName: 'test added to describe with config',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.true
        })
      })

      it('returns false when there are multiple suites with given title', () => {
        const saveDetails = {
          absoluteFile: '',
          runnableTitle: 'suite with same title',
          commands: exampleTestCommands,
          testName: 'new test',
        }

        return createNewTestInSuite(saveDetails).then((success) => {
          expect(success).to.be.false
        })
      })
    })
  })

  describe('#createNewTestInFile', () => {
    it('can create a new test in the root of a file', () => {
      return createNewTestInFile('', exampleTestCommands, 'test added to file')
    })

    it('preserves comments in a completely empty spec', () => {
      readFile.resolves(emptyCommentsSpec)

      return createNewTestInFile('', exampleTestCommands, 'test added to empty file')
    })
  })

  describe('#createFile', () => {
    it('creates a new file with templated comments', () => {
      return createFile('/path/to/project/cypress/integration/my_new_spec.js')
    })
  })

  describe('#countStudioUsage', () => {
    it('returns 0s when nothing was created with Studio', () => {
      return countStudioUsage('').then(({ studioCreated, studioExtended }) => {
        expect(studioCreated).to.eq(0)
        expect(studioExtended).to.eq(0)
      })
    })

    it('returns accurate counts of Studio usage', () => {
      readFile.resolves(writtenSpec)

      return countStudioUsage('').then(({ studioCreated, studioExtended }) => {
        expect(studioCreated).to.eq(2)
        expect(studioExtended).to.eq(4)
      })
    })
  })
})
