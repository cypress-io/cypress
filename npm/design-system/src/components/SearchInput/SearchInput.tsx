import React from 'react'
import styles from './SearchInput.module.scss'
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome'

import cs from 'classnames'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: FontAwesomeIconProps['icon']
  placeholder: string
  onSuffixClicked?: () => void
  onPrefixClicked?: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

export const SearchInput: React.FC<SearchInputProps> = (props) => (<span className={styles.inputButton}>
  { props.prefixIcon &&
      <FontAwesomeIcon
        className={styles.prefix}
        icon={props.prefixIcon} /> }
  <input
    type="text"
    ref={props.inputRef}
    className={cs([styles.searchInput, props.prefixIcon ? styles.hasPrefix : ''])}
    placeholder={props.placeholder}
    value={props.value}
    onChange={props.onChange}
  />
  { props.value &&
      <FontAwesomeIcon
        data-testid="close"
        className={styles.suffix}
        tabIndex={0}
        icon="times"
        onClick={props.onSuffixClicked}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && props.onSuffixClicked) {
            props.onSuffixClicked()
          }
        }}
      /> }
</span>
)
