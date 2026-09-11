# APEX — SPT 1721-A1 Tax Export Specification
## DJP Compliance & Annual Recalculation Architecture (PMK 168/2023 & UU HPP)

> **Author**: Pam (Head of Product & Market Intelligence, LankDev Corp)  
> **Prepared for**: Gilank (Founder & Product Lead)  
> **Target Audience**: APEX Engineering Team, Indonesian HR & Tax Administrators  
> **Document Status**: Production Specification v1.0 | Approved  
> **Date**: September 2026  

---

## 1. Regulatory Context

Under **PMK 168/2023** and **PP 58/2023**:
- **Jan–Nov (Masa Non-Terakhir)**: PPh 21 is calculated using **TER (Tarif Efektif Rata-rata)** Categories A, B, and C applied directly to monthly gross wages.
- **Dec (Masa Terakhir / Annual Reconciliation)**: PPh 21 is recalculated using **Pasal 17 UU PPh / UU HPP** progressive tax brackets on annual net income.
- **SPT 1721-A1**: The official annual tax withholding certificate issued by employers to permanent employees for personal e-Filing (e-SPT / Coretax DJP).

---

## 2. Annual Reconciliation Algorithm (December Engine)

$$\text{PPh 21 Dec} = \text{Tax}_{\text{Pasal 17}}\left(\text{Annual Gross} - \text{Biaya Jabatan} - \text{BPJS Employee Share} - \text{PTKP}\right) - \sum_{i=1}^{11} \text{PPh 21 TER}_i$$

### Rules & Constants (2026):
1. **Biaya Jabatan**: 5% of Annual Gross, capped at **Rp 6.000.000 / year** (Rp 500.000 / month).
2. **JHT & JP Employee Share**: 2.0% JHT + 1.0% JP (capped at Rp 11.086.300 / mo for JP).
3. **PTKP Categories**:
   - TK/0: Rp 54.000.000 | TK/1: Rp 58.500.000 | TK/2: Rp 63.000.000 | TK/3: Rp 67.500.000
   - K/0: Rp 58.500.000  | K/1: Rp 63.000.000  | K/2: Rp 67.500.000  | K/3: Rp 72.000.000
4. **Pasal 17 Tax Brackets**:
   - Up to Rp 60.000.000: **5%**
   - > Rp 60.000.000 to Rp 250.000.000: **15%**
   - > Rp 250.000.000 to Rp 500.000.000: **25%**
   - > Rp 500.000.000 to Rp 5.000.000.000: **30%**
   - > Rp 5.000.000.000: **35%**

---

## 3. Export CSV Format for e-SPT / Coretax DJP Import

The exported file `spt_1721_a1_[company_slug]_[tax_year].csv` complies with DJP import specifications:

```csv
masa_pajak,tahun_pajak,pembetulan,npwp_pemotong,nama_pemotong,nik_pegawai,npwp_pegawai,nama_pegawai,status_ptkp,gaji_pokok_setahun,tunjangan_setahun,thr_setahun,bruto_setahun,biaya_jabatan,iuran_pensiun_jht,neto_setahun,ptkp_setahun,pkp_setahun,pph21_terutang_setahun,pph21_telah_dipotong_jan_nov,pph21_kurang_bayar_des
12,2026,0,012345678000000,"PT Sinar Harapan",3171010000000001,000000000000000,"Aditya Saputra",TK/0,60000000,12000000,6000000,78000000,3900000,1800000,72300000,54000000,18300000,915000,850000,65000
```

---

## 4. Operational & Engineering Action Plan

1. **Pure Function Unit Tests**: Add test cases for annual reconciliation in `tests/ter-engine.test.mjs`.
2. **Admin Download UI**: Provide a 1-click **"Export Tax Form 1721-A1"** button inside `/[slug]/payroll`.
3. **Fail-Closed Verification**: If an employee profile lacks PTKP status or NIK, flag as incomplete before generating annual tax reports.

---
*End of Specification. Authored by Product & Market Intelligence (LankDev Corp).*
