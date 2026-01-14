<!-- <template>
  <q-layout view="hHh Lpr lff">
    <Loader :isLoading="loader" :logout="true" />

    <q-header elevated class="bg-blue-10">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleDrawer"
        />

        <q-toolbar-title style="cursor: pointer">
          {{ app_name }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer style="position: relative" v-model="drawer" show-if-above>
      <q-btn
        flat
        round
        dense
        size="md"
        icon="close"
        class="drawerBtn"
        @click="toggleDrawer"
      />

      <div
        class="q-pa-none text-center inputClass"
        style="
          position: absolute;
          inset: 10px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
        "
      >
        <div style="position: sticky; top: 0">
          <q-card-section style="margin: 75px 0">
            <div class="avatar-container">
              <q-avatar size="160px" class="absolute-center">
                <img :src="imageApi + employeeId" alt="avatar" />
              </q-avatar>
            </div>
          </q-card-section>

          <q-item-label header class="text-center text-black">
            <span class="text-subtitle1 text-bold q-pa-none">
              {{ employeeFullName }}
            </span>
            <div
              class="text-caption text-grey-8 q-pa-none"
              style="
                word-break: break-word;
                white-space: normal;
                line-height: 1;
              "
            >
              {{ employeeDeptDesc }}
            </div>
          </q-item-label>
        </div>

        <div
          class="drawerScroll q-pa-none"
          style="
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          "
        >
          <q-list>
            <q-item class="flex column">
              <EssentialLink
                style="width: 100%"
                v-for="link in essentialLinks"
                :key="link.title"
                v-bind="link"
              />
            </q-item>
          </q-list>
        </div>
        <div style="padding: 10px; text-align: center; flex-shrink: 0">
          <q-btn
            style="width: 100%"
            class="bg-negative text-white"
            icon="logout"
            name="logout"
            label="logout"
            @click="onLogout()"
          />
        </div>

        <div style="text-align: center; flex-shrink: 0">
          <div style="display: flex; justify-content: center">
            <img
              src="../assets/images/uerm-hospital-logo.png"
              alt="logo"
              style="width: 60%; height: auto; max-height: 100px"
            />
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template> -->

<template>
  <q-layout view="lHh Lpr lff">
    <q-drawer
      v-model="drawer"
      show-if-above
      :width="290"
      :breakpoint="0"
      style="position: relative; background: transparent"
    >
      <q-btn
        flat
        round
        dense
        size="lg"
        icon="close"
        class="drawerBtn"
        style="position: absolute; right: 10px; top: 10px; z-index: 1"
        @click="toggleDrawer"
      />

      <div
        class="q-pa-none text-center drawerStyle"
        style="
          position: absolute;
          inset: 5px 10px 5px 10px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          height: calc(100% - 10px);
        "
      >
        <div class="q-pa-none" style="position: sticky; top: 0">
          <div style="padding: 10px 0 0 0; text-align: center">
            <img
              src="../assets/images/uerm-hospital-logo.png"
              alt="logo"
              style="
                width: 90%;
                height: auto;
                max-height: 120px;
                object-fit: contain;
              "
            />
          </div>
          <div header class="text-center q-pb-md">
            <div
              class="text-caption text-grey-8 q-pa-none text-bold q-mt-xs"
              style="
                word-break: break-word;
                white-space: normal;
                line-height: 1.2;
              "
            >
              University of East Ramon Magsaysay Memorial Medical Center Inc.
            </div>
          </div>
        </div>

        <!-- Scrollable Menu Items -->
        <div
          class="drawerScroll q-pa-none"
          style="
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            padding-bottom: 80px;
          "
        >
          <q-list>
            <q-item class="flex column">
              <EssentialLink
                style="width: 100%"
                v-for="link in essentialLinks"
                :key="link.title"
                v-bind="link"
              />
            </q-item>
          </q-list>
        </div>

        <!-- Floating Logout Button -->
        <div
          style="
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            z-index: 100;
          "
        >
          <q-btn
            style="width: 100%"
            unelevated
            class="bg-negative text-white"
            icon="logout"
            name="logout"
            label="logout"
            @click="onLogout()"
          />
        </div>
      </div>
    </q-drawer>

    <q-header
      class="bg-primary"
      :style="drawer ? 'border-bottom-left-radius: 10px' : ''"
    >
      <q-toolbar>
        <q-btn
          v-if="!drawer"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleDrawer"
        />

        <q-toolbar-title
          @click="redirectToAnnouncements()"
          style="cursor: pointer"
        >
          {{ app_name }}
        </q-toolbar-title>
        <q-space />

        <q-btn flat round dense>
          <q-avatar class="avatar-pop" size="40px">
            <img :src="imageApi + employeeId" alt="avatar" />
          </q-avatar>
          <q-menu class="no-hover">
            <q-card style="min-width: 250px">
              <q-card-section class="text-center q-pb-sm">
                <q-avatar size="80px" class="q-mb-sm">
                  <img :src="imageApi + employeeId" alt="avatar" />
                </q-avatar>
                <div class="text-subtitle1 text-bold">
                  {{ employeeFullName }}
                </div>
                <!-- <div class="text-caption text-grey-7">
                  {{ employeePosition }}
                </div> -->
                <div class="text-caption text-grey-7">
                  {{ employeeDeptDesc }}
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-pa-xs">
                <div
                  class="avatarBtn q-pa-sm cursor-pointer"
                  v-ripple
                  v-close-popup
                  @click="onLogout"
                >
                  <q-icon
                    name="logout"
                    size="sm"
                    class="q-mr-lg q-ml-sm text-negative"
                  />
                  <span class="text-black">Logout</span>
                </div>
              </q-card-section>
            </q-card>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from "vue";
import EssentialLink from "components/EssentialLink.vue";
import { mapGetters } from "vuex";
import helperMethods from "src/helperMethods";
import { QSpinnerIos } from "quasar";
import Loader from "../components/Loader.vue";

const linksList = [
  // {
  //   title: "Insert Room",
  //   caption: "Insert Room",
  //   icon: "room_preferences",
  //   link: "/insert-room",
  // },
  // {
  //   title: "Classroom Scheduler",
  //   caption: "Classroom Scheduler",
  //   icon: "calendar_month",
  //   link: "/schedule-class-room",
  // },
  {
    title: "Book A Room",
    caption: "Room Scheduler",
    icon: "pending_actions",
    link: "/schedule-room-booking",
  },
  {
    title: "Book A Class",
    caption: "Custom Classroom",
    icon: "pending_actions",
    link: "/schedule-custom-classroom-scheduler",
  },
  {
    title: "Scheduled Rooms",
    caption: "Scheduled Rooms",
    icon: "event_available",
    link: "/scheduled-rooms",
  },
  {
    title: "Calendar View",
    caption: "CalendarView",
    icon: "calendar_month",
    link: "/calendar-view",
  },
  // {
  //   title: "Generate Report",
  //   caption: "GenerateReport",
  //   icon: "text_snippet",
  //   link: "/generatereport",
  // },
  // {
  //   title: "Classroom Utilization",
  //   caption: "ClassroomUtilization",
  //   icon: "receipt_long",
  //   link: "/classroomutiiization",
  // },
  {
    title: "Report",
    caption: "Report",
    icon: "receipt_long",
    link: "/report",
  },
];

export default defineComponent({
  name: "MainLayout",

  components: {
    EssentialLink,
    Loader,
  },

  data() {
    return {
      app_name: process.env.APP_NAME,
      essentialLinks: linksList,
      drawer: false,
      imageApi: process.env.ImageApi,
      loader: false,
    };
  },

  computed: {
    ...mapGetters({
      employeeId: "userModule/getEmployeeId",
      employeeFullName: "userModule/getEmployeeFullName",
      employeeDeptDesc: "userModule/getEmployeeDeptDesc",
    }),
  },

  methods: {
    toggleDrawer: function () {
      this.drawer = !this.drawer;
    },

    async onLogout() {
      this.loader = true;
      // this.$q.loading.show({
      //   spinner: QSpinnerIos,
      //   message: "Logging Out",
      //   messageColor: "blue-10",
      //   backgroundColor: "grey-1",
      //   spinnerColor: "blue-10",
      //   customClass: "custom-loading-style",
      //   spinnerSize: "7em",
      // });
      await this.$store.dispatch("userModule/logout", this.employeeId);
      this.loader = false;
      // this.$q.loading.hide();
    },
  },
});
</script>
