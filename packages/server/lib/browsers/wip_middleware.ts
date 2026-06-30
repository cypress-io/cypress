import { DocumentDomainBehavior } from '@packages/network-tools'

const documentDomainBehavior = new DocumentDomainBehavior()

// these should all be driven ports
export type ForGetAutUrl<T> = (ctx: T) => Promise<string>

export type ForGetTopUrl<T> = (ctx: T) => Promise<string>

export type ForIsAutFrame<T> = (ctx: T) => Promise<boolean>
// end driven ports

// business logic for determining if top needs to be simulated. takes ports. we would need to adapt the middleware in packages/proxy and packages/browser-automation to this structure
export const doesTopNeedToBeSimulated = (currentAUTUrl: string, currentTopUrl: string, isAutFrame: boolean): boolean => {
  // if the AUT url is undefined for whatever reason, return false as we do not want to complicate top simulation
  if (!currentAUTUrl || currentAUTUrl === 'about:blank') {
    return false
  }

  // only simulate top if the AUT is NOT the primary super domain origin, meaning that we should treat the AUT as top
  // or the request is the AUT frame, which is common for redirects and navigations.
  // return !ctx.remoteStates.isPrimarySuperDomainOrigin(currentAUTUrl) || ctx.req.isAUTFrame

  const topOrigin = documentDomainBehavior.getOrigin(currentTopUrl)
  const autOrigin = documentDomainBehavior.getOrigin(currentAUTUrl)

  // NOTE: I need to figure out how the current primarySuperDomainOrigin stuff works with injectDocumentDomain.
  // it feels like regardless of document domain being injected or not, we STILL need to simulate top if the origins do NOT match
  // top MUST be simulated if the AUT origin and top origin do NOT match
  return !documentDomainBehavior.urlsMatch(topOrigin, autOrigin) || isAutFrame
}
