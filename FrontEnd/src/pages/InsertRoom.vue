<template>
  <q-layout>
    <q-page-container>
      <div class="container">
        <div class="row" style="width: 95%">
          <div class="col-12">
            <Loader :isLoading="loader" />

            <div v-if="loading">
              <SkeletonLoader :insert="true" />
            </div>
            <q-card v-else class="rounded2">
              <q-card-section class="bg-amber-8">
                <q-tabs
                  v-model="tab"
                  indicator-color="amber-8"
                  active-color="amber-8"
                  class="bg-blue-10 text-white shadow-2 row"
                >
                  <q-tab
                    class="col-4"
                    name="Insert Room Type"
                    icon="format_indent_increase"
                    label="Insert Room Type"
                  ></q-tab>
                  <q-tab
                    class="col-4"
                    name="Insert Building"
                    icon="domain"
                    label="Insert Building"
                  ></q-tab>
                  <q-tab
                    class="col-4"
                    name="Insert Room"
                    icon="meeting_room"
                    label="Insert Room"
                  ></q-tab>
                </q-tabs>
              </q-card-section>
              <q-card-section>
                <q-tab-panels
                  v-model="tab"
                  animated
                  transition-prev="slide-right"
                  transition-next="slide-left"
                >
                  <q-tab-panel name="Insert Room Type">
                    <q-input
                      class="bg-grey-3 q-mb-xs"
                      filled
                      label="Room Type Code"
                      v-model="typeCode"
                    />
                    <q-input
                      class="bg-grey-3 q-mb-md"
                      filled
                      label="Room Type Description"
                      v-model="typeDescription"
                    />
                    <div class="text-center">
                      <q-btn
                        push
                        color="blue-10"
                        class="text-white"
                        label="Submit New Room Type"
                        @click="submitNewRoomType"
                      />
                    </div>
                  </q-tab-panel>

                  <q-tab-panel name="Insert Building">
                    <q-input
                      class="bg-grey-3 q-mb-xs"
                      filled
                      label="Building Code"
                      v-model="buildingCode"
                    />
                    <q-input
                      class="bg-grey-3 q-mb-xs"
                      filled
                      label="Building Name"
                      v-model="buildingName"
                    />
                    <q-input
                      class="bg-grey-3 q-mb-md"
                      filled
                      label="Building Description"
                      v-model="buildingDescription"
                    />
                    <div class="text-center">
                      <q-btn
                        push
                        color="blue-10"
                        class="text-white"
                        label="Submit New Building"
                        @click="submitNewBuilding"
                      />
                    </div>
                  </q-tab-panel>

                  <q-tab-panel name="Insert Room">
                    <q-select
                      filled
                      v-model="selectedRoom"
                      use-input
                      input-debounce="0"
                      label="Room Type"
                      :options="rooms"
                      style="margin-bottom: 5px"
                      behavior="menu"
                      fill-input
                      clearable
                      hide-selected
                      @filter="filterFn"
                      class="bg-grey-3"
                      option-value="code"
                      option-label="description"
                    >
                      <template v-slot:no-option>
                        <q-item>
                          <q-item-section class="text-grey">
                            No results
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select
                      filled
                      v-model="selectedBuilding"
                      use-input
                      input-debounce="0"
                      label="Building"
                      :options="buildings"
                      style="margin-bottom: 5px"
                      behavior="menu"
                      fill-input
                      clearable
                      hide-selected
                      @filter="filterFn"
                      class="bg-grey-3"
                      option-value="code"
                      option-label="description"
                    >
                      <template v-slot:no-option>
                        <q-item>
                          <q-item-section class="text-grey">
                            No results
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select
                      filled
                      v-model="selectedDepartment"
                      use-input
                      input-debounce="0"
                      label="Department"
                      :options="departments"
                      style="margin-bottom: 5px"
                      behavior="menu"
                      fill-input
                      clearable
                      hide-selected
                      @filter="filterFn"
                      class="bg-grey-3"
                      option-value="deptCode"
                      option-label="deptLabel"
                    >
                      <template v-slot:no-option>
                        <q-item>
                          <q-item-section class="text-grey">
                            No results
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select
                      filled
                      v-model="selectedFloor"
                      use-input
                      input-debounce="0"
                      label="Floor"
                      clearable
                      hide-selected
                      :options="floor"
                      behavior="menu"
                      @filter="filterFn"
                      fill-input
                      class="bg-grey-3 q-mb-xs"
                    >
                      <template v-slot:no-option>
                        <q-item>
                          <q-item-section class="text-grey">
                            No results
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-input
                      class="bg-grey-3 q-mb-xs"
                      filled
                      label="Room Number / Description"
                      v-model="roomNumber"
                    />

                    <q-input
                      class="bg-grey-3 q-mb-xs"
                      filled
                      label="Floor Area (sqm)"
                      type="number"
                      v-model="floorArea"
                    />

                    <q-input
                      class="bg-grey-3 q-mb-md"
                      filled
                      label="Capacity"
                      type="number"
                      v-model="capacity"
                    />

                    <div class="text-center q-mt-xs">
                      <q-btn
                        push
                        color="blue-10"
                        class="text-white"
                        label="Submit New Room"
                        @click="submitNewRoom"
                      />
                    </div>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { QSpinnerIos } from "quasar";
import helperMethods from "../helperMethods.js";
import { mapGetters } from "vuex";
import SkeletonLoader from "../components/loadingSkeleton.vue";
import Loader from "../components/Loader.vue";

let roomOptions = [];
let buildingOptions = [];
let departmentOptions = [];

let floorsOptions = [
  { label: "Ground Floor", value: "0" },
  { label: "Second Floor", value: "1" },
  { label: "Third Floor", value: "2" },
  { label: "Fourth Floor", value: "3" },
  { label: "Fifth Floor", value: "4" },
  { label: "Sixth Floor", value: "5" },
];

export default {
  data() {
    return {
      roomCode: "",
      roomDescription: "",
      typeCode: "",
      typeDescription: "",
      buildingCode: "",
      buildingDescription: "",
      buildingName: "",
      tab: "Insert Room Type",
      rooms: roomOptions,
      buildings: buildingOptions,
      selectedRoom: "",
      selectedBuilding: "",
      floorArea: "",
      capacity: "",
      floor: floorsOptions,
      selectedFloor: "",
      departments: departmentOptions,
      selectedDepartment: "",
      roomNumber: "",
      loading: true,
      loadingCounter: null,
      loader: false,
    };
  },

  components: {
    SkeletonLoader,
    Loader,
  },

  computed: {
    ...mapGetters({
      roomOptions: "roomModule/getRoomOptions",
      buildingOptions: "roomModule/getBuildingOptions",
      departmentOptions: "roomModule/getDepartmentOptions",
    }),
  },

  methods: {
    filterFn(val, update) {
      if (val === "") {
        update(() => {
          this.rooms = this.roomOptions;
          this.buildings = this.buildingOptions;
          this.departments = this.departmentOptions;
          this.floor = floorsOptions;
        });
        return;
      }
      update(() => {
        const needle = val.toLowerCase();
        this.rooms = this.roomOptions.filter(
          (option) => option.description.toLowerCase().indexOf(needle) > -1
        );
        this.buildings = this.buildingOptions.filter(
          (option) => option.description.toLowerCase().indexOf(needle) > -1
        );
        this.departments = this.departmentOptions.filter(
          (option) => option.deptLabel.toLowerCase().indexOf(needle) > -1
        );
        this.floor = floorsOptions.filter(
          (option) => option.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    async submitNewRoomType() {
      if (!this.typeCode || !this.typeDescription) {
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
      this.$q
        .dialog({
          title: "Warning",
          message: "Are you sure you want to create new room?",
          persistent: true,
          ok: {
            push: true,
            color: "blue-10",
            label: "Confirm",
            class: "text-subtitle1",
          },
          cancel: {
            push: true,
            color: "negative",
            label: "Cancel",
            class: "text-subtitle1",
          },
        })
        .onOk(async () => {
          const data = {
            code: this.typeCode,
            description: this.typeDescription,
          };

          this.loader = true;

          // this.$q.loading.show({
          //   spinner: QSpinnerIos,
          //   message: "Submitting New Room",
          //   messageColor: "blue-10",
          //   backgroundColor: "grey-1",
          //   spinnerColor: "blue-10",
          //   customClass: "custom-loading-style",
          //   spinnerSize: "7em",
          // });

          try {
            await this.$store.dispatch("roomModule/submitNewRoomType", data);
            // this.$q.loading.hide();
            this.loader = false;
            this.$q.notify({
              color: "green-8",
              position: "center",
              message: "Success Creating New Room",
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });
            helperMethods.disablePointerEvents(2000);
            this.typeCode = "";
            this.typeDescription = "";
          } catch (error) {
            // this.$q.loading.hide();
            this.loader = false;
            if (error.response.status == "409") {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: error.response.data.error,
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            } else {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: "Error Creating New Room",
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            }
          }
        })
        .onDismiss(() => {});
    },

    async submitNewBuilding() {
      if (
        !this.buildingCode ||
        !this.buildingDescription ||
        !this.buildingName
      ) {
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
      this.$q
        .dialog({
          title: "Warning",
          message: "Are you sure you want to create new building?",
          persistent: true,
          ok: {
            push: true,
            color: "blue-10",
            label: "Confirm",
            class: "text-subtitle1",
          },
          cancel: {
            push: true,
            color: "negative",
            label: "Cancel",
            class: "text-subtitle1",
          },
        })
        .onOk(async () => {
          const data = {
            code: this.buildingCode,
            description: this.buildingDescription,
            name: this.buildingName,
          };

          // this.$q.loading.show({
          //   spinner: QSpinnerIos,
          //   message: "Submitting New Building",
          //   messageColor: "blue-10",
          //   backgroundColor: "grey-1",
          //   spinnerColor: "blue-10",
          //   customClass: "custom-loading-style",
          //   spinnerSize: "7em",
          // });
          this.loader = true;

          try {
            await this.$store.dispatch("roomModule/submitNewBuilding", data);
            // this.$q.loading.hide();
            this.loader = false;

            this.$q.notify({
              color: "green-8",
              position: "center",
              message: "Success Creating New Building",
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });
            helperMethods.disablePointerEvents(2000);
            this.buildingCode = "";
            this.buildingDescription = "";
            this.buildingName = "";
          } catch (error) {
            // this.$q.loading.hide();
            this.loader = false;
            if (error.response.status == "409") {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: error.response.data.error,
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            } else {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: "Error Creating New Building",
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            }
          }
        })
        .onDismiss(() => {});
    },

    async getRoomTypes() {
      try {
        await this.$store.dispatch("roomModule/getRoomTypes");
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error("Failed getting all the room types");
      }
    },

    async getBuildings() {
      try {
        await this.$store.dispatch("roomModule/getBuildings");
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error("Failed getting all the room types");
      }
    },

    async getDepartments() {
      try {
        await this.$store.dispatch("roomModule/getDepartments");
        this.loadingCounter++;
        if (this.loadingCounter === 3) {
          this.loading = false;
        }
      } catch (error) {
        console.error("Failed getting all the room types");
      }
    },

    async submitNewRoom() {
      if (!this.selectedRoom || !this.selectedBuilding || !this.selectedFloor) {
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
      this.$q
        .dialog({
          title: "Warning",
          message: "Are you sure you want to create new room?",
          persistent: true,
          ok: {
            push: true,
            color: "blue-10",
            label: "Confirm",
            class: "text-subtitle1",
          },
          cancel: {
            push: true,
            color: "negative",
            label: "Cancel",
            class: "text-subtitle1",
          },
        })
        .onOk(async () => {
          const data = {
            roomId: this.roomNumber ? this.roomNumber : null,
            name: this.selectedRoom.description,
            department: this.selectedDepartment.deptLabel
              ? this.selectedDepartment.deptLabel
              : null,
            bldgCode: this.selectedBuilding.code,
            floorArea: this.floorArea ? this.floorArea : null,
            capacity: this.capacity ? this.capacity : null,
            floor: this.selectedFloor.value,
            roomTypeId: this.selectedRoom.code,
          };

          // this.$q.loading.show({
          //   spinner: QSpinnerIos,
          //   message: "Submitting New Room",
          //   messageColor: "blue-10",
          //   backgroundColor: "grey-1",
          //   spinnerColor: "blue-10",
          //   customClass: "custom-loading-style",
          //   spinnerSize: "7em",
          // });
          this.loader = true;

          try {
            await this.$store.dispatch("roomModule/submitNewRoom", data);
            // this.$q.loading.hide();
            this.loader = false;

            this.$q.notify({
              color: "green-8",
              position: "center",
              message: "Success Creating New Room",
              icon: "check",
              iconColor: "white",
              timeout: 1000,
              progress: true,
            });
            helperMethods.disablePointerEvents(2000);
            this.selectedRoom = "";
            this.selectedBuilding = "";
            this.selectedFloor = "";
            this.floorArea = "";
            this.capacity = "";
            this.selectedDepartment = "";
            this.roomNumber = "";
          } catch (error) {
            // this.$q.loading.hide();
            this.loader = false;

            if (error.response.status == "409") {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: error.response.data.error,
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            } else {
              this.$q.notify({
                color: "negative",
                position: "center",
                message: "Error Creating New Room",
                icon: "report_problem",
                iconColor: "white",
                timeout: 1000,
                progress: true,
              });
            }
          }
        })
        .onDismiss(() => {});
    },
  },

  created() {
    this.getRoomTypes();
    this.getBuildings();
    this.getDepartments();
  },
};
</script>

<style></style>
