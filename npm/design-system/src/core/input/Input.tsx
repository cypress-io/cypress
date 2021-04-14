import * as React from 'react'
import { basicInputRenderer, InputBase, InputProps } from './InputBase'

export const Input: React.FC<InputProps<{}>> = (props) => <InputBase {...props} inputRenderer={basicInputRenderer} />
