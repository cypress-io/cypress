/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Config, NewPlugin, Printer, Refs } from '../types'

import { printListItems, printObjectProperties } from '../collections'

const SPACE = ' '

const OBJECT_NAMES = ['DOMStringMap', 'NamedNodeMap']
const ARRAY_REGEXP = /^(HTML\w*Collection|NodeList)$/

const testName = (name: any) => {
  return OBJECT_NAMES.indexOf(name) !== -1 || ARRAY_REGEXP.test(name)
}

export const test = (val: any) => {
  return val &&
  val.constructor &&
  val.constructor.name &&
  testName(val.constructor.name)
}

// Convert array of attribute objects to props object.
const propsReducer = (props: any, attribute: any) => {
  props[attribute.name] = attribute.value

  return props
}

export const serialize = (
  collection: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  const name = collection.constructor.name

  if (++depth > config.maxDepth) {
    return `[${name}]`
  }

  return (
    (config.min ? '' : name + SPACE) +
    (OBJECT_NAMES.indexOf(name) !== -1
      ? `{${
        printObjectProperties(
          name === 'NamedNodeMap'
            ? Array.prototype.reduce.call(collection, propsReducer, {})
            : { ...collection },
          config,
          indentation,
          depth,
          refs,
          printer,
        )
      }}`
      : `[${
        printListItems(
          Array.from(collection),
          config,
          indentation,
          depth,
          refs,
          printer,
        )
      }]`)
  )
}

const plugin: NewPlugin = { serialize, test }

export default plugin
