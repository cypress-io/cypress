import _ from 'lodash'
import os from 'os'
import { app, nativeImage as image } from 'electron'
// eslint-disable-next-line no-duplicate-imports
import type { WebContents } from 'electron'
import cyIcons from '@cypress/icons'
import savedState from '../saved_state'
import menu from '../gui/menu'
import Events from '../gui/events'
import * as Windows from '../gui/windows'
import { runInternalServer } from './internal-server'
import type { LaunchArgs, PlatformName } from '@packages/types'
import EventEmitter from 'events'

const isDev = () => {
  return process.env['CYPRESS_INTERNAL_ENV'] === 'development'
}

interface State {
  appX?: number
  appY?: number
  appWidth?: number
  appHeight?: number
  isAppDevToolsOpen?: boolean
}

const platformArgs = {
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

function getWindowArgs (state: State) {
  // Electron Window's arguments
  // These options are passed to Electron's BrowserWindow
  const minWidth = Math.round(/* 13" MacBook Air */ 1792 / 3) // Thirds

  const preferredWidth = 1200
  const minHeight = 800
  const preferredHeight = 800

  const chooseDimensions = (preferred: number, minimum: number, previous?: number) => {
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
    width: chooseDimensions(
      preferredWidth,
      minWidth,
      state.appWidth,
    ),

    height: chooseDimensions(
      preferredHeight,
      minHeight,
      state.appHeight,
    ),

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

  return _.extend(common, platformArgs[os.platform()])
}

async function ready (options: LaunchArgs) {
  const { serverPortPromise, bus, ctx } = process.env.LAUNCHPAD
    ? runInternalServer(options)
    : { bus: new EventEmitter, serverPortPromise: Promise.resolve(undefined), ctx: null }

  // TODO: potentially just pass an event emitter
  // instance here instead of callback functions
  menu.set({
    withDevTools: isDev(),
    onLogOutClicked () {
      return bus.emit('menu:item:clicked', 'log:out')
    },
    getGraphQLPort: () => {
      return ctx?.gqlServerPort
    },
  })

  const [port, state] = await Promise.all([
    serverPortPromise,
    savedState.create(options.projectRoot, false).then((state) => state.get()),
  ])

  const win = await Windows.open(options.projectRoot, port, getWindowArgs(state))

  // TODO(lachlan): once unified is merged, ctx will no longer be nullable,
  // so we should remove this (and any other) ctx?. checks that exist.
  ctx?.actions.electron.setBrowserWindow(win)

  Events.start({
    ...(options as LaunchArgs),
    onFocusTests () {
      // @ts-ignore
      return app.focus({ steal: true }) || win.focus()
    },
    os: os.platform() as PlatformName,
  }, bus)

  return win
}

export async function run (options: LaunchArgs) {
  await app.whenReady()

  return ready(options)
}
