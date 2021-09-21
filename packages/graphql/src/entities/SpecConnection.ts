import { nxs, NxsResult } from "nexus-decorators";
import type { SpecContract } from "../contracts";
import type { NexusGenArgTypes } from "../gen/nxs.gen";
import { base64Encode } from "../util";
import { PageInfo } from "./PageInfo";
import { Spec } from "./Spec";

@nxs.objectType({
  description: 'Spec Edge'
})
export class SpecEdge {
  constructor (private _config: SpecContract) {}

  @nxs.field.nonNull.string()
  cursor () {
    return base64Encode(`connection:${this._config.absolute}`)
  }

  @nxs.field.nonNull.type(() => Spec)
  node () {
    return new Spec(this._config)
  }
}

@nxs.objectType({
  description: 'Relay compliant connection'
})
export class SpecConnection {
  constructor (private args: NexusGenArgTypes['Project']['specs'], private _specs: SpecContract[]) {}

  @nxs.field.nonNull.list.nonNull.type(() => SpecEdge)
  edges () {
    return this._specs.map(x => new SpecEdge(x))
  }

  /**
   * todo(lachlan): actually support pagination
   */
  @nxs.field.nonNull.type(() => PageInfo)
  pageInfo (): NxsResult<'SpecConnection', 'pageInfo'> {
    return new PageInfo({
      hasNextPage: false,
      hasPreviousPage: false,
    })
  }
}