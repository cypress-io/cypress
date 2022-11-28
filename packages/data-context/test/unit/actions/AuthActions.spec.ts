import type { DataContext } from '../../../src'
import { AuthActions } from '../../../src/actions/AuthActions'
import { createTestDataContext } from '../helper'
import sinon, { SinonStub } from 'sinon'
import sinonChai from 'sinon-chai'
import chai, { expect } from 'chai'
import { FoundBrowser } from '@packages/types'

chai.use(sinonChai)

describe('AuthActions', () => {
  context('.login', () => {
    let ctx: DataContext
    let actions: AuthActions

    beforeEach(() => {
      sinon.restore()

      ctx = createTestDataContext('open')

      ;(ctx._apis.authApi.logIn as SinonStub)
      .resolves({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })

      actions = new AuthActions(ctx)
    })

    it('sets coreData.user', async () => {
      await actions.login()
      expect(ctx.coreData.user).to.include({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })
    })

    it('focuses the main window if there is no activeBrowser', async () => {
      ctx.coreData.activeBrowser = null

      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).to.be.calledOnce
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).to.not.be.called
    })

    it('focuses the main window if the activeBrowser does not support focus', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      sinon.stub(ctx.browser, 'isFocusSupported').withArgs(browser).resolves(false)

      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).to.be.calledOnce
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).to.not.be.called
    })

    it('focuses the main window if the activeBrowser supports focus, but browser is closed', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'closed'

      sinon.stub(ctx.browser, 'isFocusSupported').withArgs(browser).resolves(true)

      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).to.be.calledOnce
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).to.not.be.called
    })

    it('focuses the main window if the activeBrowser supports focus, but browser is opening', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'opening'

      sinon.stub(ctx.browser, 'isFocusSupported').withArgs(browser).resolves(true)

      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).to.be.calledOnce
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).to.not.be.called
    })

    it('focuses the browser if the activeBrowser does support focus and browser is open', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'open'

      sinon.stub(ctx.browser, 'isFocusSupported').withArgs(browser).resolves(true)

      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).to.not.be.called
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).to.be.calledOnce
    })

    it('does not focus anything if the activeBrowser does support focus but the main window is focused', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      sinon.stub(ctx.browser, 'isFocusSupported').withArgs(browser).resolves(true)

      ;(ctx._apis.electronApi.isMainWindowFocused as SinonStub).returns(true)

      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).to.not.be.called
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).to.not.be.called
    })
  })
})
