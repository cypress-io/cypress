import React, { ChangeEventHandler, useState } from 'react'
import type { TestingType } from '../types/shared'
import { NewUserWelcome } from './NewUserWelcome'
import { RunnerButton } from './RunnerButton'

interface SelectWizardProps {
  testingTypes: TestingType[]
  showNewUserFlow: boolean
}

export const SelectWizard: React.FC<SelectWizardProps> = (props) => {
  const [selectedTestingType, setSelectedTestingType] = useState<string>()
  const dismissNewUserWelcome: React.MouseEventHandler<any> = () => {}
  const selectTestingType = (testingType: TestingType): ChangeEventHandler<HTMLInputElement> => {
    return (e) => {
      setSelectedTestingType(e.target.value)
    }
  }

  return (
    <>
      <h2 className="text-xl text-left mb-4">
        Welcome! What kind of tests would you like to run?
      </h2>

      <h2 className="text-xl text-left mb-4" v-if="!loading">
        Welcome! What kind of tests would you like to run?
      </h2>

      <div className="max-w-128 mx-auto my-0">
        {props.showNewUserFlow && <NewUserWelcome onClose={dismissNewUserWelcome} />}
      </div>

      <div className="text-center">
        {props.testingTypes.map((testingType, idx) => (
          <RunnerButton
            key={testingType}
            testingType={testingType}
            selected={selectedTestingType === testingType}
            onChange={selectTestingType(testingType)}
          />
        ))}
      </div>
    </>
  )
}

{ /* <script lang="ts">
import gql from 'graphql-tag'
import { defineComponent, markRaw, computed } from "vue";
import { useStore } from "../store";
import { TestingType, testingTypes } from "../types/shared";
import RunnerButton from "./RunnerButton.vue";
import NewUserWelcome from "./NewUserWelcome.vue";
import { useQuery } from "@vue/apollo-composable";

export default defineComponent({
  components: {
    RunnerButton,
    NewUserWelcome,
  },

  setup() {
    const { result, loading, error, refetch } = useQuery(gql`
      {
        app {
          cypressVersion
        }
      }
    `)

    setInterval(() => {
      refetch()
    }, 500)

    const store = useStore();

    const selectTestingType = (testingType: TestingType) => {
      store.setTestingType(testingType);
    };

    const dismissNewUserWelcome = () => {
      store.setDismissedHelper(true);
    };

    return {
      loading,
      result,
      testingTypes: markRaw(testingTypes),
      selectTestingType,
      showNewUserFlow: computed(
        () => store.getState().firstOpen && !store.getState().hasDismissedHelper
      ),
      selectedTestingType: computed(() => store.getState().testingType),
      dismissNewUserWelcome,
    };
  },
});
</script> */ }
