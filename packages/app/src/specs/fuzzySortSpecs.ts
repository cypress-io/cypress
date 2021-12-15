import fuzzySort from 'fuzzysort'

type PartialSpec = {
  id: string
  baseName: string
  relative: string
}

export function fuzzySortSpecs<T extends PartialSpec> (specs: T[], searchValue: string) {
  const transformedSpecs = addMetadataToSpecs(specs)

  const result = fuzzySort
  .go(searchValue, transformedSpecs, { keys: ['baseName', 'directory'], allowTypo: false })
  .map((result) => {
    const [file, dir] = result

    return {
      ...result.obj,
      fileIndexes: file?.indexes ?? [],
      dirIndexes: dir?.indexes ?? [],
    }
  })

  return result
}

function addMetadataToSpecs<T extends PartialSpec> (specs: T[]) {
  return specs.map((spec) => {
    return {
      ...spec,
      directory: getDirectoryPath(spec.relative),
      fileIndexes: [],
      dirIndexes: [],
    }
  })
}

function getDirectoryPath (path: string) {
  return path.slice(0, path.lastIndexOf('/'))
}
