import axios from "axios";
import { Cookies } from "quasar";

// const APIUrl = process.env.RestApiLocal;

const APIUrl =
  process.env.Platform && process.env.Platform.toUpperCase() === "DEV"
    ? process.env.RestApiLocal
    : process.env.RestApiProd;

export default {
  async endPointCallGet(endPoint, token) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${APIUrl}/room-mgt/${endPoint}`, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async endPointCallPost(endPoint, data, token) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${APIUrl}/room-mgt/${endPoint}`,
        data,
        { headers }
      );
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async endPointCallGetParameter(endPoint, data, token) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${APIUrl}/room-mgt/${endPoint}`, {
        params: data,
        headers,
      });

      return response.data;
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  },
};
