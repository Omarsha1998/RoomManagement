const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const recordBoxes = require("../models/recordBoxes.js");
// MODELS //

const getRecordBoxes = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const boxes = await recordBoxes.getRecordBoxes("", txn, {
        top: {},
        order: {},
      });
      let finalArray = [];
      for (let box of boxes) {
        const splittedCaseNo = box.caseNo.split(";");
        let patientInfo = "";
        for (let caseNo of splittedCaseNo) {
          const getPatientCasesHIMS = await recordBoxes.getPatientCases(
            { 
							sqlWhere: `caseNo = '${caseNo}'`
						},
            txn,
            {
              top: {},
              order: {},
            }
          );

          if (getPatientCasesHIMS.length === 0) {
            const getPatientCasesOldHIMS =
              await recordBoxes.getPatientCasesOldHIS(
								{ 
									sqlWhere: `refNo = '${caseNo}'`
								},
                txn,
                {
                  top: {},
                  order: {},
                }
              );
						
            patientInfo = getPatientCasesOldHIMS[0];
          } else {
            patientInfo = getPatientCasesHIMS[0];
          }
					
					const payload = {
						boxId: box.boxId,
						caseNo: patientInfo.caseNo,
						patientNo: patientInfo.patientNo,
						firstName: patientInfo.firstName,
						lastName: patientInfo.lastName,
						middleName: patientInfo.middleName,
						dateAd: patientInfo.dateAd,
						dateDis: patientInfo.dateDis,
					};
					finalArray.push(payload);
        }
      }
      return finalArray;
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
  getRecordBoxes,
};
