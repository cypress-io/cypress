/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Config, Printer, Refs } from '../../types'

import escapeHTML from './escapeHTML'

// Return empty string if keys is empty.
export const printProps = (
  keys: Array<string>,
  props: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  const indentationNext = indentation + config.indent
  const colors = config.colors

  return keys
  .map((key) => {
    const value = props[key]
    let printed = printer(value, config, indentationNext, depth, refs)

    if (typeof value !== 'string') {
      if (printed.indexOf('\n') !== -1) {
        printed =
            config.spacingOuter +
            indentationNext +
            printed +
            config.spacingOuter +
            indentation
      }

      printed = `{${printed}}`
    }

    return (
      `${config.spacingInner +
        indentation +
        colors.prop.open +
        key +
        colors.prop.close
      }=${
        colors.value.open
      }${printed
      }${colors.value.close}`
    )
  })
  .join('')
}

// Return empty string if children is empty.
export const printChildren = (
  children: Array<any>,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  return children
  .map(
    (child) => {
      return config.spacingOuter +
        indentation +
        (typeof child === 'string'
          ? printText(child, config)
          : printer(child, config, indentation, depth, refs))
    },
  )
  .join('')
}

export const printText = (text: string, config: Config): string => {
  const contentColor = config.colors.content

  return contentColor.open + escapeHTML(text) + contentColor.close
}

export const printComment = (comment: string, config: Config): string => {
  const commentColor = config.colors.comment

  return (
    `${commentColor.open
    }<!--${
      escapeHTML(comment)
    }-->${
      commentColor.close}`
  )
}

// Separate the functions to format props, children, and element,
// so a plugin could override a particular function, if needed.
// Too bad, so sad: the traditional (but unnecessary) space
// in a self-closing tagColor requires a second test of printedProps.
export const printElement = (
  type: string,
  printedProps: string,
  printedChildren: string,
  config: Config,
  indentation: string,
): string => {
  const tagColor = config.colors.tag

  return (
    `${tagColor.open
    }<${
      type
    }${printedProps &&
      tagColor.close +
        printedProps +
        config.spacingOuter +
        indentation +
        tagColor.open
    }${printedChildren
      ? `>${
        tagColor.close
      }${printedChildren
      }${config.spacingOuter
      }${indentation
      }${tagColor.open
      }</${
        type}`
      : `${printedProps && !config.min ? '' : ' '}/`
    }>${
      tagColor.close}`
  )
}

export const printElementAsLeaf = (type: string, config: Config) => {
  const tagColor = config.colors.tag

  return (
    `${tagColor.open
    }<${
      type
    }${tagColor.close
    } …${
      tagColor.open
    } />${
      tagColor.close}`
  )
}
