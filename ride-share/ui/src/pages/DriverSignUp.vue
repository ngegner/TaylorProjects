<template>
  <v-container>
    <h4 class="display-1">Sign Up to Drive</h4>

    <v-form v-model="valid">
      <v-text-field
        v-model="newDriver.licenseNumber"
        label="License Number"
        :rules="[(v) => !!v || 'Item is required']"
        required
      />
      <v-text-field
        v-model="newDriver.licenseState"
        label="License State"
        :rules="[(v) => !!v || 'Item is required']"
        required
      />
      <v-btn :disabled="!valid" color="#60944D" @click="handleSubmit"> Sign Up </v-btn>
    </v-form>

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
            <v-btn color="##464343" text v-on:click="hideDialog">Okay</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "driverSignUp",

  data() {
    return {
      valid: false,

      newDriver: {
        userID: this.$store.state.currentUser,
        licenseNumber: "",
        licenseState: 0, // Is licenseState supposed to be an int?
      },

      signedUp: false,

      dialogHeader: "<no dialogHeader>",
      dialogText: "<no dialogText>",
      dialogVisible: false,
    };
  },
  methods: {
    handleSubmit() {
      this.signedUp = false;

      this.$axios
        .post("/drivers", {
          userID: this.newDriver.userID,
          licenseNumber: this.newDriver.licenseNumber,
          licenseState: this.newDriver.licenseState,
        })
        .then((result) => {
          if (result.data.ok) {
            this.showDialog("Success", result.data.msge);
            this.signedUp = true;
          } else {
            this.showDialog("Sorry", result.data.msge);
          }
        })
        .catch((err) => this.showDialog("Failed", err));
    },
    showDialog: function (header, text) {
      this.dialogHeader = header;
      this.dialogText = text;
      this.dialogVisible = true;
    },
    hideDialog: function () {
      this.dialogVisible = false;
    },
  },
};
</script>
