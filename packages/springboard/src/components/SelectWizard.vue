<template>
  <h2 class="text-xl text-left mb-4">
    Welcome! What kind of tests would you like to run?
  </h2>

  <div class="max-w-128 mx-auto my-0">
    <NewUserWelcome v-if="showNewUserFlow" @close="dismissNewUserWelcome" />
  </div>

  <div class="text-center">
    <RunnerButton
      v-for="testingType of testingTypes"
      :key="testingType"
      :testingType="testingType"
      :selected="selectedTestingType === testingType"
      @click="selectTestingType(testingType)"
    />
  </div>

  <button @click="initProject">1. Initialize Project {{ progress.initProject }}</button>
  <button @click="initPlugins">2. Initialize Plugins {{ progress.initPlugins }}</button>
  <button @click="initServer">3. Initialize Server {{ progress.initServer }}</button>
  <button @click="initRunner">4. Launch Runner</button>
  <button @click="killActiveRunner">(X) Kill runner</button>
</template>

<script lang="ts">
import { defineComponent, markRaw, computed, reactive } from "vue";
import { useStore } from "../store";
import { TestingType, testingTypes } from "../types/shared";
import RunnerButton from "./RunnerButton.vue";
import NewUserWelcome from "./NewUserWelcome.vue";
import { ipcBus } from '../ipc'

export default defineComponent({
  components: {
    RunnerButton,
    NewUserWelcome,
  },

  setup() {
    const store = useStore();

    const progress = reactive({
      initProject: '',
      initPlugins: '',
      initServer: '',
    })

    const initPlugins = () => {
      progress.initPlugins = 'LOADING...'
      ipcBus.send('on:initialize:plugins', {})
    }

    const killActiveRunner = () => {
      ipcBus.send('on:kill:runner', {})
      progress.initProject = ''
      progress.initPlugins = ''
      progress.initServer = ''
    }

    const initServer = () => {
      progress.initServer = 'LOADING...'
      ipcBus.send('on:initialize:server', {})
    }

    const initRunner = () => {
      ipcBus.send('on:initialize:runner', {})
    }

    ipcBus.on('on:initialize:project', () => {
      progress.initProject = 'OK'
    })

    ipcBus.on('on:initialize:plugins', () => {
      progress.initPlugins = 'OK'
    })

    ipcBus.on('on:initialize:server', () => {
      progress.initServer = 'OK'
    })

    const initProject = () => {
      ipcBus.on('get:options', ({ data }, ...rest: any[]) => {
        progress.initProject = 'LOADING...'
        ipcBus.send('on:initialize:project', {
          ...data,
          testingType: store.getState().testingType 
        })
      })

      ipcBus.send('get:options', {})
    }

    const selectTestingType = (testingType: TestingType) => {
      store.setTestingType(testingType);
    };

    const dismissNewUserWelcome = () => {
      store.setDismissedHelper(true);
    };

    return {
      initProject,
      initPlugins,
      initServer,
      initRunner,
      killActiveRunner,
      progress,
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
</script>