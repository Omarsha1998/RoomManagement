<template>
  <div class="bgImageUERM d-flex justify-center align-center">
    <div>
      <Loader :isLoading="loader" :login="true" />
      <q-layout class="d-flex justify-center align-center q-pa-xl">
        <q-card
          :class="[
            $q.screen.name + '-text',
            $q.screen.name + '-width2',
            $q.screen.name + '-height2',
            'black-shadow',
          ]"
          style="border-radius: 25px"
        >
          <div class="row bg-white" style="width: 100%; height: 100%">
            <div
              class="d-flex justify-center align-center"
              :class="$q.screen.gt.xs ? 'col-6' : 'col-12'"
            >
              <div class="bg-blue-10 logoClass">
                <img
                  :src="imageLogo"
                  alt="Logo"
                  style="width: 100%; height: 100%"
                />
              </div>
            </div>
            <div
              class="d-flex justify-center align-center"
              :class="$q.screen.gt.xs ? 'col-6' : 'col-12'"
            >
              <q-form
                class="full-width"
                method="post"
                @submit.prevent="submitLogin"
                autocomplete="off"
              >
                <div class="text-center q-mt-md">
                  <p class="text-bold">Hi, Good {{ greeting }}!</p>
                </div>
                <div class="q-pa-md">
                  <q-input
                    v-model="employeeId"
                    class="q-mb-md"
                    label="Secretary Code"
                    label-color="blue-10"
                    outlined
                  />
                  <q-input
                    class="q-mb-xs"
                    v-model="password"
                    label="Password"
                    label-color="blue-10"
                    outlined
                    :type="passwordVisible ? 'text' : 'password'"
                  >
                    <template v-slot:append>
                      <q-icon
                        v-if="!passwordVisible"
                        name="visibility_off"
                        color="black-10"
                        @click="passwordVisible = !passwordVisible"
                      />
                      <q-icon
                        v-else
                        name="visibility"
                        color="black-10"
                        @click="passwordVisible = !passwordVisible"
                      />
                    </template>
                  </q-input>
                </div>
                <q-checkbox
                  class="q-pl-sm text-subtitle1"
                  v-model="rememberMe"
                  label="Remember Me"
                  color="blue-10"
                />
                <q-card-section class="text-center">
                  <q-btn
                    class="full-width"
                    color="blue-10"
                    label="Login"
                    type="submit"
                    push
                  />
                </q-card-section>
              </q-form>
            </div>
          </div>
        </q-card>
      </q-layout>
    </div>
  </div>
</template>

<script>
import { QSpinnerIos } from "quasar";
import helperMethods from "../helperMethods.js";
import logo from "../assets/images/LOGOWITHOUTBGWHITETEXT.png";
import Loader from "../components/Loader.vue";
import { Cookies } from "quasar";

export default {
  data() {
    return {
      appName: process.env.APP_NAME,
      employeeId: "",
      password: "",
      imageLogo: logo,
      loader: false,
      rememberMe: false,
      passwordVisible: false,
    };
  },

  components: {
    Loader,
  },

  computed: {
    greeting() {
      const currentHour = new Date().getHours();
      return currentHour < 12 ? "Morning" : "Afternoon";
    },
  },

  methods: {
    async submitLogin() {
      if (!this.employeeId || !this.password) {
        this.$q.notify({
          color: "negative",
          position: "center",
          message: "Input the Required Field",
          icon: "report_problem",
          iconColor: "white",
          timeout: 1000,
          progress: true,
        });
        return;
      }
      this.loader = true;
      try {
        const data = {
          employeeId: this.employeeId,
          password: this.password,
        };

        await this.$store.dispatch("userModule/login", data);
        // this.$q.loading.hide();
        if (this.rememberMe) {
          Cookies.set("secretaryCode", this.employeeId, {
            expires: 7,
          });
          Cookies.set("password", this.password, { expires: 7 });
          Cookies.set("rememberMe", "true", { expires: 7 });
        } else {
          Cookies.remove("secretaryCode");
          Cookies.remove("password");
          Cookies.remove("rememberMe");
        }
        this.loader = false;
        this.$router.push("/");
      } catch (error) {
        // this.$q.loading.hide();
        this.loader = false;
        if (error.response.status == "402") {
          this.$q.notify({
            color: "negative",
            position: "center",
            message: error.response.data.body,
            icon: "report_problem",
            iconColor: "white",
            timeout: 1000,
            progress: true,
          });
        }
      }
    },
  },
};
</script>
