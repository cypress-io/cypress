import 'sinon-chai'
import style from 'ansi-styles'
import chai, { expect } from 'chai'
/* eslint-disable no-console */
import chalk from 'chalk'
import sinon, { SinonSpy } from 'sinon'
import * as errors from '../../src'
import { parseResolvedPattern } from '../../src/errorUtils'

chai.use(require('@cypress/sinon-chai'))

describe('lib/errors', () => {
  beforeEach(() => {
    sinon.restore()
    sinon.spy(console, 'log')
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
      const err = errors.getError('NO_PROJECT_ID', '/path/to/project/cypress.json')

      const ret = errors.log(err)

      expect(ret).to.be.undefined

      expect(console.log).to.be.calledWithMatch('/path/to/project/cypress.json')
    })

    it('logs err.details', () => {
      const userError = new Error('asdf')

      const err = errors.get('CONFIG_FILE_UNEXPECTED_ERROR', 'foo/bar/baz', userError)

      const ret = errors.log(err)

      expect(ret).to.be.undefined

      expect(console.log).to.be.calledWithMatch('foo/bar/baz')

      expect(console.log).to.be.calledWithMatch(chalk.magenta(userError.stack ?? ''))
    })

    describe('err.stack', () => {
      it('is logged if not a known Cypress error', () => {
        const err = new Error('foo')

        const ret = errors.log(err)

        expect(ret).to.eq(err)

        expect(console.log).to.be.calledWith(chalk.red(err.stack ?? ''))
      })

      it('is not logged if a known Cypress error', () => {
        const err = new Error('foo')

        err['isCypressErr'] = true

        const ret = errors.log(err)

        expect(ret).to.be.undefined

        expect(console.log).not.to.be.calledWith(chalk.red(err.stack ?? ''))
      })
    })

    context('err.cause', () => {
      let err

      beforeEach(() => {
        err = new Error('foo')
        err['cause'] = err
      })

      it('is not logged if a known Cypress error', () => {
        err['isCypressErr'] = true

        const ret = errors.log(err)

        expect(ret).to.be.undefined

        expect(console.log).not.to.be.calledWith(chalk.red('Caused by:'))
      })

      it('is not logged if max cause depth === 0', () => {
        const ret = errors.log(err, 'red', 0)

        expect(ret).to.eq(ret)

        expect(console.log).not.to.be.calledWith(chalk.red('Caused by:'))
      })

      it('is logged to a specified max depth', () => {
        const ret = errors.log(err, 'red', 5)

        expect(ret).to.eq(err)

        const causeLogs = (console.log as SinonSpy).getCalls().filter((call) => call.args[0] === chalk.red('Caused by:'))

        expect(causeLogs).to.have.length(5)
      })
    })
  })

  context('.clone', () => {
    it('converts err.message from ansi to html with span classes when html true', () => {
      const err = new Error(`foo${chalk.blue('bar')}${chalk.yellow('baz')}`)
      const obj = errors.cloneErr(err, { html: true })

      expect(obj.message).to.eq('foo<span class="ansi-blue-fg">bar</span><span class="ansi-yellow-fg">baz</span>')
    })

    it('does not convert err.message from ansi to html when no html option', () => {
      const err = new Error(`foo${chalk.blue('bar')}${chalk.yellow('baz')}`)
      const obj = errors.cloneErr(err)

      expect(obj.message).to.eq('foo\u001b[34mbar\u001b[39m\u001b[33mbaz\u001b[39m')
    })
  })

  describe('.parseResolvedPattern', () => {
    const folderPath = '/dev/cypress/packages/server'

    it('splits common paths', () => {
      const pattern = '/dev/cypress/packages/server/cypress/integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).to.eq('/dev/cypress/packages/server')
      expect(resolvedPattern).to.eq('cypress/integration/**notfound**')
    })

    it('splits common paths factoring in ../', () => {
      const pattern = '/dev/cypress/packages/server/../../integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).to.eq('/dev/cypress')
      expect(resolvedPattern).to.eq('integration/**notfound**')
    })

    it('splits common paths until falsy instead of doing an intersection', () => {
      const pattern = '/private/var/cypress/integration/cypress/integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).to.eq('')
      expect(resolvedPattern).to.eq('/private/var/cypress/integration/cypress/integration/**notfound**')
    })

    it('splits common paths up directories until root is reached', () => {
      const pattern = '/../../../../../../../cypress/integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).to.eq('')
      expect(resolvedPattern).to.eq('/cypress/integration/**notfound**')
    })
  })
})
