import * as React from 'react'

export interface RunnerButtonProps {
  selected: boolean
  testingType: string
}

export const RunnerButton: React.FC<RunnerButtonProps> = ({
  selected,
  testingType,
}) => (
  <label
    className={`text-left inline-block border-2 rounded-lg mx-2 p-3 w-xs cursor-pointer ${
      selected ? 'border-blue-500' : 'border-gray-500'
    }`}
    htmlFor="testingType"
  >
    <input
      type={`radio ${selected ? 'border-blue-500' : 'border-gray-500'}`}
      className="mr-3"
      name="testingType"
      id="testingType"
      checked={selected}
    />
    <img className="mr-3 inline" src="https://via.placeholder.com/50" />
    {{ testingType }}
  </label>
)
