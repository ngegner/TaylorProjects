<template>
    <v-container>
        <v-text-field
            label='New User Number'
            v-model='newUser'
            filled>
        </v-text-field>
        <v-btn text @click='changeUser'>Change User</v-btn>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            newUser: 0,
        }
    },
    methods: {
        changeUser() {
            this.$store.commit('changeCurrentUser', this.newUser);
            if( this.$store.state.currentUser === this.newUser ) {
                console.log("SUCCESS");
            } else {
                console.log("FAILURE");
            }
        }
    }
}
</script>
