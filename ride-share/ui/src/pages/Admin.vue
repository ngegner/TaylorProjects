<template>
  <v-container>
    <!-- Vehicle Table -->
    <div>
      <h4 class="display-1">Admin</h4>

      <v-data-table
        class="elevation-1"
        :headers="vehicleHeaders"
        :items="vehicles"
        v-if="vehicles.length != 0"
      >
        <template v-slot:item="{ item }">
          <tr>
            <td>{{ item.make }}</td>
            <td>{{ item.model }}</td>
            <td>{{ item.color }}</td>
            <td>{{ item.vehicleType.type }}</td>
            <td>{{ item.capacity }}</td>
            <td>{{ item.mpg }}</td>
            <td>{{ item.licenseState }}</td>
            <td>{{ item.licensePlate }}</td>
            <v-icon
              small
              class="ml-2"
              color="#464343"
              @click="editVehicleItem(item)"
              >mdi-wrench</v-icon
            >
            <v-icon
              small
              class="ml-2"
              color="#464343"
              @click="deleteVehicleItem(item, item.id)"
              >mdi-delete</v-icon
            >
          </tr>
        </template>

        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Vehicles</v-toolbar-title>
            <v-divider class="mx-4" inset vertical> </v-divider>
            <v-spacer></v-spacer>
            <!-- Create new vehicle -->
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="#60944D"
                  dark
                  class="mb-2"
                  v-bind="attrs"
                  v-on="on"
                  @click="setNewVehicle"
                >
                  New Vehicle
                </v-btn>
              </template>
              <!-- Display edit form -->
              <v-card>
                <v-card-title
                  ><span class="headline">{{ formTitle }}</span></v-card-title
                >
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.make"
                          label="Make"
                        />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.model"
                          label="Model"
                        />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.color"
                          label="Color"
                        />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.type"
                          label="Vehicle Type"
                        />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.capacity"
                          label="Capacity"
                        />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field v-model="editedVehicle.mpg" label="MPG" />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.licenseState"
                          label="License State"
                        />
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-text-field
                          v-model="editedVehicle.licensePlate"
                          label="License Plate"
                        />
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>

                <!-- Keep or discard new vehicle -->
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="#cf142b" text @click="close"> Cancel </v-btn>
                  <v-btn color="#464343" text @click="save"> Save </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Confirm deletion -->
            <v-dialog v-model="dialogDelete" max-width="500px">
              <v-card>
                <v-card-title class="headline"
                  >Are you sure you want to delete this item?</v-card-title
                >
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="#cf142b" text @click="closeDelete">Cancel</v-btn>
                  <v-btn color="#464343" text @click="deleteVehicleConfirm"
                    >OK</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-toolbar>
        </template>

      </v-data-table>
      <v-btn text color="#60944D" @click="send">Send</v-btn>
    </div>
    <!-- TODO: Display ride controls -->

    <!-- display result dialog -->
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
  name: "admin",

  data() {
    return {
      dialog: false,
      dialogDelete: false,

      dialogHeader: "<no dialogHeader>",
      dialogText: "<no dialogText>",
      dialogVisible: false,

      errorMessage: "",

      vehicleHeaders: [
        { text: "Make", align: "start", sortable: false, value: "make" },
        { text: "Model", value: "model" },
        { text: "Color", value: "color" },
        { text: "Vehicle Type", value: "type" },
        { text: "Capacity", value: "capcity" },
        { text: "MPG", value: "mpg" },
        { text: "License State", value: "licenseState" },
        { text: "License Plate", value: "licensePlate" },
      ],
      vehicles: [],
      editedIndex: -1,
      // Model for edited vehicle, replaced when vehicle selected
      editedVehicle: {
        make: "",
        model: "",
        color: "",
        type: "",
        mpg: 0,
        licenseState: "",
        licensePlate: "",
      },
      defaultVehicle: {
        make: "",
        model: "",
        color: "",
        type: "",
        mpg: 0,
        licenseState: "",
        licensePlate: "",
      },

      newVehicle: false,
    };
  },

  computed: {
    // If editing an item in the table, label the editing form
    formTitle() {
      return this.editedIndex === -1 ? "New Vehicle" : "Edit Vehicle";
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      val || this.closeDelete();
    },
  },

  mounted() {
    this.$axios
      .get(`/vehicles`)
      .then((result) => {
        if (result.data.ok) {
          this.vehicles = result.data.msge;
        } else {
          this.showDialog("Sorry", result.data.msge);
        }
      })
      .catch((err) => this.showDialog(err));
    // TODO: add routes for rest of tables
  },

  methods: {
    editVehicleItem(item) {
      this.editedIndex = this.vehicles.indexOf(item);
      // Object.assign takes a target and a source
      // empty object is replaced with the value of the edited item
      this.editedVehicle = Object.assign({}, item);
      this.dialog = true;
    },
    deleteVehicleItem(item, id) {
      this.$axios
        .delete(`/vehicles/${id}`)
        .then((result) => {
          if (result.data.ok) {
            this.showDialog("Success", result.data.msge);
          } else {
            this.showDialog("Failure", result.data.msge);
          }
        })
        .catch((err) => this.showDialog("ERROR", err));

      this.editedIndex = this.vehicles.indexOf(item);
      this.editedVehicle = Object.assign({}, item);
      this.dialogDelete = true;
    },
    // deletes item (press "OK" during deleteVehicleConfirm)
    deleteVehicleConfirm() {
      this.vehicles.splice(this.editedIndex, 1);
      this.closeDelete();
    },
    // discard created vehicle
    close() {
      this.dialog = false;
      // $nextTick() performs the enclosed function upon the next DOM update
      this.$nextTick(() => {
        this.editedVehicle = Object.assign({}, this.defaultVehicle);
        this.editedIndex = -1;
      });
    },
    // cancels delete (press "cancel" during deleteVehicleConfirm)
    closeDelete() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedVehicle = Object.assign({}, this.defaultVehicle);
        this.editedIndex = -1;
      });
    },
    // add created vehicle to table
    save() {
      if (this.editedIndex > -1) {
        Object.assign(this.vehicles[this.editedIndex], this.editedVehicle);
      } else {
        this.vehicles.push(this.editedVehicle);
      }
      this.close();
    },
    setNewVehicle() {
      if (this.newVehicle === false) {
        this.newVehicle = true;
      }
    },
    // Send all updates made to server
    send() {
      this.vehicles.forEach((vehicle) => {
        this.$axios
          .patch(`/vehicles`, {
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            type: vehicle.vehicleTypeID,
            capacity: vehicle.capacity,
            mpg: vehicle.mpg,
            licenseState: vehicle.licenseState,
            licensePlate: vehicle.licensePlate,
          })
          .then((result) => {
            if (result.data.ok) {
              console.log(`SUCCESS: ${result.data.msge}`);
            } else {
              console.log(`FAILED: ${result.data.msge}`);
            }
          })
          .catch((err) => `ERROR: ${err}`);
      });
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
