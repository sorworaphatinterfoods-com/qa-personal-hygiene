/**
 * GHP Personal Hygiene Inspection — Google Apps Script backend
 * เอกสารอ้างอิง: QP-QA-10  |  มาตรฐาน: GHP / GMP
 *
 *   GET  (ไม่ส่ง action)              → รายชื่อพนักงาน (เหมือนของเดิม)
 *   GET  ?action=dates                → วันที่ที่มีการตรวจ (unique, ใหม่→เก่า)
 *   GET  ?action=records&date=YYYY-MM-DD → ผลตรวจของวันนั้น (รายคน)
 * ทุก response จะมีฟิลด์ action สะท้อนกลับ เพื่อให้ระบบ QA ตรวจได้ว่า
 * backend อัปเกรดแล้ว (Smart QA Factory จะแสดงแผงผลตรวจสดอัตโนมัติ)
 *
 * วิธีติดตั้ง:
 *   1) เปิด Google Sheet เดิม → Extensions > Apps Script
 *   2) วางโค้ดนี้แทนของเดิมทั้งไฟล์
 *   3) Deploy > Manage deployments > (deployment เดิม) > Edit ✏️ >
 *      Version: New version > Deploy   ← สำคัญ! ต้อง deploy เวอร์ชันใหม่
 *      (ถ้า Deploy ใหม่เป็นคนละ URL ต้องอัปเดต WEB_APP_URL ใน index.html ด้วย)
 */

// ===== ตั้งค่าให้ตรงกับชีตจริงของคุณ =====
var EMP_SHEET = "Employees";
var REC_SHEET = "Records";

// หัวตารางของชีต Records (ตรงกับของเดิม)
var REC_HEADERS = [
  "Timestamp",
  "วันที่ตรวจ",
  "ผู้ตรวจ",
  "ชื่อพนักงาน",
  "การแต่งกาย",
  "มือ/เล็บ/เครื่องประดับ",
  "แต่งหน้า/น้ำหอม",
  "สุขภาพ",
  "อุปกรณ์ส่วนบุคคล",
  "พฤติกรรม/ล้างมือ",
  "ผลรวม",
  "ผู้บันทึก (LINE userId)"
];

// key ภาษาอังกฤษของแต่ละคอลัมน์ (ให้ระบบ QA อ่านเป็น JSON สวยๆ)
var REC_KEYS = [
  "timestamp", "inspectionDate", "inspector", "displayName",
  "uniform", "nails", "cosmetics", "health", "specialEq", "behavior",
  "overall", "userId"
];

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "employees";

    if (action === "dates")   return jsonOutput({ result: "success", action: "dates",   data: listDates() });
    if (action === "records") return jsonOutput({ result: "success", action: "records", data: listRecords(e.parameter.date) });

    // default (ของเดิม): รายชื่อพนักงานสำหรับ dropdown หน้าเว็บ
    return jsonOutput({ result: "success", action: "employees", data: listEmployees() });
  } catch (err) {
    return jsonOutput({ result: "error", message: String(err) });
  }
}

function listEmployees() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMP_SHEET);
  var names = [];
  if (sheet && sheet.getLastRow() > 1) {
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    names = values
      .map(function (row) { return String(row[0]).trim(); })
      .filter(function (name) { return name !== ""; });
  }
  return names;
}

/** แปลงค่าวันที่ในชีต (Date object หรือ string) → "YYYY-MM-DD" */
function normDate(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  var s = String(v || "").trim();
  // รองรับ DD/MM/YYYY ที่ผู้ใช้อาจพิมพ์เอง
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
  return s.slice(0, 10);
}

function readAllRecords() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(REC_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, REC_HEADERS.length).getValues();
  return values.map(function (row) {
    var o = {};
    for (var i = 0; i < REC_KEYS.length; i++) {
      var v = row[i];
      if (v instanceof Date) v = (i === 0)
        ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")
        : normDate(v);
      o[REC_KEYS[i]] = (v === null || v === undefined) ? "" : String(v);
    }
    o.inspectionDate = normDate(o.inspectionDate || o.timestamp);
    return o;
  });
}

/** รายการวันที่ (unique, ใหม่→เก่า) */
function listDates() {
  var seen = {};
  readAllRecords().forEach(function (r) { if (r.inspectionDate) seen[r.inspectionDate] = true; });
  return Object.keys(seen).sort().reverse();
}

/** ผลตรวจของวันที่ระบุ (ไม่ส่ง date = ทั้งหมด จำกัด 500 แถวล่าสุด) */
function listRecords(date) {
  var rows = readAllRecords();
  if (date) rows = rows.filter(function (r) { return r.inspectionDate === String(date).slice(0, 10); });
  // ตัด userId ออกจาก payload (ข้อมูลส่วนบุคคล ไม่จำเป็นต่อหน้าจอ QA)
  rows.forEach(function (r) { delete r.userId; delete r.timestamp; });
  return rows.slice(-500);
}

/**
 * POST: บันทึกผลการตรวจ 1 รายการลงชีต Records (เหมือนของเดิมทุกประการ)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(REC_SHEET);
    if (!sheet) sheet = ss.insertSheet(REC_SHEET);
    if (sheet.getLastRow() === 0) sheet.appendRow(REC_HEADERS);

    var items = [
      data.uniform, data.nails, data.cosmetics,
      data.health, data.specialEq, data.behavior
    ];
    var overall = items.indexOf("Fail") !== -1 ? "Fail" : "Pass";

    sheet.appendRow([
      new Date(),
      data.inspectionDate || "",
      data.inspector || "",
      data.displayName || "",
      data.uniform || "",
      data.nails || "",
      data.cosmetics || "",
      data.health || "",
      data.specialEq || "",
      data.behavior || "",
      overall,
      data.userId || ""
    ]);

    return jsonOutput({ status: overall });
  } catch (err) {
    return jsonOutput({ status: "error", message: String(err) });
  }
}

/** helper: ส่งออกเป็น JSON */
function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
