import _ from 'lodash'
import os from 'os'
import { app, nativeImage as image } from 'electron'
// eslint-disable-next-line no-duplicate-imports
import type { WebContents } from 'electron'
import * as cyIcons from '@packages/icons'
import * as savedState from '../saved_state'
import menu from '../gui/menu'
import * as Windows from '../gui/windows'
import { makeGraphQLServer } from '@packages/graphql/src/makeGraphQLServer'
import { DataContext, globalPubSub, getCtx, clearCtx } from '@packages/data-context'
import type { LaunchArgs, PlatformName } from '@packages/types'
import { EventEmitter } from 'events'
import debugLib from 'debug'
import Events from '../gui/events'

const debug = debugLib('cypress:server:interactive')

const isDev = () => {
  return Boolean(process.env['CYPRESS_INTERNAL_ENV'] === 'development')
}

export = {
  isMac () {
    return os.platform() === 'darwin'
  },

  getWindowArgs (state) {
    // Electron Window's arguments
    // These options are passed to Electron's BrowserWindow
    const minWidth = Math.round(/* 13" MacBook Air */ 1792 / 3) // Thirds

    const preferredWidth = 1200
    const minHeight = 400
    const preferredHeight = 800

    const chooseDimensions = ({ preferred, previous, minimum }) => {
      // If the user doesn't have a previous size that's valid or big
      // enough, use the preferred size instead.
      if (!previous || previous < minimum) {
        return preferred
      }

      return previous
    }

    const common = {
      // The backgroundColor should match the value we will show in the
      // launchpad frontend.

      // When we use a dist'd launchpad (production), this color won't be
      // as visible. However, in our local dev setup (launchpad running via
      // a dev server), the backgroundColor will flash if it is a
      // different color.
      backgroundColor: 'white',

      // Dimensions of the Electron window on initial launch.
      // Because we are migrating users that may have
      // a width smaller than the min dimensions, we will
      // force the dimensions to be within the minimum bounds.
      //
      // Doing this before launch (instead of relying on minW + minH)
      // prevents the window from jumping.
      width: chooseDimensions({
        preferred: preferredWidth,
        minimum: minWidth,
        previous: state.appWidth,
      }),

      height: chooseDimensions({
        preferred: preferredHeight,
        minimum: minHeight,
        previous: state.appHeight,
      }),

      minWidth,
      minHeight,

      x: state.appX,
      y: state.appY,
      type: 'INDEX',
      devTools: state.isAppDevToolsOpen,
      trackState: {
        width: 'appWidth',
        height: 'appHeight',
        x: 'appX',
        y: 'appY',
        devTools: 'isAppDevToolsOpen',
      },
      onBlur (this: {webContents: WebContents}) {
        if (this.webContents.isDevToolsOpened()) {
          return
        }

        return Windows.hideAllUnlessAnotherWindowIsFocused()
      },
      onFocus () {
        // hide internal dev tools if in production and previously focused
        // window was the electron browser
        menu.set({ withInternalDevTools: isDev() })

        return Windows.showAll()
      },
      onClose () {
        app.quit()
      },
    }

    return _.extend(common, this.platformArgs())
  },

  platformArgs () {
    const args = {
      darwin: {
        show: true,
        frame: true,
        transparent: false,
      },

      linux: {
        show: true,
        frame: true,
        transparent: false,
        icon: image.createFromPath(cyIcons.getPathToIcon('icon_64x64.png')),
      },
    }

    return args[os.platform()]
  },

  /**
   * @param {import('@packages/types').LaunchArgs} options
   * @returns
   */
  ready (options: {projectRoot?: string} = {}, port: number) {
    const { projectRoot } = options
    const ctx = getCtx()

    // TODO: potentially just pass an event emitter
    // instance here instead of callback functions
    menu.set({
      withInternalDevTools: isDev(),
      onLogOutClicked () {
        return globalPubSub.emit('menu:item:clicked', 'log:out')
      },
      getGraphQLPort: () => {
        return ctx?.gqlServerPort
      },
    })

    return savedState.create(projectRoot, false).then((state) => state.get())
    .then((state) => {
      return Windows.open(projectRoot, port, this.getWindowArgs(state))
      .then((win) => {
        ctx?.actions.electron.setBrowserWindow(win)
        Events.start({
          ...(options as LaunchArgs),
          onFocusTests () {
            // @ts-ignore
            return app.focus({ steal: true }) || win.focus()
          },
          os: os.platform() as PlatformName,
        }, new EventEmitter())

        return win
      })
    })
  },

  async run (options, ctx: DataContext) {
    const [, port] = await Promise.all([
      app.whenReady(),
      makeGraphQLServer(),
    ])

    // Before the electron app quits, we interrupt and ensure the current
    // DataContext is completely destroyed prior to quitting the process.
    // Parts of the DataContext teardown are asynchronous, particularly the
    // closing of open file watchers, and not awaiting these can cause
    // the electron process to throw.
    // https://github.com/cypress-io/cypress/issues/22026

    app.once('will-quit', (event: Event) => {
      // We must call synchronously call preventDefault on the will-quit event
      // to halt the current quit lifecycle
      event.preventDefault()

      debug('clearing DataContext prior to quit')

      // We use setImmediate to guarantee that app.quit will be called asynchronously;
      // synchronously calling app.quit in the will-quit handler prevent the subsequent
      // close from occurring
      setImmediate(async () => {
        try {
          await clearCtx()
        } catch (e) {
          // Silently handle clearCtx errors, we still need to quit the app
          debug(`DataContext cleared with error: ${e?.message}`)
        }

        debug('DataContext cleared, quitting app')

        app.quit()
      })
    })

    return this.ready(options, port)
  },
}
