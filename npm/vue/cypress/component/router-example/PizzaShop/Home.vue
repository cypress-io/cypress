<template>
  <div class="shop-home">
    <router-link
      v-slot="{ navigate }"
      :to="{ name: 'order' }"
      custom
    >
      <button
        class="order"
        @click="navigate"
      >
        Place Your Order
      </button>
    </router-link>
    <br>
    <h4>Or select a popular option:</h4>
    <router-link
      :to="{ name: 'order', params: { preset: 'veggie' } }"
      class="order-veggie"
    >
      🥗 Veggie
    </router-link><br>
    <router-link
      :to="{ name: 'order', params: { preset: 'vegan' } }"
      class="order-vegan"
    >
      🥕 Vegan
    </router-link><br>
    <router-link
      :to="{ name: 'order', params: { preset: 'meatlover' } }"
      class="order-meatlover"
    >
      🍖 Meatlover
    </router-link><br>
    <router-link
      :to="{ name: 'order', params: { preset: 'hawaiian' } }"
      class="order-hawaiian"
    >
      🍍 Hawaiian
    </router-link><br>
    <router-link
      :to="{ name: 'order', query: { cheese: true } }"
      class="order-cheese"
    >
      🧀 Just Cheese
    </router-link>
  </div>
</template>
