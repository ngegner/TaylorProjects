<template>
  <v-container>
    <h4 class="display-1">Your Driving Plans</h4>

    <v-data-table
      v-if="driverPlans"
      class="elevation-1"
      :headers="headers"
      :items="driverPlans"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td>{{ item.toLocation.name }}</td>
          <td>{{ item.date }}</td>
          <!--td>{{ item.capacity }}</td :disabled='item.capacity < item.passengerCount'-->
          <td>{{ item.passengerCount }}</td>
          <td>{{ item.toLocation.state }}</td>
          <td>{{ item.toLocation.city }}</td>
          <td>{{ item.toLocation.address }}</td>
          <td>{{ item.toLocation.zipCode }}</td>
          <v-btn color="#cf142b" @click="cancelDrive(item.id)">Cancel</v-btn>
        </tr>
      </template>
    </v-data-table>
    <div v-else>
      <p>{{ errorMessage }}</p>
      <v-btn color="#60944D" text :to="{ name: 'home-page' }"
        >Search Rides</v-btn
      >
    </div>

    <div class="text-xs-center">
      <v-dialog v-model="dialogVisible" width="500">
        <v-card>
          <v-card-title primary-title>
            {{ dialogHeader }}
          </v-card-title>

          <v-card-text>
            {{ dialogText }}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="#464343" text v-on:click="hideDialog">Okay</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "driverDetails",

  data() {
    return {
      headers: [
        { text: "Ride", align: "start", sortable: false, value: "name" },
        { text: "Date", value: "date" },
        //{ text: 'Capacity', value: 'capacity' },
        { text: "Passengers", value: "passengerCount" },
        { text: "City", value: "city" },
        { text: "State", value: "state" },
        { text: "Address", value: "address" },
        { text: "Zip Code", value: "zipCode" },
        //{ text: 'Vehicle', value: 'vehicle' },
      ],

      driverPlans: [],

      dialogHeader: "<no dialogHeader>",
      dialogText: "<no dialogText>",
      dialogVisible: false,

      errorMessage: "",
    };
  },
  mounted() {
    this.$axios
      .get(`/drives/${this.$store.state.currentUser}`)
      .then((result) => {
        if (result.data.ok) {
          this.driverPlans = result.data.msge;
        } else {
          this.errorMessage = result.data.msge;
        }
      })
      .catch((err) => this.showDialog("Failed", err));
  },
  methods: {
    //doesn't work  
    cancelDrive(id) {
      this.$axios
        .delete(`/drives/${id}/${this.$store.state.currentUser}`)
        .then((result) => {
          if (result.data.ok) {
            this.showDialog("Success", result.data.msge);
            // IMPORTANT - How to remove ride from display?
            this.driverPlans = result.data.newList;
          } else {
            this.showDialog("Sorry", result.data.msge);
          }
        })
        .catch((err) => this.showDialog("Failed", err));
    },
    showDialog(header, text) {
      this.dialogHeader = header;
      this.dialogText = text;
      this.dialogVisible = true;
    },
    hideDialog() {
      this.dialogVisible = false;
    },
  },
};
</script>
