/// <reference path="../../cli/types/cy-blob-util.d.ts" />
/// <reference path="../../cli/types/cy-bluebird.d.ts" />
/// <reference path="../../cli/types/cy-moment.d.ts" />
/// <reference path="../../cli/types/cy-minimatch.d.ts" />
/// <reference path="../../cli/types/lodash/index.d.ts" />
/// <reference path="../../cli/types/sinon/index.d.ts" />
/// <reference path="../../cli/types/jquery/index.d.ts" />

/// <reference path="../../cli/types/cypress-npm-api.d.ts" />

/// <reference path="../../cli/types/net-stubbing.ts" />
/// <reference path="../../cli/types/cypress.d.ts" />
/// <reference path="../../cli/types/cypress-global-vars.d.ts" />
/// <reference path="../../cli/types/cypress-type-helpers.d.ts" />

declare namespace SocketIO {
  interface Socket {
    inReporterRoom: boolean
    inRunnerRoom: boolean
  }
}
