import axios from "axios";
import { Cookies } from "quasar";
import helperMethods from "src/helperMethods";
import helper from "../../helperApi";

// const APIUrl = process.env.RestApiLocal;

const APIUrl =
  process.env.Platform === "DEV"
    ? process.env.RestApiLocal
    : process.env.RestApiProd;

export default {
  async login({ commit, dispatch }, data) {
    try {
      // const response = await axios.post(`${APIUrl}/room-mgt/login`, data);
      const response = await helper.endPointCallPost("login", data);
      let token = response.data;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 3);
      helperMethods.createCookie("token", token, {
        expires: expirationDate,
        path: "/login",
      });
      dispatch("setNewValues", token);
    } catch (error) {
      console.error("Error Logging In", error);
      throw error;
    }
  },

  setNewValues({ commit }, token) {
    try {
      const [, payloadBase64] = token.split(".");

      const cleanedPayload = payloadBase64
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const decodedPayload = JSON.parse(
        decodeURIComponent(escape(atob(cleanedPayload))),
        "utf-8"
      );
      decodedPayload.token = token;
      commit("SET_LOGIN_DATA", decodedPayload);
    } catch (error) {
      throw error;
    }
  },

  async logout({ dispatch }, employeeId) {
    try {
      const token = Cookies.get("token");
      const data = {
        tokenValue: token,
        employeeIdValue: employeeId,
      };
      const response = await axios.post(`${APIUrl}/room-mgt/logout`, data, {
        headers: { Authorization: `Bearer ${Cookies.get("token")}` },
      });
      if (response.status === 200 || response.status === 401) {
        await dispatch("setDefaultValues", true);
      } else {
        throw new Error("An error has occurred in user_module.logout()");
      }
    } catch (error) {
      console.error("Error Logging In", error);
      throw error;
    }
  },

  setDefaultValues({ commit }, refreshPage = false) {
    try {
      helperMethods.deleteCookie("token");
      commit("SET_LOGIN_DATA_DEFAULT");
      if (refreshPage === true) {
        helperMethods.refreshPage();
        return this.$router.push("/login");
      }
    } catch (error) {
      throw error;
    }
  },
};
