import _ from 'lodash'
import os from 'os'
import { app, nativeImage as image } from 'electron'
// eslint-disable-next-line no-duplicate-imports
import type { WebContents } from 'electron'
import cyIcons from '@cypress/icons'
import * as savedState from '../saved_state'
import menu from '../gui/menu'
import * as Windows from '../gui/windows'
import { makeGraphQLServer } from '@packages/graphql/src/makeGraphQLServer'
import { DataContext, globalPubSub, getCtx } from '@packages/data-context'
import type { LaunchArgs, PlatformName } from '@packages/types'
import { EventEmitter } from 'events'
import Events from '../gui/events'

const isDev = () => {
  // TODO: (tim) ensure the process.env.LAUNCHPAD gets removed before release
  return Boolean(process.env['CYPRESS_INTERNAL_ENV'] === 'development' || process.env.LAUNCHPAD)
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
    const minHeight = 800
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
        // hide dev tools if in production and previously focused
        // window was the electron browser
        menu.set({ withDevTools: isDev() })

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
        icon: image.createFromPath(cyIcons.getPathToIcon('icon_128x128.png')),
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
      withDevTools: isDev(),
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

    return this.ready(options, port)
  },
}
