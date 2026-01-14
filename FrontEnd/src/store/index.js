import { createStore, createLogger } from "vuex";
import middleware from "./middleware.js";
import roomModule from "./modules/roomModule";
import userModule from "./modules/userModule";

const Store = createStore({
  modules: {
    roomModule,
    userModule,
  },
  plugins: [middleware],
});

export default Store;
