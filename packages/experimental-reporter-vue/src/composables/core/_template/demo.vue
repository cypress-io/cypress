<script setup lang="ts">
import { defineComponent } from 'vue'
import { useCounter } from '.'

return useCounter()
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="inc()">
      Increment
    </button>
    <button @click="dec()">
      Decrement
    </button>
    <button @click="inc(5)">
      Increment (+5)
    </button>
    <button @click="dec(5)">
      Decrement (-5)
    </button>
    <button @click="set(100)">
      Set (100)
    </button>
    <button @click="reset()">
      Reset
    </button>
  </div>
</template>
