import * as React from 'react'

/** @type {React.FC<React.SVGProps<SVGSVGElement>} */
export function CollapseIcon (props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <title> collapse </title>
      <path
        stroke="#9D9EA9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
      ></path>
    </svg>
  )
}
