import React, { useRef, useMemo } from 'react'
import { TextSizableComponent, Label } from 'core/shared'
import { useCheckbox } from '@react-aria/checkbox'
import { StyledText, styledTextSizeClassNames } from 'core/text/StyledText'
import styles from './Checkbox.module.scss'
import cs from 'classnames'
import {v4 as uuid} from 'uuid'

interface CheckboxProps extends TextSizableComponent, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  checked: boolean
  label: Label

  setChecked: (selected: boolean) => void
}

export const Checkbox: React.FC<CheckboxProps> = ({ className, label, checked, setChecked, size, lineHeight, ...props }) => {
  const inputRef = useRef<HTMLInputElement>()
  const state = useMemo(() => ({ isSelected: checked, setSelected: setChecked }), [checked])
  const inputId = useMemo(uuid, [])
  const { inputProps } = useCheckbox(props, state, inputRef)

  return <StyledText size={ size } lineHeight={ lineHeight } className={cs(styles.wrapper, className)}>

    { label.type === 'tag' && <label for={ inputId } className={cs(styles.label)}>{ label.contents }</label> }

    <input aria-label={ label.type === 'aria' ? label.contents : undefined }
      id={ inputId }
      ref={ inputRef }
      className={cs(styles.input)}
      { ...props }
      { ...inputProps } />
  </StyledText>
}
