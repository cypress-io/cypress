import * as React from 'react'
// @ts-ignore
import SamoyedImage from './samoyed.jpg'

interface DogProps {}

export const Dog: React.FC<DogProps> = ({}) => {
  return (
    <div>
      <h1> Your dog is Samoyed: </h1>
      <img src={SamoyedImage} />
    </div>
  )
}

export default Dog
