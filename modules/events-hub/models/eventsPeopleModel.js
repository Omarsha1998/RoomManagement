const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectEventsPeople = async function (conditions, args, options, txn) {
  try {
    const eventsPeople = await sqlHelper.query(
      `SELECT
        a.code,
        a.lastname,
        a.firstname,
        a.middlename,
        concat(a.lastname, ', ', a.firstname, ' ', a.middlename) fullname,
        a.department,
        a.position,
        a.type,
        a.createdBy,
        a.updatedBy,
        a.active,
        case when c.[GROUP] is null then 'EMPLOYEES - WITHOUT GROUP'
            else 
				c.[GROUP]
          end employeeGroup,
        a.dateTimeCreated,
        a.dateTimeUpdated
      from HR..EventsPeople a
      left join [UE database]..Employee b on b.EmployeeCode = a.code
      left join UERMMMC..SECTIONS c  with(nolock) on c.CODE = b.DeptCode  
      WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    eventsPeople.forEach((list) => {
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
      });
    });
    return eventsPeople;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectEventsExternalPeople = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const eventsPeople = await sqlHelper.query(
      `SELECT
        a.code,
        concat(a.lastname, ', ', a.firstname, ' ', a.middlename) fullname,
        a.lastname,
        a.firstname,
        a.middlename,
        a.department,
        a.position,
        a.department [group],
        'REGULAR' status,
        2 type,
        case 
          when b.id is not null then cast(1  as bit)
          else cast(0 as bit)
        end registrationStatus
      from HR..EventsExternalPeople a 
      left join HR..EventsPeople b on a.code = b.code
      WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return eventsPeople;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectEmployees = async function (conditions, args, options, txn) {
  try {
    const eventsPeople = await sqlHelper.query(
      `select
        a.code,
        a.fullname,
        a.lastname,
        a.firstname,
        a.middlename,
        a.dept_desc department,
        a.pos_desc position,
        [group],
        a.emp_status_desc status,
        1 type,
        case 
          when b.id is not null then cast(1  as bit)
          else cast(0 as bit)
        end registrationStatus
      from [UE database]..vw_Employees  a 
      left join HR..EventsPeople b on a.code = b.code
      WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return eventsPeople;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertEventData = async function (
  payload,
  table,
  timeStampColumn = "dateTimeCreated",
  txn,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Event Data" };
  }
  try {
    const eventData = await sqlHelper.insert(
      table,
      payload,
      txn,
      timeStampColumn,
    );
    return eventData;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertEventsPeople = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Event Data" };
  }
  try {
    const eventData = await sqlHelper.insert("HR..EventsPeople", payload, txn);
    return eventData;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateEventData = async function (
  payload,
  table,
  condition,
  timeStampColumn = "dateTimeUpdated",
  txn,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Event Data" };
  }

  try {
    return await sqlHelper.update(
      table,
      payload,
      condition,
      txn,
      timeStampColumn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectEventsPeople,
  selectEventsExternalPeople,
  selectEmployees,
  insertEventData,
  insertEventsPeople,
  updateEventData,
};
