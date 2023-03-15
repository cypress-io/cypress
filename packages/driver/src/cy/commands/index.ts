import * as Actions from './actions'

import * as Agents from './agents'

import * as Aliasing from './aliasing'

import * as Asserting from './asserting'

import * as Clock from './clock'

import * as Commands from './commands'

import * as Connectors from './connectors'

import * as Cookies from './cookies'

import * as Debugging from './debugging'

import * as Exec from './exec'

import * as Files from './files'

import * as Fixtures from './fixtures'

import * as Intercept from './intercept'

import * as Location from './location'

import * as Misc from './misc'

import * as Origin from './origin'

import * as Popups from './popups'

import * as Navigation from './navigation'

import * as Querying from './querying'

import * as Request from './request'

import Screenshot from './screenshot'

import * as Sessions from './sessions'

import Storage from './storage'

import * as Task from './task'

import * as Traversals from './traversals'

import * as Waiting from './waiting'

import Window from './window'

import * as Xhr from './xhr'

export const allCommands = {
  ...Actions,
  Agents,
  Aliasing,
  Asserting,
  Clock,
  Commands,
  Connectors,
  Cookies,
  Debugging,
  Exec,
  Files,
  Fixtures,
  ...Intercept,
  Location,
  Misc,
  Origin,
  Popups,
  Navigation,
  ...Querying,
  Request,
  Screenshot,
  Sessions,
  Storage,
  Task,
  Traversals,
  Waiting,
  Window,
  Xhr,
}
