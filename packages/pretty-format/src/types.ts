/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type Colors = {
  comment: {close: string, open: string}
  content: {close: string, open: string}
  prop: {close: string, open: string}
  tag: {close: string, open: string}
  value: {close: string, open: string}
}

type Indent = (arg0: string) => string
export type Refs = Array<any>

type Print = (arg0: any) => string

export type Theme = {
  comment: string
  content: string
  prop: string
  tag: string
  value: string
}

type ThemeReceived = {
  comment?: string
  content?: string
  prop?: string
  tag?: string
  value?: string
}

export type Options = {
  callToJSON: boolean
  escapeRegex: boolean
  escapeString: boolean
  highlight: boolean
  indent: number
  maxDepth: number
  min: boolean
  plugins: Plugins
  printFunctionName: boolean
  theme: Theme
}

export type OptionsReceived = {
  callToJSON?: boolean
  escapeRegex?: boolean
  escapeString?: boolean
  highlight?: boolean
  indent?: number
  maxDepth?: number
  min?: boolean
  plugins?: Plugins
  printFunctionName?: boolean
  theme?: ThemeReceived
}

export type Config = {
  callToJSON: boolean
  colors: Colors
  escapeRegex: boolean
  escapeString: boolean
  indent: string
  maxDepth: number
  min: boolean
  plugins: Plugins
  printFunctionName: boolean
  spacingInner: string
  spacingOuter: string
}

export type Printer = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
) => string

type Test = (arg0: any) => boolean

export type NewPlugin = {
  serialize: (
    val: any,
    config: Config,
    indentation: string,
    depth: number,
    refs: Refs,
    printer: Printer,
  ) => string
  test: Test
}

type PluginOptions = {
  edgeSpacing: string
  min: boolean
  spacing: string
}

type OldPlugin = {
  print: (
    val: any,
    print: Print,
    indent: Indent,
    options: PluginOptions,
    colors: Colors,
  ) => string
  test: Test
}

export type Plugin = NewPlugin | OldPlugin

export type Plugins = Array<Plugin>
