<template>
  <div style="margin-top: 5px" v-if="bookedRooms">
    <q-skeleton
      :style="{
        height: '830px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '10px',
      }"
      :animation="skeletonAnimation"
    >
      <div
        class="row"
        :style="{
          width: '100%',
        }"
      >
        <div
          class="col-6"
          :style="{ display: 'flex', justifyContent: 'center' }"
        >
          <q-skeleton
            :style="{
              height: '50px',
              width: '210px',
            }"
            :animation="skeletonAnimation"
          />
        </div>
        <div
          class="col-6"
          :style="{ display: 'flex', justifyContent: 'center' }"
        >
          <q-skeleton
            :style="{
              height: '50px',
              width: '210px',
            }"
            :animation="skeletonAnimation"
          />
        </div>
      </div>

      <div
        :style="{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '60px',
        }"
      >
        <q-skeleton
          :style="{
            display: 'flex',
            justifyContent: 'center',
            height: '35px',
            width: '96%',
          }"
          :animation="skeletonAnimation"
        ></q-skeleton>
      </div>

      <div
        :style="{
          width: '96%%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '25px',
          flexDirection: 'column',
          alignItems: 'center',
        }"
      >
        <template v-for="rowIndex in rowCount" :key="'row-' + rowIndex">
          <div
            :style="{
              display: 'flex',
              height: '50px',
              width: '97%',
            }"
          >
            <template v-for="colIndex in columnCount" :key="'col-' + colIndex">
              <div
                :style="{ flex: 1, display: 'flex', justifyContent: 'center' }"
              >
                <q-skeleton
                  :style="{
                    height: rowIndex === 1 ? '15px' : '35px',
                    width: rowIndex === 1 ? '70%' : '85%',
                  }"
                  :animation="skeletonAnimation"
                />
              </div>
            </template>
          </div>
        </template>
      </div>
    </q-skeleton>
  </div>

  <div v-else>
    <q-skeleton
      v-if="schedule"
      :style="{
        height: '585px',
        display: 'flex',
        flexDirection: 'column',
      }"
      :animation="skeletonAnimation"
    >
      <div
        class="row"
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }"
      >
        <q-skeleton
          :style="{
            height: '50px',
            width: '210px',
            marginLeft: '25px',
          }"
          :animation="skeletonAnimation"
        />
        <q-skeleton
          :style="{
            height: '50px',
            width: '210px',
          }"
          :animation="skeletonAnimation"
        />
        <q-skeleton
          v-if="cherryPick"
          :style="{
            height: '50px',
            width: '210px',
          }"
          :animation="skeletonAnimation"
        />
        <q-skeleton
          :style="{
            height: '50px',
            width: '210px',
            marginRight: '25px',
          }"
          :animation="skeletonAnimation"
        />
      </div>
      <div
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '25px',
        }"
      >
        <q-skeleton
          :style="{
            height: '370px',
            width: '890px',
          }"
          :animation="skeletonAnimation"
        />
      </div>
      <div
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'left',
          marginTop: '55px',
          marginLeft: '25px',
        }"
      >
        <q-skeleton
          :style="{
            height: '35px',
            width: '110px',
          }"
          :animation="skeletonAnimation"
        />
      </div>
    </q-skeleton>

    <q-skeleton
      v-if="insert"
      :style="{
        height: '335px',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '25px',
      }"
      :animation="skeletonAnimation"
    >
      <div
        class="row"
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }"
      >
        <q-skeleton
          :style="{
            height: '50px',
            width: '210px',
            marginLeft: '200px',
          }"
          :animation="skeletonAnimation"
        />
        <q-skeleton
          :style="{
            height: '50px',
            width: '210px',
          }"
          :animation="skeletonAnimation"
        />
        <q-skeleton
          :style="{
            height: '50px',
            width: '210px',
            marginRight: '200px',
          }"
          :animation="skeletonAnimation"
        />
      </div>
      <div
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '50px',
        }"
      >
        <q-skeleton
          :style="{
            height: '250%',
            width: '95%',
          }"
          :animation="skeletonAnimation"
        />
      </div>
      <div
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '35px',
        }"
      >
        <q-skeleton
          :style="{
            height: '250%',
            width: '95%',
          }"
          :animation="skeletonAnimation"
        />
      </div>
      <div
        :style="{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '65px',
        }"
      >
        <q-skeleton
          :style="{
            height: '35px',
            width: '200px',
          }"
          :animation="skeletonAnimation"
        />
      </div>
    </q-skeleton>
  </div>
</template>

<script>
export default {
  props: {
    rowCount: {
      type: Number,
      default: 0,
    },
    columnCount: {
      type: Number,
      default: 0,
    },
    cherryPick: Boolean,
    bookedRooms: Boolean,
    insert: Boolean,
    schedule: Boolean,
  },

  data() {
    return {
      skeletonAnimation: "fade",
    };
  },
};
</script>
