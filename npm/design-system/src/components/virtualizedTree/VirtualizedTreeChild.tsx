import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useFocusManager, useFocusRing } from '@react-aria/focus'
import { usePress } from '@react-aria/interactions'
import { PressEvent } from '@react-types/shared'
import cs from 'classnames'

import { InternalChildProps, InternalOnRenderChildProps, isParent, LeafTreeBase, ParentTreeBase, SpecificTreeNode, treeChildClass } from './types'
import { useMeasure } from 'hooks/useMeasure'

import styles from './VirtualizedTree.module.scss'
import { useCurrent } from 'hooks/useCurrent'
import { useFocusDispatch, useFocusState } from './focusState'

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
    onNodeKeyDown,
    onChildUnmountFocusLoss,
    setOpen,
    resize,
    onRenderLeaf,
    onRenderParent,
  }: InternalChildProps<TLeaf, TParent>) => {
  const focusManager = useFocusManager()
  const globalFocusedId = useFocusState()
  const [, setGlobalFocus] = useFocusDispatch()

  const resizer = useCallback((height: number) => resize?.(height, true), [resize])
  const { statefulRef, setRef, remeasure } = useMeasure(height ?? 0, resizer, [data, style, isOpen], !shouldMeasure)

  const id = data.node.id
  const isGlobalFocused = globalFocusedId === id
  const { isFocused, focusProps } = useFocusRing({ within: true })
  const onFocusRingFocus = focusProps.onFocus

  const currentIsFocused = useCurrent(isFocused)
  const currentId = useCurrent(id)

  const createEventNode = useCallback(() => isParent(data.node) ? {
    type: 'parent' as const,
    data: data as SpecificTreeNode<TParent>,
    isOpen,
    setOpen,
  } : {
    type: 'leaf' as const,
    data: data as SpecificTreeNode<TLeaf>,
    isOpen,
    setOpen,
  }, [data, isOpen, setOpen])

  const onPress = useMemo(() => onNodePress ? {
    onPress: (event: PressEvent) =>
      onNodePress(createEventNode(), event),
  } : {}, [createEventNode, onNodePress])

  const { pressProps } = usePress(onPress)
  const pressOnKeyDown = pressProps.onKeyDown

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onNodeKeyDown) {
      onNodeKeyDown(createEventNode(), event)

      if (event.isDefaultPrevented()) {
        return
      }
    }

    switch (event.key) {
      case 'ArrowDown':
        focusManager.focusNext()
        break
      case 'ArrowUp':
        focusManager.focusPrevious()
        break
      case 'ArrowRight': {
        if (isParent(data.node) && !isOpen) {
          setOpen(true)
        }

        break
      }
      case 'ArrowLeft': {
        if (isParent(data.node) && isOpen) {
          setOpen(false)
        }

        break
      }
      default:
        pressOnKeyDown?.(event)

        return
    }

    event.preventDefault()
    event.stopPropagation()
  }, [data.node, isOpen, focusManager, createEventNode, onNodeKeyDown, pressOnKeyDown, setOpen])

  const onFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    setGlobalFocus(id)
    onFocusRingFocus?.(event)
  }, [id, onFocusRingFocus, setGlobalFocus])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isGlobalFocused && !currentIsFocused.current && statefulRef) {
      console.log(`Global focus ${id}`)
      setTimeout(() => {
        statefulRef.focus()
      }, 10)
    }
  }, [isGlobalFocused, statefulRef])

  useEffect(() => {
    // console.log(`${isFocused ? 'Focusing' : 'Unfocusing'} ${currentId.current}`)
  }, [isFocused])

  useEffect(() => {
    console.log(`Mounting ${currentId.current}`)

    return () => {
      if (currentIsFocused.current) {
        console.log(`Unmounting ${currentId.current}, ${currentIsFocused.current}`)

        setGlobalFocus(currentId.current)
        onChildUnmountFocusLoss?.()
      } else {
        console.log(`Unmounting ${currentId.current}`)
      }
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return id !== 'root' || showRoot ? (
    // Wrapper is required for indent margin to work correctly with the tree's absolute positioning
    <span style={style}>
      <div
        {...focusProps}
        ref={(ref) => {
          setRef(ref)
          // @ts-ignore
          focusProps.ref = ref
        }}
        {...pressProps}
        className={cs(treeChildClass, styles.child, { [styles.focus]: isFocused })}
        style={indentSize ? { marginLeft: `${data.nestingLevel * indentSize}rem` } : undefined}
        // First item is assigned a tabindex to allow tabbing in and out of the tree
        tabIndex={data.isFirst ? 0 : -1}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
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
