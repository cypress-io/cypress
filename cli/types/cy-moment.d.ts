import moment = require('moment')
export = Moment
export as namespace Moment

declare namespace Moment {
  type MomentStatic = typeof moment
}
