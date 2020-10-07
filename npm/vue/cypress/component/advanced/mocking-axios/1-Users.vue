<template>
  <div>
    <h1>Axios Get</h1>
    <ul v-if="users && users.length">
      <li v-for="user of users" v-bind:key="user.id">
        <p><strong>{{user.id}}</strong> - {{user.name}}</p>
      </li>
    </ul>
  </div>
</template>

<script>
// import just the "get" from axios
import {get} from 'axios';

export default {
  data() {
    return {
      users: []
    }
  },

  // Fetches posts when the component is created.
  created() {
    get('https://jsonplaceholder.cypress.io/users?_limit=3')
    .then(response => {
      // JSON responses are automatically parsed.
      this.users = response.data
    })
  }
}
</script>
