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
  tests: DebugSpecListTestsFragment[]
  groups: DebugSpecListGroupsFragment[]
  foundLocally: boolean
  testingType: TestingTypeEnum
  matchesCurrentTestingType: boolean
}

export const specsList = ({ specs, tests, localSpecs, currentTestingType, groups }: DebugSpecsArgs): CloudDebugSpec[] => {
  const localSpecsSet = new Set(localSpecs.map(((spec) => posixify(spec.relative))))
  const groupsMap = groups.reduce<{[id: string]: DebugSpecListGroupsFragment}>((acc, group) => ({ ...acc, [group.id]: group }), {})

  const mappedTests = tests.reduce<{[id: string]: CloudDebugSpec}>((acc, curr) => {
    let debugResult = acc[curr.specId]

    if (!debugResult) {
      const foundSpec = specs.find((spec) => spec.id === curr.specId)

      if (!foundSpec) {
        //TODO better handle error case
        throw new Error(`Could not find spec for id ${ curr.specId}`)
      }

      const groups = (foundSpec.groupIds || []).reduce<DebugSpecListGroupsFragment[]>((acc, id) => {
        if (id) {
          acc.push(groupsMap[id])
        }

        return acc
      }, [])
      // should always exist, the testingType should not differ between groups
      const testingType = (groups[0]?.testingType || 'e2e') as TestingTypeEnum

      debugResult = {
        spec: foundSpec,
        tests: [curr],
        groups,
        testingType,
        matchesCurrentTestingType: testingType === currentTestingType,
        foundLocally: localSpecsSet.has(foundSpec.path),
      }

      acc[curr.specId] = debugResult
    } else {
      debugResult.tests.push(curr)
    }

    return acc
  }, {})

  return Object.values(mappedTests)
}
