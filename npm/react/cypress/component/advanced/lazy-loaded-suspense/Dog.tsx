import * as React from 'react'
import SamoyedImage from './samoyed.jpg'

interface DogProps {}

export const Dog: React.FC<DogProps> = () => {
  return (
    <div>
      <h1> Your dog is Samoyed: </h1>
      <img src={SamoyedImage} />
    </div>
  )
}

/** @alias */
export default Dog
