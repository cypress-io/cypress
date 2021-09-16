import type { CloudProjectResolvers, MutationResolvers, QueryResolvers } from '../../src/gen/cloud-source-types.gen'

export function TestCloudProject (): CloudProjectResolvers {
  return {
    id () {
      return '1'
    },
  }
}

export function TestCloudQuery (): Required<QueryResolvers> {
  return {
    cloudNode (args, ctx) {
      return null
    },
    cloudProjectBySlug () {
      return TestCloudProject()
    },
    cloudProjectsBySlugs () {
      return null
    },
    cloudViewer () {
      return null
    },
  }
}

export function TestCloudMutation (): Required<MutationResolvers> {
  return {
    test (a, b) {
      return true
    },
  }
}

export function TestConnectionFor () {
  return {}
}
