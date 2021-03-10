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
  const prefixIcon = props.prefixIcon && (
    <FontAwesomeIcon
      className={styles.prefix}
      icon={props.prefixIcon}
    />
  )

  return (
    <span className={styles.inputButton}>
      {prefixIcon}
      <input
        type="text"
        ref={props.inputRef}
        className={cs([styles.searchInput, props.prefixIcon ? styles.hasPrefix : ''])}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
      />
      {
        props.value &&
        <FontAwesomeIcon
          data-testid="close"
          className={styles.suffix}
          tabIndex={0}
          icon="times"
          onClick={props.onSuffixClicked}
          onKeyPress={(e) => e.key === 'Enter' && props.onSuffixClicked && props.onSuffixClicked()}
        />
      }
    </span>
  )
}
