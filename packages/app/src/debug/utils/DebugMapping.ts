import type { DebugSpecListSpecFragment, DebugSpecListTestsFragment, DebugLocalSpecsFragment, TestingTypeEnum, DebugSpecListGroupsFragment } from '../../generated/graphql'
import { posixify } from '../../paths'

type DebugSpecsArgs = {
  specs: readonly DebugSpecListSpecFragment[]
  tests: readonly DebugSpecListTestsFragment[]
  groups: readonly DebugSpecListGroupsFragment[]
  localSpecs: readonly DebugLocalSpecsFragment[]
  currentTestingType: TestingTypeEnum
}

export type CloudDebugSpec = {
  spec: DebugSpecListSpecFragment
  tests: { [thumbprint: string]: DebugSpecListTestsFragment[] }
  groups: { [groupId: string]: DebugSpecListGroupsFragment }
  testingType: TestingTypeEnum
  matchesCurrentTestingType: boolean
  foundLocally: boolean
}

export const specsList = ({ specs, tests, localSpecs, currentTestingType, groups }: DebugSpecsArgs): CloudDebugSpec[] => {
  const localSpecsSet = new Set(localSpecs.map(((spec) => posixify(spec.relative))))
  const groupsMap = groups.reduce<{[id: string]: DebugSpecListGroupsFragment}>((acc, group) => ({ ...acc, [group.id]: group }), {})

  const mappedTests = tests.reduce<{[id: string]: CloudDebugSpec}>((acc, curr) => {
    let debugResult = acc[curr.specId]

    if (!debugResult) {
      const foundSpec = specs.find((spec) => spec.id === curr.specId)

      if (!foundSpec) {
        // TODO better handle error case by showing an error message rather than just throwing
        // an error. Will be addressed in https://github.com/cypress-io/cypress/issues/25639
        throw new Error(`Could not find spec for id ${ curr.specId}`)
      }

      const groupsMapping = (foundSpec.groupIds || []).reduce<{[grpId: string]: DebugSpecListGroupsFragment}>((acc, id) => {
        if (id) {
          acc[id] = groupsMap[id]
        }

        return acc
      }, {})
      // The testingType will not differ between groups
      const testingType = Object.values(groupsMapping)[0].testingType as TestingTypeEnum

      debugResult = {
        spec: foundSpec,
        tests: { [curr.thumbprint]: [curr] },
        groups: groupsMapping,
        testingType,
        matchesCurrentTestingType: testingType === currentTestingType,
        foundLocally: localSpecsSet.has(foundSpec.path),
      }

      acc[curr.specId] = debugResult
    } else {
      if (!debugResult.tests[curr.thumbprint]) {
        debugResult.tests[curr.thumbprint] = [curr]
      } else {
        debugResult.tests[curr.thumbprint].push(curr)
      }
    }

    return acc
  }, {})

  return Object.values(mappedTests)
}
