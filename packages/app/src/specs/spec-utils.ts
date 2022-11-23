import fuzzySort from 'fuzzysort'
import type { FoundSpec } from '@packages/types'
import { ComputedRef, Ref, ref, watch } from 'vue'
import _ from 'lodash'
import { FuzzyFoundSpec, getPlatform } from './tree/useCollapsibleTree'

export function fuzzySortSpecs <T extends FuzzyFoundSpec> (specs: T[], searchValue: string) {
  const normalizedSearchValue = getPlatform() === 'win32' ? searchValue.replaceAll('/', '\\') : searchValue

  const fuzzySortResult = fuzzySort
  .go(normalizedSearchValue, specs, { keys: ['relative', 'baseName'], allowTypo: false, threshold: -3000 })
  .map((result) => {
    const [relative, baseName] = result

    return {
      ...result.obj,
      fuzzyIndexes: {
        relative: relative?.indexes ?? [],
        baseName: baseName?.indexes ?? [],
      },
    }
  })

  return fuzzySortResult
}

export function makeFuzzyFoundSpec (spec: FoundSpec): FuzzyFoundSpec {
  return {
    ...spec,
    fuzzyIndexes: {
      relative: [],
      baseName: [],
    },
  }
}

export function useCachedSpecs<S extends { absolute: string }> (
  specs: ComputedRef<Readonly<S[]>>,
): Ref<Readonly<S[]>> {
  const cachedSpecs: Ref<Readonly<S[]>> = ref([])

  watch(specs, (currentSpecs, prevSpecs = []) => {
    if (!_.isEqual(currentSpecs, prevSpecs)) {
      cachedSpecs.value = currentSpecs
    }
  }, { immediate: true })

  return cachedSpecs
}

// Used to split indexes from a baseName match to a fileName + extension (with cy extension) match
// For example, given a filename of Button.cy.tsx:
// - search of 'Butcytsx' yields indexes [0,1,2,7,8,10,11,12]
// - deriveIndexes yields
//    {
//      fileNameIndexes: [0,1,2], // indexes to highlight in "Button"
//      extensionIndexes: [1,2,4,5,6] // indexes to highlight in ".cy.tsx"
//    }
export function deriveIndexes (fileName: string, indexes: number[]) {
  return indexes.reduce((acc, idx) => {
    if (idx < fileName.length) {
      acc.fileNameIndexes.push(idx)
    } else {
      acc.extensionIndexes.push(idx - fileName.length)
    }

    return acc
  }, { fileNameIndexes: <number[]>[], extensionIndexes: <number[]>[] })
}
