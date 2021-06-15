import * as React from 'react'
import type { SupportedFramework } from '../types/supportedFrameworks'

interface SelectFrameworkProps {
  frameworks: SupportedFramework[]
  images: string[]
}

export const SelectFramework: React.FC<SelectFrameworkProps> = (props) => {
  return (
    <>
      <h3>Select your framework</h3>
      <p className="opacity-0">
        <select
          data-cy="select-framework"
          className="h-20 absolute left-60"
        >
          {props.frameworks.map((framework) => (
            <option key={framework.displayName} value={framework.id}>
              {framework.displayName}
            </option>
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
            {i < (props.images.length - 1) && <span>x</span>}
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

// <script lang="ts">
// import { computed, defineComponent, markRaw } from 'vue'
// import { useStore } from '../store'
// import { frameworks } from '../supportedFrameworks'

// export default defineComponent({
//   setup(props, ctx) {
//     const store = useStore()

//     const selectedFramework = computed(() => store.getState().component.framework)

//     const selectedFrameworkId = computed({
//       get() {
//         return selectedFramework.value ? selectedFramework.value.id : 'none'
//       },
//       set(id: string) {
//         store.setComponentFramework(frameworks.find(x => x.id === id)!)
//       }
//     })

//     return {
//       selectedFrameworkId,
//       frameworks: markRaw(frameworks),
//       images: computed(() => selectedFramework.value && selectedFramework.value.images)
//     }
//   }
// })
// </script>
