-- GHP Personal Hygiene Inspection — D1 schema
-- 12 inspection items matching QP-QA-10 paper form

CREATE TABLE IF NOT EXISTS employees (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS records (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  inspection_date TEXT NOT NULL,
  inspector       TEXT NOT NULL,
  emp_name        TEXT NOT NULL,
  item1           TEXT NOT NULL CHECK(item1  IN ('Pass','Fail')),  -- หมวกคลุมผม
  item2           TEXT NOT NULL CHECK(item2  IN ('Pass','Fail')),  -- ผ้าปิดจมูก
  item3           TEXT NOT NULL CHECK(item3  IN ('Pass','Fail')),  -- ผ้ากันเปื้อน
  item4           TEXT NOT NULL CHECK(item4  IN ('Pass','Fail')),  -- ถุงมือ
  item5           TEXT NOT NULL CHECK(item5  IN ('Pass','Fail')),  -- รองเท้า
  item6           TEXT NOT NULL CHECK(item6  IN ('Pass','Fail')),  -- ชุดทำงาน
  item7           TEXT NOT NULL CHECK(item7  IN ('Pass','Fail')),  -- เล็บมือ
  item8           TEXT NOT NULL CHECK(item8  IN ('Pass','Fail')),  -- เครื่องประดับ
  item9           TEXT NOT NULL CHECK(item9  IN ('Pass','Fail')),  -- น้ำหอม
  item10          TEXT NOT NULL CHECK(item10 IN ('Pass','Fail')),  -- ขนมขบเคี้ยว
  item11          TEXT NOT NULL CHECK(item11 IN ('Pass','Fail')),  -- ของใช้ส่วนตัว
  item12          TEXT NOT NULL CHECK(item12 IN ('Pass','Fail')),  -- การล้างมือ
  overall         TEXT NOT NULL CHECK(overall IN ('Pass','Fail')),
  user_id         TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_records_date ON records(inspection_date);
