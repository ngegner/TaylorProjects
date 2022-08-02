<template>
  <v-app-bar app dark color="#464343">
    <router-link v-bind:to="{ name: 'home-page' }">
      <v-img class="logo" src="http://cse.taylor.edu/~jmiller/pdrivep.PNG"/>
      <!-- <v-toolbar-title class="white--text">
        pdrivep
      </v-toolbar-title> -->
    </router-link>

    <v-spacer></v-spacer>

    <v-btn text :to="{ name: 'myRides' }">My Rides</v-btn>
    <v-btn text :to="{ name: 'driverDetails' }">Driver Details</v-btn>
    <v-btn :hidden='checkDriver' text :to="{ name: 'driverSignUp' }">Driver Sign Up</v-btn>
    <v-btn text :to="{ name: 'admin' }">Admin</v-btn>

  </v-app-bar>
</template>

<script>
export default {
  name: 'nav-bar',

  computed: {
    checkDriver() {
      this.$axios
        .get(`drives/${this.$store.state.currentUser}`)
        .then(result => {
          if( result.data.msge === `You are not signed up to drive` ) {
            return true;
          } else {
            return false;
          }
        })
        .catch(err => console.log(err));
    }
  }
}
</script>

<style scoped>
  .logo {
    display: inline-block;
    vertical-align: top;
    height: 50%;
    width: 30%;
    position: relative;
    z-index: -1;
    /*background-image: "../../public/pdrivep.PNG"*/
}
</style>
