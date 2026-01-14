const express = require('express')
const router = express.Router()
// SQL CONN 
const sql = require("mssql")
const sqlConfig = require('../config/database')
const sanitize = require("../helpers/sanitize");
// /SQL CONN

router.use(sanitize);

router.get('/', (req, res) => {
    sql.connect(sqlConfig, (err) => {
        if (err) {
            res.send({ error: err });
        }
        const request = new sql.Request();
        request.query(`select * from [UE database]..vw_Employees e where e.dept_code in ('5050') and e.is_active = 1 order by name`, (err, recordset) => {
            if (err) {
                res.send({ error: err });
            }
            res.send(recordset.recordset);
        });
    });
})


module.exports = router;