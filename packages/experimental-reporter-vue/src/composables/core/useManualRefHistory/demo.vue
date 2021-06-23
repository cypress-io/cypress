<script setup lang="ts">
import dayjs from 'dayjs'
import { useManualRefHistory } from '.'
import { useCounter } from '../../shared'

const format = (ts: number) => dayjs(ts).format()

const { inc, dec, count } = useCounter()
const { canUndo, canRedo, history, commit, undo, redo } = useManualRefHistory(count, { capacity: 10 })
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
  <button @click="commit()">
    Commit
  </button>
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
