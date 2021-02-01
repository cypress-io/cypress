import { builders as b } from 'ast-types'
import Promise from 'bluebird'
import * as recast from 'recast'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'

import Fixtures from '../../support/helpers/fixtures'
import fs from '../../../lib/util/fs'
import { generateCypressCommand, addCommandsToBody, generateTest, appendCommandsToTest, createNewTestInSuite } from '../../../lib/util/spec_writer'

const mockSpec = Fixtures.get('projects/studio/cypress/integration/unwritten.spec.js')

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
  // recast doesn't play nicely with mockfs so we do it manually
  beforeEach(() => {
    sinon.stub(fs, 'readFile').resolves(mockSpec)
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

  describe('#generateTest', () => {
    it('creates a new test with body', () => {
      const testBody = b.blockStatement([])

      addCommandsToBody(testBody.body, exampleTestCommands)

      const test = generateTest('my new test', testBody)

      verifyOutput(test)
    })
  })

  describe('#appendCommandsToTest', () => {
    it('can add commands to an existing test defined with it', () => {
      appendCommandsToTest({
        absoluteFile: '',
        line: 3,
        column: 5,
      }, exampleTestCommands)
    })

    it('can add commands to an existing test defined with specify', () => {
      appendCommandsToTest({
        absoluteFile: '',
        line: 7,
        column: 5,
      }, exampleTestCommands)
    })

    it('can add commands to an existing test defined with it only', () => {
      appendCommandsToTest({
        absoluteFile: '',
        line: 12,
        column: 8,
      }, exampleTestCommands)
    })
  })

  describe('#createNewTestInSuite', () => {
    it('can create a new test in a suite defined with describe', () => {
      createNewTestInSuite({
        absoluteFile: '',
        line: 2,
        column: 3,
      }, exampleTestCommands, 'test added to describe')
    })

    it('can create a new test in a suite defined with context', () => {
      createNewTestInSuite({
        absoluteFile: '',
        line: 17,
        column: 3,
      }, exampleTestCommands, 'test added to context')
    })

    it('can create a new test in a suite defined with describe only', () => {
      createNewTestInSuite({
        absoluteFile: '',
        line: 22,
        column: 12,
      }, exampleTestCommands, 'test added to describe only')
    })
  })
})
