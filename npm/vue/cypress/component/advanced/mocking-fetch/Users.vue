<template>
  <div>
    <h1>Users</h1>
    <ul v-if="users && users.length">
      <li
        v-for="user of users"
        :key="user.id"
        class="user"
      >
        <p><strong>{{ user.id }}</strong> - {{ user.name }}</p>
      </li>
    </ul>
    <p
      v-else
      class="loading"
    >
      Loading...
    </p>
  </div>
</template>

<script>
export default {
  data () {
    return {
      users: [],
    }
  },

  created () {
    fetch('https://jsonplaceholder.cypress.io/users?_limit=3')
    .then((response) => response.json())
    .then((list) => {
      this.users = list
    })
  },
}
</script>
