import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import helperMethods from "../helperMethods.js";
import Store from "../store/index.js";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
    routes: [
      {
        path: "/",
        redirect: "/schedule-room-booking",
        component: () => import("layouts/MainLayout.vue"),
        children: [
          {
            path: "/insert-room",
            name: "/Insert Room",
            meta: {
              title: "Insert Room",
              requiresAuth: true,
            },
            component: () => import("src/pages/InsertRoom.vue"),
          },
          {
            path: "/schedule-class-room",
            name: "/Classroom Scheduler",
            meta: {
              title: "Classroom Scheduler",
              requiresAuth: true,
            },
            component: () => import("src/pages/ScheduleClassroom.vue"),
          },
          {
            path: "/schedule-room-booking",
            name: "/Room Scheduler",
            meta: {
              title: "Room Scheduler",
              requiresAuth: true,
            },
            component: () => import("src/pages/ScheduleBooking.vue"),
          },
          {
            path: "/schedule-custom-classroom-scheduler",
            name: "/Custom Classroom",
            meta: {
              title: "Custom Classroom",
              requiresAuth: true,
            },
            component: () => import("src/pages/CustomClassroomBooking.vue"),
          },
          {
            path: "/scheduled-rooms",
            name: "/Scheduled Rooms",
            meta: {
              title: "Scheduled Rooms",
              requiresAuth: true,
            },
            component: () => import("src/pages/ScheduledRooms.vue"),
          },
          {
            path: "/generate-report",
            name: "Generate Report",
            meta: {
              title: "GenerateReport",
              requiresAuth: true,
            },
            component: () => import("src/pages/GenerateReport.vue"),
          },

          {
            path: "/calendar-view",
            name: "Calendar View",
            meta: {
              title: "CalendarView",
              requiresAuth: true,
            },
            component: () => import("src/pages/CalendarView.vue"),
          },

          {
            path: "/classroom-utiiization",
            name: "Classroom Utilization",
            meta: {
              title: "ClassroomUtilization",
              requiresAuth: true,
            },
            component: () => import("src/pages/ClassroomUtilization.vue"),
          },
          {
            path: "/report",
            name: "Report",
            meta: {
              title: "Report",
              requiresAuth: true,
            },
            component: () => import("src/pages/Reports.vue"),
          },
        ],
      },
      {
        path: "/login",
        name: "Login",
        meta: {
          title: "Login",
        },
        component: () => import("pages/Login.vue"),
      },
    ],
  });

  Router.beforeEach(async (to, from, next) => {
    helperMethods.setPageTitle(to.meta.title + " - " + process.env.APP_NAME);
    let toFullPathLowerCase = to.fullPath.toLowerCase();

    if (
      helperMethods.getCookie("token") &&
      Store.getters["userModule/hasValues"] === false
    ) {
      let token = helperMethods.getCookie("token");
      await Store.dispatch("userModule/setNewValues", token);
    }

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (Store.getters["userModule/hasValues"] === false) {
        return next("/login");
      }
      return next();
    } else {
      if (
        Store.getters["userModule/hasValues"] === true &&
        toFullPathLowerCase.includes("/login") === true
      ) {
        return next(from);
      }
      return next();
    }
  });

  return Router;
});
