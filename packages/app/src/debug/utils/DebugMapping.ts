import type { DebugSpecListSpecFragment, DebugSpecListTestsFragment, TestingTypeEnum, DebugSpecListGroupsFragment } from '../../generated/graphql'

type DebugSpecsArgs = {
  specs: readonly DebugSpecListSpecFragment[]
  tests: readonly DebugSpecListTestsFragment[]
  groups: readonly DebugSpecListGroupsFragment[]
  currentTestingType: TestingTypeEnum
}

export type CloudDebugSpec = {
  spec: DebugSpecListSpecFragment
  tests: { [thumbprint: string]: DebugSpecListTestsFragment[] }
  groups: { [groupId: string]: DebugSpecListGroupsFragment }
  testingType: TestingTypeEnum
}

export const specsList = ({ specs, tests, currentTestingType, groups }: DebugSpecsArgs): CloudDebugSpec[] => {
  const groupsMap = groups.reduce<{[id: string]: DebugSpecListGroupsFragment}>((acc, group) => ({ ...acc, [group.id]: group }), {})

  const mappedTests = tests.reduce<{[id: string]: CloudDebugSpec}>((acc, curr) => {
    let debugResult = acc[curr.specId]

    if (!debugResult) {
      const foundSpec = specs.find((spec) => spec.id === curr.specId)

      if (!foundSpec) {
        //TODO better handle error case
        throw new Error(`Could not find spec for id ${ curr.specId}`)
      }

      const groups = (foundSpec.groupIds || []).reduce<{[grpId: string]: DebugSpecListGroupsFragment}>((acc, id) => {
        if (id) {
          acc[id] = groupsMap[id]
        }

        return acc
      }, {})
      // should always exist, the testingType should not differ between groups
      const testingType = (groups[0]?.testingType || 'e2e') as TestingTypeEnum

      debugResult = {
        spec: foundSpec,
        tests: { [curr.thumbprint]: [curr] },
        groups,
        testingType,
      }

      acc[curr.specId] = debugResult
    } else {
      debugResult.tests[curr.thumbprint].push(curr)
    }

    return acc
  }, {})

  return Object.values(mappedTests)
}

// export const specsList = <S extends {id: string}, T extends {specId: string}>
// (specs: readonly S[], tests: readonly T[]): {spec: S, tests: T[]}[] => {
//   const mappedTests = tests.reduce((acc, curr) => {
//     // console.log(`test specId = ${ curr.specId}`)
//     let spec = acc[curr.specId]

//     if (!spec) {
//       const foundSpec = specs.find((spec) => spec.id === curr.specId)

//       spec = { spec: foundSpec }
//       // console.log('looking for spec', spec)
//       if (foundSpec) {
//         acc[curr.specId] = spec
//       } else {
//         //TODO better handle error case
//         throw new Error(`Could not find spec for id ${ curr.specId}`)
//       }
//     }

//     spec.tests = [...(spec.tests || []), curr]

//     // console.log('spec.tests', spec.tests)
//     return acc
//   }, {})
//   // console.log(mappedTests)

//   return Object.values(mappedTests)
// }
