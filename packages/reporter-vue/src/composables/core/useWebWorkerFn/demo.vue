<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, ref, nextTick } from 'vue'
import { useWebWorkerFn } from '.'
import { useTimestamp } from '../useTimestamp'

const heavyTask = () => {
  const randomNumber = () => Math.trunc(Math.random() * 5_000_00)
  const numbers: number[] = Array(5_000_000).fill(undefined).map(randomNumber)
  numbers.sort()
  return numbers.slice(0, 5)
}

const { workerFn, workerStatus, workerTerminate } = useWebWorkerFn(heavyTask)
const time = useTimestamp()
const computedTime = computed(() => dayjs(time.value).format('YYYY-MM-DD HH:mm:ss SSS'))
const running = computed(() => workerStatus.value === 'RUNNING')

const data = ref<number[] | null>(null)
const runner = ref('')

const baseSort = async() => {
  data.value = null
  await nextTick()
  data.value = heavyTask()
  runner.value = 'Main'
}

const workerSort = async() => {
  data.value = null
  await nextTick()
  data.value = await workerFn()
  runner.value = 'Worker'
}
</script>

<template>
  <p>Current Time: <b>{{ computedTime }}</b></p>
  <note class="mb-2">
    This is a demo showing sort for large array (5 milion numbers) with or w/o WebWorker.<br>Clock stops when UI blocking happends.
  </note>
  <button @click="baseSort">
    Sort in Main Thread
  </button>
  <button v-if="!running" @click="workerSort">
    Sort in Worker
  </button>
  <button v-else class="orange" @click="workerTerminate">
    Terminate Worker
  </button>
  <p v-if="data">
    Thread: <strong>{{ runner }}</strong><br>
    Result: <strong>{{ data }}</strong>
  </p>
</template>
