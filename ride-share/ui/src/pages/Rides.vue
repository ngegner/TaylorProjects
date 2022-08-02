<template>
  <v-container>
    <div>
      <h4 class="display-1">Rides</h4>

      <v-data-table
        v-if="rides.length != 0"
        class="elevation-1"
        :headers="headers"
        :items="rides"
      >
        <template v-slot:item="{ item }">
          <tr>
            <td>{{ item.toLocation.name }}</td>
            <td>{{ item.date[0,11] }}</td>
            <!--td>{{ item.capacity }}</td :disabled='item.capacity < item.passengerCount'-->
            <td>{{ item.passengerCount }}</td>
            <td>{{ item.toLocation.state }}</td>
            <td>{{ item.toLocation.city }}</td>
            <td>{{ item.toLocation.address }}</td>
            <td>{{ item.toLocation.zipCode }}</td>
            <v-btn @click="joinRide(item.id)">Join Ride</v-btn>
            <v-btn @click="driveRide(item.id)">Drive</v-btn>
          </tr>
        </template>
      </v-data-table>
      <div v-else>
        <p>{{ errorMessage }}</p>
      </div>
      <div>
        <v-btn color="#60944D" text :to="{ name: 'home-page' }"
          >Search again</v-btn
        >
      </div>
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
  name: "Rides",

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

      rides: [],

      dialogHeader: "<no dialogHeader>",
      dialogText: "<no dialogText>",
      dialogVisible: false,

      errorMessage: '',
    };
  },
  mounted() {
    let sendType = this.$store.state.searchType;
    let sendKey = this.$store.state.searchKey;
    this.$axios
      .get(`/rides/${sendKey}/${sendType}`)
      .then((result) => {
        if (result.data.ok) {
          //this.showDialog("Success", result.data.msge);
          //What is returned?
          this.rides = result.data.msge;
        } else {
          this.errorMessage = result.data.msge;
        }
      })
      .catch((err) => console.log("Failed", err));
  },
  methods: {
    joinRide(id) {
      this.$axios
        .put(`/passengers/${id}/${this.$store.state.currentUser}`)
        .then((result) => {
          if (result.data.ok) {
            this.showDialog("Success", result.data.msge);
            //this.rides = result.data.msge;
          } else {
            this.showDialog("Sorry", result.data.msge);
          }
        })
        .catch((err) => console.log("Failed", err));
    },
    driveRide(id) {
      this.$axios
        .put(`/drivers/${id}/${this.$store.state.currentUser}`)
        .then((result) => {
          if (result.data.ok) {
            this.showDialog("Success", result.data.msge);
            //this.rides = result.data.msge;
          } else {
            this.showDialog("Sorry", result.data.msge);
          }
        })
        .catch((err) => console.log("Failed", err));
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
