import type { QueryResolvers as CloudQueryResolvers, Resolver } from '../gen/cloud-source-types.gen'
import type { NexusGenInterfaceNames, NexusGenObjectNames, NexusGenUnionNames } from '../gen/nxs.gen'

export type CloudRemoteTargets = {
  [K in NexusGenObjectNames | NexusGenUnionNames | NexusGenInterfaceNames]:
  K extends `Cloud${string}` ? (K extends `${string}${'Edge'}` ? never : K) : never
}[NexusGenObjectNames | NexusGenUnionNames | NexusGenInterfaceNames]

export type CloudQueryFields = keyof CloudQueryResolvers

export type CloudQueryArgs<T extends keyof CloudQueryResolvers> =
  Exclude<CloudQueryResolvers[T], undefined> extends Resolver<any, any, any, infer Args>
    ? keyof Args extends never ? never : Args
    : never
