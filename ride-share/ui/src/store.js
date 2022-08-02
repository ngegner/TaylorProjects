import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    currentAccount: null,
    searchKey: '',
    searchType: '',
    currentUser: 10,
  },

  getters: {
    getSearchKey(state) {
      return state.searchKey !== '';
    },
    getSearchType(state) {
      return state.searchType !== '';
    },
    currentUser(state) {
      return state.currentUser;
    },
  },

  mutations: {
    newSearchKey(state, searchKeyInput) {
      state.searchKey = searchKeyInput;
    },
    newSearchType(state, searchTypeInput) {
      state.searchType = searchTypeInput;
    },
    changeCurrentUser(state, userNumber) {
      state.currentUser = userNumber;
    },
  }
});
