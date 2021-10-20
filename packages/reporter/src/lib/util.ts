import { KeyboardEvent } from 'react'

const INDENT_BASE = 5
const INDENT_AMOUNT = 15

function indent (level: number) {
  return INDENT_BASE + level * INDENT_AMOUNT
}

// Returns a keyboard handler that invokes the provided function when either enter or space is pressed
const onEnterOrSpace = (f: (() => void)) => {
  return (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      f()
    }
  }
}

const splitFilename = (filename: string, index: number): [string, string] => {
  if (index < 0) {
    return [filename, '']
  }

  return [filename.substr(0, index), filename.substr(index)]
}

// strips directory path and then
// '_spec' and any file extension should be split off from the main part of the filename
const getFilenameParts = (spec: string): [string, string] => {
  if (!spec) {
    return ['', '']
  }

  const specWithoutPath = spec.substr(spec.lastIndexOf('/') + 1)

  if (!specWithoutPath) {
    return [spec, '']
  }

  const specIndex = specWithoutPath.indexOf('_spec.')

  if (specIndex > -1) {
    return splitFilename(specWithoutPath, specIndex)
  }

  const dotIndex = specWithoutPath.indexOf('.')

  if (dotIndex < 0) return [spec, '']

  return splitFilename(specWithoutPath, dotIndex)
}

export {
  getFilenameParts,
  indent,
  onEnterOrSpace,
}
