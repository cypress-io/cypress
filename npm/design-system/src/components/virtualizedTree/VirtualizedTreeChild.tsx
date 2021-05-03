import React, { memo, useCallback, useMemo } from 'react'
import { usePress } from '@react-aria/interactions'
import { PressEvent } from '@react-types/shared'
import cs from 'classnames'

import { createPressEventNode, InternalChildProps, InternalOnRenderChildProps, isParent, LeafTreeBase, ParentTreeBase, treeChildClass } from './types'
import { useMeasure } from 'hooks/useMeasure'

import styles from './VirtualizedTree.module.scss'
import { useFocusState } from './focusState'

export const TreeChild = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    data,
    isOpen,
    style,
    height,
    indentSize,
    showRoot,
    shouldMeasure,
    onNodePress,
    setOpen,
    resize,
    onRenderLeaf,
    onRenderParent,
  }: InternalChildProps<TLeaf, TParent>) => {
  const globalFocusId = useFocusState()
  const id = data.node.id

  const isFocused = globalFocusId === id

  const resizer = useCallback((height: number) => resize(height, true), [resize])
  const { setRef, remeasure } = useMeasure(height, resizer, [data, style, isOpen], !shouldMeasure)

  const createEventNode = useCallback(() => createPressEventNode(data, isOpen, setOpen), [data, isOpen, setOpen])

  const onPress = useMemo(() => onNodePress ? {
    onPress: (event: PressEvent) =>
      onNodePress(createEventNode(), event),
  } : {}, [createEventNode, onNodePress])

  const { pressProps } = usePress(onPress)

  return id !== 'root' || showRoot ? (
    // Wrapper is required for indent margin to work correctly with the tree's absolute positioning
    <span style={style}>
      <div
        ref={setRef}
        {...pressProps}
        className={cs(treeChildClass, styles.child, { [styles.focus]: isFocused })}
        style={indentSize ? { marginLeft: `${data.nestingLevel * indentSize}rem` } : undefined}
      >
        <MemoedOnRenderChild
          data={data}
          isOpen={isOpen}
          setOpen={setOpen}
          remeasure={remeasure}
          onRenderLeaf={onRenderLeaf}
          onRenderParent={onRenderParent}
        />
      </div>
    </span>
  ) : null
}

const OnRenderChild = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    data: { node, nestingLevel },
    isOpen,
    setOpen,
    remeasure,
    onRenderLeaf,
    onRenderParent,
  }: InternalOnRenderChildProps<TLeaf, TParent>) =>
    isParent(node)
      ? onRenderParent({
        parent: node,
        depth: nestingLevel,
        isOpen,
        setOpen,
        remeasure,
      })
      : onRenderLeaf({
        leaf: node,
        depth: nestingLevel,
        remeasure,
      })

// Memo `onRender` callback results to double the speed of height calculation
const MemoedOnRenderChild = memo(OnRenderChild) as typeof OnRenderChild
