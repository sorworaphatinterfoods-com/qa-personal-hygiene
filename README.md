# qa-personal-hygiene

แบบบันทึกการตรวจสุขลักษณะส่วนบุคคลก่อนเข้าปฏิบัติงาน (GHP / GMP — อ้างอิง QP-QA-10)
สำหรับ บริษัท ศ.วรภัทร อินเตอร์ ฟู้ดส์ จำกัด ใช้งานผ่าน LINE LIFF

## ความสามารถ
- เลือก **วันที่ตรวจ** (ตั้งค่าเป็นวันนี้อัตโนมัติ) และระบุ **ผู้ตรวจ**
- ตรวจสุขลักษณะ 6 หัวข้อตามมาตรฐาน GHP/GMP (การแต่งกาย, มือ/เล็บ/เครื่องประดับ,
  แต่งหน้า/น้ำหอม, สุขภาพ, อุปกรณ์ส่วนบุคคล, พฤติกรรม/ล้างมือ)
- บันทึกทีละคนต่อเนื่อง โดยคงค่าวันที่และผู้ตรวจไว้
- **สร้างรายงาน A4** พร้อมพิมพ์ (ตารางรายชื่อ × หัวข้อตรวจ, สรุปผ่าน/ไม่ผ่าน, ช่องลงนาม)
- **ติดตั้งเป็นแอปบนมือถือได้ (PWA)** — เพิ่มไปยังหน้า Home มีไอคอน เปิดแบบเต็มจอ และใช้งาน offline ได้

## โครงสร้างไฟล์
| ไฟล์ | คำอธิบาย |
|------|----------|
| `index.html` | หน้าเว็บ/LIFF สำหรับตรวจและสร้างรายงาน A4 |
| `manifest.webmanifest` | PWA manifest (ชื่อแอป, ไอคอน, ธีม, แสดงแบบเต็มจอ) |
| `sw.js` | Service Worker (cache app shell ให้ใช้งาน offline) |
| `icons/` | ไอคอนแอปขนาดต่าง ๆ (192/512/maskable/apple-touch) |
| `backend/Code.gs` | ต้นแบบ Google Apps Script (รองรับวันที่/ผู้ตรวจ) — คัดลอกไปวางใน Apps Script Editor |
| `.github/workflows/deploy-pages.yml` | Deploy `index.html` ขึ้น GitHub Pages อัตโนมัติเมื่อ push เข้า `main` |

## การติดตั้งเป็นแอปบนมือถือ (PWA)
> ต้องเปิดผ่าน **HTTPS** (GitHub Pages เป็น HTTPS อยู่แล้ว) — Service Worker จึงจะทำงาน
- **Android (Chrome):** เปิด URL > เมนู ⋮ > "ติดตั้งแอป" / "เพิ่มลงในหน้าจอหลัก"
- **iOS (Safari):** เปิด URL > ปุ่มแชร์ > "เพิ่มลงในหน้าจอโฮม"

## การติดตั้ง

### 1) Backend (Google Apps Script)
1. เปิด Google Sheet ที่เก็บข้อมูล > Extensions > Apps Script
2. วางโค้ดจาก `backend/Code.gs` (ปรับชื่อชีต/คอลัมน์ตามหมายเหตุในไฟล์)
3. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
4. นำ URL ที่ได้ไปใส่ที่ตัวแปร `WEB_APP_URL` ใน `index.html`

### 2) Frontend (GitHub Pages)
1. ไปที่ **Settings > Pages > Source** เลือก **GitHub Actions** (ทำครั้งเดียว)
2. workflow จะ deploy ให้อัตโนมัติทุกครั้งที่ push เข้า `main`
3. นำ URL ของ Pages ไปตั้งค่าเป็น Endpoint URL ของ LIFF (LIFF ID `2009360135-uaaM4KeT`)
