/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Config, NewPlugin, Printer, Refs } from '../types'

import {
  printChildren,
  printComment,
  printElement,
  printElementAsLeaf,
  printProps,
  printText,
} from './lib/markup'

const ELEMENT_NODE = 1
const TEXT_NODE = 3
const COMMENT_NODE = 8
const FRAGMENT_NODE = 11

const ELEMENT_REGEXP = /^((HTML|SVG)\w*)?Element$/

const testNode = (nodeType: any, name: any) => {
  return (nodeType === ELEMENT_NODE && ELEMENT_REGEXP.test(name)) ||
  (nodeType === TEXT_NODE && name === 'Text') ||
  (nodeType === COMMENT_NODE && name === 'Comment') ||
  (nodeType === FRAGMENT_NODE && name === 'DocumentFragment')
}

export const test = (val: any) => {
  return val &&
  val.constructor &&
  val.constructor.name &&
  testNode(val.nodeType, val.constructor.name)
}

type HandledType = Element | Text | Comment | DocumentFragment

function nodeIsText (node: HandledType): node is Text {
  return node.nodeType === TEXT_NODE
}

function nodeIsComment (node: HandledType): node is Comment {
  return node.nodeType === COMMENT_NODE
}

function nodeIsFragment (node: HandledType): node is DocumentFragment {
  return node.nodeType === FRAGMENT_NODE
}

export const serialize = (
  node: HandledType,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  if (nodeIsText(node)) {
    return printText(node.data, config)
  }

  if (nodeIsComment(node)) {
    return printComment(node.data, config)
  }

  const type = nodeIsFragment(node)
    ? `DocumentFragment`
    : node.tagName.toLowerCase()

  if (++depth > config.maxDepth) {
    return printElementAsLeaf(type, config)
  }

  return printElement(
    type,
    printProps(
      nodeIsFragment(node)
        ? []
        : Array.from(node.attributes)
        .map((attr) => attr.name)
        .sort(),
      nodeIsFragment(node)
        ? []
        : Array.from(node.attributes).reduce(
          (props, attribute) => {
            props[attribute.name] = attribute.value

            return props
          },
          {} as any,
        ),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer,
    ),
    printChildren(
      Array.prototype.slice.call(node.childNodes || node.children),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer,
    ),
    config,
    indentation,
  )
}

const plugin: NewPlugin = { serialize, test }

export default plugin
