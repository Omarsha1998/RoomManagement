const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

// SELECT
router.get("/equipments", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT DISTINCT BE.SerialNumber, 
      BE.EquipmentId AS 'EquiID',
      BE.SerialNumber AS 'EquipmentSN',
      
      REPLACE(STUFF((SELECT ',' + B.JobOrder + ' - ' 
      + B.EquipmentConcern  + ' - '
      + CONVERT( varchar,B.DateFinished,101)
      FROM [UE database]..[BEMEMS_Equip_Maintenance] B 
      WHERE BE.SerialNumber = B.SerialNumber 
      FOR XML PATH('')), 1, 1, '')
      ,',',CHAR(10)) AS 'JO_History',
      
      
      BE.[Description] AS 'EquipmentDec',
      BE.Brand AS 'EquipmentBra',
      BE.Model AS 'EquipmentMod',
      BE.Supplier AS 'EquipmentSup',
      BE.AlternativeSupplier AS 'EquipmentAlt',
      CAST(CONVERT( varchar, BE.DateOfPurchase, 107) AS DATE) AS 'EquipmentDI',
      BE.PurchaseCost AS 'EquipmentPC',
      BE.LifeExpectancy AS 'EquipmentLE',
      BE.Department AS 'EquipmentDep',
      BE.[Location] AS 'EquipmentLoc',
      BE.[Status] AS 'EquipmentSta',
      BE.Remarks AS 'EquipmentRem',
      BE.RenewalType AS 'EquipmentRT',
      BE.DocumentLink  AS 'EquipmentDL'
      
      FROM [UE database]..BEMEMS_Equipments BE
      LEFT JOIN [UE database]..BEMEMS_Equip_Maintenance BEM ON BE.SerialNumber = BEM.SerialNumber
      WHERE BE.[Status] != 'Deleted'
    
      ORDER BY EquipmentDI DESC	
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/equipments-maintenance", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT * ,(AssetToDo+'  '+AssetToDo_Others) AS 'AssetToDoSet' FROM [UE database].[dbo].[BEMEMS_Equip_Maintenance] 
      WHERE WorkStatus != 'CLOSE' 
      AND [DeleteStatus] IS NULL
      ORDER BY DateStarted DESC`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

// router.get("/equipments-view-maintenance", (req, res) => {
//   if (!appMain.checkAuth(req.query.auth)) {
//     res.send({ error: appMain.error });
//     return;
//   }
//   void (async function () {
//     try {
//       await sql.connect(sqlConfig);
//       const sqlQuery = `
//       SELECT * FROM [UE database].[dbo].[BEMEMS_Equip_Maintenance]`;
//       const result = await sql.query(sqlQuery);
//       // sql.close();
//       res.send(result.recordset);
//     } catch (error) {
//       res.send({ error });
//     }
//   })();
// });

router.get("/equipments-maintenance-services", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere = "";
  const sn = req.query.serialNumber;
  // console.log(req.query)
  if (sn != "*") {
    sqlWhere = `where SerialNumber = '${sn}'`;
  }
  // console.log(req.query.serialNumber)
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT  
	[Maintenance_ID]
	,[WorkOrder]
	,[JobOrder]
	,[RequestedBy]
	,[Department]
	,[WorkPriority]
	,[DateOfPurchase]
	,[DateStarted]
	,[WorkStatus]
	,[DateTimeCalled]
	,[DateFinished]
	,[AssetDescription]
	,[Supplier]
	,[Manufacturer]
	,[Model]
	,[AssetTag]
	,[SerialNumber]
  ,[AssetToDo]
  ,[AssetToDo_Others]
	,(AssetToDo+'  '+AssetToDo_Others) AS 'AssetToDoSet'
	,[MaintenanceType]
	,[EquipmentConcern]
	,[WorkPerformedAndResult]
	,[RenewalType]
	,[NextRenewal]
	,[Remarks]
	,[Recommendation]
	,[PerformedBy]
	,[ApprovedBy]
	,[DoneBy]
	,[IsActive]
  ,[DeleteRemarks]
  ,[DeleteStatus]
FROM [UE database].[dbo].[BEMEMS_Equip_Maintenance] 
WHERE [DeleteStatus] IS NULL
order by DateStarted DESC
      ${sqlWhere}
      `;
      // console.log(sqlQuery)
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/supplier", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    [CODE]
      ,[NAME]
      ,[TELNO]
      ,[STATUS]
      ,[isAPVActive]
      FROM
      [UERMMMC].[dbo].[SUPPLIER] 
      WHERE 
      [Status] = 'A' 
      AND isAPVActive = '1'
      ORDER BY [NAME] ASC 
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/biomedical-engineers", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    [EmployeeCode],
	    (LastName+', '+FirstName+' '+MiddleName) as Name,
	    Position,
	    UERMEmail
   
      FROM [UE database].[dbo].[Employee] WHERE DeptCode = '1780' or EmployeeCode ='1237'`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/biomedical-engineers-count", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    COUNT([EmployeeCode]) AS userCount
   
      FROM [UE database].[dbo].[Employee] WHERE DeptCode = '1780' or EmployeeCode ='1237'`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/departments", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT  

      [CODE],
      [DESCRIPTION]
     
      FROM [UERMMMC].[dbo].[SECTIONS]
      
      ORDER BY [description] ASC `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/equipment-status", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
		  [ID]
		  ,[EquipStatusType]
	    FROM [UE database].[dbo].[BEMEMS_Equip_Status]`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/equipment-main-status", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT  [WorkMainStatusID]
      ,[WorkMainStatusDesc]
      ,[WorkMainStatusCode]
      FROM [UE database].[dbo].[BEMEMS_Main_Work_Status]
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/location", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT
		    [BldgCode]
		    ,[BldgDesc]
	    FROM [UE database].[dbo].[BEMEMS_Location]
      ORDER BY [BldgDesc] ASC
     `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/active-maintenance", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT COUNT([Maintenance_ID]) as ActiveMain
      FROM [UE database].[dbo].[BEMEMS_Equip_Maintenance]
      WHERE WorkStatus = 'OPEN'
      AND [DeleteStatus] IS NULL
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/supplier-count", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    COUNT([CODE]) AS suppCount
      FROM
      [UERMMMC].[dbo].[SUPPLIER] 
      WHERE 
      [Status] = 'A' 
      AND isAPVActive = '1'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/count-ar", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT COUNT(EquipmentConcern) AS AssetRetirement
      FROM [UE database]..BEMEMS_Equip_Maintenance
      WHERE EquipmentConcern = 'Asset Retirement' 
      AND WorkStatus = 'OPEN' 
      AND [DeleteStatus] IS NULL
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/count-pm", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT COUNT(EquipmentConcern) AS 'PreventiveMaintenance'
      FROM [UE database]..BEMEMS_Equip_Maintenance
      WHERE EquipmentConcern = 'Preventive Maintenance' 
      AND WorkStatus = 'OPEN'
      AND [DeleteStatus] IS NULL
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/count-cm", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT COUNT(EquipmentConcern) AS 'CorrectiveMaintenance'
      FROM [UE database]..BEMEMS_Equip_Maintenance
      WHERE EquipmentConcern = 'Corrective Maintenance'
      AND WorkStatus = 'OPEN'
      AND [DeleteStatus] IS NULL
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/count-pmc", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT COUNT(EquipmentConcern) AS 'PreventiveMaintenanceCalibration'
      FROM [UE database]..BEMEMS_Equip_Maintenance
      WHERE EquipmentConcern = 'Preventive Maintenance and Calibration'
      AND WorkStatus = 'OPEN'
      AND [DeleteStatus] IS NULL
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/count-c", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT COUNT(EquipmentConcern) AS 'Calibration'
      FROM [UE database]..BEMEMS_Equip_Maintenance
      WHERE EquipmentConcern = 'Calibration'
      AND WorkStatus = 'OPEN'
      AND [DeleteStatus] IS NULL
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/maintenance-type", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    [EquipMaintenanceType]
	    ,[EquipMaintenanceCode]
      FROM [UE database].[dbo].[BEMEMS_Equip_Main_Type]
      WHERE EquipMaintenanceType != 'Done'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/main-work-status", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
      [WorkMainStatusDesc]
      ,[WorkMainStatusCode]
      FROM [UE database].[dbo].[BEMEMS_Main_Work_Status]
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/main-work-priority", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
      [WorkOrderCode]
      ,[WorkOrderDesc]
      FROM [UE database].[dbo].[BEMEMS_Main_Work_Priority]
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/main-renewal-type", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
      [ScheduledMaintenanceType]
      ,[SchedMainValueInDays]
      FROM [UE database].[dbo].[BEMEMS_Main_Renewal]
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/main-to-do", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT
      [AssetToDo_ID],
      [AssetToDo_Desc]
      FROM [UE database].[dbo].[BEMEMS_Main_ToDo]
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/main-performed-by", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    [EmployeeCode],
	    (LastName+', '+FirstName+' '+MiddleName) as Name,
	    Position,
	    UERMEmail
   
      FROM [UE database].[dbo].[Employee] WHERE DeptCode = '1880'  and isActive = 1`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/main-approved-by", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      SELECT 
	    [EmployeeCode],
	    (LastName+', '+FirstName+' '+MiddleName) as Name,
	    Position,
	    UERMEmail
   
      FROM [UE database].[dbo].[Employee] WHERE EmployeeCode in ('5276','9090')  and isActive = 1
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/equipments-sn", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT DISTINCT
      CONVERT(VARCHAR(20), GETDATE(), 112) + '-' + CONVERT(VARCHAR(20), RIGHT(SerialNumber, 4)) AS 'WorkOrderNumber',
      SerialNumber 
        ,[Description]
        ,[Model]
        ,[Supplier]
        ,[AlternativeSupplier]
        ,[DateOfPurchase]
        ,[Department]
        ,[RenewalType]
        ,[Brand]
     FROM [UE database].[dbo].[BEMEMS_Equipments]`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

// ADD
router.post("/add-equipments", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `Exec [UE database].[dbo].[BEMEMS_ADD_Equipment]
        '${req.body.Description}',
        '${req.body.Brand}',
        '${req.body.Model}',
        '${req.body.SerialNumber}',
        '${req.body.Supplier}',
        '${req.body.AlternativeSupplier}',
        '${req.body.DateOfPurchase}',
        '${req.body.PurchaseCost}',
        '${req.body.LifeExpectancy}',
        '${req.body.Department}',
        '${req.body.Location}',
        '${req.body.Status}',
        '${req.body.Remarks}',
        '${req.body.RenewalType}',
        '${req.body.DocumentLink}',
        '${req.body.EquipmentId}',
        '${helpers.getIp(req.socket.remoteAddress)}',
        1
      `;
      // console.log(req.body)
      // console.log(sqlQuery)
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/add-maintenance", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `Exec [ue database]..BEMEMS_ADD_Maintenance
        '${req.body.WorkOrder}',
        '${req.body.JobOrder}',
        '${req.body.RequestedBy}',
        '${req.body.Department}',
        '${req.body.WorkPriority}',
        '${req.body.DateOfPurchase}',
        '${req.body.DateStarted}',
        '${req.body.WorkStatus}',
        '${req.body.DateTimeCalled}',
        '${req.body.DateFinished}',
        '${req.body.AssetDescription}',
        '${req.body.Supplier}',
        '${req.body.Manufacturer}',
        '${req.body.Model}',
        '${req.body.SerialNumber}',
        '${req.body.AssetToDo}',
        '${req.body.AssetToDo_Others}',
        '${req.body.EquipmentConcern}',
        '${req.body.WorkPerformedAndResult}',
        '${req.body.RenewalType}',
        '${req.body.Remarks}',
        '${req.body.Recommendation}',
        '${req.body.PerformedBy}',
        '${req.body.ApprovedBy}',
        '${helpers.getIp(req.socket.remoteAddress)}',
        1
      `;
      // console.log(req.body)

      const result = await sql.query(sqlQuery);
      // console.log(result)
      // console.log(sqlQuery)
      sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

// EDIT
router.post("/edit-equipments", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `Exec [UE database].[dbo].[BEMEMS_ADD_Equipment]
        '${req.body.Description}',
        '${req.body.Brand}',
        '${req.body.Model}',
        '${req.body.SerialNumber}',
        '${req.body.Supplier}',
        '${req.body.AlternativeSupplier}',
        '${req.body.DateOfPurchase}',
        '${req.body.PurchaseCost}',
        '${req.body.LifeExpectancy}',
        '${req.body.Department}',
        '${req.body.Location}',
        '${req.body.Status}',
        '${req.body.Remarks}',
        '${req.body.RenewalType}',
        '${req.body.DocumentLink}',
        '${req.body.EquipmentId}',
        '${helpers.getIp(req.socket.remoteAddress)}',
        2
      `;
      // console.log(req.body)
      // console.log(sqlQuery)
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.post("/edit-maintenance", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `Exec [ue database]..BEMEMS_ADD_Maintenance
        '${req.body.WorkOrder}',
        '${req.body.JobOrder}',
        '${req.body.RequestedBy}',
        '${req.body.Department}',
        '${req.body.WorkPriority}',
        '${req.body.DateOfPurchase}',
        '${req.body.DateStarted}',
        '${req.body.WorkStatus}',
        '${req.body.DateTimeCalled}',
        '${req.body.DateFinished}',
        '${req.body.AssetDescription}',
        '${req.body.Supplier}',
        '${req.body.Manufacturer}',
        '${req.body.Model}',
        '${req.body.SerialNumber}',
        '${req.body.AssetToDo}',
        '${req.body.AssetToDo_Others}',
        '${req.body.EquipmentConcern}',
        '${req.body.WorkPerformedAndResult}',
        '${req.body.RenewalType}',
        '${req.body.Remarks}',
        '${req.body.Recommendation}',
        '${req.body.PerformedBy}',
        '${req.body.ApprovedBy}',
        '${helpers.getIp(req.socket.remoteAddress)}',
        2
      `;

      const result = await sql.query(sqlQuery);
      // console.log(result)
      // console.log(sqlQuery)
      sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

// DELETE

router.post("/delete-maintenance", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      // await sql.connect(sqlConfig);
      // const sqlQuery = `Exec [ue database]..[BEMEMS_DELETE_Maintenance]
      //   '${req.body.WorkOrder}',
      //   '${req.body.DeleteStatus}',
      //   '${req.body.DeleteRemarks}',
      //   '${helpers.getIp(req.socket.remoteAddress)}',
      // `;
      // const result = await sql.query(sqlQuery);

      await sql.connect(sqlConfig);

      const result =
        await sql.query`Exec [ue database]..[BEMEMS_DELETE_Maintenance]
        ${req.body.WorkOrder},
        ${req.body.DeleteStatus},
        ${req.body.DeleteRemarks}
      ;`;
      // console.log(result.recordset[0]);
      res.send(result.recordset[0]);
    } catch (error) {
      // console.log(error);
      res.send({ error });
    }
  })();
});

module.exports = router;
