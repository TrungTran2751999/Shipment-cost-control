const host = "http://localhost:3001";
let countBtnPagination = 4;
let countRowPerPage = 16;
let countListBtnImporter = 3;
function formatDate(day){
    if(day){
        let date = day.split(" ")[0].split("/").reverse().join("-");
        let time = day.split(" ")[1]?day.split(" ")[1]:"00:00:00";
        return date+" "+time;
    }
}
function convertNull(value){
    if(value){
        return `'${value}'`;
    }else{
        return null
    }
}
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    // Bỏ các khoảng trắng liền nhau
    str = str.replace(/ + /g," ");
    str = str.trim();
    // Remove punctuations
    // Bỏ dấu câu, kí tự đặc biệt
    return str;
}

function excelFileToJSON(file){
    let finalResult;
    try {
      var reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = function(e) {

          var data = e.target.result;
          var workbook = XLSX.read(data, {
              type : 'binary'
          });
          var result = {};
          workbook.SheetNames.forEach(function(sheetName) {
          var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
          if (roa.length > 0) {
              result[sheetName] = roa;
          }
        });
        finalResult = result;
      }
    }catch(e){
        console.error(e);
    }
      return finalResult;
}

// Matching the date through regular expression
function validateDateTime(date){
    if(!date){
        return true
    }else{
        let dateformat = /^\d{4}[\-](0?[1-9]|1[0-2])[\-](0?[1-9]|[1-2][0-9]|3[01]) (([1-9]|0[1-9]|1[0-9]|2[1-3]):00||00:00:00)$/;
        let arr = date?.split("'")
        date = arr[1] || date;
        console.log(date)
        if (date.match(dateformat)) {
            let operator = date.split(' ');
    
            // Extract the string into month, date and year      
            let datepart = [];
            if (operator.length > 1) {
                datepart = operator[0].split('-');
            }
            let month = parseInt(datepart[1]);
            let day = parseInt(datepart[2]);
            let year = parseInt(datepart[0]);
    
            // Create a list of days of a month      
            let ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (month == 1 || month > 2) {
                if (day > ListofDays[month - 1]) {
                    console.log("false1")
                    //to check if the date is out of range     
                    return false;
                }
            } else if (month == 2) {
                let leapYear = false;
                if ((!(year % 4) && year % 100) || !(year % 400)) leapYear = true;
                if ((leapYear == false) && (day >= 29)) return false;
                else
                    if ((leapYear == true) && (day > 29)) {
                        console.log('false2');
                        return false;
                    }
            }
            return true
        } else {
            console.log("Invalid date format!");
            return false;
        }
    }
}      

let textarea = $("#table-info textarea");
for(let i=0; i<textarea.length; i++){
    $(textarea[i]).css("height", "22px")
}
let thead = $("#table-info thead tr th");
for(let i=0; i<thead.length; i++){
    $(thead[i]).css("background-color", "green")
}

let tableCreate = $("#table-create input");
let tableUpdate = $("#table-update input");
for(let i=0; i<tableCreate.length; i++){
    $(tableCreate[i]).attr("placeholder","");
}
for(let i=0; i<tableUpdate.length; i++){
    $(tableUpdate[i]).attr("placeholder","");
}
let inputColor = $("input[type='color']");
for(let i=0; i<inputColor.length; i++){
    $(inputColor[i]).val("#ffffff");
}

function rgbToHex(param) {
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
      }
    let rgb = param.split("(")[1].split(")")[0];
    let r = rgb.split(",")[0].trim();
    let g = rgb.split(",")[1].trim();
    let b = rgb.split(",")[2].trim();

    return "#" + componentToHex(+r) + componentToHex(+g) + componentToHex(+b);
}
let input = $("#table-update input");
for(let i=0; i<input.length; i++){
    if(!$(input[i]).attr("disabled")){
        $(input[i]).css("border-color","red")
    }
}
let droplist = $("#table-update select");
for(let i=0; i<droplist.length; i++){
    if(!$(droplist[i]).attr("disabled")){
        $(droplist[i]).css("border","2px solid red")
    }
}
Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function getDates(startDate, stopDate) {
   var dateArray = new Array();
   var currentDate = startDate;
   while (currentDate <= stopDate) {
     let currentDay = formatDate(new Date(currentDate).toLocaleDateString()).split(" ")[0];
     let day = +currentDay.split("-")[2]<10?`0${currentDay.split("-")[2]}`:currentDay.split("-")[2];
     let month = +currentDay.split("-")[1]<10?`0${currentDay.split("-")[1]}`:currentDay.split("-")[1];
     let year = currentDay.split("-")[0];
     dateArray.push(year+"-"+month+"-"+day);
     currentDate = currentDate.addDays(1);
   }
   return dateArray;
 }
function getDate(startDate,stopDate){
    let dateArray = getDates(new Date(startDate), new Date(stopDate));
    // for (i = 0; i < dateArray.length; i ++ ) {
    //     console.log(formatDate(new Date(dateArray[i])));
    // }
    return dateArray;
}
// xuat file Excel
function exportWorksheet(jsonObject, type) {
    var myFile = `${type}-report.xlsx`;
    var myWorkSheet = XLSX.utils.json_to_sheet(jsonObject);
    var myWorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(myWorkBook, myWorkSheet, "myWorkSheet");
    XLSX.writeFile(myWorkBook, myFile);
}

//covert ISO time
function convertISOTime(param, type){
    let result;
    let date = param.split("T")[0].split("-").join("-");
    let hour = param.split("T")[1].split(".")[0];
    if(param){
        if(type=="date"){
            result = `${date}`; 
        }else{
            result = `${date} ${hour}`;
        }
    }
    return result;
}
function ISOToFormatTime(param){
    if(param){
        let date = param.split(" ")[0].split("-").reverse().join("/");
        let time = param.split(" ")[1];
        return `${date} ${time}`;
    }
    return param;
}
//convert ETD unload nhap excel
function convertETD(param){
    let result;
    if(param){
        let date = param.split(" ")[1].split("/").reverse().join("-").replaceAll("'","");
        let hour = param.split(" ")[0].split("h")[0].replaceAll("'","");
        result = `${date} ${hour}:00`;
    }
    return result;
}

