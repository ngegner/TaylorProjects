import Vue from "vue";
import Router from "vue-router";

import Home from "./pages/Home.vue";
import MyRides from "./pages/MyRides.vue";
import DriverDetails from "./pages/DriverDetails.vue";
import Rides from "./pages/Rides.vue";
import Admin from "./pages/Admin.vue"
import DriverSignUp from "./pages/DriverSignUp.vue";
import User from "./pages/User.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    { name: "home-page", path: "/", component: Home },
    { name: 'myRides', path: '/myRides', component: MyRides },
    { name: 'driverDetails', path: '/driverDetails', component: DriverDetails },
    { name: 'rides', path: '/rides', component: Rides },
    { name: "driverSignUp", path: "/driverSignUp", component: DriverSignUp },
    { name: 'admin', path: '/admin', component: Admin },
    { name: 'user', path: '/user', component: User },

  ]
});
