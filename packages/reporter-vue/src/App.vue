<template>
  {{ store.number }}
  <button @click="store.number++">increment</button>
</template>

<script lang="ts">
import { defineStore } from 'pinia'
import { defineComponent } from "vue";


// useStore could be anything like useUser, useCart
const useStore = defineStore({
  // unique id of the store across your application
  id: 'storeId',
  state(){
    return {number: 0}
  },
  actions: {
    increment() {
      this.number++
    }
  }
})

export default defineComponent({
  name: "App",
  props: ["reporterBus", "state"],
  setup(props) {
    const store = useStore()
    return { store }
  }
});
</script>
