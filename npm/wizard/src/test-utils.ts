import { SinonSpyCallApi } from 'sinon'

export function someOfSpyCallsIncludes (spy: any, logPart: string) {
  return spy.getCalls().some(
    (spy: SinonSpyCallApi<unknown[]>) => {
      return spy.args.some((callArg) => typeof callArg === 'string' && callArg.includes(logPart))
    },
  )
}
