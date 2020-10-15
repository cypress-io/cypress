import React from 'react'

/**
 * React component for the Mistakes Mode / Fast Mode
 * elements in the Status Section.
 */
export const Mode = props => {
  return (
    <div
      className={
        props.mode === 'mistakes'
          ? 'status__action-mistakes-mode'
          : 'status__action-fast-mode'
      }
    >
      <label
        className={
          props.mode === 'mistakes'
            ? 'status__action-mistakes-mode-switch'
            : 'status__action-fast-mode-switch'
        }
      >
        <input type="checkbox" />
        <span
          className={
            props.mode === 'mistakes'
              ? 'status__action-mistakes-mode-slider'
              : 'status__action-fast-mode-slider'
          }
          onClick={props.onClickMode}
        ></span>
      </label>
      <p className="status__action-text">
        {props.mode === 'mistakes' ? 'Mistakes Mode' : 'Fast Mode'}
      </p>
    </div>
  )
}
