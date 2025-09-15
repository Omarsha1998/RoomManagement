<template>
  <q-layout>
    <q-page-container>
      <div class="container">
        <div class="row" style="width: 95%">
          <div class="col-12 q-pb-xl q-mt-md">
            <div v-if="loading">
              <SkeletonLoader :schedule="true" :bookedRooms="false" />
            </div>
            <div v-else>
              <reportComponent
                :buildingOptions="buildings"
                :roomOptions="rooms"
                :departmentOptions="departments"
              />
            </div>

            <!-- <q-card v-else>
              <q-tabs
                v-model="tab"
                indicator-color="amber-8"
                active-color="positive"
                class="bg-blue-10 text-amber-8 shadow-2 row"
              >
                <q-tab
                  :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                  name="classReportDaily"
                  icon="room_preferences"
                  label="Classroom Schedule"
                  inline-label
                  mobile-arrows
                />
                <q-tab
                  :class="$q.screen.gt.md ? 'col-6' : 'col-12'"
                  name="classUtilization"
                  icon="summarize"
                  label="Classroom Utilization"
                />
              </q-tabs>

              <q-separator></q-separator>

              <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="classReportDaily">
                  <reportComponent
                    :buildingOptions="buildings"
                    :roomOptions="rooms"
                    :departmentOptions="departments"
                    :utilization="false"
                  />
                </q-tab-panel>

                <q-tab-panel name="classUtilization">
                  <reportComponent
                    :buildingOptions="buildings"
                    :roomOptions="rooms"
                    :departmentOptions="departments"
                    :utilization="true"
                  />
                </q-tab-panel>
              </q-tab-panels>
            </q-card> -->
          </div>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapGetters } from "vuex";
import SkeletonLoader from "../components/loadingSkeleton.vue";
import helperMethods from "src/helperMethods";
import Loader from "../components/Loader.vue";
import reportComponent from "../components/reportComponent.vue";

let formatOptions = [
  { label: "Week", value: "Weekly" },
  { label: "Month", value: "Monthly" },
];

export default {
  data() {
    return {
      tab: "classReportDaily",
      loading: true,
      loadingCounter: null,
      buildings: null,
      rooms: null,
      departments: null,
      loader: false,
    };
  },

  components: {
    SkeletonLoader,
    Loader,
    reportComponent,
  },

  computed: {
    ...mapGetters({
      buildingOptions: "roomModule/getBuildingOptions",
      allRoomsReport: "roomModule/getAllRoomsReport",
      deptOptions: "roomModule/getDepartmentOptions",
    }),
  },

  methods: {
    async getBuildings() {
      try {
        await this.$store.dispatch("roomModule/getBuildings");
        this.buildings = this.buildingOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async getAllRooms() {
      try {
        await this.$store.dispatch("roomModule/getAllRooms");
        this.rooms = this.allRoomsReport;
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },

    async getDepartments() {
      try {
        await this.$store.dispatch("roomModule/getDepartments");
        this.departments = this.deptOptions;
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error(error);
      }
    },
  },

  created() {
    this.getBuildings();
    this.getAllRooms();
    this.getDepartments();
  },
};
</script>
