import React from 'react'
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome'
import cs from 'classnames'
import styles from './SearchInput.module.scss'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: FontAwesomeIconProps['icon']
  placeholder: string
  onSuffixClicked?: () => void
  onPrefixClicked?: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

export const SearchInput: React.FC<SearchInputProps> = (props) => {
  const { onSuffixClicked } = props

  const prefixIcon = props.prefixIcon && (
    <FontAwesomeIcon
      className={styles.prefix}
      icon={props.prefixIcon}
    />
  )

  const onKeyPress = React.useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Enter') {
      onSuffixClicked?.()
    }
  }, [onSuffixClicked])

  return (
    <span className={styles.inputButton}>
      {prefixIcon}
      <input
        ref={props.inputRef}
        type="text"
        className={cs([styles.searchInput, props.prefixIcon ? styles.hasPrefix : ''])}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
      />
      {
        props.value && (
          <FontAwesomeIcon
            data-testid="close"
            className={styles.suffix}
            tabIndex={0}
            icon="times"
            onClick={props.onSuffixClicked}
            onKeyPress={onKeyPress}
          />
        )
      }
    </span>
  )
}
