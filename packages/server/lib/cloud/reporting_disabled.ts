// Whether the user has turned off the reports Cypress sends without an account
// behind them.
//
// Any value on CYPRESS_DISABLE_GUEST_TELEMETRY turns them off. Crash and error
// reports are sent whether or not anyone is logged in, so they answer to it as
// well as to CYPRESS_CRASH_REPORTS, which predates it, names crash reports alone
// and is read for the one value documented for it.
export const isReportingDisabled = (): boolean => {
  return Boolean(process.env.CYPRESS_DISABLE_GUEST_TELEMETRY) || process.env.CYPRESS_CRASH_REPORTS === '0'
}
