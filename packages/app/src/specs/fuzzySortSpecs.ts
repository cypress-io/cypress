import fuzzySort from 'fuzzysort'

type PartialSpec = {
  id: string
  baseName: string
  relative: string
}

export function fuzzySortSpecs<T extends PartialSpec> (specs: T[], searchValue: string) {
  const transformedSpecs = addMetadataToSpecs(specs)

  return fuzzySort
  .go(searchValue, transformedSpecs, { keys: ['baseName', 'directory'] })
  .map((result) => {
    const [file, dir, obj] = result

    return {
      ...obj,
      indexes: [1],
      fileIndexes: file?.indexes ?? [],
      dirIndexes: dir?.indexes ?? [],
    }
  })
}

function addMetadataToSpecs<T extends PartialSpec> (specs: T[]) {
  return specs.map((spec) => {
    return {
      ...spec,
      directory: getDirectoryPath(spec.relative),
      indexes: [],
      fileIndexes: [],
      dirIndexes: [],
    }
  })
}

function getDirectoryPath (path: string) {
  return path.slice(0, path.lastIndexOf('/'))
}
