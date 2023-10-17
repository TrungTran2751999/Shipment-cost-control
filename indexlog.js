let mysql = require ('mysql');
let nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
let sql = require('mssql');
let uuid = require('uuid');

let mysqlConfig= mysql.createPool({
    connectionLimit : 30,
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'erpsystem'
});
// let mysqlConfig= mysql.createPool({
//     host:'pbvweb01v',
//     user:'nale',
//     password:'Nale_123',
//     database:'erpsystem'
// });


const sqlConf = {
    user: 'sa',
    password: 'Phubai@123@',
    database: 'PBVPAYQSQL1V',
    //server: PBV-89TMXT2\SQLEXPRESS
    server: "localhost",
    options: {
      trustedConnection: true,
      encrypt: false,
      enableArithAbort: false,
      trustServerCertificate: true
    },
    requestTimeout: 3000000
}
// const sqlConf = {
//     user: 'cts',
//     password: 'Ct$yS123',
//     database: 'PBCTS',
//     //server: PBV-89TMXT2\SQLEXPRESS
//     server: "PBVPAYQSQL1V",
//     options: {
//       trustedConnection: true,
//       encrypt: false,
//       enableArithAbort: false,
//       trustServerCertificate: true
//     },
//    requestTimeout: 3000000
// }

let path = require("path");
//cau hinh doc ejs
let express = require("express");
let bodyParser = require ('body-parser');
let app = express();
//cau hinh dang nhap voi user va password
let passport = require('passport');
let session = require('express-session');
let flash = require('connect-flash');
let LocalStrategy = require('passport-local').Strategy;
//cau hinh python read - write
const {PythonShell} = require('python-shell');
let formidable = require('formidable');

let staticResource='//pbvfps1/PBShare2/Scan/';
let staticResource10='//pbvfps1/SEWING/Bundle_Scan/';
let staticResource9='//pbvfps1/SCAN/Bundle_scan/'
let staticResource2='//pbv-h0m2wv2/BK_Bundle/ScanTemp/Others/'

let staticResource3='//pbv-h0m2wv2/BK_Bundle1/Cutting/'
let staticResource4='//pbv-h0m2wv2/BK_Bundle1/'
let staticResource5='//pbv-h0m2wv2/BK_Bundle1/Backup/'
let staticResource6='//pbv-h0m2wv2/BK_Bundle2/Others/'
let staticResource7='//pbv-h0m2wv2/BK_Bundle2/Backup/'
let staticResource8='//pbv-h0m2wv2/BK_Bundle3/Backup/'
// let staticResource9='//pbvfps1/PBShare3/Scan/'
let staticReport   ='//pbvfps1/PBShare2/Scan/Report/ReportWebserver/'

let cssPath = path.resolve(__dirname, "CSS");
app.use("/CSS", express.static(cssPath));

let publicPath = path.resolve(__dirname, "public");
app.use("/public", express.static(publicPath));

let script = path.resolve(__dirname, "script");
app.use("/script", express.static(script))

let dbPath = path.resolve(__dirname, "db");
app.use("/db", express.static(dbPath));


app.use('/image', express.static(staticResource));
app.use('/image2', express.static(staticResource2));
app.use('/image3', express.static(staticResource3));
app.use('/image4', express.static(staticResource4));
app.use('/image5', express.static(staticResource5));
app.use('/image6', express.static(staticResource6));
app.use('/image7', express.static(staticResource7));
app.use('/image8', express.static(staticResource8));
app.use('/image9', express.static(staticResource9));
app.use('/image10', express.static(staticResource10));
app.use('/report', express.static(staticReport));
app.use(express.static("public"));

let imgpath1='\\\\10.113.90.40\\ScantemPB1\\scan_tem'
let imgpath2='\\\\10.113.90.98\\ScantemPB2\\scan_tem'

app.use("/imgpath", express.static(imgpath1));
app.use("/imgpath2", express.static(imgpath2));


app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(session({
    secret: "secret",
    saveUninitialized: true,
    resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
let logger = require("morgan");
const { config } = require('dotenv');
const { copyFileSync } = require('fs');
const e = require('express');
const { list } = require('pm2');
const { off } = require('process');
const { error } = require('console');
app.use(logger("dev"));
//==site==
app.set("view engine", "ejs");
app.set("views", "./views");
let server = require("http").Server(app);
let io = require("socket.io")(server);
let port = 3001;
let domain = 'localhost'
server.listen(port, domain);
console.log('listen '+`http://${domain}:${port}`)

passport.use(new LocalStrategy(
    (username, password, done)=>{
        let flagLogin=false;

        mysqlConfig.getConnection(function(err, connection){
            if (err) {
                throw err;
            }
            connection.query("SELECT Password, Position FROM setup_user where User='"+username+"';", function (err, result, fields) {
                connection.release();
                if (err) throw err;
                if (result.length>0){
                    if (password==result[0].Password){
                        console.log(username+ ' logged in');
                        flagLogin=true;
                        return done(null, username);
                    }
                }
                if (flagLogin==false) {
                    return done(null, false);
                }
            });
        });
    }
));
passport.serializeUser(function(user, done){
    done(null, user);
});
passport.deserializeUser(function(user, done){
    done(null, user);
});

function get_dept(user, callback){
    let dept='';
    mysqlConfig.getConnection(function(err, connection){
        if (err) {
            throw err;
        }
        connection.query("SELECT User, Name, Department, AdminLog, ImportLog, ExportLog, ShipmentLog, UnloadingLog FROM setup_user where User='"+user+"';", function (err, result, fields) {
            connection.release();
            if (err) throw err;
            if (result.length>0){
                
                return callback(result);
            }
        });
    });
    return dept;
}
// ====================================XAC THUC NGUOI DUNG==============================
// ====================================CONTROLLER=======================================
app.get("/login", function(request, response)  {
    request.logout();
    response.render("login");
});

app.post('/login',passport.authenticate("local",{
    failureRedirect : '/login',
    failureFlash : true}), function(req, res) {
    get_dept(req.user, function(result){
        user=result[0].User;
        dept=result[0].Department;
        position=result[0].Position;
        adminLog=result[0].AdminLog;
        importLog=result[0].ImportLog;
        exportLog=result[0].ExportLog;
        shipmentLog=result[0].ShipmentLog;
        unloadingLog=result[0].UnloadingLog;

        if(adminLog!='Y' && exportLog!='Y' && importLog!='Y' && shipmentLog!='Y' && unloadingLog!='Y') {
            res.redirect("/report-container");
            return
        }
        
        if(adminLog==='Y') {
            res.redirect("/admin")
            return
        }

        if(importLog==='Y'){
            res.redirect("/importer");
            return
        }

        if(exportLog==='Y') {
            res.redirect("/exporter");
            return
        }

        if(shipmentLog==='Y') {
            res.redirect("/shipping");
            return;
        };

        if(unloadingLog==='Y'){
            res.redirect("/unloading");
            return;
        }
        
        res.end();
    }) 
})

app.get("/", function(req, res)  {
    if (!req.isAuthenticated()){
        return res.redirect("login");
    }else{
        if(adminLog==='Y'){
            res.redirect("/admin")
            return
        }else if(importLog==='Y'){
            res.redirect("/importer")
            return
        }else if(exportLog==='Y'){
            res.redirect("/exporter");
            return;
        }else if(shipmentLog==='Y'){
            res.redirect("/shipping");
            return;
        }else if(unloadingLog==='Y'){
            res.redirect("/unloading");
            return;
        }
    }
    res.end();
});

//router cho trang chu admin
app.get("/admin", function(req, res){
    if (!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, "AdminLog")
    .then(async ()=>{
        let year = req.query.year||`${new Date().getFullYear()}`;
        
        let week = req.query.week||`(SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;

        let search = req.query.search
        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");
        
        let query = `SELECT 
                        idSystem, 
                        estimated_loading_week,
                        cont_category,
                        booking_no_update,
                        booking_number,
                        carrier,
                        DC,
                        request_loading,
                        cont_number,
                        estimated_loading_date,
                        loading_location,
                        loading_date,
                        ship_date,
                        cut_off_loading_date,
                        cy_cut_off,
                        ammentdent_bill_cut_off,
                        original_etd,
                        new_etd,
                        ETA,
                        new_ETA,
                        service,
                        vessel,
                        picked_date,
                        vendor,
                        ATA_phu_bai,
                        unload_location,
                        unload_complete_day,
                        CDF_date,
                        export_saving_truck_day,
                        reason_export_saving_truck,
                        picked_at_port,
                        dropping_at_port,
                        dropping_date,
                        pre_booking_number,
                        seal,
                        note_loading_plan,
                        color
                    FROM cont
                    WHERE export_saving_truck_year = ${year} 
                    AND estimated_loading_week = ${week}
                    ${search?`AND cont_number = '${search}'`:""}
                    AND isHide IS NULL
                    AND booking_number IS NOT NULL
                    ORDER BY no ASC, booking_no_update ASC, booking_no`;
        console.log(query)
        let close;
       sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
            res.render(`admin/home`, {listData: result.recordset});
            return result;
            }catch(err){

            }
        })
        .finally(()=>{
            // //close.close();
        })
        
    })
    .catch(()=>{
        res.redirect("/403")
    })

});

//router dan toi trang unloading cho admin
app.get("/admin-unloading", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'AdminLog')
    .then((user)=>{
        try{
        let year = req.query.year;
        
        let week = req.query.week;

        let search = req.query.search;
        let page = req.query.page || 1;
        let limit = req.query.limit || 16;
        let status = req.query.status;
        let offset = (page-1)*limit;
        // if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9]*$"))){
        //     res.redirect("/404");
        //     return;
        // }
        console.log("year", year);
        console.log("week", week);
        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");

        function condition(){
            let conditions = "";
            if(search){
                let condition = `
                AND (cont_category LIKE '%${search}%'
                OR cont_number LIKE '%${search}%' 
                OR carrier LIKE '%${search}%' 
                OR vendor LIKE '%${search}%' 
                OR unload_location LIKE '%${search}%') `;
                conditions+=condition;
            }else{
                let condition = `
                AND (request_unload_date IS NULL
                OR unload_location IS NULL
                OR unload_complete_day IS NULL) `;
                conditions+=condition;
            }
            if(year){
                let condition = `AND export_saving_truck_year = '${year}' `
                conditions+=condition;
            }
            if(week){
                let condition = `AND estimated_loading_week = '${week}' `
                conditions+=condition;
            }
            return conditions;
        }
        
        let query = `

            SELECT * FROM (SELECT * FROM (SELECT
                idSystem, 
                reason_borrow_cont,
                estimated_loading_week,
                estimated_loading_date,
                cont_category,
                cont_number,
                carrier,
                vendor,
                ATA_phu_bai,
                request_unload_date,
                unload_location,
                unload_complete_day,
                saving_truck,
                reason_unload,
                note_unloading,
                warehouse_unload_date,
                export_saving_truck_year,
                product_category,
                borrow_location,
                locate_seal,
                borrow_date,
                noted_unloading
            FROM cont
            WHERE ATA_phu_bai IS NOT NULL
            AND idImporter IS NULL
            ORDER BY ATA_phu_bai DESC OFFSET 0 ROWS) as a
            UNION ALL
            SELECT 
                idSystem,
                reason_borrow_cont,
                estimated_loading_week,
                estimated_loading_date,
                cont_category,
                cont_number,
                direct_carrier as carrier,
                vendor,
                ata_pb as ATA_phu_bai,
                request_unload_date,
                unload_location,
                unload_date as unload_complete_day,
                saving_truck,
                reason_unload,
                note_unloading,
                warehouse_unload_date,
                export_saving_truck_year,
                product_category,
                borrow_location,
                locate_seal,
                borrow_date,
                noted_unloading
            FROM importer) as t
            WHERE ATA_phu_bai IS NOT NULL
            AND cont_number IS NOT NULL
            AND vendor != 'MT'
            ${condition()} 
            ORDER BY t.ATA_phu_bai DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
            `;
        let close ;
        console.log(query)
        sql.connect(sqlConf)
        .then(pool=>{
            close=pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
            res.render(`admin/unloading`, {listData: result.recordset, position: user["Position"], adminLog: user["AdminLog"], shipmentLog: user["ShipmentLog"]});
            return result;
            }catch(err){
                console.log(err);
            }
        })
        .finally(()=>{
            //close.close();
        })
        }catch(err){
            console.log(err);
        }
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//router cho trang chu importer
app.get("/importer", async function(req,res){
    let check = false;
    
    if (!req.isAuthenticated()){
        res.redirect("/login");
        return;
    }
    authorization(req.user, "ImportLog")
    .then(result=>{
        console.log(req.user);
        res.render("importer/home");
    })
    .catch(err=>{
        res.redirect("/403");
    })
    
});

//router cho trang chi tiet nhap hang importer
app.get("/detail-importer", function(req,res){
    if (!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, "ImportLog")
    .then(()=>{
            try{
                let page = req.query.page || 1;
                let limit = req.query.limit || 10;
                let offset = (page-1)*limit;
                console.log("offset", offset);
                console.log("limit",limit);
            let query = 
            `SELECT * FROM (
            SELECT 
                idSystem,
                cont_category,
                cont_number,
                vendor,
                bill,
                direct_carrier,
                picked_at_port,
                picked_date,
                ata_vn_port,
                ata_pb,
                unload_location,
                unload_date,
                invoice,
                po,
                booking_date,
                oil_price,
                vendor_cargo_ready_date,
                return_at_port_day,
                note,
                status
            FROM importer
            ORDER BY ata_pb DESC OFFSET 0 ROWS) as t
            ORDER BY ata_pb DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
            `;
            let close;
            sql.connect(sqlConf)
            .then(pool=>{
                close = pool;
                return pool.request().query(query);
            })
            .then(result=>{
                res.render("importer/detail", {listData:result.recordset})
            })
            .catch(err=>{
                console.log(err);
            })
            .finally(()=>{
                // //close.close();
            })
        }catch(err){
            console.log(err);
            res.redirect("/404");
        }
    })
    .catch(()=>{
        res.redirect("/403");
    })
});

//router dan toi trang tao ke hoach
app.get("/create-loading-plan", function(req, res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'AdminLog')
    .then(()=>{
        res.render("admin/createPlan")
    })
    .catch(()=>{
        res.redirect("/403")
    })
    
});

//router dan toi trang update ke hoach
app.get("/update-loading-plan", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'AdminLog')
    .then(()=>{
        let year = req.query.year||`${new Date().getFullYear()}`;
        
        let week = req.query.week||`(SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;

        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");
        
        let query = `SELECT 
                        idSystem, 
                        estimated_loading_week,
                        cont_category,
                        booking_no_update,
                        booking_number,
                        carrier,
                        DC,
                        cont_number,
                        estimated_loading_date,
                        request_loading,
                        loading_location,
                        loading_date,
                        ship_date,
                        cut_off_loading_date,
                        cy_cut_off,
                        ammentdent_bill_cut_off,
                        original_etd,
                        new_etd,
                        ETA,
                        new_ETA,
                        service,
                        vessel,
                        picked_date,
                        vendor,
                        ATA_phu_bai,
                        unload_location,
                        unload_complete_day,
                        CDF_date,
                        export_saving_truck_day,
                        reason_export_saving_truck,
                        picked_at_port,
                        dropping_at_port,
                        dropping_date,
                        pre_booking_number,
                        oil_price,
                        seal,
                        note_loading_plan,
                        color
                    FROM cont
                    WHERE export_saving_truck_year = ${year} AND estimated_loading_week = ${week} AND isHide IS NULL
                    ORDER BY no ASC, booking_no_update ASC, booking_no ASC;`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close=pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
                res.render(`admin/updatePlan`, {listData: result.recordset});
                return result;
            }catch(err){

            }
        })
        .finally(()=>{
            //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403")
    })

    
});

//router dan toi trang shipping
app.get("/shipping", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    let close;
    authorization(req.user, 'ShipmentLog')
    .then((user)=>{
        let search = req.query.search;

        let year = req.query.year||`${new Date().getFullYear()}`;
        
        let week = req.query.week||`(SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;

        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");
        
        let query = `SELECT 
                        idSystem, 
                        estimated_loading_week,
                        request_loading,
                        cont_category,
                        booking_no_update,
                        booking_number,
                        carrier,
                        DC,
                        cont_number,
                        estimated_loading_date,
                        loading_location,
                        loading_date,
                        ship_date,
                        cut_off_loading_date,
                        cy_cut_off,
                        ammentdent_bill_cut_off,
                        original_etd,
                        new_etd,
                        vessel,
                        unload_location,
                        unload_complete_day,
                        export_saving_truck_day,
                        reason_export_saving_truck,
                        seal,
                        note_shipping,
                        MNF_number,
                        manufacture,
                        color,
                        noted_loading
                    FROM cont
                    WHERE 
                    isHide IS NULL
                    AND booking_number IS NOT NULL
                    AND cont_number IS NOT NULL
                    ${search && year && week ? 
                    `AND cont_number = '${search}'
                    AND export_saving_truck_year = ${year}
                    AND estimated_loading_week = ${week}`:
                    year && week?
                    `AND export_saving_truck_year = ${year}
                    AND estimated_loading_week = ${week}`:
                    search?`AND cont_number = '${search}'`:""}
                    ORDER BY no, booking_no_update, booking_no ASC`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            let close1 ;
            try{
                let query = `SELECT * FROM manufacture`
                sql.connect(sqlConf)
                .then(pool=>{
                    close1 = pool;
                    return pool.request().query(query);
                })
                .then(manufacture=>{
                    try{
                    console.log("user",user["Position"]);
                    res.render(`shipping/updateShipping`, {listData: result.recordset, listManufacture: manufacture.recordset, position: user["Position"]});
                    }catch(err){
                        console.log(err);
                    }
                })
                .catch(err=>{
                    console.log(err);
                })
                .finally(()=>{
                    
                })
                return result;
            }catch(err){
                console.log(err)
            }
        })
        .finally(()=>{
            // //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403");
    })
    .finally(()=>{
        //close.close();
    })
})

//router dan toi trang update thong tin cho shipping
app.get("/update-shipping", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'ShipmentLog')
    .then(()=>{
        let year = req.query.year||`${new Date().getFullYear()}`;
        
        let week = req.query.week||`(SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;

        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");
        
        let query = `SELECT 
                        idSystem, 
                        estimated_loading_week,
                        cont_category,
                        booking_no_update,
                        booking_number,
                        carrier,
                        DC,
                        cont_number,
                        estimated_loading_date,
                        loading_location,
                        loading_date,
                        ship_date,
                        cut_off_loading_date,
                        cy_cut_off,
                        ammentdent_bill_cut_off,
                        original_etd,
                        new_etd,
                        vessel,
                        unload_location,
                        unload_complete_day,
                        export_saving_truck_day,
                        reason_export_saving_truck,
                        seal,
                        note_shipping,
                        MNF_number,
                        manufacture
                    FROM cont
                    WHERE export_saving_truck_year = ${year} AND estimated_loading_week = ${week} AND isHide IS NULL
                    ORDER BY new_etd, original_etd, no, booking_no_update, booking_no ASC;`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
                res.render(`shipping/updateShipping`, {listData: result.recordset});
                return result;
            }catch(err){

            }
        })
        .finally(()=>{
            //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403")
    })
})

//router dan toi trang exporter
app.get("/exporter", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'ExportLog')
    .then((user)=>{
        let year = req.query.year||`${new Date().getFullYear()}`;
        
        let week = req.query.week||`
        (
            SELECT MAX(estimated_loading_week) 
            FROM cont 
            WHERE export_saving_truck_year = ${year}
            AND isHide IS NULL
            AND booking_number IS NOT NULL
            AND cont_number IS NOT NULL
        )`;

        let search = req.query.search;
        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");
        
        let query = `SELECT 
                        idSystem, 
                        estimated_loading_week,
                        cont_category,
                        booking_no_update,
                        booking_number,
                        carrier,
                        DC,
                        cont_number,
                        estimated_loading_date,
                        loading_location,
                        loading_date,
                        ship_date,
                        cut_off_loading_date,
                        cy_cut_off,
                        ammentdent_bill_cut_off,
                        original_etd,
                        new_etd,
                        service,
                        eta,
                        new_eta,
                        vessel,
                        CDF_date,
                        doc_pic,
                        finish_export_docx,
                        SO,
                        HQ,
                        pre_booking_number,
                        seal,
                        note_shipping,
                        manufacture,
                        MNF_number,
                        dozen,
                        amount,
                        cbm,
                        gross_weight,
                        oil_price,
                        note_exporter
                    FROM cont
                    WHERE export_saving_truck_year = ${year} 
                    AND estimated_loading_week = ${week} 
                    ${search?`AND cont_number = '${search}'`:""}
                    AND isHide IS NULL
                    AND booking_number IS NOT NULL
                    AND cont_number IS NOT NULL
                    ORDER BY new_etd, original_etd,no, booking_no_update, booking_no ASC`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close=pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            res.render(`exporter/updateExporter`, {listData: result.recordset, username: user["Name"]});
            return result;
        })
        .finally(()=>{
            //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//router dan toi trang update thong tin exporter
app.get("/update-exporter", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'ExportLog')
    .then(()=>{
        let year = req.query.year||`${new Date().getFullYear()}`;
        
        let week = req.query.week||`(SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;

        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");
        
        let query = `SELECT 
                        idSystem, 
                        estimated_loading_week,
                        cont_category,
                        booking_no_update,
                        booking_number,
                        carrier,
                        DC,
                        cont_number,
                        estimated_loading_date,
                        loading_location,
                        loading_date,
                        ship_date,
                        cut_off_loading_date,
                        cy_cut_off,
                        ammentdent_bill_cut_off,
                        original_etd,
                        new_etd,
                        service,
                        eta,
                        new_eta,
                        vessel,
                        CDF_date,
                        doc_pic,
                        finish_export_docx,
                        SO,
                        HQ,
                        pre_booking_number,
                        seal,
                        note_exporter
                    FROM cont
                    WHERE export_saving_truck_year = ${year} AND estimated_loading_week = ${week} AND isHide IS NULL
                    ORDER BY new_etd, original_etd,no, booking_no_update, booking_no ASC`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            res.render(`exporter/updateExporter`, {listData: result.recordset});
            return result;
        })
        .finally(()=>{
            //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//router dan toi trang unloading
app.get("/unloading", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    authorization(req.user, 'UnloadingLog')
    .then((user)=>{
        try{
        let year = req.query.year;
        
        let week = req.query.week;

        let search = req.query.search;
        let page = req.query.page || 1;
        let limit = req.query.limit || 16;
        let status = req.query.status;
        let offset = (page-1)*limit;
        // if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9]*$"))){
        //     res.redirect("/404");
        //     return;
        // }
        console.log("year", year);
        console.log("week", week);
        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");

        function condition(){
            let conditions = "";
            if(search){
                let condition = `
                AND (cont_category LIKE '%${search}%'
                OR cont_number LIKE '%${search}%' 
                OR carrier LIKE '%${search}%' 
                OR vendor LIKE '%${search}%' 
                OR unload_location LIKE '%${search}%') `;
                conditions+=condition;
            }else{
                let condition = `
                AND (request_unload_date IS NULL
                OR unload_location IS NULL
                OR unload_complete_day IS NULL) `;
                conditions+=condition;
            }
            if(year){
                let condition = `AND export_saving_truck_year = '${year}' `
                conditions+=condition;
            }
            if(week){
                let condition = `AND estimated_loading_week = '${week}' `
                conditions+=condition;
            }
            return conditions;
        }
        
        let query = `

            SELECT * FROM (SELECT * FROM (SELECT
                idSystem, 
                reason_borrow_cont,
                estimated_loading_week,
                estimated_loading_date,
                cont_category,
                cont_number,
                carrier,
                vendor,
                ATA_phu_bai,
                request_unload_date,
                unload_location,
                unload_complete_day,
                saving_truck,
                reason_unload,
                note_unloading,
                warehouse_unload_date,
                export_saving_truck_year,
                product_category,
                borrow_location,
                locate_seal,
                borrow_date,
                noted_unloading
            FROM cont
            WHERE ATA_phu_bai IS NOT NULL
            AND idImporter IS NULL
            ORDER BY ATA_phu_bai DESC OFFSET 0 ROWS) as a
            UNION ALL
            SELECT 
                idSystem,
                reason_borrow_cont,
                estimated_loading_week,
                estimated_loading_date,
                cont_category,
                cont_number,
                direct_carrier as carrier,
                vendor,
                ata_pb as ATA_phu_bai,
                request_unload_date,
                unload_location,
                unload_date as unload_complete_day,
                saving_truck,
                reason_unload,
                note_unloading,
                warehouse_unload_date,
                export_saving_truck_year,
                product_category,
                borrow_location,
                locate_seal,
                borrow_date,
                noted_unloading
            FROM importer) as t
            WHERE ATA_phu_bai IS NOT NULL
            AND cont_number IS NOT NULL
            AND vendor != 'MT'
            ${condition()} 
            ORDER BY t.ATA_phu_bai DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
            `;
        let close ;
        console.log(query)
        sql.connect(sqlConf)
        .then(pool=>{
            close=pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
            res.render(`unloading/updateUnloading`, {listData: result.recordset, position: user["Position"], adminLog: user["AdminLog"], shipmentLog: user["ShipmentLog"]});
            return result;
            }catch(err){
                console.log(err);
            }
        })
        .finally(()=>{
            //close.close();
        })
        }catch(err){
            console.log(err);
        }
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//router dan toi trang trucking cost
app.get("/routing-code", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    let search = req.query.search?`'${req.query.search}'`:req.query.search;
    let page = req.query.page || 1;
    let limit = req.query.limit || 10;
    let status = req.query.status;
    let offset = (page-1)*limit;
    if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
        res.redirect("/404");
        return;
    }
    authorization(req.user, 'AdminLog')
    .then(()=>{
        let condition = `
        WHERE picked_at_port = ${search} OR 
        vendor = ${search} OR 
        loading_location = ${search} OR 
        dropped_at_port = ${search} OR 
        routing_code_1 = ${search} OR
        routing_code_2 = ${search}`;
        let query = `
            SELECT 
            * 
            FROM 
            routing_code
            ${search?condition:""}
            ORDER BY idSystem DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close=pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
                res.render(`admin/routingCode`, {listData: result.recordset});
                return result;
            }catch(err){
                console.log(err)
            }
        })
        .finally(()=>{
            //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//router dan toi trang routing-code
app.get("/trucking-cost", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    let search = req.query.search?`'${req.query.search}'`:req.query.search;
    let page = req.query.page || 1;
    let limit = req.query.limit || 10;
    let status = req.query.status;
    let offset = (page-1)*limit;
    if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
        res.redirect("/404");
        return;
    }
    authorization(req.user, 'AdminLog')
    .then(()=>{
        let condition = `
        WHERE routing_code = ${search} OR
        index_price = ${search} `;
        let query = `
            SELECT 
            * 
            FROM 
            trucking_cost
            ${search?condition:""}
            ORDER BY idSystem DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`;
        console.log(query)
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
                res.render(`admin/truckingCost`, {listData: result.recordset});
                return result;
            }catch(err){
                console.log(err)
            }
        })
        .finally(()=>{
            //close.close();
        })
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//router dan toi trang cost
app.get("/cost", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'AdminLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 10;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
        if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
            res.redirect("/404");
            return;
        }
        let condition = search?` AND (a.cont_number=${search} OR a.direct_carrier=${search} OR a.vendor=${search} OR a.picked_at_port=${search} OR a.dropping_at_port=${search})`:"";
        let query = 
            `SELECT 
            *
            FROM (SELECT * FROM (SELECT 
                    idSystem,
                    cont_category,
                    cont_number,
                    vendor,
                    direct_carrier,
                    picked_at_port,
                    picked_date,
                    dropping_at_port,
                    loading_location,
                    oil_price,
                    routing_code,
                    trucking_cost,
                    status
                FROM importer
                WHERE status!='REUSED' OR status IS NULL
                ORDER BY ata_pb DESC OFFSET 0 ROWS) as t UNION
                SELECT 
                    idSystem,
                    cont_category,
                    cont_number,
                    vendor,
                    carrier as direct_carrier,
                    picked_at_port,
                    picked_date,
                    dropping_at_port,
                    loading_location,
                    oil_price,
                    routing_code,
                    trucking_cost,
                    status
                FROM cont) as a 
                WHERE a.cont_number IS NOT NULL 
                ${condition}
                ORDER BY a.picked_date DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
        console.log(query);
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .then(result=>{
            res.render("admin/cost", {listData:result.recordset})
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close.close();
        })
    }catch(err){
        console.log(err);
        res.redirect("/404");
    }
    })
    .catch(()=>{
        res.redirect("/403")
    })
   

})

//router dan toi trang cost cho importer
app.get("/cost-importer", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'ImportLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 10;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
        if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
            res.redirect("/404");
            return;
        }
        let condition = search?` AND (cont_number=${search} OR direct_carrier=${search} OR vendor=${search} OR picked_at_port=${search} OR dropping_at_port=${search})`:"";
        let query = 
            `SELECT 
                idSystem,
                cont_category,
                cont_number,
                vendor,
                direct_carrier,
                picked_at_port,
                picked_date,
                oil_price,
                routing_code,
                trucking_cost,
                status
            FROM importer
            WHERE status!='REUSED' OR status IS NULL
            ${condition}
            ORDER BY picked_date DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
        console.log(query);
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .then(result=>{
            res.render("importer/cost", {listData:result.recordset})
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close.close();
        })
    }catch(err){
        console.log(err);
        res.redirect("/404");
    }
    })
    .catch(()=>{
        res.redirect("/403")
    })
    
})

//router dan roi trang cost cho exporter
app.get("/cost-exporter", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'ExportLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 10;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
        if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
            res.redirect("/404");
            return;
        }
        let condition = search?` AND (cont_number=${search} OR direct_carrier=${search} OR vendor=${search} OR picked_at_port=${search} OR dropping_at_port=${search})`:"";
        let query = 
            `SELECT 
                idSystem,
                cont_category,
                cont_number,
                vendor,
                direct_carrier,
                picked_at_port,
                picked_date,
                oil_price,
                routing_code,
                trucking_cost,
                status
            FROM cont
            WHERE booking_number IS NOT NULL
            ${condition}
            ORDER BY picked_date DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
        console.log(query);
        sql.connect(sqlConf)
        .then(pool=>{
            return pool.request().query(query);
        })
        .then(result=>{
            res.render("exporter/cost", {listData:result.recordset})
        })
        .catch(err=>{
            console.log(err);
        })
    }catch(err){
        console.log(err);
        res.redirect("/404");
    }
    })
    .catch(()=>{
        res.redirect("/403")
    })
})

//router dan toi trang demdet
app.get("/demdet",function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    let search = req.query.search?`'${req.query.search}'`:req.query.search;
    let page = req.query.page || 1;
    let limit = req.query.limit || 10;
    let status = req.query.status;
    let offset = (page-1)*limit;
    if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
        res.redirect("/404");
        return;
    }
    authorization(req.user, 'AdminLog')
    .then(()=>{
        let condition = `
        WHERE carrier = ${search}`;
        let query = `
            SELECT 
            * 
            FROM 
            dem_det_cost
            ${search?condition:""}
            ORDER BY carrier ASC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`;
        console.log(query)
        sql.connect(sqlConf)
        .then(pool=>{
            
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
                res.render(`admin/demdet`, {listData: result.recordset});
                return result;
            }catch(err){
                console.log(err)
            }
        })
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//report vong doi container
app.get("/report-container",function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    let search = req.query.search;
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let arrCont = [];
    let arrImporter = [];
    let query1 = `
    SELECT
        idSystem,
        cont_number,
        picked_date,
        picked_at_port,
        ATD_vendor,
        vendor,
        carrier,
        ATA_phu_bai,
        ATA_vn_port,
        unload_complete_day,
        unload_location,
        loading_date,
        loading_location,
        finish_export_docx,
        CDF_date,
        ETA,
        MNF_number,
        dropping_date as return_export_day,
        idImporter,
        borrow_date,
        borrow_location,
        dropping_at_port
    FROM cont
    ${search ?
    `WHERE cont_number = '${search}'`:
    fromDate && toDate ?
    `WHERE cont_number = '${search}' AND picked_date BETWEEN '${fromDate}' AND '${toDate}'`:
    `WHERE cont_number = NULL`}`;
    let query2 = `
    SELECT
        idSystem,
        cont_number,
        picked_date,
        vendor,
        direct_carrier as carrier,
        picked_at_port,
        ata_vn_port as ATA_vn_port,
        ata_pb as ATA_phu_bai,
        unload_date as unload_complete_day,
        return_at_port_day
    FROM importer
    ${search ?
        `WHERE cont_number = '${search}'`:
        fromDate && toDate ?
        `WHERE cont_number = '${search}' AND picked_date BETWEEN '${fromDate}' AND '${toDate}'`:
        `WHERE cont_number = NULL`}`;
    sql.connect(sqlConf)
    .then(pool1=>{
        return pool1.request().query(query1);
    })
    .then(result1=>{
        arrCont = result1.recordset;
        sql.connect(sqlConf)
        .then(pool2=>{
            return pool2.request().query(query2);
        })
        .then(result2=>{
            try{
            let arrResult = [];
            arrImporter = result2.recordset;
            //khu trung cont resued
            for(let i=0; i<arrCont.length; i++){
                for(let j=0; j<arrImporter.length; j++){
                    if(arrCont[i]["idImporter"] == arrImporter[j]["idSystem"]){
                        arrImporter.splice(1,j);
                    }
                }
            } 
            let arr = arrResult.concat(arrCont).concat(arrImporter);
            res.render("report/report", {listData:arr});
            }catch(err){
                console.log(err);
            }
        })
        .catch(err2=>{
            console.log(err2);
        })
    })
    .catch((err1)=>{
        console.log(err1)
    })
})

// router dan toi 404
app.get("/404", function(req,res){
    res.render("error/404");
});

//router dan toi 403
app.get("/403", function(req,res){
    res.render("error/403");
});


//router dan toi trang manufacture
app.get("/manufacture", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'AdminLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 16;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
            if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
                res.redirect("/404");
                return;
            }
            let condition = search?`WHERE name=${search}`:"";
            let query = `SELECT * FROM manufacture ${condition} ORDER BY name OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
            sql.connect(sqlConf)
            .then(pool=>{
                return pool.request().query(query);
            })
            .then(result=>{
                try{
                    res.render("admin/manufacture", {listData:result.recordset});
                }catch(err){
                    console.log(err);
                }
            })
            .catch(err=>{
                console.log(err);
            })
        }catch(err){
            console.log(err)
        }
    })
    .catch((err)=>{
        res.redirect("/403");
    })
})

//router dan toi trang reason unloading
app.get("/reason-unloading", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'AdminLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 16;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
            if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
                res.redirect("/404");
                return;
            }
            let condition = search?`WHERE reason=${search}`:"";
            let query = `SELECT * FROM reason_unloading ${condition} ORDER BY reason OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
            sql.connect(sqlConf)
            .then(pool=>{
                return pool.request().query(query);
            })
            .then(result=>{
                try{
                    res.render("admin/reasonUnloading", {listData:result.recordset});
                }catch(err){
                    console.log(err);
                }
            })
            .catch(err=>{
                console.log(err);
            })
        }catch(err){
            console.log(err)
        }
    })
    .catch((err)=>{
        res.redirect("/403");
    })
})

//router dan toi email receive
app.get("/email-receive", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'AdminLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 16;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
            if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
                res.redirect("/404");
                return;
            }
            let condition = search?`WHERE email=${search}`:"";
            let query = `SELECT * FROM email_receive ${condition} ORDER BY idSystem OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
            sql.connect(sqlConf)
            .then(pool=>{
                return pool.request().query(query);
            })
            .then(result=>{
                try{
                    res.render("admin/emailReceive", {listData:result.recordset});
                }catch(err){
                    console.log(err);
                }
            })
            .catch(err=>{
                console.log(err);
            })
        }catch(err){
            console.log(err)
        }
    })
    .catch((err)=>{
        res.redirect("/403");
    })
})

//router dan toi 
app.get("/product-cont", function(req,res){
    if(!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, 'AdminLog')
    .then(()=>{
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 16;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
            if(isNaN(page) || isNaN(limit)){
                res.redirect("/404");
                return;
            }
            let condition = search?`WHERE name=${search}`:"";
            let query = `SELECT * FROM product_cont ${condition} ORDER BY name OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;`
            sql.connect(sqlConf)
            .then(pool=>{
                return pool.request().query(query);
            })
            .then(result=>{
                try{
                    res.render("admin/productCont", {listData:result.recordset});
                }catch(err){
                    console.log(err);
                }
            })
            .catch(err=>{
                console.log(err);
            })
        }catch(err){
            console.log(err)
        }
    })
    .catch((err)=>{
        res.redirect("/403");
    })
})

// router dan toi 404
app.get("/404", function(req,res){
    res.render("error/404");
});

//router dan toi 403
app.get("/403", function(req,res){
    res.render("error/403");
});



//router dan toi trang quan ly non-booking
app.get("/non-booking", function(req,res){
    if (!req.isAuthenticated()) return res.redirect("/login");
    authorization(req.user, "AdminLog")
    .then(()=>{
            try{
                let page = req.query.page || 1;
                let limit = req.query.limit || 16;
                let status = req.query.status;
                let offset = (page-1)*limit;
            if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9]*$"))){
                res.redirect("/404");
                return;
            }
            let query = 
            `SELECT * FROM (SELECT * FROM (SELECT 
                idSystem,
                cont_category,
                cont_number,
                vendor,
                direct_carrier,
                picked_at_port,
                picked_date,
                ata_vn_port,
                ata_pb,
                unload_date,
                unload_location, 
                oil_price,
                return_at_port_day,
                status
            FROM importer
            ORDER BY ata_pb DESC OFFSET 0 ROWS) as t UNION
            SELECT 
                idSystem,
                cont_category,
                cont_number,
                vendor,
                carrier as direct_carrier,
                picked_at_port,
                picked_date,
                ata_vn_port,
                ATA_phu_bai as ata_pb,
                unload_complete_day as unload_date,
                unload_location, 
                oil_price,
                dropping_date as return_at_port_day,
                status
            FROM cont ${status?"":`WHERE booking_number IS NULL`}) as a 
            WHERE ${status?"status="+"'"+status+"'":"status IS NULL"}
            ORDER BY a.ata_pb DESC
            OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
            console.log(query);
            sql.connect(sqlConf)
            .then(pool=>{
                return pool.request().query(query);
            })
            .then(result=>{
                res.render("admin/nonBooking", {listData:result.recordset})
            })
            .catch(err=>{
                console.log(err);
            })
        }catch(err){
            console.log(err);
            res.redirect("/404");
        }
    })
    .catch(()=>{
        res.redirect("/403")
    })
})

// ====================================CONTROLLER=======================================
// =======================================================API===============================================
// api post data lap ke hoach hang xuat
app.post("/api/create-plan-loading", async function(req, res){
    if(!req.isAuthenticated()) return res.redirect("/login");

    if(!authorization(req.user, 'AdminLog')) return res.redirect("/login");
    
    let listData = req.body;
    function query() { 
        let result = "";
        for(let i=0; i<listData.length; i++){
            let query = `INSERT INTO cont(
                idSystem, 
                estimated_loading_week,
                cont_category,
                booking_no,
                booking_number,
                carrier,
                DC,
                cont_number,
                estimated_loading_date,
                loading_location,
                loading_date,
                ship_date,
                cut_off_loading_date,
                cy_cut_off,
                ammentdent_bill_cut_off,
                original_etd,
                new_etd,
                ETA,
                new_ETA,
                service,
                vessel,
                picked_date,
                vendor,
                ATA_phu_bai,
                unload_location,
                unload_complete_day,
                CDF_date,
                export_saving_truck_day,
                reason_export_saving_truck,
                picked_at_port,
                dropping_at_port,
                dropping_date,
                pre_booking_number,
                seal,
                note_loading_plan,
                export_saving_truck_year,
                no,
                booking_no_update,
                color,
                request_loading
                ) 
            VALUES(
                'loadingPlan.${listData[i].idCurrent}${uuidv4()}${uuidv4()}${uuidv4()}', 
                ${listData[i].week},
                ${listData[i].contCategory},
                ${listData[i].noBooking},
                ${listData[i].bookingNumber},
                ${listData[i].carrier},
                ${listData[i].dc},
                ${listData[i].containerNumber},
                ${listData[i].estimateLoadingDate},
                ${listData[i].loadingLocation},
                ${listData[i].loadingDate},
                ${listData[i].shipDate},
                ${listData[i].cutOffLoadingDate},
                ${listData[i].cyCutOff},
                ${listData[i].ammentdentBillCutOff},
                ${listData[i].etd},
                ${listData[i].newEtd},
                ${listData[i].eta},
                ${listData[i].newEta},
                ${listData[i].service},
                ${listData[i].vessel},
                ${listData[i].pickedDate},
                ${listData[i].vendor},
                ${listData[i].ataPb},
                ${listData[i].unloadingLocation},
                ${listData[i].unloadingDate},
                ${listData[i].cdfDate},
                ${listData[i].exportSavingTruckDate},
                ${listData[i].reasonExportSavingTruck},
                ${listData[i].picAtPort},
                ${listData[i].droppingAtPort},
                ${listData[i].droppingDate},
                ${listData[i].preBookingNumber},
                ${listData[i].seal},
                ${listData[i].note},
                '${new Date().getFullYear()}',
                '${i+1}',
                ${listData[i].noBooking},
                ${listData[i].color},
                ${listData[i].requestLoading}
            );`;
            result+=query;
        }
        return result;
    }
    console.log(query())
    createTransansaction(query(), res);
});

//api lay 5 tuan lap ke hoach gan nhat trong nam
app.get("/api/top5week", async function (req,res) {
    if(!req.isAuthenticated() && !authorization(req.user, "AdminLog")) return res.redirect("/login");

    let year = req.query.year || `${new Date().getFullYear()}`;

    let maxWeek = req.query.maxWeek;
    
    let minWeek = req.query.minWeek;

    let search = req.query.search;

    if(!validateTime(year) || !validateTime(maxWeek) || !validateTime(minWeek)){
        res.status(404).json("FAIL");
        return;
    }

    if(!maxWeek) maxWeek = parseInt(maxWeek);
    if(!minWeek) minWeek = parseInt(minWeek);

    console.log(`SELECT DISTINCT ${!maxWeek && !minWeek ? " TOP 4 ":" "}
                    estimated_loading_week
                FROM cont 
                WHERE export_saving_truck_year = '${year}'
                ${maxWeek && minWeek ? 
                    " AND estimated_loading_week <= "+maxWeek+" "+
                    " AND estimated_loading_week >= "+minWeek+" ": " "
                } AND isHide IS NULL
                ORDER BY estimated_loading_week DESC;`)
    let close;
    sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request()
            .query(`
            SELECT DISTINCT ${!maxWeek && !minWeek ? " TOP 4 ":" "}
                estimated_loading_week
            FROM cont 
            WHERE export_saving_truck_year = '${year}'
            ${maxWeek && minWeek ? 
                " AND estimated_loading_week <= "+maxWeek+" "+
                " AND estimated_loading_week >= "+minWeek+" ": " "
            }
            ${search?`AND cont_number='${search}'`:""}
            ORDER BY estimated_loading_week DESC;
            `)
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404")
            return 
        })
        .then(result=>{
            try{
            res.status(200).json(result.recordset);
            return result;
            }catch(err){};
        })
        .finally(()=>{
            //close.close();
        })
})

//api lay 5 tuan gan nhat cua shipping va exporter
app.get("/api/top5week-shipping-exporter", async function (req,res) {
    let year = req.query.year || `${new Date().getFullYear()}`;

    let maxWeek = req.query.maxWeek;
    
    let minWeek = req.query.minWeek

    if(!validateTime(year) || !validateTime(maxWeek) || !validateTime(minWeek)){
        res.status(404).json("FAIL");
        return;
    }

    if(!maxWeek) maxWeek = parseInt(maxWeek);
    if(!minWeek) minWeek = parseInt(minWeek);

    console.log(`SELECT DISTINCT ${!maxWeek && !minWeek ? " TOP 4 ":" "}
                    estimated_loading_week
                FROM cont 
                WHERE export_saving_truck_year = '${year}'
                ${maxWeek && minWeek ? 
                    " AND estimated_loading_week <= "+maxWeek+" "+
                    " AND estimated_loading_week >= "+minWeek+" ": " "
                } 
                AND booking_number IS NOT NULL
                AND cont_number IS NOT NULL
                AND isHide IS NULL
                ORDER BY estimated_loading_week DESC;`)
    let close;
    sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request()
            .query(`
            SELECT DISTINCT ${!maxWeek && !minWeek ? " TOP 4 ":" "}
                estimated_loading_week
            FROM cont 
            WHERE export_saving_truck_year = '${year}'
            ${maxWeek && minWeek ? 
                " AND estimated_loading_week <= "+maxWeek+" "+
                " AND estimated_loading_week >= "+minWeek+" ": " "
            }
            AND booking_number IS NOT NULL
            AND cont_number IS NOT NULL
            AND isHide IS NULL
            ORDER BY estimated_loading_week DESC;
            `)
        })
        .catch(e=>{
            console.log(e);
            return 
        })
        .then(result=>{
            let arrResult = result.recordset;
            for(let i=0; i<arrResult.length; i++){
                if(arrResult[i]==null){
                    result.recordset.splice(i,1);
                }
            }
            res.status(200).json(result.recordset);
            return result;
        })
        .finally(()=>{
            //close.close();
        })
})

//api loc cont theo nam va tuan
app.get("/api/yearAndWeek", async function(req,res){
    if(!req.isAuthenticated() && !authorization(req.user, "AdminLog")) return res.redirect("/login");
    
    let year = req.query.year;

    let week = req.query.week;

    if(!validateTime(year) || !validateTime(req.query.week)) return res.redirect("/404");
    let close;
    sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request()
            .query(`
            SELECT 
                    idSystem, 
                    estimated_loading_week,
                    booking_no,
                    booking_number,
                    carrier,
                    DC,
                    cont_number,
                    estimated_loading_date,
                    loading_location,
                    loading_date,
                    ship_date,
                    cut_off_loading_date,
                    cy_cut_off,
                    ammentdent_bill_cut_off,
                    original_etd,
                    new_etd,
                    ETA,
                    service,
                    vessel,
                    picked_date,
                    vendor,
                    ATA_phu_bai,
                    unload_location,
                    unload_complete_day,
                    CDF_date,
                    export_saving_truck_day,
                    reason_export_saving_truck,
                    picked_at_port,
                    dropping_at_port,
                    dropping_date,
                    pre_booking_number,
                    seal,
                    note_loading_plan
                FROM cont
                WHERE export_saving_truck_year = ${year} AND estimated_loading_week = ${week}
                ORDER BY no ASC
            `)
        })
        .catch(e=>{
            console.log(e)
        })
        .finally(()=>{
            //close.close();
        })
})

//api tim so cong co tuan gan nhat
app.get("/api/countRowPlan", async function(req,res){
    if (!req.isAuthenticated()) return res.redirect("/login");

    let year = req.query.year || new Date().getFullYear();

    if(!validateTime(year)){
        res.status(404).json("FAIL");
        return;
    }
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool
        return pool.request()
        .query(`
        SELECT MAX(estimated_loading_week) as max
        FROM cont
        WHERE export_saving_truck_year = ${year}
        AND isHide IS NULL`);
    })
    .catch(e=>{
        console.log(e)
    })
    .then(result=>{
        console.log(result.recordset)
        res.status(200).json(result.recordset);
        return result;
    })
    .finally(()=>{
        //close.close();
    })
})

//api tim so cont co tuan gan nhat cua shipping va exporter
app.get("/api/countRowExportOrShip",function(req,res){
    if (!req.isAuthenticated()) return res.redirect("/login");

    let year = req.query.year || new Date().getFullYear();

    if(!validateTime(year)){
        res.status(404).json("FAIL");
        return;
    }
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool
        return pool.request()
        .query(`
        SELECT MAX(estimated_loading_week) as max
        FROM cont
        WHERE export_saving_truck_year = ${year}
        AND booking_number IS NOT NULL
        AND cont_number IS NOT NULL
        AND isHide IS NULL`);
    })
    .catch(e=>{
        console.log(e)
    })
    .then(result=>{
        console.log(result.recordset)
        res.status(200).json(result.recordset);
        return result;
    })
    .finally(()=>{
        //close.close();
    })
})

//api tim kiem su ton tai cua week
app.get("/api/checkExistWeek", async function (req,res) {
    let year = req.query.year || `${new Date().getFullYear()}`;
    let week = req.query.week;
    
    if(!validateTime(year) || !validateTime(week)){
        res.status(400).json("FAIL")
        return;
    }
    let close;   
    sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request()
            .query(`
                SELECT DISTINCT estimated_loading_week
                FROM cont
                WHERE export_saving_truck_year = '${year}' AND estimated_loading_week = '${week}'
            `)
        })
        .then(result=>{
            console.log(result)
            res.status(200).json(result.recordset);
        })
        .catch(e=>{
            res.status(400).json({message: "FAIL"})
            console.log(e);
        })
        .finally(()=>{
            //close.close();
        })
})

//api cap nhat stt cua stt booking
app.post("/api/updateBookingStt", function(req, res){
    function query(){
        let listData = req.body;
        let result = "";
        for(let i=0; i<listData.length; i++){
            let query = `
                UPDATE cont
                SET booking_no_update = ${listData[i]["noBooking"]},
                no = ${listData[i]["stt"]}
                WHERE idSystem = '${listData[i]["id"]}';
            `
            result+=query;
        }
        return result;
    }
    console.log(query())
    createTransansaction(query(), res)
})

//api cap nhat data cho loading plan
app.post("/api/updateBooking", function(req,res){
    if (!req.isAuthenticated() && !authorization(req.user, "AdminLog")) return res.redirect("/login");

    let newData = req.body.new;
    let existedData = req.body.existed;
    function query(){
        let queries = "";
        for(let data of newData){
            let query = `INSERT INTO cont(
                idSystem, 
                estimated_loading_week,
                cont_category,
                booking_no,
                booking_number,
                carrier,
                DC,
                cont_number,
                estimated_loading_date,
                loading_location,
                loading_date,
                ship_date,
                cut_off_loading_date,
                cy_cut_off,
                ammentdent_bill_cut_off,
                original_etd,
                new_etd,
                ETA,
                new_ETA,
                service,
                vessel,
                picked_date,
                vendor,
                ATA_phu_bai,
                unload_location,
                unload_complete_day,
                export_saving_truck_day,
                reason_export_saving_truck,
                picked_at_port,
                oil_price,
                dropping_at_port,
                dropping_date,
                pre_booking_number,
                seal,
                note_loading_plan,
                export_saving_truck_year,
                booking_no_update,
                no,
                color,
                request_loading
                ) 
            VALUES(
                'loadingPlan.${data.idCurrent}${uuidv4()}.${uuidv4()}.${uuidv4()}', 
                ${data.week},
                ${data.contCategory},
                ${data.noBooking},
                ${data.bookingNumber},
                ${data.carrier},
                ${data.dc},
                ${data.containerNumber},
                ${data.estimateLoadingDate},
                ${data.loadingLocation},
                ${data.loadingDate},
                ${data.shipDate},
                ${data.cutOffLoadingDate},
                ${data.cyCutOff},
                ${data.ammentdentBillCutOff},
                ${data.etd},
                ${data.newEtd},
                ${data.eta},
                ${data.newEta},
                ${data.service},
                ${data.vessel},
                ${data.pickedDate},
                ${data.vendor},
                ${data.ataPb},
                ${data.unloadingLocation},
                ${data.unloadingDate},
                ${data.exportSavingTruckDate},
                ${data.reasonExportSavingTruck},
                ${data.picAtPort},
                ${data.oilPrice},
                ${data.droppingAtPort},
                ${data.droppingDate},
                ${data.preBookingNumber},
                ${data.seal},
                ${data.note},
                ${data.year},
                ${data.noBooking},
                ${data.no},
                ${data.color},
                ${data.requestLoading}
            );`;
            queries+=query;
        }
        let i=0;
        for(let data of existedData){
            let query = 
            `UPDATE cont 
                SET 
                estimated_loading_week = ${data.week},
                cont_category = ${data.contCategory},
                booking_no = ${data.noBooking},
                booking_number = ${data.bookingNumber},
                carrier = ${data.carrier},
                DC = ${data.dc},
                cont_number = ${data.containerNumber},
                estimated_loading_date = ${data.estimateLoadingDate},
                request_loading = ${data.requestLoading},
                loading_location = ${data.loadingLocation},
                loading_date = ${data.loadingDate},
                ship_date = ${data.shipDate},
                cut_off_loading_date = ${data.cutOffLoadingDate},
                cy_cut_off = ${data.cyCutOff},
                ammentdent_bill_cut_off = ${data.ammentdentBillCutOff},
                original_etd = ${data.etd},
                new_etd = ${data.newEtd},
                ETA = ${data.eta},
                new_ETA = ${data.newEta},
                service = ${data.service},
                vessel = ${data.vessel},
                picked_date = ${data.pickedDate},
                vendor = ${data.vendor},
                oil_price = ${data.oilPrice},
                ATA_phu_bai = ${data.ataPb},
                unload_location = ${data.unloadingLocation},
                unload_complete_day = ${data.unloadingDate},
                export_saving_truck_day = ${data.exportSavingTruckDate},
                reason_export_saving_truck = ${data.reasonExportSavingTruck},
                picked_at_port = ${data.picAtPort},
                dropping_at_port = ${data.droppingAtPort},
                dropping_date = ${data.droppingDate},
                pre_booking_number = ${data.preBookingNumber},
                seal = ${data.seal},
                note_loading_plan =  ${data.note},
                export_saving_truck_year = ${data.year},
                booking_no_update = ${data.noBooking},
                color = ${data.color}
            WHERE idSystem = '${data.idSystem}';
            
            DECLARE @idBooking${i} varchar(1000)
            SET @idBooking${i} = 
            (SELECT idSystem FROM cont WHERE idBooking = '${data.idSystem}');

            UPDATE cont SET
                estimated_loading_week = ${data.week},
                estimated_loading_date = ${data.estimateLoadingDate},
                export_saving_truck_year = ${data.year}
            WHERE idSystem = @idBooking${i};
            
            DECLARE @idImporter${i} varchar(1000)
            SET @idImporter${i} = 
            (SELECT idImporter FROM cont WHERE idSystem = '${data.idSystem}');

            UPDATE importer SET
                estimated_loading_week = ${data.week},
                estimated_loading_date = ${data.estimateLoadingDate},
                export_saving_truck_year = ${data.year}
            WHERE idSystem = @idImporter${i};
            `;
            i++;
            queries+=query;
        }
        return queries;
    };
    console.log(query());
    console.log(newData);
    createTransansaction(query(), res);
})

//api tao data tai bang importer
app.post("/api/create-importer", function(req,res){
    let listData = req.body;
    function query(){
        let queries = "";
        for(let i=0; i<listData.length; i++){
            let query = `
                INSERT INTO importer(
                    idSystem,
                    cont_category,
                    cont_number,
                    vendor,
                    bill,
                    direct_carrier,
                    picked_at_port,
                    picked_date,
                    ata_vn_port,
                    ata_pb,
                    invoice,
                    po,
                    booking_date,
                    vendor_cargo_ready_date,
                    return_at_port_day,
                    note,
                    created_at
                ) VALUES (
                    'importer.${listData[i].idCurrent}${uuidv4()}${uuidv4()}${uuidv4()}',
                    ${listData[i].contCategory},
                    ${listData[i].containerNumber},
                    ${listData[i].vendor},
                    ${listData[i].bill},
                    ${listData[i].directCarrier},
                    ${listData[i].picAtPort},
                    ${listData[i].pickedDate},
                    ${listData[i].ataVnPort},
                    ${listData[i].ataPb},
                    ${listData[i].invoice},
                    ${listData[i].po},
                    ${listData[i].bookingDate},
                    ${listData[i].venderCargoDay},
                    ${listData[i].returnAtPortDay},
                    ${listData[i].note},
                    '${+new Date()}'
            );`;
            queries+=query;
        }
        return queries;
    }
    console.log(query());
    createTransansaction(query(), res);
})

//api tim so luong row cua importer
app.get("/api/importer/countRow", function(req,res){
    let status = req.query.status;
    let query = `SELECT COUNT(idSystem) as max FROM importer WHERE ${status?"status="+"'"+status+"'":"status IS NULL"};`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api fill data importer theo so luong 
app.get("/api/importer", function(req,res){
    let id = req.query.id;
    console.log("id",id)
    if(!id){
        res.status(400).json("FAIL");
        return;
    }
    let query = 
    `SELECT * FROM importer WHERE idSystem = '${id}'`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
        res.status(400).json("FAIL");
    })
    .finally(()=>{
        //close.close();
    })
})

//api update data importer theo idSystem
app.put("/api/importer", function(req,res){
    let query = 
    `UPDATE importer SET
        cont_category = ${req.body.contCategory},
        cont_number = ${req.body.contNumber},
        vendor = ${req.body.vendor},
        bill = ${req.body.bill},
        direct_carrier = ${req.body.directCarrier},
        invoice = ${req.body.invoice},
        po = ${req.body.po},
        booking_date = ${req.body.bookingDate},
        picked_at_port = ${req.body.pickedAtPort},
        picked_date = ${req.body.pickedDate},
        vendor_cargo_ready_date = ${req.body.vendorCargo},
        ata_vn_port = ${req.body.ataVnPort},
        ata_pb = ${req.body.ataPb},
        oil_price = ${req.body.oilPrice},
        return_at_port_day = ${req.body.returnPortDay},
        note = ${req.body.note}

        WHERE idSystem = '${req.body.idSystem}'
    `
    console.log(query);
    createTransansaction(query, res);
})

//api dem so luong non-booking
app.get("/api/countNonBooking", function(req,res){
    let status = req.query.status;
    let query = `
    SELECT COUNT(a.idSystem) as max FROM (SELECT * FROM (SELECT 
        idSystem,
        cont_category,
        cont_number,
        vendor,
        direct_carrier,
        picked_at_port,
        picked_date,
        ata_vn_port,
        ata_pb, 
        status
    FROM importer
    ORDER BY ata_pb DESC OFFSET 0 ROWS) as t UNION
    SELECT 
        idSystem,
        cont_category,
        cont_number,
        vendor,
        direct_carrier,
        picked_at_port,
        picked_date,
        ata_vn_port,
        ATA_phu_bai as ata_pb,
        status
    FROM cont WHERE booking_number IS NULL AND vendor IS NOT NULL) as a 
    WHERE ${status?"status="+"'"+status+"'":"status IS NULL"}`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api dem so luong cost importer
app.get("/api/count-cost-importer", function(req,res){
        try{
            let page = req.query.page || 1;
            let limit = req.query.limit || 10;
            let status = req.query.status;
            let offset = (page-1)*limit;
            let search = req.query.search?`'${req.query.search}'`:req.query.search;
        if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
            res.redirect("/404");
            return;
        }
        let condition = search?` AND (a.cont_number=${search} OR a.direct_carrier=${search} OR a.vendor=${search} OR a.picked_at_port=${search} OR a.dropping_at_port=${search})`:"";
        let query = 
        `SELECT 
            COUNT(idSystem)
        FROM importer
        WHERE status!='REUSED' OR status IS NULL
        ${condition}`;

        console.log(query);
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            return pool.request().query(query);
        })
        .then(result=>{
            res.status(200).json(result.recordset);
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close.close();
        })
        }catch(err){
            console.log(err);
            res.redirect("/404");
        }   
})

//api dem luong cost
app.get("/api/count-cost", function(req,res){
    try{
        let page = req.query.page || 1;
        let limit = req.query.limit || 10;
        let status = req.query.status;
        let offset = (page-1)*limit;
        let search = req.query.search?`'${req.query.search}'`:req.query.search;
    if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
        res.redirect("/404");
        return;
    }
    let condition = search?` AND (a.cont_number=${search} OR a.direct_carrier=${search} OR a.vendor=${search} OR a.picked_at_port=${search} OR a.dropping_at_port=${search})`:"";
    let query = 
    `SELECT 
    COUNT(a.idSystem) as max
    FROM (SELECT * FROM (SELECT 
            idSystem,
            cont_category,
            cont_number,
            vendor,
            direct_carrier,
            picked_at_port,
            picked_date,
            dropping_at_port,
            loading_location,
            oil_price,
            routing_code,
            trucking_cost,
            status
        FROM importer
        WHERE status!='REUSED' OR status IS NULL
        ORDER BY ata_pb DESC OFFSET 0 ROWS) as t UNION
        SELECT 
            idSystem,
            cont_category,
            cont_number,
            vendor,
            carrier as direct_carrier,
            picked_at_port,
            picked_date,
            dropping_at_port,
            loading_location,
            oil_price,
            routing_code,
            trucking_cost,
            status
        FROM cont) as a
        WHERE a.cont_number IS NOT NULL 
        ${condition};`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    }catch(err){
        console.log(err);
        res.redirect("/404");
    }   
})

//api dem luong cost exporter
app.get("/api/count-cost-exporter", function(req,res){
    try{
        let page = req.query.page || 1;
        let limit = req.query.limit || 10;
        let status = req.query.status;
        let offset = (page-1)*limit;
        let search = req.query.search?`'${req.query.search}'`:req.query.search;
    if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
        res.redirect("/404");
        return;
    }
    let condition = search?` AND (a.cont_number=${search} OR a.direct_carrier=${search} OR a.vendor=${search} OR a.picked_at_port=${search} OR a.dropping_at_port=${search})`:"";
    let query = 
    `SELECT 
        COUNT(idSystem)
    FROM 
    WHERE booking_number IS NOT NULL
    ${condition}`;
    let close;
    console.log(query);
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    }catch(err){
        console.log(err);
        res.redirect("/404");
    }   
})

//api dem so luong dem det
app.get("/api/count-demdet", function(req,res){
    try{
        let page = req.query.page || 1;
        let limit = req.query.limit || 10;
        let status = req.query.status;
        let offset = (page-1)*limit;
        let search = req.query.search?`'${req.query.search}'`:req.query.search;
    if(isNaN(page) || isNaN(limit) || (status && !status.match("^[a-zA-Z0-9/-]*$"))){
        res.redirect("/404");
        return;
    }
    let condition = search?`WHERE carrier=${search}`:"";
    let query = 
        `SELECT 
        COUNT(idSystem) as max 
        FROM 
        dem_det_cost
        ${search?condition:""};`
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    }catch(err){
        console.log(err);
        res.redirect("/404");
    }   
})

//api update non-booking
app.post("/api/update-non-booking", function(req,res){
    let data = req.body.existed;
    let type = data[0]["idSystem"].split(".")[0];
    let query;
    if(type == "loadingPlan"){
        query = `
        UPDATE cont SET
            vendor = ${data[0].vendor},
            cont_category = ${data[0].contCategory},
            carrier = ${data[0].carrier},
            cont_number = ${data[0].contNumber},
            picked_at_port = ${data[0].pickedAtPort},
            picked_date = ${data[0].pickedDate},
            ATA_vn_port = ${data[0].ataVnPort},
            ATA_phu_bai = ${data[0].ataPb},
            oil_price = ${data[0].oilPrice},
            dropping_date = ${data[0].returnAtPortDay}
        WHERE idSystem = '${data[0].idSystem}'`;
    }else if(type == "importer"){
        query = `
        UPDATE importer SET
            picked_date = ${data[0].pickedDate},
            return_at_port_day = ${data[0].returnAtPortDay},
            oil_price = ${data[0].oilPrice}
        WHERE idSystem = '${data[0].idSystem}'`;
    }
    console.log(query);
    createTransansaction(query,res);
})

//api dem so tuan ma co cont co booking va khong co cont number
app.get("/api/weekNoContNumber", function(req,res){
    let year = req.query.year || new Date().getFullYear();
    let query = `
        SELECT 
        DISTINCT estimated_loading_week
        FROM cont
        WHERE export_saving_truck_year = ${year} 
        AND
        booking_number IS NOT NULL
        AND
        cont_number IS NULL
        ORDER BY estimated_loading_week DESC`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api load toan bo booking tuan nay va tuan sau
app.get("/api/booking", function(req,res){
    let year = req.query.year || new Date().getFullYear();
    let week = req.query.week || `(SELECT max(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;
    let query = `
        SELECT 
        DISTINCT booking_number, carrier
        FROM cont
        WHERE export_saving_truck_year = ${year} 
        AND 
        estimated_loading_week = ${week}
        AND
        booking_number IS NOT NULL
        AND
        cont_number IS NULL`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api reused cont
app.post("/api/reused", function(req, res){
    let data = req.body;
    let type = req.body.idSystem.split(".")[0];
    let query = "";
    if(type==='loadingPlan'){
        query = `
        DECLARE @id varchar(1000)
        SET @id = 
        (SELECT TOP 1
            idSystem
            FROM 
        cont WHERE 
        booking_number = ${data.bookingNumber} 
        AND cont_number IS NULL 
        AND export_saving_truck_year = '${data.year}'
        AND estimated_loading_week = '${data.week}'
        ORDER BY booking_no_update ASC);

        UPDATE cont SET
            cont_category = ${data.categoryCont},
            cont_number = ${data.contNumber},
            vendor = ${data.vendor},
            direct_carrier = ${data.directCarrier},
            picked_at_port = ${data.pickedAtPort},
            picked_date = ${data.pickedDay},
            ATA_vn_port = ${data.ataVnPort},
            ATA_phu_bai = ${data.ataPb},
            unload_location = ${data.unloadLocation},
            unload_complete_day = ${data.unloadDate}
        WHERE
        idSystem = @id; 

        UPDATE cont SET
            isHide = 'Y',
            idBooking = @id,
            direct_carrier = ${data.directCarrier},
            estimated_loading_week = (SELECT estimated_loading_week FROM cont WHERE idSystem = @id),
            export_saving_truck_year = (SELECT export_saving_truck_year FROM cont WHERE idSystem = @id),
            estimated_loading_date = (SELECT estimated_loading_date FROM cont WHERE idSystem = @id),
            status = 'REUSED'
        WHERE idSystem = '${data.idSystem}';
        `
    }else if(type === 'importer'){
        query = `
        DECLARE @id varchar(1000)
        SET @id = 
        (SELECT TOP 1 
            idSystem 
            FROM 
        cont WHERE 
        booking_number = ${data.bookingNumber}
        AND cont_number IS NULL
        AND export_saving_truck_year = '${data.year}'
        AND estimated_loading_week = '${data.week}'
        ORDER BY booking_no_update ASC);

        UPDATE importer SET
            status = 'REUSED',
            estimated_loading_week = (SELECT estimated_loading_week FROM cont WHERE idSystem = @id),
            export_saving_truck_year = (SELECT export_saving_truck_year FROM cont WHERE idSystem = @id),
            estimated_loading_date = (SELECT estimated_loading_date FROM cont WHERE idSystem = @id)
        WHERE
        idSystem = '${data.idSystem}';
        
        UPDATE cont SET
            cont_category = ${data.categoryCont},
            cont_number = ${data.contNumber},
            vendor = ${data.vendor},
            
            picked_at_port = ${data.pickedAtPort},
            picked_date = ${data.pickedDay},
            ATA_vn_port = ${data.ataVnPort},
            ATA_phu_bai = ${data.ataPb},
            unload_location = ${data.unloadLocation},
            unload_complete_day = ${data.unloadDate},
            idImporter = '${data.idSystem}'
        WHERE
        idSystem = @id; 
        `
    };
    console.log("query", query);
    createTransansaction(query, res);
    
})

//api non-status cont
app.get("/api/non-status", function(req,res){
    let id = req.query.id;
    let type = id.split(".")[0];
    let query = ""
    if(type==='loadingPlan'){
        query = `
        UPDATE cont SET 
            cont_number = null,
            vendor = null,
            direct_carrier = null,
            picked_at_port = null,
            picked_date = null,
            ATA_vn_port = null,
            ATA_phu_bai = null,
            unload_location = null,
            unload_complete_day = null
        WHERE
            idSystem = (SELECT idBooking FROM cont WHERE idSystem = '${id}');

        UPDATE cont SET
            status = null,
            isHide = null,
            idBooking = null,
            estimated_loading_week = null,
            export_saving_truck_year = null,
            estimated_loading_date = null
        WHERE
            idSystem = '${id}';
        `
    }else if(type === 'importer'){
        query = `
        UPDATE cont SET 
            cont_number = null,
            vendor = null,
            direct_carrier = null,
            picked_at_port = null,
            picked_date = null,
            ATA_vn_port = null,
            ATA_phu_bai = null,
            unload_location = null,
            unload_complete_day = null,
            idImporter = null
        WHERE idImporter = '${id}'; 
        
        UPDATE importer SET 
            status = null,
            estimated_loading_week = null,
            export_saving_truck_year = null,
            estimated_loading_date = null
        WHERE idSystem = '${id}'`
    }
    console.log(query);
    createTransansaction(query, res);
})

//api oneway cont
app.get("/api/oneway", function(req,res){
    let id = req.query.id;
    console.log("id", id)
    let type = id.split(".")[0];
    let query = ""
    if(type==='loadingPlan'){
        query = `
        UPDATE cont SET 
            status = 'ONEWAY',
            isHide = 'Y'
        WHERE idSystem = '${id}'`;
    }else if(type === 'importer'){
        query = `
        UPDATE importer SET
            status = 'ONEWAY'
        WHERE idSystem = '${id}';`
    }
    console.log(query);
    createTransansaction(query, res);
})

//api update data trang update shipping
app.post("/api/update-shipping", function(req,res){
    let data = req.body;
    let queries = "";
    for(let i=0; i<data.length; i++){
        let query = `
        UPDATE cont SET
            loading_location = ${data[i].loadingLocation},
            loading_date = ${data[i].loadingDate},
            reason_export_saving_truck = ${data[i].reasonExportSavingTruck},
            note_shipping = ${data[i].note},
            manufacture = ${data[i].manufacture},
            MNF_number = ${data[i].mnfNumber},
            ship_date = ${data[i].shipDate?"(SELECT GETDATE())":null},
            DC = ${data[i].dc},
            ${data[i].position=="Superintendent"?`request_loading = ${data[i]["requestLoading"]},`:""}
            noted_loading = ${data[i].notedLoading}
        WHERE idSystem = '${data[i].idSystem}';`
        queries+=query;
    }
    console.log(queries);
    createTransansaction(queries, res);
})

//api send email shippping
app.post("/api/send-email-shipping", function(req,res){
    try{
        let data = req.body;
        console.log(data)
        // let transporter = nodemailer.createTransport({
        //     host: 'smtp.gmail.com',
        //     port: 465,
        //     secure: true, // use SSL
        //     auth: {
        //         user: 'sapoproject01@gmail.com',
        //         pass: 'jrovaspntfgozxws'
        //     }
        // });
        var transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com", // hostname
            secureConnection: false, // TLS requires secureConnection to be false
            port: 587, // port for secure SMTP
            tls: {
            ciphers:'SSLv3'
            },
            auth: {
                user: `${data.emailSend}`,
                pass: `${data.password}`
            }
        });
        let mnfAlert = "";
        let arrMnf = data.mnf.split(", ");
        let arrDc = data.dc.split(", ");
        let arrManufacture = data.manufactute.split(", ");
        for(let i=0; i<arrMnf.length; i++){
            mnfAlert+=`<p>MNF${i+1}: ${arrMnf[i]}; DC${i+1}: ${arrDc[i]}; Manufacture: ${arrManufacture[i]}</p>`;
        }
        let mailOptions = {
            from: `"SHIPPING " <${data.emailSend}>`, // sender address (who sends)
            to: `${data.emailReiceive}`, // list of receivers (who receives)
            subject: `Báo cáo xuất hàng thành phẩm: Số cont: ${data.contNumber},Nơi xuất: ${data.loadingLocation}, Số MNF: ${arrMnf.join("/")}`, // Subject line
            text: 'Hello world ', // plaintext body
            html: `<p>Dear all, Shipping team gửi báo cáo xuất hàng, thông tin container như bên dưới ạ </p>
                  <p>TUAN: ${data.week}</p>
                  <p>Loading date: ${data.loadingDate}</p>
                  <p>Ship date: ${data.shipDate}</p>
                  <p>ETD: ${data.etd}</p>
                  <p>Loading location: ${data.loadingLocation}</p>
                  <p>Container number: ${data.contNumber}</p>
                  <p>Seal number: ${data.sealNumber}</p>
                  ${mnfAlert}
                  <p>GHI CHÚ: ${data.noted}</p>
                  <p>Thanks all,</p>` // html body
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                res.status(400).json(error)
                return console.log(error);
            }
            let query = `UPDATE cont SET ship_date = (SELECT GETDATE()) WHERE idSystem = '${data.id}'`;
            createTransansaction(query,res);
            console.log('Message sent: ' + info.response);
        });
    }catch(err){

    }
})

//api send email unloading
app.post("/api/send-email-unloading", function(req,res){
    try{
        let data = req.body;
        console.log(data)
        // let transporter = nodemailer.createTransport({
        //     host: 'smtp.gmail.com',
        //     port: 465,
        //     secure: true, // use SSL
        //     auth: {
        //         user: 'sapoproject01@gmail.com',
        //         pass: 'jrovaspntfgozxws'
        //     }
        // });
        var transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com", // hostname
            secureConnection: false, // TLS requires secureConnection to be false
            port: 587, // port for secure SMTP
            tls: {
            ciphers:'SSLv3'
            },
            auth: {
                user: `${data.emailSend}`,
                pass: `${data.password}`
            }
        });
        let mailOptions = {
            from: `"UNLOADING " <${data.emailSend}>`, // sender address (who sends)
            to: `${data.emailReiceive}`, // list of receivers (who receives)
            subject: `BÁO CONTAINER RA CỔNG: Số cont: ${data.containerNumber} - Cổng ra: ${data.borrowLocation || data.unloadLocation} ${data.unloadCompleteDay?"":`-Số seal: ${data.locateSeal}-Nơi đến: ${data.borrowLocation}`}`, // Subject line
            text: 'báo container ra cổng', // plaintext body
            html: `<p>${data.productCategory && data.unloadCompleteDay==false?`Cont bên dưới được dùng để chuyển hàng qua ${data.borrowLocation}`:"cont bên dưới đã hoàn thành xuống cont và trả rỗng"}</p>
                   <p>SỐ CONT: ${data.containerNumber}</p>
                   <p>SỐ SEAL: ${data.locateSeal && data.unloadCompleteDay==false?data.locateSeal:"KHÔNG"}</p>
                   <p>HÀNG HÓA: ${data.productCategory && data.unloadCompleteDay==false?data.productCategory: "KHÔNG"}</p>
                   <p>NGÀY RA: ${data.unloadCompleteDay || data.borrowDate}</p>
                   <p>CỔNG RA: ${data.borrowLocation || data.unloadLocation}</p>
                   <p>GHI CHÚ: ${data.noted}</p>
            <p>Đây là email tự động của bộ phận Log-Kho, vui lòng không phản hồi email này</p>` // html body
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                res.status(400).json(error)
                return console.log(error);
            }
            res.status(200).json("SUCCESS")
            console.log('Message sent: ' + info.response);
        });
    }catch(err){

    }
})

//api get email bao ve
app.get("/api/email-bv", function(req,res){
    let type = req.query.type;
    let query = `
    SELECT 
    * FROM 
    email_receive  
    ${type=='unloading'?`WHERE unloading = 'Y'`:
    type=='loading'?`WHERE loading = 'Y'`:""}`;
    sql.connect(sqlConf)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then((result)=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
})


//api update data trang update exporter
// app.post("/api/update-exporter", function(req,res){
//     let data = req.body;
//     authorization(req.user, "ExportLog")
//     .then((result)=>{
//         let queries = "";
//         sql.connect(sqlConf)
//         .then(pool=>{
//             try{
//             let queryDay = `
//             SELECT CDF_date as date FROM cont WHERE idSystem = '${data[i].idSystem}'
//             `
//             return pool.request().query(queryDay);
//             }catch(err){
//                 console.log(err);
//             }
//         })
//         .then(date=>{
//             try{
//             for(let i=0; i<data.length; i++){
//                 let query = `
//                     UPDATE cont SET 
//                         CDF_date = ${data[i].cdfDate},
//                         finish_export_docx = ${data[i].finishExportDocs},
//                         SO = ${data[i].soNumber},
//                         HQ = ${data[i].hqNumber},
//                         note_exporter = ${data[i].note},
//                         dozen = ${data[i].dozen},
//                         amount = ${data[i].amount},
//                         cbm = ${data[i].cbm},
//                         gross_weight = ${data[i].cbm},
//                         ${convertISODate((`${date.recordset[0].date}`))!=data[i].cdfDate?
//                             ",doc_pic=" +"'"+result["Name"]+"'":""}
//                     WHERE idSystem = '${data[i].idSystem}';`;
//                 queries+=query;
//             }
//             console.log("queries", queries);
//             createTransansaction(queries, res);
//             }catch(err){
//                 console.log(err);
//             }
//         })
//     })
//     .catch(()=>{
//         res.redirect("/403");
//     })
// })

//api update data trang update exporter
// app.post("/api/update-exporter", function(req,res){
//     let data = req.body;
//     authorization(req.user, "ExportLog")
//     .then((result)=>{
//         let queries = "";
//             try{
//             for(let i=0; i<data.length; i++){
//                 let updateQuery;
//                 if(data[i].cdfDate){
//                     updateQuery = 
//                     `
//                     IF @date${i} = ${data[i].cdfDate}
//                     UPDATE cont SET 
//                         finish_export_docx = ${data[i].finishExportDocs},
//                         SO = ${data[i].soNumber},
//                         HQ = ${data[i].hqNumber},
//                         note_exporter = ${data[i].note},
//                         dozen = ${data[i].dozen||null},
//                         amount = ${data[i].amount||null},
//                         cbm = ${data[i].cbm||null},
//                         gross_weight = ${data[i].grossWeight||null}
//                     WHERE idSystem = '${data[i].idSystem}'
//                     ELSE
//                     UPDATE cont SET 
//                         CDF_date = ${data[i].cdfDate},
//                         finish_export_docx = ${data[i].finishExportDocs},
//                         SO = ${data[i].soNumber},
//                         HQ = ${data[i].hqNumber},
//                         note_exporter = ${data[i].note},
//                         dozen = ${data[i].dozen||null},
//                         amount = ${data[i].amount||null},
//                         cbm = ${data[i].cbm||null},
//                         gross_weight = ${data[i].grossWeight||null},
//                         doc_pic = ${data[i].docPic}
//                     WHERE idSystem = '${data[i].idSystem}'
//                     ;`;
//                 }else{
//                     updateQuery = 
//                     `
//                     UPDATE cont SET 
//                         finish_export_docx = ${data[i].finishExportDocs},
//                         SO = ${data[i].soNumber},
//                         HQ = ${data[i].hqNumber},
//                         note_exporter = ${data[i].note},
//                         dozen = ${data[i].dozen||null},
//                         amount = ${data[i].amount||null},
//                         cbm = ${data[i].cbm||null},
//                         gross_weight = ${data[i].grossWeight||null}
//                     WHERE idSystem = '${data[i].idSystem}'`
//                 }
//                 let query = `
//                     DECLARE @date${i} text
//                     SET @date${i} = (SELECT CDF_date as date FROM cont WHERE idSystem = '${data[i].idSystem}')
//                     ${updateQuery}`
                    
//                 queries+=query;
//             }
//             console.log("queries", queries);
//             createTransansaction(queries, res);
//             }catch(err){
//                 console.log(err);
//             }
//     })
//     .catch(()=>{
//         res.redirect("/403");
//     })
// })

app.post("/api/update-exporter", function(req,res){
    let data = req.body;
    authorization(req.user, "ExportLog")
    .then((result)=>{
        let queries = "";
            try{
            for(let i=0; i<data.length; i++){

                let query = `
                UPDATE cont SET 
                    CDF_date = ${data[i].cdfDate},
                    finish_export_docx = ${data[i].finishExportDocs},
                    SO = ${data[i].soNumber=="' '"?null:data[i].soNumber},
                    HQ = ${data[i].hqNumber=="' '"?null:data[i].hqNumber},
                    note_exporter = ${data[i].note},
                    dozen = ${data[i].dozen||null},
                    amount = ${data[i].amount||null},
                    cbm = ${data[i].cbm==0||!data[i].cbm||data[i].cbm=="'0'"?null:data[i].cbm},
                    gross_weight = ${data[i].grossWeight||null},
                    doc_pic = ${data[i].docPic}
                WHERE idSystem = '${data[i].idSystem}'`
                    
                queries+=query;
            }
            console.log("queries", queries);
            createTransansaction(queries, res);
            }catch(err){
                console.log(err);
            }
    })
    .catch(()=>{
        res.redirect("/403");
    })
})

//get api all SO trong database
app.get("/api/get-all-so",function(req,res){
    let query = `SELECT idSystem, SO FROM cont`;
    sql.connect(sqlConf)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
})

//api dem so luong unloading
app.get("/api/count-row-unloading", function(req,res){
    let year = req.query.year;
        
        let week = req.query.week;

        let search = req.query.search;
        let page = req.query.page || 1;
        let limit = req.query.limit || 16;
        // let status = req.query.status;
        // let offset = (page-1)*limit;
        if(isNaN(page) || isNaN(limit)){
            res.redirect("/404");
            return;
        }

        if(!validateTime(year) || !validateTime(req.query.week)) return res.render("error/404");

        function condition(){
            let conditions = "";
            if(search){
                let condition = `
                AND (cont_category LIKE '%${search}%' 
                OR cont_number LIKE '%${search}%'
                OR carrier LIKE '%${search}%'
                OR vendor LIKE '%${search}%' 
                OR unload_location LIKE '%${search}%') `;
                conditions+=condition;
            }else{
                let condition = `
                AND (request_unload_date IS NULL
                OR unload_location IS NULL
                OR unload_complete_day IS NULL) `;
                conditions+=condition;
            }
            if(year){
                let condition = `AND export_saving_truck_year = '${year}' `
                conditions+=condition;
            }
            if(week){
                let condition = `AND estimated_loading_week = '${week}' `
                conditions+=condition;
            }
            return conditions;
        }
        
        let query = `

        SELECT COUNT(idSystem) as max FROM (SELECT * FROM (SELECT 
            idSystem, 
            estimated_loading_week,
            estimated_loading_date,
            cont_category,
            cont_number,
            carrier,
            vendor,
            ATA_phu_bai,
            request_unload_date,
            unload_location,
            unload_complete_day,
            saving_truck,
            reason_unload,
            note_unloading,
            export_saving_truck_year
        FROM cont
        ORDER BY ATA_phu_bai DESC OFFSET 0 ROWS) as a
        UNION ALL
        SELECT 
            idSystem,
            estimated_loading_week,
            estimated_loading_date,
            cont_category,
            cont_number,
            direct_carrier as carrier,
            vendor,
            ata_pb as ATA_phu_bai,
            request_unload_date,
            unload_location,
            unload_date as unload_complete_day,
            saving_truck,
            reason_unload,
            note_unloading,
            export_saving_truck_year
        FROM importer) as t
        WHERE t.ATA_phu_bai IS NOT NULL
        ${condition()}
        `;
        console.log(query);
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(query);
        })
        .catch(e=>{
            console.log(e);
            res.render("error/404");
        })
        .then(result=>{
            try{
                res.status(200).json(result.recordset)
                return result;
            }catch(err){
                console.log(err);
            }
        })
        .finally(()=>{
            //close.close();
        })
})

//api update data trang unloading
app.post("/api/update-unloading", function(req,res){
    let data = req.body.existed;
    let queries = "";
    let type = data[0].idSystem.split(".")[0];
    for(let i=0; i<data.length; i++){
            if(type==='loadingPlan'){
                let query = `
                DECLARE @idBooking varchar(1000)
                SET @idBooking = (SELECT idBooking FROM cont WHERE idSystem = '${data[0].idSystem}');

                UPDATE cont SET
                    ${data[0]["postion"]==='Supervisor'||data[0]["postion"]==='Assistan'||data[0]["isAdminLog"]==='Y'||data[0]["isShipmentLog"]==='Y'?`
                        starting_date = ${data[0].startingDate},
                        request_unload_date = ${data[0].requestUnloadDate},
                        unload_complete_day = ${data[0].unloadCompleteDay},
                        unload_location = ${data[0].unloadLocation},
                        reason_borrow_cont = ${data[0].reasonBorrowCont},
                        saving_truck = ${data[0].savingTruckDate},
                        reason_unload = ${data[0].reason},
                        note_unloading = ${data[0].note},
                        ATA_phu_bai = ${data[0].ataPb},

                        product_category = ${data[0].productCategory},
                        borrow_location = ${data[0].borrowLocation},
                        locate_seal = ${data[0].locateSeal},
                        borrow_date = ${data[0].borrowDate},
                        noted_unloading = ${data[0].noted}
                    `:`
                    starting_date = ${data[0].startingDate},
                    unload_complete_day = ${data[0].unloadCompleteDay},
                    reason_unload = ${data[0].reason},
                    note_unloading = ${data[0].note},
                    reason_borrow_cont = ${data[0].reasonBorrowCont},
                    product_category = ${data[0].productCategory},
                    borrow_location = ${data[0].borrowLocation},
                    locate_seal = ${data[0].locateSeal},
                    borrow_date = ${data[0].borrowDate},
                    noted_unloading = ${data[0].noted}`}
                    
                WHERE idSystem = '${data[0].idSystem}';
                
                UPDATE cont SET
                    ${data[0]["postion"]==='Supervisor'||data[0]["postion"]==='Assistan'||data[0]["isAdminLog"]==='Y'||data[0]["isShipmentLog"]==='Y'?`
                        starting_date = ${data[0].startingDate},
                        request_unload_date = ${data[0].requestUnloadDate},
                        unload_complete_day = ${data[0].unloadCompleteDay},
                        unload_location = ${data[0].unloadLocation},
                        reason_borrow_cont = ${data[0].reasonBorrowCont},
                        saving_truck = ${data[0].savingTruckDate},
                        reason_unload = ${data[0].reason},
                        note_unloading = ${data[0].note},
                        ATA_phu_bai = ${data[0].ataPb},

                        product_category = ${data[0].productCategory},
                        borrow_location = ${data[0].borrowLocation},
                        locate_seal = ${data[0].locateSeal},
                        borrow_date = ${data[0].borrowDate},
                        noted_unloading = ${data[0].noted}
                    `:`
                    starting_date = ${data[0].startingDate},
                    unload_complete_day = ${data[0].unloadCompleteDay},
                    reason_unload = ${data[0].reason},
                    note_unloading = ${data[0].note},
                    reason_borrow_cont = ${data[0].reasonBorrowCont},
                    product_category = ${data[0].productCategory},
                    borrow_location = ${data[0].borrowLocation},
                    locate_seal = ${data[0].locateSeal},
                    borrow_date = ${data[0].borrowDate},
                    noted_unloading = ${data[0].noted}`}
                    
                WHERE idSystem = @idBooking;
                `
                queries+=query;
            }
            if(type==='importer'){
                let query = `
                DECLARE @idCont varchar(1000)
                SET @idCont = (SELECT idSystem FROM cont WHERE idImporter = '${data[0].idSystem}');
                
                UPDATE importer SET
                ${data[0]["postion"]==='Supervisor'||data[0]["postion"]==='Assistan'||data[0]["isAdminLog"]==='Y'||data[0]["isShipmentLog"]==='Y'?`
                    request_unload_date = ${data[0].requestUnloadDate},
                    unload_date = ${data[0].unloadCompleteDay},
                    unload_location = ${data[0].unloadLocation},
                    saving_truck = ${data[0].savingTruckDate},
                    reason_unload = ${data[0].reason},
                    note_unloading = ${data[0].note},
                    reason_borrow_cont = ${data[0].reasonBorrowCont},
                    ata_pb = ${data[0].ataPb},
                    starting_date = ${data[0].startingDate},
                    product_category = ${data[0].productCategory},
                    borrow_location = ${data[0].borrowLocation},
                    locate_seal = ${data[0].locateSeal},
                    borrow_date = ${data[0].borrowDate},
                    noted_unloading = ${data[0].noted}
                `:`
                    starting_date = ${data[0].startingDate},
                    unload_date = ${data[0].unloadCompleteDay},
                    reason_unload = ${data[0].reason},
                    note_unloading = ${data[0].note},
                    reason_borrow_cont = ${data[0].reasonBorrowCont},
                    product_category = ${data[0].productCategory},
                    borrow_location = ${data[0].borrowLocation},
                    locate_seal = ${data[0].locateSeal},
                    borrow_date = ${data[0].borrowDate},
                    noted_unloading = ${data[0].noted}
                `}
                WHERE idSystem = '${data[0].idSystem}';

                UPDATE cont SET
                ${data[0]["postion"]==='Supervisor'||data[0]["postion"]==='Assistan'||data[0]["isAdminLog"]==='Y'||data[0]["isShipmentLog"]==='Y'?`
                    starting_date = ${data[0].startingDate},
                    request_unload_date = ${data[0].requestUnloadDate},
                    unload_complete_day = ${data[0].unloadCompleteDay},
                    unload_location = ${data[0].unloadLocation},
                    saving_truck = ${data[0].savingTruckDate},
                    reason_unload = ${data[0].reason},
                    note_unloading = ${data[0].note},
                    reason_borrow_cont = ${data[0].reasonBorrowCont},
                    ATA_phu_bai = ${data[0].ataPb},
                    
                    product_category = ${data[0].productCategory},
                    borrow_location = ${data[0].borrowLocation},
                    locate_seal = ${data[0].locateSeal},
                    borrow_date = ${data[0].borrowDate},
                    noted_unloading = ${data[0].noted}
                `:`
                    starting_date = ${data[0].startingDate},
                    unload_complete_day = ${data[0].unloadCompleteDay},
                    reason_unload = ${data[0].reason},
                    note_unloading = ${data[0].note},
                    reason_borrow_cont = ${data[0].reasonBorrowCont},
                    noted_unloading = ${data[0].noted},
                    product_category = ${data[0].productCategory},
                    borrow_location = ${data[0].borrowLocation},
                    locate_seal = ${data[0].locateSeal},
                    borrow_date = ${data[0].borrowDate}
                `}
                WHERE idSystem = @idCont;
                `
                queries+=query;
            }
    }
    console.log(queries);
    createTransansaction(queries, res);
})

//api dem so luong routing code
app.get("/api/count-row-routing-code", function(req,res){
    let search = req.query.search;
    let condition = `
        WHERE picked_at_port = '${search}' OR 
        vendor = '${search}' OR 
        loading_location = '${search}' OR 
        dropped_at_port = '${search}' OR 
        routing_code_1 = '${search}' OR
        routing_code_2 = '${search}'`;
    let query = `SELECT COUNT(idSystem) as max FROM routing_code ${search?condition:""};`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api create routing code
app.post("/api/create-routing-code", function(req,res){
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query("SELECT MAX(idSystem) as max FROM routing_code");
    })
    .then(result=>{
        function query(){
            let listData = req.body.new;
            let query = ""
            for(let i=0; i<listData.length; i++){
                query = `
                    INSERT INTO routing_code (
                        idSystem,
                        picked_at_port,
                        vendor,
                        loading_location,
                        dropped_at_port,
                        routing_code_1,
                        routing_code_2,
                        status
                    ) VALUES (
                        '${+result.recordset[0].max+1}',
                        ${listData[i]["pickedAtPort"]},
                        ${listData[i]["vendor"]},
                        ${listData[i]["loadingLocation"]},
                        ${listData[i]["droppedAtPort"]},
                        ${listData[i]["routingCode1"]},
                        ${listData[i]["routingCode2"]},
                        ${listData[i]["status"]}
                    )
                `
            }
            return query;
        }
        console.log(query());
        createTransansaction(query(), res);
    })
    .catch(e=>{
        console.log(e);
    })
    .finally(()=>{
        //close.close();
    })
})

//api update routing code
app.post("/api/update-routing-code", function(req,res){
    function query(){
        let listData = req.body.existed;
        let result = "";
        for(let i=0; i<listData.length; i++){
            let query = `
                UPDATE routing_code
                SET 
                picked_at_port = ${listData[i]["pickedAtPort"]},
                vendor = ${listData[i]["vendor"]},
                loading_location = ${listData[i]["loadingLocation"]},
                dropped_at_port = ${listData[i]["droppedAtPort"]},
                routing_code_1 = ${listData[i]["routingCode1"]},
                routing_code_2 = ${listData[i]["routingCode2"]},
                status = ${listData[i]["status"]}
                WHERE idSystem = '${listData[i]["idSystem"]}';
            `
            result+=query;
        }
        return result;
    }
    console.log(query())
    createTransansaction(query(), res)
    
})

//api create trucking cost
app.post("/api/create-trucking-cost", function(req,res){
    let listData = req.body.new;
    function createTruckingCost(){
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query("SELECT MAX(idSystem) as max FROM trucking_cost");
    })
    .then(result=>{
        function query(){
            let query = ""
            for(let i=0; i<listData.length; i++){
                query = `
                    INSERT INTO trucking_cost (
                        idSystem,
                        rank_oil,
                        oil_price_min,
                        oil_price_max,
                        routing_code,
                        cont_category,
                        trucking_cost
                    ) VALUES (
                        '${+result.recordset[0].max+1}',
                        ${listData[i]["rank"]},
                        ${listData[i]["minPrice"]},
                        ${listData[i]["maxPrice"]},
                        ${listData[i]["routingCode"]},
                        ${listData[i]["contCategory"]},
                        ${listData[i]["truckingCost"]}
                    )`
            }
            return query;
        }
        console.log(query());
        createTransansaction(query(), res);
    })
    .catch(e=>{
        console.log(e);
    })
    .finally(()=>{
        //close.close();
    })
    }
    createTruckingCost();

})

//api update trucking cost
app.post("/api/update-trucking-cost", function(req,res){
    function query(){
        let listData = req.body.existed;
        let result = "";
        for(let i=0; i<listData.length; i++){
            let query = `
                UPDATE trucking_cost
                SET 
                rank_oil = ${listData[i]["rank"]},
                oil_price_min = ${listData[i]["minPrice"]},
                oil_price_max = ${listData[i]["maxPrice"]},
                routing_code = ${listData[i]["routingCode"]},
                cont_category = ${listData[i]["contCategory"]},
                trucking_cost = ${listData[i]["truckingCost"]}
                WHERE idSystem = '${listData[i]["idSystem"]}';
            `
            result+=query;
        }
        return result;
    }
    console.log(query())
    createTransansaction(query(), res)
    
})

//api create row dem det
app.post("/api/create-demdet",function(req,res){
    let listData = req.body.new;
    
    function createTruckingCost(){
        let close;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query("SELECT MAX(idSystem) as max FROM dem_det_cost");
        })
        .then(result=>{
            function query(){
                let query = ""
                for(let i=0; i<listData.length; i++){
                    query = `
                        INSERT INTO dem_det_cost (
                            idSystem,
                            carrier,
                            free_det_day,
                            free_dem_day,
                            free_dem_det_combine_day,
                            period_min,
                            period_max,
                            charge_day_20,
                            charge_day_40,
                            type
                        ) VALUES (
                            '${+result.recordset[0].max+1}',
                            ${listData[i]["carrier"]},
                            ${listData[i]["freeDetDay"]},
                            ${listData[i]["freeDemDay"]},
                            ${listData[i]["freeDemDetCombine"]},
                            ${listData[i]["minPeriod"]},
                            ${listData[i]["maxPeriod"]},
                            ${listData[i]["chargeDay20"]},
                            ${listData[i]["chargeDay40"]},
                            '${listData[i]["type"]}'
                        )`
                }
                return query;
            }
            console.log(query());
            createTransansaction(query(), res);
        })
        .catch(e=>{
            console.log(e);
        })
        .finally(()=>{
            //close.close();
        })
    }
    createTruckingCost();
})

//api update row dem det
app.post("/api/update-demdet", function(req,res){
    function query(){
        let listData = req.body.existed;
        let result = "";
        for(let i=0; i<listData.length; i++){
            let query = `
                UPDATE dem_det_cost
                SET 
                carrier = ${listData[i]["carrier"]},
                free_dem_day = ${listData[i]["freeDemDay"]},
                free_det_day = ${listData[i]["freeDetDay"]},
                free_dem_det_combine_day = ${listData[i]["freeDemDetCombine"]},
                period_min = ${listData[i]["minPeriod"]},
                period_max = ${listData[i]["maxPeriod"]},
                charge_day_20 = ${listData[i]["chargeDay20"]},
                charge_day_40 = ${listData[i]["chargeDay40"]},
                type = '${listData[i]["type"]}'
                WHERE idSystem = '${listData[i]["idSystem"]}';
            `
            result+=query;
        }
        return result;
    }
    console.log(query())
    createTransansaction(query(), res)
    
})

//api delete row dem det
app.post("/api/delete-demdet", function(req,res){
    let id=  req.query.id;
    let query = `
    DELETE dem_det_cost
    WHERE idSystem = '${id}';`
    console.log(query)
    createTransansaction(query, res)
})

//api dem so luong trucking cost
app.get("/api/count-row-trucking-cost", function(req,res){
    let search = req.query.search;
    let condition = `
        WHERE routing_code = '${search}' OR
        index_price = '${search}' `;
    let query = `SELECT COUNT(idSystem) as max FROM trucking_cost ${search?condition:""};`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api trich xuat picked at port
app.get("/api/picked-at-port", function(req,res){
    let query = `SELECT DISTINCT picked_at_port as port FROM routing_code WHERE picked_at_port IS NOT NULL`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api trich xuat dropped at port
app.get("/api/dropped-at-port", function(req,res){
    let query = `SELECT DISTINCT dropped_at_port as port FROM routing_code WHERE dropped_at_port IS NOT NULL`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api trich xuat loading location
app.get("/api/loading-location", function(req,res){
    let query = `SELECT DISTINCT loading_location as port FROM routing_code WHERE loading_location IS NOT NULL`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close()
    })
})

//api trich xuat carrier
app.get("/api/carrier", function(req,res){
    let query = `SELECT DISTINCT carrier as port FROM dem_det_cost WHERE carrier IS NOT NULL`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api trich xuat vendor
app.get("/api/vendor", function(req,res){
    let query = `SELECT DISTINCT vendor as port FROM routing_code WHERE vendor IS NOT NULL`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api trich xuat product category
app.get("/api/product-category",function(req,res){
    let query = `SELECT DISTINCT name as port FROM product_cont`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api upload excel
app.post("/api/excel", function(req,res){
    let datas = req.body;
    let queries="";
    for(let i=0; i<datas.length; i++){
        if(datas[i]["bookingNumber"]){
            let query=
            `UPDATE cont SET
                ATA_vn_port = ${datas[i]["ataVnPort"]},
                ATA_phu_bai = ${datas[i]["ataPb"]},
                ATD_vendor = ${datas[i]["atdVendor"]},
                cont_number = ${datas[i]["contNumber"]},
                cont_category = ${datas[i]["contCategory"]},
                picked_at_port = ${datas[i]["pickedAtPort"]},
                picked_date = ${datas[i]["pickedDate"]},
                seal = ${datas[i]["seal"]},
                vendor = ${datas[i]["vendor"]}
            WHERE idSystem = '${datas[i]["idSystem"]}'; `;
            queries+=query;   
        }else{
            let query=
            `INSERT INTO cont(
                idSystem,
                cont_category,
                ATA_vn_port,
                ATA_phu_bai,
                ATD_vendor,
                carrier,
                cont_number,
                picked_at_port,
                picked_date,
                seal,
                vendor,
                no,
                booking_no,
                booking_no_update
            ) VALUES (
                'loadingPlan.${uuidv4()}${uuidv4()}${uuidv4()}${uuidv4()}',
                ${datas[i]["contCategory"]},
                ${datas[i]["ataVnPort"]},
                ${datas[i]["ataPb"]},
                ${datas[i]["atdVendor"]},
                ${datas[i]["carrier"]},
                ${datas[i]["contNumber"]},
                ${datas[i]["pickedAtPort"]},
                ${datas[i]["pickedDate"]},
                ${datas[i]["seal"]},
                ${datas[i]["vendor"]},
                ${i+1},
                ${i+1},
                ${i+1}
            )`;
            queries+=query;
        }
    }
    console.log(queries);
    createTransansaction(queries,res);

})

//api count booking number 4 tuan gan nhat
app.get("/api/count-booking-number", function(req,res){
    let queryCountBooking = 
    `DECLARE @maxYear int
    SET @maxYear = (SELECT MAX(export_saving_truck_year) FROM cont);
    SELECT booking_number, COUNT(booking_number) as count FROM cont
    WHERE
    export_saving_truck_year = (SELECT MAX(export_saving_truck_year) FROM cont)
    AND (
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))
    OR
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))-1
    OR
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))-2
    OR
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))-3
    ) AND cont_number IS NULL
    GROUP BY booking_number`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(queryCountBooking);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api tim booking number 4 tuan gan nhat
app.get("/api/booking-number-nearest", function(req,res){
    let query = `
    DECLARE @maxYear int
    SET @maxYear = (SELECT MAX(export_saving_truck_year) FROM cont);
    SELECT idSystem, booking_number FROM cont
    WHERE
    export_saving_truck_year = (SELECT MAX(export_saving_truck_year) FROM cont)
    AND (
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))
    OR
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))-1
    OR
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))-2
    OR
    estimated_loading_week = (SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year=(SELECT MAX(export_saving_truck_year) FROM cont))-3
    ) AND cont_number IS NULL
    ORDER BY no, booking_no`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        //close.close();
        res.status(400).json("FAIL");
        console.log(err);
    })
})

//api cap nhat cost
app.post("/api/cost", function(req,res){
    let data = req.body.existed;
    let type = data[0].idSystem.split(".")[0];
    let query = 
        `SELECT TOP 1 routing_code.routing_code_1 as routing1, routing_code.routing_code_2 as routing2 FROM 
        routing_code
        WHERE
        picked_at_port= ${data[0]["pickedAtPort"]}
        AND
        vendor ${data[0]["vendor"]?`=${data[0]["vendor"]}`:"IS NULL"}
        AND
        loading_location ${data[0]["loadingLocation"]?`=${data[0]["loadingLocation"]}`:"IS NULL"}
        AND 
        dropped_at_port ${data[0]["droppedAtPort"]?`=${data[0]["droppedAtPort"]}`:"IS NULL"}`;

    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        let listData = result.recordset;
        console.log("listData",listData)
        if(listData.length>0){
            let queryTrucking1 = 
            `SELECT TOP 1 trucking_cost.trucking_cost as trucking  FROM trucking_cost 
            WHERE routing_code = '${listData[0]["routing1"]}'
            AND cont_category = ${data[0]["contCategory"]}
            AND oil_price_min <= ${data[0]["oilPrice"]} AND oil_price_max >=${data[0]["oilPrice"]}`;

            console.log("queryTruck1", queryTrucking1)

            let queryTrucking2 = 
            `SELECT TOP 1 trucking_cost.trucking_cost as trucking FROM trucking_cost 
            WHERE routing_code = '${listData[0]["routing2"]}'
            AND cont_category = ${data[0]["contCategory"]}
            AND oil_price_min <= ${data[0]["oilPrice"]} AND oil_price_max >=${data[0]["oilPrice"]}`;

            console.log("queryTruck2", queryTrucking2)
            sql.connect(sqlConf)
            .then(pool=>{
                return pool.request().query(queryTrucking1);
            })
            .then(routing1=>{
                sql.connect(sqlConf)
                .then(pool=>{
                    return pool.request().query(queryTrucking2);
                })
                .then(routing2=>{
                    let rout1 = routing1.recordset;
                    let rout2 = routing2.recordset;
                    
                    let typeId;
                    if(type==='loadingPlan'){
                        typeId="cont";
                    }else if(type==='importer'){
                        typeId="importer";
                    }
                    let query;
                    if(rout2.length > 0){
                        query = `
                        UPDATE ${typeId} SET
                            trucking_cost = '${rout1[0]["trucking"] + rout2[0]["trucking"]}',
                            routing_code = '${result.recordset[0]["routing1"]} + ${result.recordset[0]["routing2"]}',
                            oil_price = ${data[0]["oilPrice"]}
                        WHERE idSystem = '${data[0].idSystem}'`;
                    }else{
                        query = `
                        UPDATE ${typeId} SET
                            trucking_cost = '${rout1[0]["trucking"]}',
                            routing_code = '${result.recordset[0]["routing1"]}',
                            oil_price = ${data[0]["oilPrice"]}
                        WHERE idSystem = '${data[0].idSystem}'`;
                    }
                    
                    console.log(query)
                    createTransansaction(query,res);
                    })
                .catch(err=>{
                    console.log(err)
                    res.status(400).json("Không tồn tại routing code. Hãy coi lại")
                })
            })
            .catch(err=>{
                res.status(400).json("Không tồn tại routing code. Hãy coi lại")
            })

        }else{
            res.status(400).json("Không tồn tại trucking cost. Hãy coi lại giá")
        }
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    
})

//api count manufacture
app.get("/api/count-row-manufacture", function(req,res){
    let search = req.query.search?`WHERE name = '${req.query.search}'`:"";
    let query = `SELECT count(idSystem) as max FROM manufacture ${search}`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then((result)=>{
        res.status(200).json(result.recordset)
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api count reason unloading
app.get("/api/count-row-reason-unloading", function(req,res){
    let search = req.query.search?`WHERE name = '${req.query.search}'`:"";
    let query = `SELECT count(idSystem) as max FROM reason_unloading ${search}`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then((result)=>{
        res.status(200).json(result.recordset)
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api count email receive
app.get("/api/count-row-receive", function(req,res){
    let search = req.query.search?`WHERE email = '${req.query.search}'`:"";
    let query = `SELECT count(idSystem) as max FROM email_receive ${search}`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then((result)=>{
        res.status(200).json(result.recordset)
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api count product-cont
app.get("/api/count-product-cont",function(req,res){
    let search = req.query.search?`WHERE name = '${req.query.search}'`:"";
    let query = `SELECT count(idSystem) as max FROM product_cont ${search}`;
    console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then((result)=>{
        res.status(200).json(result.recordset)
    })
    .catch((err)=>{
        res.status(400).json("FAIL");
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api create manufacture
app.post("/api/create-manufacture", function(req,res){
    let data = req.body.new;
    let queryMaxId = "SELECT MAX(idSystem) as max FROM manufacture";
    let checkExisted = `SELECT name FROM manufacture WHERE name = ${data[0]["manufacture"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("Manufacture này đã tồn tại");
            return;
        }else{
            addData();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })

    function addData(){
        let close1;
        sql.connect(sqlConf)
        .then(pool=>{
            close1 = pool;
            return pool.request().query(queryMaxId);
        })
        .then(result=>{
            let query = 
            `INSERT INTO manufacture(idSystem, name) VALUES (${+result.recordset[0]["max"]+1||1}, ${data[0]["manufacture"]})`;
            createTransansaction(query, res)
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close1.close();
        })
    }
})

//api create reason unloading
app.post("/api/create-unloading", function(req,res){
    let data = req.body.new;
    let queryMaxId = "SELECT MAX(idSystem) as max FROM reason_unloading";
    let checkExisted = `SELECT reason FROM reason_unloading WHERE reason = ${data[0]["reason"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("Reason này đã tồn tại");
            return;
        }else{
            addData();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })

    function addData(){
        let close1;
        sql.connect(sqlConf)
        .then(pool=>{
            close = pool;
            return pool.request().query(queryMaxId);
        })
        .then(result=>{
            let query = 
            `INSERT INTO reason_unloading(
                idSystem, 
                reason,
                unloading,
                loading
            ) 
            VALUES 
            (
                ${+result.recordset[0]["max"]+1||1}, 
                ${data[0]["reason"]},
                '${data[0]["unloading"]}',
                '${data[0]["loading"]}'
            )`;
            createTransansaction(query, res)
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close1.close();
        })
    }
})

//api create email receive
app.post("/api/create-email-reiceve", function(req,res){
    let data = req.body.new;
    let queryMaxId = "SELECT MAX(idSystem) as max FROM email_receive";
    let checkExisted = `SELECT email FROM email_receive WHERE email = ${data[0]["email"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("Email này đã tồn tại");
            return;
        }else{
            addData();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })

    function addData(){
        let close1;
        sql.connect(sqlConf)
        .then(pool=>{
            close1 = pool;
            return pool.request().query(queryMaxId);
        })
        .then(result=>{
            let query = 
            `INSERT INTO 
            email_receive(
                idSystem, 
                email,
                unloading,
                loading) 
            VALUES 
            (${+result.recordset[0]["max"]+1||1}, 
            ${data[0]["email"]},
            ${data[0]["unloading"]},
            ${data[0]["loading"]})`;
            console.log(query);
            createTransansaction(query, res)
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close1.close();
        })
    }
})

//api create product of cont
app.post("/api/create-product-cont",function(req,res){
    let data = req.body.new;
    let queryMaxId = "SELECT MAX(idSystem) as max FROM product_cont";
    let checkExisted = `SELECT name FROM product_cont WHERE name = ${data[0]["name"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("Sản phẩm này đã tồn tại");
            return;
        }else{
            addData();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })

    function addData(){
        let close1;
        sql.connect(sqlConf)
        .then(pool=>{
            close1 = pool;
            return pool.request().query(queryMaxId);
        })
        .then(result=>{
            let query = 
            `INSERT INTO 
            product_cont(
                idSystem, 
                name) 
            VALUES 
            (${+result.recordset[0]["max"]+1||1}, 
            ${data[0]["name"]})`;
            createTransansaction(query, res)
        })
        .catch(err=>{
            console.log(err);
        })
        .finally(()=>{
            //close1.close();
        })
    }
})

//api update manufacture
app.post("/api/update-manufacture", function(req,res){
    let data = req.body.existed;
    let close;
    let checkExisted = `SELECT name FROM manufacture WHERE name = ${data[0]["manufacture"]}`;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("Manufacture này đã tồn tại");
            return;
        }else{
            handle();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    function handle(){
        let query = 
        `UPDATE manufacture SET name = ${data[0]["manufacture"]} WHERE idSystem = ${data[0]["idSystem"]}`;
        createTransansaction(query, res)
    }
})

//api update reason unloading
app.post("/api/update-reason-unloading", function(req,res){
    try{
    let data = req.body.existed;
    console.log(data)
    let checkExisted = `SELECT reason FROM reason_unloading WHERE reason = ${data[0]["reason"]} AND idSystem != ${data[0]["idSystem"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("reason này đã tồn tại");
            return;
        }else{
            handle();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    function handle(){
        let query = 
        `UPDATE reason_unloading 
        SET 
        reason = ${data[0]["reason"]},
        unloading = '${data[0]["unloading"]}',
        loading = '${data[0]["loading"]}'
        WHERE idSystem = ${data[0]["idSystem"]}`;
        console.log(query)
        createTransansaction(query, res)
    }
    }catch(err){
        console.log(err)
    }
})

//api update reason unloading
app.post("/api/update-email-receive", function(req,res){
    try{
    let data = req.body.existed;
    let checkExisted = `SELECT email FROM email_receive WHERE email = ${data[0]["email"]} AND idSystem != ${data[0]["idSystem"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("email này đã tồn tại");
            return;
        }else{
            handle();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    function handle(){
        let query = 
        `UPDATE email_receive 
        SET 
        email = ${data[0]["email"]},
        unloading = '${data[0]["unloading"]}',
        loading = '${data[0]["loading"]}' 
        WHERE idSystem = ${data[0]["idSystem"]}`;
        console.log(query)
        createTransansaction(query, res)
    }
    }catch(err){
        console.log(err)
    }
})

app.post("/api/update-product-cont",function(req,res){
    try{
    let data = req.body.existed;
    let checkExisted = `SELECT name FROM product_cont WHERE name = ${data[0]["name"]} AND idSystem != ${data[0]["idSystem"]}`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(checkExisted);
    })
    .then(result=>{
        console.log(result)
        if(result.recordset.length > 0){
            res.status(400).json("Product này đã tồn tại");
            return;
        }else{
            handle();
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
    function handle(){
        let query = 
        `UPDATE product_cont
        SET 
        name = ${data[0]["name"]}
        WHERE idSystem = ${data[0]["idSystem"]}`;
        console.log(query)
        createTransansaction(query, res)
    }
    }catch(err){
        console.log(err)
    }
})

//api delete reason unloading
app.post("/api/delete-reason-unloading", function(req,res){
    let id=  req.query.id;
    let query = `
    DELETE reason_unloading WHERE idSystem = '${id}';`
    console.log(query)
    createTransansaction(query, res)
})

//api delete email
app.post("/api/delete-email-receive",function(req,res){
    let id=  req.query.id;
    let query = `
    DELETE email_receive WHERE idSystem = '${id}';`
    console.log(query)
    createTransansaction(query, res)
})

//api delete product cont
app.post("/api/delete-product-cont",function(req,res){
    let id=  req.query.id;
    let query = `
    DELETE product_cont WHERE idSystem = '${id}';`
    console.log(query)
    createTransansaction(query, res)
})

//api trich xuat manufacture
app.get("/api/manufacture", function(req,res){
    let query = `SELECT * FROM manufacture`;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api trich xuat reason unloading
app.get("/api/reason-unloading", function(req,res){
    let type = req.query.type;
    let query = `SELECT reason as port 
                 FROM reason_unloading 
                 ${type=="unloading"?"WHERE unloading = 'Y'":
                 type=="loading"?"WHERE loading = 'Y'":""}
                 `;
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
    .finally(()=>{
        //close.close();
    })
})

//api xuat bao cao
app.post("/api/export-report-general", function(req,res){
    try{
    let data = req.body.rangeTime;
    let type = req.body.type;
    let conditionRange = "";
    let conditionRange1 = "";
    let conditionImportATA = "";
    if(type=="CDFdate"){
        for(let i=0; i<data.length; i++){
            if(i==0){
                conditionRange += `cont.CDF_date LIKE '%${data[i]}%' `;
            }else{
                conditionRange += `OR cont.CDF_date LIKE '%${data[i]}%' `;
            }
        }
        for(let i=0; i<data.length; i++){
            if(i==0){
                conditionRange1 += `a.CDF_date LIKE '%${data[i]}%' `;
            }else{
                conditionRange1 += `OR a.CDF_date LIKE '%${data[i]}%' `;
            }
        }
    }else if(type=="ATAphubai"){
        conditionRange = `cont.ATA_phu_bai BETWEEN '${data.fromDate}' AND '${data.toDate}'`;
        conditionRange1 = `a.ATA_phu_bai BETWEEN '${data.fromDate}' AND '${data.toDate}'`;
        conditionImportATA = `a.ata_pb BETWEEN '${data.fromDate}' AND '${data.toDate}'`;
    }
    
    let resultArr=[];
    let query = 
    `SELECT cont.*, routing_code_1, routing_code_2, statuss FROM (SELECT a.* FROM (SELECT 
        cont.idSystem,
        cont.cont_number,
        cont.picked_at_port,
        cont.vendor,
        cont.loading_location,
        cont.dropping_at_port,
        cont.oil_price,
        routing_code.routing_code_1,
        routing_code.routing_code_2,
        cont.cont_category,
        routing_code.status as statuss
        FROM cont
        LEFT JOIN 
        routing_code
        ON 
        cont.picked_at_port = routing_code.picked_at_port
        AND
        cont.vendor = routing_code.vendor
        AND
        cont.loading_location = routing_code.loading_location
        AND
        cont.dropping_at_port = routing_code.dropped_at_port) as a
      
        WHERE a.routing_code_2 IS NULL
        
        UNION
        
        SELECT b.* FROM (SELECT a.* FROM (SELECT 
        cont.idSystem,
        cont.cont_number,
        cont.picked_at_port,
        cont.vendor,
        cont.loading_location,
        cont.dropping_at_port,
        cont.oil_price,
        routing_code.routing_code_1,
        routing_code.routing_code_2,
        cont.cont_category,
        routing_code.status as statuss
        FROM cont
        LEFT JOIN 
        routing_code
        ON 
        cont.picked_at_port = routing_code.picked_at_port
        AND
        cont.vendor = routing_code.vendor
        AND
        cont.loading_location = routing_code.loading_location
        AND
        cont.dropping_at_port = routing_code.dropped_at_port) as a
        ) as b) as d
        JOIN
        cont
        ON
        cont.idSystem = d.idSystem
        ${conditionRange?`WHERE ${conditionRange}`:""}`;
        console.log(query);
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close = pool;
        return pool.request().query(query);
    })
    .then(result1=>{
        let queryDropAndLoadNull = 
        `SELECT a.* FROM (SELECT 
            cont.*,
            routing_code.routing_code_1,
            routing_code.routing_code_2,
            routing_code.status as statuss
            FROM cont
            JOIN 
            routing_code
            ON 
            cont.picked_at_port = routing_code.picked_at_port
            AND
            cont.vendor = routing_code.vendor
            AND
            cont.loading_location IS NULL
            AND
            routing_code.dropped_at_port IS NULL) as a    
        ${conditionRange1?`WHERE ${conditionRange1}`:""}`;
        let close1;
        sql.connect(sqlConf)
        .then(pool1=>{
            close1 = pool1;
            return pool1.request().query(queryDropAndLoadNull);
        })
        .then((result2)=>{
            let arrResult2 = result2.recordset[0]?[result2.recordset[0]]:[];
            for(let j=0; j<result2.recordset.length; j++){
                for(let i=0; i<arrResult2.length; i++){
                    if(result2.recordset[j]["idSystem"] && arrResult2[i]["idSystem"] && arrResult2[i]["idSystem"]==result2.recordset[j]["idSystem"]){
                        break;
                    }else if(i==arrResult2.length-1){
                        arrResult2.push(result2.recordset[j]);
                    }
                }
            }
            let contImporterReused = 
            `SELECT a.*  FROM (
            SELECT cont.*, routing_code_1, routing_code_2, routing_code.status as statuss FROM cont JOIN routing_code
            ON
            cont.picked_at_port = routing_code.picked_at_port
            AND
            routing_code.vendor = 'NHAP KHAU'
            AND
            cont.loading_location = routing_code.loading_location
            AND
            cont.dropping_at_port = routing_code.dropped_at_port) as a
            ${conditionRange1?`WHERE ${conditionRange1}`:""}`;
            let close2;
            sql.connect(sqlConf)
            .then(pool2=>{
                close2 = pool2;
                return pool2.request().query(contImporterReused);
            })
            .then((result3)=>{
                let contImporterOneWay = 
                `SELECT a.* FROM (
                SELECT importer.*, routing_code_1, routing_code_2, routing_code.status as statuss FROM importer LEFT JOIN routing_code
                ON
                importer.picked_at_port = routing_code.picked_at_port
                AND
                routing_code.vendor = 'NHAP KHAU'
                AND
                routing_code.loading_location IS NULL
                AND
                importer.dropping_at_port IS NULL
                AND
                routing_code.dropped_at_port IS NULL) as a
                ${conditionImportATA?`WHERE ${conditionImportATA}`:""}`;
                let close3;
                sql.connect(sqlConf)
                .then(pool3=>{
                    close3 = pool3;
                    return pool3.request().query(contImporterOneWay);
                })
                .then(result4=>{
                    let arrResult4 = [];
                    if(conditionImportATA){
                        arrResult4 = result4.recordset[0]?[result4.recordset[0]]:[];
                        for(let j=0; j<result4.recordset.length; j++){
                            for(let i=0; i<arrResult4.length; i++){
                                if(result4.recordset[j]["idSystem"] && arrResult4[i]["idSystem"] && arrResult4[i]["idSystem"]==result4.recordset[j]["idSystem"]){
                                    break;
                                }else if(i==arrResult4.length-1){
                                    arrResult4.push(result4.recordset[j]);
                                }
                            }
                        }
                    }
                    
                    //result finish
                    let arrFinish = result1.recordset.concat(arrResult2).concat(result3.recordset).concat(arrResult4);
                    res.status(200).json(arrFinish);
                })
                .catch((err)=>{
                    console.log(err)
                })
                .finally(()=>{
                    // close3.close();
                })
            })
            .catch((error)=>{
                console.log(error)
            })
            .finally(()=>{
                // close2.close();
            })
        })
        .catch((err)=>{
            console.log(err)
        })
        .finally(()=>{
            // //close1.close();
        })
        // console.log(result)
        // res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
    .finally(()=>{
        // //close.close();
    })
    }catch(err){
        console.log(err)
    }
})

//api lay bao cao xuat
app.post("/api/export-report-export", function(req,res){
    let data = req.body.rangeTime;
    let type = req.body.type;
    let conditionRange = "";
    if(type=="CDFdate"){
        for(let i=0; i<data.length; i++){
            if(i==0){
                conditionRange += `cont.CDF_date LIKE '%${data[i]}%' `;
            }else{
                conditionRange += `OR cont.CDF_date LIKE '%${data[i]}%' `;
            }
        }
    }else if(type=="droppingDate"){
        conditionRange = `cont.dropping_date BETWEEN '${data.fromDate}' AND '${data.toDate}'`;
    }
    let query = `
    SELECT
    cont.HQ, 
    cont.CDF_date, 
    cont.cont_number,
    cont.MNF_number, 
    cont.SO,
    cont.cbm,
    cont.carrier,
    cont.original_etd,
    cont.cont_category,
    cont.oil_price,
    rank_oil,
    CONCAT(routing_code_1,' ','+',' ',routing_code_2) as routing_code, 
    trucking_cost_total, 
    statuss 
    FROM (SELECT a.*, trucking_cost.trucking_cost, trucking_cost.trucking_cost as trucking_cost_total, trucking_cost.rank_oil FROM (SELECT 
        cont.idSystem,
        cont.cont_number,
        cont.picked_at_port,
        cont.vendor,
        cont.loading_location,
        cont.dropping_at_port,
        cont.oil_price,
        routing_code.routing_code_1,
        routing_code.routing_code_2,
        cont.cont_category,
        routing_code.status as statuss
        FROM cont
        LEFT JOIN 
        routing_code
        ON 
        cont.picked_at_port = routing_code.picked_at_port
        AND
        cont.vendor = routing_code.vendor
        AND
        cont.loading_location = routing_code.loading_location
        AND
        cont.dropping_at_port = routing_code.dropped_at_port) as a
        LEFT JOIN
        trucking_cost
        ON
        a.routing_code_1 = trucking_cost.routing_code
        AND
        a.oil_price >= trucking_cost.oil_price_min
        AND
        a.oil_price <= trucking_cost.oil_price_max
        AND 
        a.cont_category = trucking_cost.cont_category
        WHERE a.routing_code_2 IS NULL
        
        UNION
        
        SELECT b.*, b.trucking_cost+trucking_cost.trucking_cost as trucking_cost_total, trucking_cost.rank_oil FROM (SELECT a.*, trucking_cost.trucking_cost FROM (SELECT 
        cont.idSystem,
        cont.cont_number,
        cont.picked_at_port,
        cont.vendor,
        cont.loading_location,
        cont.dropping_at_port,
        cont.oil_price,
        routing_code.routing_code_1,
        routing_code.routing_code_2,
        cont.cont_category,
        routing_code.status as statuss
        FROM cont
        LEFT JOIN 
        routing_code
        ON 
        cont.picked_at_port = routing_code.picked_at_port
        AND
        cont.vendor = routing_code.vendor
        AND
        cont.loading_location = routing_code.loading_location
        AND
        cont.dropping_at_port = routing_code.dropped_at_port) as a
        LEFT JOIN
        trucking_cost
        ON
        a.routing_code_1 = trucking_cost.routing_code
        AND
        a.oil_price >= trucking_cost.oil_price_min
        AND
        a.oil_price <= trucking_cost.oil_price_max
        AND 
        a.cont_category = trucking_cost.cont_category) as b
        JOIN
        trucking_cost
        ON
        b.routing_code_2 = trucking_cost.routing_code
        AND
        b.oil_price >= trucking_cost.oil_price_min
        AND
        b.oil_price <= trucking_cost.oil_price_max
        AND 
        b.cont_category = trucking_cost.cont_category) as d
        
        JOIN
        cont
        
        ON
        cont.idSystem = d.idSystem
    ${conditionRange?`WHERE ${conditionRange}`:""}`;
    console.log(query);
    sql.connect(query)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        res.status(400).json("dasdasdasdas");
        console.log(err);
    })
})

//api lay bao cao nhap
app.post("/api/export-report-import",function(req,res){
    let type = req.body.type;
    let rangeTime = req.body.rangeTime;
    let ataPb = req.body.rangeTimePB;
    let conditionRangeCDF = "";
    let conditionRangeATA = "";
    if(type=="CDFdate"){
        for(let i=0; i<rangeTime.length; i++){
            if(i==0){
                conditionRangeCDF += `cont.CDF_date LIKE '%${rangeTime[i]}%' `;
            }else{
                conditionRangeCDF += `OR cont.CDF_date LIKE '%${rangeTime[i]}%' `;
            }
        }
    }else if(type=="droppingDate"){
        conditionRangeCDF += `cont.dropping_date BETWEEN '${rangeTime["fromDate"]}' AND '${rangeTime["toDate"]}'`;
    }
    conditionRangeATA = `BETWEEN '${ataPb["fromDate"]}' AND '${ataPb["toDate"]}'`;
    let query1 = 
    `SELECT 
    a.cont_number,
    a.vendor,
    a.ata_pb as ATA_phu_bai,
    a.unload_date as unload_complete_day,
    a.oil_price,
    a.routing_code_1 as routing_code,
    a.cont_category,
    trucking_cost.trucking_cost as trucking_cost_total, 
    trucking_cost.rank_oil,
    a.statuss,
    a.direct_carrier as carrier,
    a.idSystem
    FROM trucking_cost
    RIGHT JOIN (
    SELECT importer.*, routing_code_1, routing_code_2, routing_code.status as statuss FROM importer JOIN routing_code
    ON
    importer.picked_at_port = routing_code.picked_at_port
    AND
    routing_code.vendor = 'NHAP KHAU'
    AND
    routing_code.loading_location IS NULL
    AND
    importer.dropping_at_port IS NULL
    AND
    routing_code.dropped_at_port IS NULL) as a
    ON a.routing_code_1 = trucking_cost.routing_code
    AND
    a.oil_price >= trucking_cost.oil_price_min
    AND
    a.oil_price <= trucking_cost.oil_price_max
    ${conditionRangeCDF && conditionRangeATA?`WHERE a.ata_pb ${conditionRangeATA}`:""}`;
    console.log(query1);
    let query2 = `
    SELECT
    cont.cont_number, 
    cont.vendor, 
    cont.ATA_phu_bai as ATA_phu_bai,
    cont.unload_complete_day, 
    cont.oil_price,
    rank_oil,
    CONCAT(routing_code_1,' ','+',' ',routing_code_2) as routing_code, 
    cont.cont_category,
    trucking_cost_total, 
    cont.carrier,
    statuss,
    cont.idSystem
    FROM (SELECT a.*, trucking_cost.trucking_cost, trucking_cost.trucking_cost as trucking_cost_total, trucking_cost.rank_oil FROM (SELECT 
        cont.idSystem,
        cont.cont_number,
        cont.picked_at_port,
        cont.vendor,
        cont.loading_location,
        cont.dropping_at_port,
        cont.oil_price,
        routing_code.routing_code_1,
        routing_code.routing_code_2,
        cont.cont_category,
        routing_code.status as statuss
        FROM cont
        LEFT JOIN 
        routing_code
        ON 
        cont.picked_at_port = routing_code.picked_at_port
        AND
        cont.vendor = routing_code.vendor
        AND
        cont.loading_location = routing_code.loading_location
        AND
        cont.dropping_at_port = routing_code.dropped_at_port) as a
        LEFT JOIN
        trucking_cost
        ON
        a.routing_code_1 = trucking_cost.routing_code
        AND
        a.oil_price >= trucking_cost.oil_price_min
        AND
        a.oil_price <= trucking_cost.oil_price_max
        AND 
        a.cont_category = trucking_cost.cont_category
        WHERE a.routing_code_2 IS NULL
        
        UNION
        
        SELECT b.*, b.trucking_cost+trucking_cost.trucking_cost as trucking_cost_total, trucking_cost.rank_oil FROM (SELECT a.*, trucking_cost.trucking_cost FROM (SELECT 
        cont.idSystem,
        cont.cont_number,
        cont.picked_at_port,
        cont.vendor,
        cont.loading_location,
        cont.dropping_at_port,
        cont.oil_price,
        routing_code.routing_code_1,
        routing_code.routing_code_2,
        cont.cont_category,
        routing_code.status as statuss
        FROM cont
        LEFT JOIN 
        routing_code
        ON 
        cont.picked_at_port = routing_code.picked_at_port
        AND
        cont.vendor = routing_code.vendor
        AND
        cont.loading_location = routing_code.loading_location
        AND
        cont.dropping_at_port = routing_code.dropped_at_port) as a
        LEFT JOIN
        trucking_cost
        ON
        a.routing_code_1 = trucking_cost.routing_code
        AND
        a.oil_price >= trucking_cost.oil_price_min
        AND
        a.oil_price <= trucking_cost.oil_price_max
        AND 
        a.cont_category = trucking_cost.cont_category) as b
        JOIN
        trucking_cost
        ON
        b.routing_code_2 = trucking_cost.routing_code
        AND
        b.oil_price >= trucking_cost.oil_price_min
        AND
        b.oil_price <= trucking_cost.oil_price_max
        AND 
        b.cont_category = trucking_cost.cont_category) as d
        
        JOIN
        cont
        
        ON
        cont.idSystem = d.idSystem
        ${conditionRangeCDF && conditionRangeATA?`WHERE statuss = 'REUSED' AND (${conditionRangeCDF})`:""}`;
        console.log(query2);
    let query3 = `
    SELECT idImporter FROM cont WHERE idImporter IS NOT NULL;`
    let query4 = `
    SELECT 
    a.cont_number,
    a.vendor,
    a.ATA_phu_bai,
    a.unload_complete_day,
    a.oil_price,
    trucking_cost.rank_oil,
    a.routing_code_1 as routing_code,
    a.cont_category,
    trucking_cost.trucking_cost as trucking_cost_total, 
    a.carrier,
    a.statuss,
    a.idSystem 
    FROM (SELECT 
    cont.*,
    routing_code.routing_code_1,
    routing_code.routing_code_2,
    routing_code.status as statuss
    FROM cont
    LEFT JOIN 
    routing_code
    ON 
    cont.picked_at_port = routing_code.picked_at_port
    AND
    cont.vendor = routing_code.vendor
    AND
    cont.loading_location IS NULL
    AND
    routing_code.dropped_at_port IS NULL) as a
    JOIN
    trucking_cost
    ON
    a.routing_code_1 = trucking_cost.routing_code
    AND
    a.oil_price >= trucking_cost.oil_price_min
    AND
    a.oil_price <= trucking_cost.oil_price_max
    ${conditionRangeCDF && conditionRangeATA?`WHERE statuss = 'ONEWAY' AND ATA_phu_bai ${conditionRangeATA}`:""}`;
    console.log(query4);
    let arrImport = [];
    let arrCont = [];
    let arrCheckResued = [];
    let arrContOneWay = [];
    sql.connect(sqlConf)
    .then((pool1)=>{
        return pool1.request().query(query1)
    })
    .then(result1=>{
        try{
        arrImport = result1.recordset;
        sql.connect(sqlConf)
        .then(pool=>{
            return pool.request().query(query3);
        })
        .then(result3=>{
            arrCheckResued = result3.recordset;
            sql.connect(sqlConf)
            .then(pool2=>{
                return pool2.request().query(query2);
            })
            .then(result2=>{
                try{
                arrCont = result2.recordset;
                sql.connect(sqlConf)
                .then(pool4=>{
                    return pool4.request().query(query4);
                })
                .then(result4=>{
                    arrContOneWay = result4.recordset;
                    res.status(200).json({arrCont:arrCont,arrCheckResued:arrCheckResued, arrImport:arrImport, arrContOneWay});
                })
                }catch(err){
                    console.log(err)
                    res.status(400).json("FAIL");
                }
            })
            .catch((err2)=>{
                console.log(err2);
                res.status(400).json("FAIL");
            })
        })
        .catch((err)=>{
            console.log(err);
            res.status(400).json("FAIL");
        })
        }catch(err){
            console.log(err);
            res.status(400).json("FAIL");
        }
    })
    .catch((err1)=>{
        console.log(err1);
        res.status(400).json("FAIL");
    })
})

//api lay bao cao saving truck
app.post("/api/export-report-saving",function(req,res){
    let rangeTime = req.body.rangeTime;
    let type = req.body.type;

    let conditionRangeCDF = "";
    if(type=="CDFdate"){
        for(let i=0; i<rangeTime.length; i++){
            if(i==0){
                conditionRangeCDF += `cont.CDF_date LIKE '%${rangeTime[i]}%' `;
            }else{
                conditionRangeCDF += `OR cont.CDF_date LIKE '%${rangeTime[i]}%' `;
            }
        }
    }else if(type=="droppingDate"){
        conditionRangeCDF += `cont.dropping_date BETWEEN '${rangeTime["fromDate"]}' AND '${rangeTime["toDate"]}'`;
    }
    let query1 = 
    `SELECT
    idSystem,
    cont_number,
    vendor,
    ATA_phu_bai,
    starting_date,
    unload_complete_day,
    CDF_date,

    saving_truck,
    oil_price as import_cost,
    reason_unload,

    export_saving_truck_day,
    no as export_cost,
    reason_export_saving_truck

    FROM cont
    WHERE
    cont_number IS NOT NULL
    ${conditionRangeCDF?`AND (${conditionRangeCDF})`:""}`;
    console.log(query1);
    
    let query2 = 
    `SELECT
    idSystem,
    cont_number,
    vendor,
    ata_pb as ATA_phu_bai,
    starting_date,
    unload_date as unload_complete_day,
    saving_truck,
    reason_unload
    FROM importer
    WHERE
    cont_number IS NOT NULL
    ${conditionRangeCDF && type=="droppingDate"?`AND return_at_port_day BETWEEN '${rangeTime["fromDate"]}' AND '${rangeTime["toDate"]}'`:""}`;
    console.log(query2);

    sql.connect(sqlConf)
    .then((pool1)=>{
        return pool1.request().query(query1)
    })
    .then(result=>{
        if(type=="droppingDate"){
            sql.connect(sqlConf)
            .then((pool2)=>{
                return pool2.request().query(query2)
            })
            .then((result2)=>{
                try{
                    let arrResult = result.recordset.concat(result2.recordset);
                    res.status(200).json(arrResult);
                }catch(err){
                    console.log(err);
                }
            })
            .catch((err2)=>{
                console.log(err2);
            })
        }else{
            try{
                let arrResult = result.recordset;
                res.status(200).json(arrResult);
            }catch(err){
                console.log(err);
            }
        }
        
    })
    .catch((err1)=>{
        console.log(err1);
        res.status(400).json("FAIL");
    })
})

//api check so cont va etd cua unloading
app.get("/api/check-cont-number-and-etd", function(req,res){
    let query = `
    SELECT cont_number, vendor, ATA_phu_bai
    FROM cont 
    WHERE 
    request_unload_date IS NULL 
    AND cont_number IS NOT NULL 
    AND vendor IS NOT NULL
    AND ATA_phu_bai IS NOT NULL
    UNION ALL
    SELECT cont_number, vendor, ata_pb
    FROM importer
    WHERE
    request_unload_date IS NULL 
    AND cont_number IS NOT NULL 
    AND vendor IS NOT NULL
    AND ata_pb IS NOT NULL;`
    sql.connect(sqlConf)
    .then((pool)=>{
        return pool.request().query(query);
    })
    .then((result)=>{
        res.status(200).json(result.recordset);
    })
    .catch((err)=>{
        console.log(err);
    })
})

//api update request unload excel
app.post("/api/upload-excel-unload", function(req,res){
    try{
    let data = req.body;
    let queries = "";
    for(let i=0; i<data.length; i++){
        query = `
            UPDATE cont SET
            request_unload_date = ${data[i]["requestUnload"]},
            reason_unload = ${data[i]["reason"]},
            unload_location = ${data[i]["unloadLocation"]}
            WHERE
            vendor = ${data[i]["supplier"]}
            AND
            cont_number = ${data[i]["contNumber"]}
            AND
            request_unload_date IS NULL; 

            UPDATE importer SET
            request_unload_date = ${data[i]["requestUnload"]},
            reason_unload = ${data[i]["reason"]},
            unload_location = ${data[i]["unloadLocation"]}
            WHERE
            vendor = 'NHAP KHAU (${data[i]["supplier"].split("'")[1]})'
            AND
            cont_number = ${data[i]["contNumber"]}
            AND
            request_unload_date IS NULL;`
        queries+=query;
    }
    console.log(queries);
    createTransansaction(queries,res);
    }catch(err){
        console.log(err);
    }
})

//api get stt cont export
app.get("/api/get-cont-follow-stt", function(req,res){
    let year = req.query.year||`${new Date().getFullYear()}`;
    
    let week = req.query.week||`(SELECT MAX(estimated_loading_week) FROM cont WHERE export_saving_truck_year = ${year})`;
    
    let query = `SELECT 
                cont_number
                FROM cont
                WHERE export_saving_truck_year = ${year} 
                AND estimated_loading_week = ${week} 
                AND isHide IS NULL
                AND booking_number IS NOT NULL
                AND cont_number IS NOT NULL
                ORDER BY new_etd, original_etd,no, booking_no_update, booking_no ASC`;
    console.log(query)
    let close;
    sql.connect(sqlConf)
    .then(pool=>{
        close=pool;
        return pool.request().query(query);
    })
    .catch(e=>{
        console.log(e);
        res.render("error/404");
    })
    .then(result=>{
        try{
        res.status(200).json(result.recordset);
        return result;
        }catch(err){
            console.log(err)
        }
    })
    .finally(()=>{
        //close.close();
    })
})

//api lay toan bo so mnf trong database
app.get("/api/get-all-mnf",function(req,res){
    let query = `
        SELECT idSystem, MNF_number as mnfNumber FROM cont
    `
    sql.connect(sqlConf)
    .then(pool=>{
        return pool.request().query(query);
    })
    .then(result=>{
        res.status(200).json(result.recordset);
    })
    .catch(err=>{
        console.log(err);
    })
})


// =======================================================API===============================================
//================================================UTILS=====================================================


//tao transaction
async function createTransansaction(query, res){
    // tao transaction de toan ven du lieu
    let dbConn  = await sql.connect(sqlConf);
     dbConn.connect();
     try {
         let transaction = new sql.Transaction(dbConn);
 
         await transaction.begin();
 
         const request = new sql.Request(transaction);

         const results = await Promise.all([
            request.query(query)
         ]);
         
         await transaction.commit();

         res.status(200).json("SUCCESS");
         
         return results;
     } catch (err) {
        try{
            console.log("dsdsds")
            res.status(400).json("FAIL");
            console.log(err)
            await transaction.rollback();
            throw err;
        }catch(er){
            console.log(er)
        }
     } finally {
         await dbConn.close();
     }
}

//validate du lieu dau vao
function validateTime(time){
    if(!time) return true;
    if(time.match("^[0-9]*$")){
        return true
    }else{
        return false
    }
}


//convert indochinetime ve isotime
function convertDateTime(time){
    if(time){
        let month = new Date(time).toLocaleDateString().split("/")[0];
        let date = new Date(time).toLocaleDateString().split("/")[1];
        let year = new Date(time).toLocaleDateString().split("/")[2];

        let day = `${year}-${month}-${date}`;
        let hour = new Date(time).toLocaleTimeString();

        return (day+ " " +hour);
    }
}
//convert date time
function convertISODate(param){
    if(param && param!=='null'){
        let time = new Date(param).toISOString();
        return `'${time.split("T")[0]} ${time.split("T")[1].split(".")[0]}'`;
    }else{
        return null
    }
} 

//================================================UTILS=====================================================
//=====================================PHAN QUYEN=======================================
async function authorization(user, role){
    
    return new Promise(function (resolve,reject) {
        mysqlConfig.getConnection(async function(err, connection){
            if (err) {
                throw err;
            }
            connection.query("SELECT User, Name, Department, Position, AdminLog, ImportLog, ExportLog, ShipmentLog, UnloadingLog FROM setup_user where User='"+user+"';", async function (err, result, fields) {
                 connection.release();
                if (err) throw err;
                if (result.length>0){
                    if(result[0]["AdminLog"]=="Y"||result[0][role]==='Y') {
                        resolve(result[0]);
                    }else{
                        reject(false);
                    }
                }else{
                     reject(false);
                }
            });
        });
    })
}

app.disable('view cache');