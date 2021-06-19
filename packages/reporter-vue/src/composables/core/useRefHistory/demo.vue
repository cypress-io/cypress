<script setup lang="ts">
import { useRefHistory } from '.'
import { useCounter } from '../../shared'
import dayjs from 'dayjs'

const format = (ts: number) => dayjs(ts).format()

const { count, inc, dec } = useCounter()
const { history, undo, redo, canUndo, canRedo } = useRefHistory(count, { capacity: 10 })
</script>

<template>
  <div>Count: {{ count }}</div>
  <button @click="inc()">
    Increment
  </button>
  <button @click="dec()">
    Decrement
  </button>
  <span class="ml-2">/</span>
  <button :disabled="!canUndo" @click="undo()">
    Undo
  </button>
  <button :disabled="!canRedo" @click="redo()">
    Redo
  </button>
  <br>
  <br>
  <note>History (limited to 10 records for demo)</note>
  <div class="code-block mt-4">
    <div v-for="i in history" :key="i.timestamp">
      <span class="opacity-50 mr-2 font-mono">{{ format(i.timestamp) }}</span>
      <span class="font-mono">{ value: {{ i.snapshot }} }</span>
    </div>
  </div>
</template>
