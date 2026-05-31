/**
 * GHP Personal Hygiene Inspection — Google Apps Script backend (ต้นแบบ/Template)
 * เอกสารอ้างอิง: QP-QA-10  |  มาตรฐาน: GHP / GMP
 *
 * วิธีใช้:
 *   1) เปิด Google Sheet ที่ใช้เก็บข้อมูล แล้วไปที่ Extensions > Apps Script
 *   2) วางโค้ดนี้แทนของเดิม (ปรับชื่อชีต/คอลัมน์ให้ตรงกับของจริงตามหมายเหตุด้านล่าง)
 *   3) Deploy > New deployment > Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4) คัดลอก URL ที่ได้ไปใส่ใน index.html ที่ตัวแปร WEB_APP_URL
 *
 * โครงสร้างชีตที่โค้ดนี้คาดหวัง (ปรับชื่อได้ที่ค่าคงที่ด้านล่าง):
 *   - ชีต "Employees": คอลัมน์ A เก็บรายชื่อพนักงาน (แถวที่ 1 เป็นหัวตาราง)
 *   - ชีต "Records":   ใช้บันทึกผลการตรวจ (โค้ดจะสร้างหัวตารางให้อัตโนมัติถ้ายังไม่มี)
 */

// ===== ตั้งค่าให้ตรงกับชีตจริงของคุณ =====
var EMP_SHEET = "Employees";
var REC_SHEET = "Records";

// หัวตารางของชีต Records (เพิ่ม "วันที่ตรวจ" และ "ผู้ตรวจ" แล้ว)
var REC_HEADERS = [
  "Timestamp",        // เวลาที่บันทึก (อัตโนมัติ)
  "วันที่ตรวจ",        // inspectionDate (จากผู้ใช้)
  "ผู้ตรวจ",           // inspector (จากผู้ใช้)
  "ชื่อพนักงาน",       // displayName
  "การแต่งกาย",        // uniform
  "มือ/เล็บ/เครื่องประดับ", // nails
  "แต่งหน้า/น้ำหอม",   // cosmetics
  "สุขภาพ",            // health
  "อุปกรณ์ส่วนบุคคล",  // specialEq
  "พฤติกรรม/ล้างมือ",  // behavior
  "ผลรวม",             // overall (Pass/Fail)
  "ผู้บันทึก (LINE userId)" // userId
];

/**
 * GET: คืนรายชื่อพนักงานให้หน้าเว็บนำไปแสดงใน dropdown
 * รูปแบบที่หน้าเว็บคาดหวัง: { result: "success", data: ["ชื่อ A", "ชื่อ B", ...] }
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(EMP_SHEET);
    var names = [];

    if (sheet && sheet.getLastRow() > 1) {
      // อ่านคอลัมน์ A ตั้งแต่แถวที่ 2 (ข้ามหัวตาราง)
      var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      names = values
        .map(function (row) { return String(row[0]).trim(); })
        .filter(function (name) { return name !== ""; });
    }

    return jsonOutput({ result: "success", data: names });
  } catch (err) {
    return jsonOutput({ result: "error", message: String(err) });
  }
}

/**
 * POST: บันทึกผลการตรวจ 1 รายการลงชีต Records
 * payload จากหน้าเว็บ: { userId, inspectionDate, inspector, displayName,
 *                        uniform, nails, cosmetics, health, specialEq, behavior }
 * คืนค่า: { status: "Pass" | "Fail" }
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(REC_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(REC_SHEET);
    }
    // สร้างหัวตารางอัตโนมัติถ้าชีตยังว่าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(REC_HEADERS);
    }

    // คำนวณผลรวม: ถ้ามีข้อใดข้อหนึ่ง "Fail" ถือว่าไม่ผ่าน
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
