<template>
  <div>
    <h1>Users</h1>
    <ul v-if="users && users.length">
      <li class="user" v-for="user of users" v-bind:key="user.id">
        <p><strong>{{user.id}}</strong> - {{user.name}}</p>
      </li>
    </ul>
    <p class="loading" v-else>Loading...</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: []
    }
  },

  created() {
    fetch('https://jsonplaceholder.cypress.io/users?_limit=3')
    .then(response => response.json())
    .then(list => {
      this.users = list
    })
  }
}
</script>
