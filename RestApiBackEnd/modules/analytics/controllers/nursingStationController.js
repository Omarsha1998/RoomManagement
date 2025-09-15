const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const nursingStations = require("../models/nursingStations.js");
// MODELS //

const getNSTCensusWithWard = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const rooms = await nursingStations.getAvailableRoomsPerWard("", txn, {
        top: {},
        order: {},
      });

      const positions = await nursingStations.getAllNSTPositions("", txn, {
        top: {},
        order: {},
      });

      let sqlWhere = `and convert(date, nst.datetimeCreated) = '${req.query.inclusiveDate}'`;
      let innerSqlWhere = `and convert(date, nst1.datetimeCreated) = '${req.query.inclusiveDate}'`;
      const census = await nursingStations.getNSTDutyCensusPerDate(
        {
          innerSqlWhere: innerSqlWhere,
          sqlWhere: sqlWhere,
        },
        txn,
        {
          top: {},
          order: {},
        }
      );
      const groupByCensus = util.groupBy(census, "departmentName");

      return {
        census: census,
      };
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

const getAvailableRoomsAndDutyNurses = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const getAllRoomsInWard = await nursingStations.getAllRoomsInWard(
        "",
        txn,
        {
          top: {},
          order: {},
        }
      );


      let sqlWhere = `and convert(date, nst.datetimeCreated) = '${req.query.dateAdmitted}'`;
      let innerSqlWhere = `and convert(date, nst1.datetimeCreated) = '${req.query.dateAdmitted}'`;
      const nursesCensus = await nursingStations.getNSTDutyCensusPerDate(
        {
          innerSqlWhere: innerSqlWhere,
          sqlWhere: sqlWhere,
        },
        txn,
        {
          top: {},
          order: {},
        }
      );

      let filteredWardRooms = [];
      if (getAllRoomsInWard.length > 0) {
        let wardGroup = util.groupBy(getAllRoomsInWard, "ward")
        let innerArr = [];
        for (let wardRooms of getAllRoomsInWard) {
          const patients = await nursingStations.getInpatientPatients(
            {
              sqlWhere: `and convert(date, datedis) > convert(date, '${req.query.dateAdmitted}') and  convert(date, datedis) < convert(date, getDate())
              and convert(date, datead) <= convert(date, '${req.query.dateAdmitted}')
              and last_room = '${wardRooms.room}'
              or (dateDis is null  
                and  (convert(date, datead) < convert(date, '${req.query.dateAdmitted}')
                or convert(date, datead) >= convert(date, '${req.query.dateAdmitted}'))
                and last_room = '${wardRooms.room}')
              `,
            },
            txn,
            {
              top: {},
              order: {},
            }
          );
          const availableRooms = wardGroup[wardRooms.ward].length
          innerArr.push({
            patients: patients,
            wardDetails: wardRooms,
            availableRooms: availableRooms
          });
        }

        if (Object.keys(innerArr).length > 0) {
          for (let innerInpatient of innerArr) {
            for (let inpatient of innerInpatient.patients) {
              inpatient.formattedDateAdmitted = new Date(inpatient.dateAdmitted)
                .toISOString()
                .substring(0, 10);

              if (inpatient.dateDischarged !== null) {
                inpatient.formattedDateDischarged = new Date(
                  inpatient.dateDischarged
                )
                  .toISOString()
                  .substring(0, 10);
              } else {
                inpatient.formattedDateDischarged = null;
              }
            }

            const census = innerInpatient.patients.filter(
              (filterCurrentDate) =>
                req.query.dateAdmitted >=
                filterCurrentDate.formattedDateAdmitted
            );
            filteredWardRooms.push({
              ward: innerInpatient.wardDetails.ward,
              room: innerInpatient.wardDetails.room,
              availableRooms: innerInpatient.availableRooms,
              occupiedRooms: census.length,
              occupiedDate: req.query.dateAdmitted,
              occupiedRoomDetails: census,
            });
          }
        }

        var result = [];
        filteredWardRooms.reduce(function (res, value) {
          if (!res[value.ward]) {
            
            res[value.ward] = { 
              ward: value.ward, 
              total: 0, 
              availableRooms: value.availableRooms, 
              occupiedDate: req.query.dateAdmitted
            };
            result.push(res[value.ward]);
          }
          res[value.ward].total += value.occupiedRooms;
          return res;
        }, {});

        return {
          census: util.groupBy(result, "ward"),
          detailed: filteredWardRooms,
          nursesCensus: nursesCensus
        }
      }

      // return finalObj;
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

module.exports = {
  getNSTCensusWithWard,
  getAvailableRoomsAndDutyNurses,
};
