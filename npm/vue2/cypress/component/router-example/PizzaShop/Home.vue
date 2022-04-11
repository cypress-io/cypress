<template>
  <div class="shop-home">
    <router-link
      :to="{ name: 'order' }"
      tag="button"
      class="order"
    >
      Place Your Order
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
      :to="{ name: 'order', params: { preset: 'hawaian' } }"
      class="order-hawaian"
    >
      🍍 Hawain
    </router-link><br>
    <router-link
      :to="{ name: 'order', query: { cheese: true } }"
      class="order-cheese"
    >
      🧀 Just Cheese
    </router-link>
  </div>
</template>
