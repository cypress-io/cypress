import * as React from 'react'
import './NoSpecSelected.scss'

export const NoSpecSelected: React.FC = ({ children }) => {
  return (
    <div className="no-spec">
      <div className="no-spec-content-container">
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M33.3333 49H6.66659C5.2521 49 3.89554 48.4381 2.89535 47.4379C1.89515 46.4377 1.33325 45.0812 1.33325 43.6667V6.33333C1.33325 4.91885 1.89515 3.56229 2.89535 2.5621C3.89554 1.5619 5.2521 1 6.66659 1H21.5626C22.2698 1.00015 22.9479 1.2812 23.4479 1.78133L37.8853 16.2187C38.3854 16.7186 38.6664 17.3968 38.6666 18.104V43.6667C38.6666 45.0812 38.1047 46.4377 37.1045 47.4379C36.1043 48.4381 34.7477 49 33.3333 49Z" stroke="#B4B5BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="no-spec-title"> No spec selected. </h2>

        {children && (
          <div className="no-spec-custom-children">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
