import axios from "axios";

export default (store) => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 403) {
        await store.dispatch("userModule/setDefaultValues", true);
      }
      return Promise.reject(error);
    }
  );
};
