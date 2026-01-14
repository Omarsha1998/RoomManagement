const axios = require("axios");

const getCanvasStudents = async function (studentNo) {
  const config = {
    method: "get",
    // url: `${process.env.CANVAS_URL}users/${studentNo}`,
    url: `${process.env.CANVAS_URL}users/sis_user_id:${studentNo}/profile`,
    headers: {
      Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
    },
  };

  return await axios(config)
    .then(function (response) {
      //   console.log(response);
      return response.data;
    })
    .catch(function (error) {
      // console.log(error);
      return { error: error };
    });
};

const getCanvasStudentsProfile = async function (canvasId) {
  const config = {
    method: "get",
    // url: `${process.env.CANVAS_URL}users/${studentNo}`,
    url: `${process.env.CANVAS_URL}users/${canvasId}`,
    headers: {
      Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
    },
  };

  return await axios(config)
    .then(function (response) {
      //   console.log(response);
      return response.data;
    })
    .catch(function (error) {
      // console.log(error);
      return { error: error };
    });
};

const insertCanvasStudent = async function (canvasPayload) {
  const payload = {
    studentNo: canvasPayload.sn,
    email: canvasPayload.email,
    password: canvasPayload.password,
    firstName: canvasPayload.first_name,
    lastName: canvasPayload.last_name,
    name: canvasPayload.full_name,
    sortableName: canvasPayload.sortable_name,
    shortName: canvasPayload.short_name,
  };
  const data = new FormData();
  data.append("pseudonym[sis_user_id]", `${payload.studentNo}`);
  data.append("pseudonym[unique_id]", `${payload.email}`);
  data.append("pseudonym[password]", `${payload.password}`);
  data.append("user[first_name]", `${payload.firstName}`);
  data.append("user[last_name]", `${payload.lastName}`);
  data.append("user[name]", `${payload.name}`);
  data.append("user[sortable_name]", `${payload.sortableName}`);
  data.append("user[short_name]", `${payload.shortName}`);

  const config = {
    method: "post",
    url: `${process.env.CANVAS_URL}accounts/1/users`,
    headers: {
      Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
    },
    data: data,
  };

  return await axios(config)
    .then(function (response) {
      // console.log(response);
      return response.data;
    })
    .catch(function (error) {
      // console.log(error);
      return { error: error };
    });
};

const updateCanvasStudent = async function (payload, id) {
  const itemCopy = { ...payload };
  const data = new FormData();
  for (const key in itemCopy) {
    if (itemCopy[key] !== undefined) data.append(`${key}`, `${itemCopy[key]}`);
  }

  const config = {
    method: "put",
    url: `${process.env.CANVAS_URL}users/${id}`,
    headers: {
      Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
    },
    data: data,
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      // console.log(error);
      return { error: error };
    });
};

// const batchSuspense = async function (payload, id) {
//   const itemCopy = { ...payload };
// 	let data = new FormData();
//   for (const key in itemCopy) {
//     if (itemCopy[key] !== undefined)
// 		data.append(`${key}`, `${itemCopy[key]}`);
//   }
// 	var config = {
//     method: "put",
//     url: `${process.env.CANVAS_URL}users/${id}`,
//     headers: {
//       Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
//     },
//     data: data,
//   };

//   return axios(config)
//     .then(function (response) {
//       console.log(response);
//       return response.data;
//     })
//     .catch(function (error) {
//       console.log(error);
//       return { error: error };
//     });
// };

module.exports = {
  getCanvasStudents,
  insertCanvasStudent,
  updateCanvasStudent,
  getCanvasStudentsProfile,
};
