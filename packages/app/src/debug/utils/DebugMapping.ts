export const specsList = <S extends {id: string}, T extends {specId: string}>(specs: readonly S[], tests: readonly T[]): {spec: S, tests: T[]}[] => {
  const mappedTests = tests.reduce((acc, curr) => {
    // console.log(`test specId = ${ curr.specId}`)
    let spec = acc[curr.specId]

    if (!spec) {
      const foundSpec = specs.find((spec) => spec.id === curr.specId)

      spec = { spec: foundSpec }
      // console.log('looking for spec', spec)
      if (foundSpec) {
        acc[curr.specId] = spec
      } else {
        //TODO better handle error case
        throw new Error(`Could not find spec for id ${ curr.specId}`)
      }
    }

    spec.tests = [...(spec.tests || []), curr]

    // console.log('spec.tests', spec.tests)
    return acc
  }, {})
  // console.log(mappedTests)

  return Object.values(mappedTests)
}
