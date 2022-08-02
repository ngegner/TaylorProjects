<template>
  <v-container>
    <v-form>
        <v-container>
          <v-text-field
            label='Where would you like to go?'
            :rules="[v => !!v || 'Item is required']"
            v-model='searchKey'
            filled>
          </v-text-field>

          <v-select
            v-model='searchType'
            :items="searchOptions"
            label="Choose search type"
            filled
            required
        ></v-select>    
          
          <v-divider></v-divider>

          <v-btn color="#60944D" @click='search'>Search</v-btn>
        </v-container>
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
            <v-btn color="#60944D" text v-on:click="hideDialog">Okay</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script>
  export default {
    name: 'Home', 

    data: () => {
      return {
        searchOptions: ['name', 'city', 'state', 'address', 'zipCode'],

        searchKey: '',  
        searchType: '',

        dialogHeader: "<no dialogHeader>",
        dialogText: "<no dialogText>",
        dialogVisible: false,
      };
    },
    methods: {
      search() {
        this.$store.commit('newSearchKey', this.searchKey);
        this.$store.commit('newSearchType', this.searchType);
        this.$router.push({ name: 'rides' });
      },
      showDialog(header, text) {
        this.dialogHeader = header;
        this.dialogText = text;
        this.dialogVisible = true;
      },
      hideDialog() {
        this.dialogVisible = false;
        if (this.accountCreated) {
          this.$router.push({ name: "home-page" });
        }
      },
    },
  }
</script>


<!-- <style scoped>
  #home {
    background: url("https://cars.usnews.com/pics/size/640x420/static/images/article/202010/128353/265689_XC60_Inscription_in_Pine_Grey_metallic_Cropped_640x420.jpg");
    background-size: auto;
  }
  v-text-field, v-select {
    color: white;
  }
</style> -->

