import React from 'react'

interface SelectFrameworkProps {
  frameworks: any[]
  images: any[]
}

export const SelectFramework: React.FC<SelectFrameworkProps> = (props) => {
  return (
    <>
      <h3>Select your framework</h3>
      <p className="opacity-0">
        <select
          data-cy="select-framework"
          v-model="selectedFrameworkId"
          className="h-20 absolute left-60"
        >
          {props.frameworks.map((framework) => (
            <option key={framework.displayName}>{framework.displayName}</option>
          ))}
          <option value="none" disabled>
            Select framework
          </option>
        </select>
      </p>
      <p className="text-center m-3 h-20">
        {props.images?.map((img, i) => (
          <React.Fragment key={img}>
            <img
              className="w-20 h-20 inline m-3"
              src={`${require(`@assets/${img}.svg`)}`}
            />
            <span v-if="i < (images.length - 1)">x</span>
          </React.Fragment>
        )) ?? (
          <>
            <div className="align-middle inline-block h-20 w-20 bg-gray-200 m-3" />
            x
            <div className="align-middle inline-block h-20 w-20 bg-gray-200 m-3" />
          </>
        )}
      </p>
      <p>
        To finish configuring your project we need to install some dependencies
        and create a few files.
      </p>
    </>
  )
}
