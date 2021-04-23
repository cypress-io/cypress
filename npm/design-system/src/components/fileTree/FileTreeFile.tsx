import React, { CSSProperties } from 'react'
import cs from 'classnames'

import type { IconifyIcon } from '@iconify/types'
import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'

import { FileBase, TreeFile } from './types'

import styles from './FileTree.module.scss'
import { StyledText } from 'core/text/StyledText'

export interface NodeComponentProps<T> {
  item: T
  depth: number
  indexes: number[]
}

export interface FileComponentProps<T extends FileBase> extends NodeComponentProps<TreeFile<T>> {
  style?: CSSProperties
  depth: number
  remeasure: () => void
}

export const icons: Record<string, { icon: IconifyIcon }> = {
  js: { icon: javascriptIcon },
  ts: { icon: typescriptIcon },
  tsx: { icon: reactTs },
  jsx: { icon: reactJs },
} as const

export const FileTreeFile = <T extends FileBase>({ item, indexes, style }: FileComponentProps<T>) => {
  const ext = getExt(item.name)
  const inlineIconProps = ext ? icons[ext] : {
    // If we don't have an icon for the extension, don't render an icon
    icon: '',
  }

  return (
    <div className={cs(styles.node, styles.file)} style={style} title={item.file.path}>
      <InlineIcon {...inlineIconProps} />
      {/* <NameWithHighlighting
        item={item}
        indexes={indexes}
      /> */}
      <StyledText size="ms" lineHeight="tight">
        {item.name}
      </StyledText>
    </div>
  )
}

const extensionRegex = /(?:\.([^.]+))?$/

const getExt = (path: string) => {
  const extensionMatches = path.match(extensionRegex)

  return extensionMatches ? extensionMatches[1] : ''
}
