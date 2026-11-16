import * as React from 'react'
import SamoyedImage from './samoyed.jpg'

export const Dog: React.FC = () => {
  return (
    <div>
      <h1> Your dog is Samoyed: </h1>
      <img src={SamoyedImage} />
    </div>
  )
}

/** @alias */
export default Dog
