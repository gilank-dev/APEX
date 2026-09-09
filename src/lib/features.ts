export interface Feature {
  id: string
  name: string
  description: string
  kpis: { label: string; value: string }[]
  actionLabel: string
  actionSuccessMessage: string
  placeholderText?: string
}

export const CATEGORY_FEATURES: Record<string, Feature[]> = {
  corporate: [
    {
      id: 'leave',
      name: 'Cuti & Izin',
      description: 'Pengajuan cuti/izin/sakit karyawan dengan persetujuan admin',
      kpis: [
        { label: 'Pending Requests', value: '0 Items' },
        { label: 'Approval Rate', value: '100%' },
        { label: 'Avg SLA', value: '2 Hours' }
      ],
      actionLabel: 'Kelola Pengajuan Cuti',
      actionSuccessMessage: 'Pengajuan cuti berhasil diproses.'
    },
    {
      id: 'payroll-engine',
      name: 'Payroll Engine',
      description: 'Calculates basic salary, allowances, and tax deductions (PPh 21 equivalent) automatically on the server-side (Cron / Edge Functions) based on monthly employee attendance.',
      kpis: [
        { label: 'Payroll Processed', value: '$32K / Mo' },
        { label: 'Insurance Sync', value: 'Connected' },
        { label: 'Tax Filings', value: 'Completed' }
      ],
      actionLabel: 'Run Payroll Calculation',
      actionSuccessMessage: 'Payroll calculation completed successfully. Salary slips are ready for review.'
    },
    {
      id: 'live-attendance-selfie',
      name: 'Live Attendance Selfie',
      description: 'Employee attendance clock-in utilizing front-facing camera selfies. Fully excludes GPS location tracking for privacy and lightweight execution.',
      kpis: [
        { label: 'Present Today', value: '96.4%' },
        { label: 'Selfie Match Rate', value: '100%' },
        { label: 'Average Clock-In', value: '07:54 AM' }
      ],
      actionLabel: 'Verify Selfie & Clock In',
      actionSuccessMessage: 'Selfie verification successful. Attendance logged.'
    },
    {
      id: 'multi-tier-approval',
      name: 'Multi-Tier Approval',
      description: 'Multi-level document approval workflow (Staff -> Manager -> Director) secured with database Row Level Security (RLS) policies.',
      kpis: [
        { label: 'Pending Approvals', value: '3 Items' },
        { label: 'SLA Response Time', value: '28 Mins' },
        { label: 'Approved Work Items', value: '142 Items' }
      ],
      actionLabel: 'Process Approval Queue',
      actionSuccessMessage: 'Document approved and routed to the next tier.'
    }
  ],
  school: [
    {
      id: 'student-database',
      name: 'Student Database',
      description: 'Centralized repository for Student IDs, personal data, grade history, and parent contacts. Features a fast 300ms debounced search and DOM virtualization.',
      kpis: [
        { label: 'Total Students', value: '450' },
        { label: 'Active Students', value: '448' },
        { label: 'Registered Classes', value: '15' }
      ],
      actionLabel: 'Search Student Database',
      actionSuccessMessage: 'Student database query updated.',
      placeholderText: 'Enter student name or ID...'
    },
    {
      id: 'tuition-billing',
      name: 'Tuition (SPP) Billing',
      description: 'Automatic tuition invoicing on the 1st of every month with integrated WhatsApp notification alerts and payment gateway webhook tracking.',
      kpis: [
        { label: 'Tuition Settled', value: '92%' },
        { label: 'Outstanding Balance', value: '38 Students' },
        { label: 'Total Revenue', value: '$15K' }
      ],
      actionLabel: 'Broadcast Bills via WhatsApp',
      actionSuccessMessage: 'Tuition invoices and payment links broadcasted to parents via WhatsApp.'
    },
    {
      id: 'grade-book-system',
      name: 'Grade Book System',
      description: 'Spreadsheet-like inline grade entry interface for teachers with optimistic UI background auto-saving to prevent data loss.',
      kpis: [
        { label: 'Class Average', value: '82.4' },
        { label: 'Report Cards Ready', value: '15 Classes' },
        { label: 'Grades Inputted', value: '88%' }
      ],
      actionLabel: 'Compute Report Grades',
      actionSuccessMessage: 'Report card grades computed and auto-saved successfully.'
    },
    {
      id: 'teacher-scheduling',
      name: 'Teacher Scheduling',
      description: 'Conflict-free teacher timetable builder with automated clash checking on the API server and weekly slot grids.',
      kpis: [
        { label: 'Teaching Hours', value: '420 Hrs / Wk' },
        { label: 'Scheduled Teachers', value: '38' },
        { label: 'Schedule Conflicts', value: '0 Cases' }
      ],
      actionLabel: 'Validate Timetable Conflicts',
      actionSuccessMessage: 'Timetable check complete: Zero scheduling conflicts detected.'
    }
  ],
  fnb: [
    {
      id: 'cash-drawer-audit',
      name: 'Cash Drawer Audit',
      description: 'Digital cash drawer reconciliation at the end of every cashier shift with Blind Balance inputs to prevent employee bias.',
      kpis: [
        { label: 'Audited Sessions', value: '2 / Day' },
        { label: 'Cash Variance', value: '$0.00' },
        { label: 'Drawer Status', value: 'Reconciled' }
      ],
      actionLabel: 'Submit Cash Audit Log',
      actionSuccessMessage: 'Cash drawer audit log reconciled successfully with POS ledger.'
    },
    {
      id: 'fifo-inventory',
      name: 'FIFO Inventory (Raw Materials)',
      description: 'Raw ingredients expiration tracking by batch sequence (First In, First Out) utilizing SQL stored procedures for minimal latency.',
      kpis: [
        { label: 'Monitored Ingredients', value: '124 Items' },
        { label: 'Expired Batches', value: '0 Items' },
        { label: 'Critical Stock Items', value: '3 Items' }
      ],
      actionLabel: 'Scan Expiration Batches',
      actionSuccessMessage: 'FIFO inventory records updated. Expiration alerts verified.'
    },
    {
      id: 'dynamic-roster',
      name: 'Dynamic Roster',
      description: 'Shift roster scheduler (Morning, Afternoon, Night) with responsive touch-friendly drag-and-drop support designed for tablet screens.',
      kpis: [
        { label: 'Active Shifts', value: '3 / Day' },
        { label: 'Scheduled Crew', value: '12 Staff' },
        { label: 'Roster Status', value: 'Assigned' }
      ],
      actionLabel: 'Save Shift Schedule',
      actionSuccessMessage: 'Weekly shift roster saved and published to the employee portal.'
    }
  ],
  retail: [
    {
      id: 'live-sku-tracking',
      name: 'Live SKU Tracking',
      description: 'Real-time stock level monitoring for product entries and sales using WebSockets (Supabase Realtime).',
      kpis: [
        { label: 'Active SKUs', value: '8,900' },
        { label: 'Stock Turnover', value: '12.4 Days' },
        { label: 'Low Stock Warnings', value: '3 SKUs' }
      ],
      actionLabel: 'Connect Realtime Stream',
      actionSuccessMessage: 'WebSocket connected. Realtime SKU tracking streams are active.'
    },
    {
      id: 'stock-opname',
      name: 'Stock Opname (Audit)',
      description: 'Offline-first stock taking module powered by IndexedDB / localStorage for warehouses with low Wi-Fi coverage.',
      kpis: [
        { label: 'Audited Items', value: '94.2%' },
        { label: 'Offline Sync Queue', value: '0 Items' },
        { label: 'Audit Discrepancies', value: '2 Pcs' }
      ],
      actionLabel: 'Start Offline Audit Session',
      actionSuccessMessage: 'Stock count synchronized successfully with the database server.'
    },
    {
      id: 'cashier-shift-handover',
      name: 'Cashier Shift Handover',
      description: 'Secure cashier session closing, cart clearing, and JWT token invalidation for next shift login to prevent session theft.',
      kpis: [
        { label: 'Last Handover', value: '03:00 PM' },
        { label: 'Active Cashier', value: 'Rani Wijaya' },
        { label: 'Audit Trail', value: 'Cleared' }
      ],
      actionLabel: 'Trigger Shift Handover',
      actionSuccessMessage: 'Cashier session closed. Terminal locked for the next incoming operator.'
    }
  ],
  clinic: [
    {
      id: 'lite-emr',
      name: 'Lite EMR (Medical Record)',
      description: 'Encrypted Electronic Medical Records (EMR) database capturing anamnesis, prescriptions, and ICD-10 codes, protected by doctor-only RLS access policies.',
      kpis: [
        { label: 'Medical Records', value: '1,240 Logs' },
        { label: 'Encryption Standard', value: 'HTTPS / AES' },
        { label: 'Access Audit Logs', value: 'Completed' }
      ],
      actionLabel: 'Decrypt EMR Records',
      actionSuccessMessage: 'Electronic Medical Record decrypted and opened securely.'
    },
    {
      id: 'prescription-tracker',
      name: 'Prescription Tracker',
      description: 'Real-time digital prescription pipeline sending doctor inputs directly to the pharmacy dispatch queue via WebSockets.',
      kpis: [
        { label: 'Pharmacy Queue', value: '2 Sessions' },
        { label: 'Prep Time Average', value: '4.2 Mins' },
        { label: 'Prescriptions Dispensed', value: '42' }
      ],
      actionLabel: 'Transmit Digital Rx',
      actionSuccessMessage: 'Digital prescription transmitted to the pharmacy queue.'
    },
    {
      id: 'patient-queue-system',
      name: 'Patient Queue System',
      description: 'Patient intake queue manager with real-time waiting lobby monitor display and browser-native text-to-speech calls.',
      kpis: [
        { label: 'Registered Today', value: '28 Patients' },
        { label: 'Average Wait Time', value: '12 Mins' },
        { label: 'Active Ticket', value: 'A-12' }
      ],
      actionLabel: 'Announce Next Ticket',
      actionSuccessMessage: 'Lobby announcement triggered: "Ticket A-12 please proceed to Doctor Consultation room".'
    },
    {
      id: 'insurance-billing-flow',
      name: 'Insurance Billing Flow',
      description: 'BPJS/insurance claim processing system with cloud attachment uploads and API-ready XML/JSON export capabilities.',
      kpis: [
        { label: 'Submission Rate', value: '88%' },
        { label: 'Pending Claims', value: '$3K' },
        { label: 'Lab Attachments', value: 'Verified' }
      ],
      actionLabel: 'Compile Claim Document',
      actionSuccessMessage: 'Insurance claim document XML compiled and downloaded.'
    }
  ],
  ngo: [
    {
      id: 'fund-allocation-tracker',
      name: 'Fund Allocation Tracker',
      description: 'Interactive donut-chart dashboard highlighting donor fund distribution (logistics, operational, medical).',
      kpis: [
        { label: 'Managed Capital', value: '$100K' },
        { label: 'Public Transparency', value: 'Audited' },
        { label: 'Total Donations', value: '$800K' }
      ],
      actionLabel: 'Generate Allocation PDF',
      actionSuccessMessage: 'Allocation report PDF generated for public transparency review.'
    },
    {
      id: 'donor-crm',
      name: 'Donor CRM',
      description: 'Donor relationship manager with Lifetime Value (LTV) logs, integrated with transactional thank-you emails via Resend/SendGrid.',
      kpis: [
        { label: 'Recurring Donors', value: '64' },
        { label: 'LTV CRM Growth', value: '+18.5%' },
        { label: 'Receipt Emails Sent', value: '100%' }
      ],
      actionLabel: 'Sync Donor Records',
      actionSuccessMessage: 'Donor CRM databases synced successfully.'
    },
    {
      id: 'beneficiary-database',
      name: 'Beneficiary Database',
      description: 'Beneficiary identity database featuring regex validation to prevent duplicate aid claims in disaster relief zones.',
      kpis: [
        { label: 'Beneficiaries Registered', value: '450' },
        { label: 'ID Check Status', value: '100% Valid' },
        { label: 'Aid Distributed', value: '98%' }
      ],
      actionLabel: 'Register New Beneficiary',
      actionSuccessMessage: 'Beneficiary registered successfully. ID checked and clean.'
    }
  ]
}
