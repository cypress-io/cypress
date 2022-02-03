/* eslint-disable no-console */
import chalk from 'chalk'
import style from 'ansi-styles'
import snapshot from 'snap-shot-it'
import sinon from 'sinon'
import 'sinon-chai'

import * as errors from '../../src'
import chai, { expect } from 'chai'

chai.use(require('@cypress/sinon-chai'))

describe('lib/errors', () => {
  beforeEach(() => {
    sinon.restore()
    sinon.stub(console, 'log')
  })

  context('.log', () => {
    it('uses red by default', () => {
      const err = errors.get('NOT_LOGGED_IN')

      const ret = errors.log(err)

      expect(ret).to.be.undefined

      const {
        red,
      } = style

      expect(console.log).to.be.calledWithMatch(red.open)

      expect(console.log).to.be.calledWithMatch(red.close)
    })

    it('can change the color', () => {
      const err = errors.get('NOT_LOGGED_IN')

      const ret = errors.log(err, 'yellow')

      expect(ret).to.be.undefined

      const {
        yellow,
      } = style

      expect(console.log).to.be.calledWithMatch(yellow.open)

      expect(console.log).to.be.calledWithMatch(yellow.close)
    })

    it('logs err.message', () => {
      const err = errors.getError('NO_PROJECT_ID', 'cypress.json', 'foo/bar/baz')

      const ret = errors.log(err)

      expect(ret).to.be.undefined

      expect(console.log).to.be.calledWithMatch('foo/bar/baz')
    })

    it('logs err.details', () => {
      const err = errors.get('PLUGINS_FUNCTION_ERROR', 'foo/bar/baz', 'details huh')

      const ret = errors.log(err)

      expect(ret).to.be.undefined

      expect(console.log).to.be.calledWithMatch('foo/bar/baz')

      expect(console.log).to.be.calledWithMatch(`\n${ chalk.yellow('details huh')}`)
    })

    it('logs err.stack in development', () => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'

      const err = new Error('foo')

      const ret = errors.log(err)

      expect(ret).to.eq(err)

      expect(console.log).to.be.calledWith(chalk.red(err.stack ?? ''))
    })
  })

  context('.clone', () => {
    it('converts err.message from ansi to html with span classes when html true', () => {
      const err = new Error(`foo${chalk.blue('bar')}${chalk.yellow('baz')}`)
      const obj = errors.clone(err, { html: true })

      expect(obj.message).to.eq('foo<span class="ansi-blue-fg">bar</span><span class="ansi-yellow-fg">baz</span>')
    })

    it('does not convert err.message from ansi to html when no html option', () => {
      const err = new Error(`foo${chalk.blue('bar')}${chalk.yellow('baz')}`)
      const obj = errors.clone(err)

      expect(obj.message).to.eq('foo\u001b[34mbar\u001b[39m\u001b[33mbaz\u001b[39m')
    })
  })

  context('.displayFlags', () => {
    it('returns string formatted from selected keys', () => {
      const options = {
        tags: 'nightly,staging',
        name: 'my tests',
        unused: 'some other value',
      }
      // we are only interested in showig tags and name values
      // and prepending them with custom prefixes
      const mapping = {
        tags: '--tag',
        name: '--name',
      }
      const text = errors.errorUtils.displayFlags(options, mapping)

      return snapshot('tags and name only', text.val)
    })
  })
})
