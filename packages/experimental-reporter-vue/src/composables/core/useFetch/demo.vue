<script setup lang="ts">
import { reactive, ref } from 'vue'
import { stringify } from '@vueuse/docs-utils'
import { useToggle } from '../../shared'
import { useFetch } from '.'

const url = ref('https://httpbin.org/get')
const refetch = ref(false)

const toggleRefetch = useToggle(refetch)

const {
  data,
  error,
  abort,
  statusCode,
  isFetching,
  isFinished,
  canAbort,
  execute,
} = useFetch(url, { refetch }).get()

const text = stringify(reactive({
  isFinished,
  isFetching,
  canAbort,
  statusCode,
  error,
  data,
}))

</script>

<template>
  <div>
    <div>
      <note>The following URLs can be used to test different features of useFetch</note>
      <div class="mt-2">
        Normal Request:
        <code>
          https://httpbin.org/get
        </code>
      </div>
      <div>
        Abort Request:
        <code>
          https://httpbin.org/delay/10
        </code>
      </div>
      <div>
        Response Error:
        <code>
          http://httpbin.org/status/500
        </code>
      </div>
    </div>

    <input v-model="url" type="text">
    <button @click="execute">
      Execute
    </button>
    <button @click="toggleRefetch">
      <carbon-checkmark v-if="refetch" />
      <carbon-error v-else />

      <span class="ml-2">{{ refetch ? 'Refetch On': 'Refetch Off' }}</span>
    </button>
    <button v-if="canAbort" class="orange" @click="abort">
      Abort
    </button>
    <pre lang="yaml">{{ text }}</pre>
  </div>
</template>
