const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getAvailableRoomsPerWard = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `Declare @T Table (
      ROOMUNITDESC varchar(50),
      ADMITTED varchar(50), 
      ROOMCOUNT varchar(50), 
      MGH varchar(50), 
      ROOMIN varchar(50), 
      asof varchar(50)
      )
    Insert @T Exec UERMHIMS..Usp_jf_GetRoomWebDashBoardV2
    
    Select ROOMUNITDESC unit, ADMITTED occupants, ROOMCOUNT rooms from @T `,
    [],
    txn
  );
};

const getAllNSTPositions = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT distinct
      pos_desc positions,
      convert(bit,case
        when pos_desc = 'Head Nurse' then 1
        else 0
      end) isHead
    FROM [UERMHIMS].[dbo].[NSTAttendance] nst
    join [UE database]..vw_Employees emp on nst.code = emp.code and emp.DEPT_CODE = nst.TimeInLocationDept
  `,
    [],
    txn
  );
};

const getNSTDutyCensusPerDate = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select deptCensus.departmentName, deptCensus.position, count(*) census from (
      SELECT distinct
        census.code,
        census.departmentName,
            position,
            convert(bit,case
              when position = 'Head Nurse' then 1
              else 0
            end) isHead
          FROM [UERMHIMS].[dbo].[NSTAttendance] nst
        left join (SELECT distinct
        nst.code,
          nst.TimeInLocationDept department,
          nst1.department departmentName,
          nst1.position positionDept
        FROM UERMHIMS..vw_NST_Attendance nst
        join UERMHIMS..NSTAttendance nst1 on nst.code = nst1.code
        where 1=1 ${conditions.innerSqlWhere}) census on nst.position = census.positionDept
        where 1=1 ${conditions.sqlWhere} and census.departmentName is not null
        ) deptCensus
        group by position, departmentName
  `,
    [],
    txn
  );
};

const getAllRoomsInWard = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select csr.ward,  csr.roomno room
      from (
      select s.DESCRIPTION ward, r.unit, r.ROOMNO from UERMMMC..ROOMS r
        left join UERMMMC..SECTIONS s on r.UNIT = s.CODE
        where r.deleted = 0 and s.description not like '%INACTIVE%'
      ) csr
      --where csr.roomno = 'N317'
      --where csr.ward = '3 NORTH 1'
    order by ward
    `,
    [],
    txn
  );
};


const getInpatientPatients = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select
      caseno,
      datead dateAdmitted,
      datedis dateDischarged,
      last_room lastRoom
    from UERMMMC..CASES
      where 1=1 ${conditions.sqlWhere}
    `,
    [],
    txn
  );
};

module.exports = {
  getAvailableRoomsPerWard,
  getAllNSTPositions,
  getNSTDutyCensusPerDate,
  getAllRoomsInWard,
  getInpatientPatients
};
