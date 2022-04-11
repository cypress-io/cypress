<template>
  <div class="pizza-order">
    <router-link class="home" :to="{ name: 'home' }">Go Home</router-link><br>
    <div class="toppings" style="float: left; width: 50%">
      <h4>Select Your Toppings</h4>
      <ul>
        <li v-for="topping in toppings" :key="topping.name">
          <input
            type="checkbox"
            :id="topping.name"
            :value="topping"
            v-model="selected"
          >
          <label :for="topping.name">
            {{ topping.icon }} {{ topping.name }}
          </label>
        </li>
      </ul>
    </div>
    <div class="order-overview" style="float: left; width: 50%">
      <h4>Order Overview</h4>
      <ul v-if="selected.length">
        <li v-for="topping in selected" :key="topping.name">
          {{ topping.icon }} {{ topping.name }}
        </li>
      </ul>
      <div v-else>
        👈 Select your toppings.
      </div>
    </div>
  </div>
</template>

<script>
import { ALL_TOPPINGS, PRESETS } from './toppings'

const filterByName = (list, name) =>
  list.filter(i => i.name === name)

export default {
  data () {
    return {
      toppings: ALL_TOPPINGS,
      selected: [],
    }
  },

  methods: {
    hasTopping (name) {
      return !!filterByName(this.selected, name)[0]
    },
    getTopping (name) {
      return filterByName(ALL_TOPPINGS, name)[0]
    }
  },

  created () {
    const presetName = this.$route.params.preset
    this.selected = presetName ? PRESETS[presetName]: []

    const selectedToppings = this.$route.query
    for (const toppingName of Object.keys(selectedToppings)) {
      if(selectedToppings[toppingName] && !this.hasTopping(toppingName)) {
        const topping = this.getTopping(toppingName)
        this.selected.push(topping)
      }
    }
  }
}
</script>


