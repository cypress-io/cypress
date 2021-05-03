import React, { CSSProperties } from 'react'
import cs from 'classnames'

import type { IconifyIcon } from '@iconify/types'
import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'

import { StyledText } from 'core/text/styledText'
import { FileBase, TreeFile } from './types'

import styles from './FileTree.module.scss'
import { useSelectedId } from './state'

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
  const selectedId = useSelectedId()
  const isSelected = item.id === selectedId

  const ext = getExt(item.name)
  const inlineIconProps = ext ? icons[ext] : {
    // If we don't have an icon for the extension, don't render an icon
    icon: '',
  }

  return (
    <div className={cs(styles.node, styles.file, { [styles.active]: isSelected })} style={style} title={item.file.path}>
      <InlineIcon {...inlineIconProps} />
      <NameWithHighlighting
        name={item.name}
        path={item.file.path}
        indexes={indexes}
      />
    </div>
  )
}

export const NameWithHighlighting: React.FC<{
  name: string
  path: string
  indexes: number[]
}> = ({ name, path, indexes }) => {
  const lengthOffset = path.length - name.length

  const indexSet = indexes.reduce((acc, current) => {
    const newIndex = current - lengthOffset

    if (newIndex >= 0) {
      acc.add(newIndex)
    }

    return acc
  }, new Set<number>())

  // TODO: It would be nice if we didn't make `n` React nodes, and instead properly inserted only the spans when necessary
  return (
    <StyledText className={styles.highlight} size="ms" lineHeight="tight">
      {[...name].map((char, index) => indexSet.has(index) ? (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index}>
          {char}
        </span>
      ) : (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={index}>
          {char}
        </React.Fragment>
      ))}
    </StyledText>
  )
}

const extensionRegex = /(?:\.([^.]+))?$/

const getExt = (path: string) => {
  const extensionMatches = path.match(extensionRegex)

  return extensionMatches ? extensionMatches[1] : ''
}
