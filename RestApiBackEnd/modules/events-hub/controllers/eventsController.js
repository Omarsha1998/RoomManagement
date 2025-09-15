const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const eventsPeopleModel = require("../models/eventsPeopleModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getEmployees = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      if (!req.query.searchTerm) {
        return { error: "Search term is empty!" };
      }

      const conditions = `and is_active = 1 and (a.code like '%${req.query.searchTerm}%' or a.lastname like '%${req.query.searchTerm}%' or a.firstname like '%${req.query.searchTerm}%')`;
      const args = [];

      const employees = await eventsPeopleModel.selectEmployees(
        conditions,
        args,
        {
          order: "code asc",
          top: "",
        },
        txn,
      );

      const innerConditions = `and a.active = 1 and (a.code like '%${req.query.searchTerm}%' or a.lastname like '%${req.query.searchTerm}%' or a.firstname like '%${req.query.searchTerm}%')`;
      const externalEmployees =
        await eventsPeopleModel.selectEventsExternalPeople(
          innerConditions,
          [],
          {
            order: "code asc",
            top: "",
          },
          txn,
        );

      let overallEmployees = employees;
      if (externalEmployees.length > 0) {
        overallEmployees = [...employees, ...externalEmployees];
      }

      return overallEmployees;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getEventsPeople = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let top = "";
      if (!req.query.recent) {
        top = req.query.recent;
      }

      const conditions = `and active = 1`;
      const args = [];

      return await eventsPeopleModel.selectEventsPeople(
        conditions,
        args,
        {
          order: "dateTimeCreated desc",
          top: top,
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getEventsPeopleRealtime = async function (req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Flush the headers to establish the SSE connection

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = await setInterval(async () => {
    const returnValue = await sqlHelper.transact(async (txn) => {
      try {
        let top = "";
        if (!req.query.recent) {
          top = req.query.recent;
        }

        const conditions = `and active = 1`;
        const args = [];

        return await eventsPeopleModel.selectEventsPeople(
          conditions,
          args,
          {
            order: "dateTimeCreated desc",
            top: top,
          },
          txn,
        );
      } catch (error) {
        console.log(error);
        return { error: error };
      }
    });
    sendEvent(returnValue);
  }, 35000);

  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
};

const postEventPeople = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const eventData = req.body;

      const conditions = "and a.code = ?";
      const args = [eventData.code];
      const eventRecord = await eventsPeopleModel.selectEventsPeople(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
      if (eventRecord.length > 0) {
        return { error: "Employee already registered" };
      }

      eventData.createdBy = util.currentUserToken(req).code;
      eventData.updatedBy = util.currentUserToken(req).code;

      // const eventPeople = await eventsPeopleModel.insertEventsPeople(
      //   eventData,
      //   txn,
      // );
      const eventPeople = await eventsPeopleModel.insertEventData(
        eventData,
        "HR..EventsPeople",
        "",
        txn,
      );
      // console.log(eventPeople);

      if (!util.isObjAndEmpty(eventPeople)) {
        await eventsPeopleModel.updateEventData(
          { active: 1 },
          "HR..RaffleEntries",
          { user_code: eventPeople.code },
          "datetime_updated",
          txn,
        );
      }

      return eventPeople;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const uploadEmployees = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // const employees = [];

      // const listed = [];
      // const unListed = [];

      // for (const emp of employees) {
      //   const employee = await sqlHelper.query(
      //     "select code, lastname, firstname, middlename, dept_desc, pos_desc from [UE Database]..vw_Employees where code = ?",
      //     [emp.Code],
      //     txn,
      //   );

      //   const empPayload = employee.map((mapEmployee) => {
      //     return {
      //       code: mapEmployee.code,
      //       lastname: mapEmployee.lastname,
      //       firstname: mapEmployee.firstname,
      //       middlename: mapEmployee.middlename,
      //       department: mapEmployee.dept_desc,
      //       position: mapEmployee.pos_desc,
      //       type: 1,
      //       createdBy: "SYSTEM GENERATED",
      //     };
      //   });

      //   if (empPayload.length > 0) {
      //     const eventsPeople = await sqlHelper.query(
      //       "select code from HR..EventsPeople where code = ?",
      //       [empPayload[0].code],
      //       txn,
      //     );

      //     if (eventsPeople.length === 0) {
      //       const eventsPeople = await eventsPeopleModel.insertEventData(
      //         empPayload[0],
      //         "HR..EventsPeople",
      //         "",
      //         txn,
      //       );
      //       // console.log(eventsPeople);
      //       listed.push(eventsPeople[0]);
      //     }

      //     await eventsPeopleModel.updateEventData(
      //       {
      //         active: 1,
      //       },
      //       "HR..RaffleEntries",
      //       {
      //         user_code: empPayload[0].code,
      //       },
      //       "datetime_updated",
      //       txn,
      //     );
      //   }
      // }

      // return listed;

      const employees = await sqlHelper.query(
        "select concat(last_name, ', ', first_name, ' ', middle_name) name, category from HR..RaffleEntries",
        [],
        txn,
      );

      const groupedEmployees = util.groupBy(employees, "category");

      Object.keys(groupedEmployees).forEach((category) => {
        // Map names and join them with "\r\n" for Excel row separation
        const names = groupedEmployees[category]
          .map((item) => item.name)
          .join("\r\n");
        // Replace the array with the merged names
        groupedEmployees[category] = names;
      });

      console.log(groupedEmployees);

      return groupedEmployees;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};
module.exports = {
  getEmployees,
  getEventsPeople,
  getEventsPeopleRealtime,
  postEventPeople,
  uploadEmployees,
};
