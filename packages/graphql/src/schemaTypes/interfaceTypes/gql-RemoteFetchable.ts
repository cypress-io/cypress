import { enumType, interfaceType } from 'nexus'
import type { RemoteFetchableStatus, NexusGenAbstractTypeMembers } from '../../gen/nxs.gen'

export interface RemoteFetchableShape {
  __typename: NexusGenAbstractTypeMembers['RemoteFetchable']
  id: string
  fetchingStatus: RemoteFetchableStatus
  operationHash: string
  operation: string
  operationVariables: any
  data?: any
  dataRaw?: any
  error?: any
}

const FETCHABLE_MEMBERS = {
  NOT_FETCHED: 'Has not been fetched yet',
  FETCHING: 'Currently fetching',
  ERRORED: 'Errored while fetching',
  FETCHED: 'We have loaded the remote data',
}

const RemoteFetchableStatusEnum = enumType({
  name: 'RemoteFetchableStatus',
  members: Object.entries(FETCHABLE_MEMBERS).map(([key, val]) => {
    return {
      name: key,
      description: val,
    }
  }),
})

export const RemoteFetchable = interfaceType({
  name: 'RemoteFetchable',
  description: 'Represents a container for a piece of remote data stitched into the graph',
  definition (t) {
    t.implements('Node')
    t.nonNull.field('fetchingStatus', {
      description: 'The current fetching status of the fetchable data',
      type: RemoteFetchableStatusEnum,
    })

    t.json('error', {
      description: 'JSON representation of the error response',
    })

    t.json('dataRaw', {
      description: 'The raw data response when resolving the data',
    })

    t.nonNull.string('operation', {
      description: 'Prints the full operation sent for this query, for debugging purposes',
    })

    t.nonNull.string('operationHash', {
      description: 'The hash of the operation, for debugging purposes',
    })

    t.nonNull.json('operationVariables', {
      description: 'The variables passed to the operation, for debugging purposes',
    })
  },
  resolveType: (t) => t.__typename,
  sourceType: {
    module: __filename,
    export: 'RemoteFetchableShape',
  },
})
