---
title: Load Testing & API SDK (Iterasi 8/10)
tags: [load-testing, api, sdk, typescript, scalability]
type: technical-spec
date: 2026-09-11
status: in-progress
---

# 🚀 Load Testing & API SDK Specification

## Executive Summary

Design comprehensive load test suite + publish TypeScript SDK to validate APEX scalability under peak load (100+ concurrent users) and provide developers with drop-in client library for integration.

---

## 🧪 Load Testing Plan

### Objectives
1. **Throughput**: Measure requests/second at various concurrency levels (10, 50, 100, 500)
2. **Latency**: Track p50, p95, p99 response times under load
3. **Error Rate**: Identify bottlenecks (rate limiting, database connection pool exhaustion)
4. **Scalability**: Verify auto-scaling (Vercel Functions, Supabase edge)
5. **Cost Model**: Estimate infrastructure cost at 1000 DAU

### Test Scenarios

#### Scenario 1: Dashboard Load (Read-Heavy)
```
10 concurrent users
Each user:
  1. GET /api/company/:id (dashboard metrics)
  2. GET /api/employees (roster list)
  3. GET /api/attendance/month (calendar view)
Duration: 5 minutes
Expected: < 200ms p95 latency
```

**Load Profile**:
```
Ramp-up: 0–10 users over 30s
Steady: 10 users for 4 minutes
Ramp-down: 10–0 users over 30s
```

#### Scenario 2: Payroll Calculation (CPU-Heavy)
```
50 concurrent users
Each user:
  1. POST /api/payroll/calculate (SPT tax engine)
     Body: annualGross, PTKP, JHT%, JP%
  2. POST /api/payroll/generate-slip (PDF export)
Duration: 10 minutes
Expected: < 500ms p95 latency (tax calculation bound)
```

**Load Profile**:
```
Ramp-up: 0–50 users over 1 minute
Steady: 50 users for 8 minutes
Spike: 100 users for 1 minute (error handling test)
Ramp-down: 100–0 users over 1 minute
```

#### Scenario 3: Webhook Delivery (High-Frequency)
```
100 concurrent companies
Each company:
  1. POST /api/webhooks/whatsapp/payslip (batched)
     100 employees per company
Duration: 5 minutes
Expected: < 100ms p95 latency, 0% error rate (rate limiter test)
```

**Load Profile**:
```
Constant: 100 companies × 100 employees = 10,000 payslips/5min
Rate limit: 100 req/min per IP → verify graceful 429 response
```

#### Scenario 4: Concurrent Multi-Tenant Isolation
```
500 concurrent users
Distributed across 50 companies (10 users per company)
Each user:
  1. GET /api/employees (verify RLS: only own company)
  2. GET /api/payroll (verify RLS: only own payroll)
Duration: 10 minutes
Expected: Zero data leakage, < 250ms p95 latency
```

**Load Profile**:
```
Ramp-up: 0–500 users over 2 minutes
Steady: 500 users for 7 minutes
Spike: 1000 users for 1 minute (breaking point test)
```

---

## 📊 Load Testing Tools & Setup

### Tool: K6 (Grafana)

**Why K6**:
- JavaScript/Go, cloud-native
- Built-in metrics (latency, throughput, error rate)
- Real-time dashboard
- Free tier: up to 50k VUs/month

**Installation**:
```bash
brew install k6  # macOS
# or
choco install k6  # Windows
```

### K6 Test Script Example

```javascript
import http from 'k6/http'
import { check, group, sleep } from 'k6'

const API_BASE = 'https://apex.lankdev.my.id'
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up
    { duration: '4m', target: 10 },   // Steady
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests < 200ms
    http_req_failed: ['rate<0.1'],    // Error rate < 10%
  },
}

export default function () {
  const headers = {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  }

  group('Dashboard Load', () => {
    // 1. GET company metrics
    let res = http.get(`${API_BASE}/api/company/current`, { headers })
    check(res, { 'company load < 200ms': (r) => r.timings.duration < 200 })

    // 2. GET employees (RLS: own company only)
    res = http.get(`${API_BASE}/api/employees`, { headers })
    check(res, {
      'employees load < 200ms': (r) => r.timings.duration < 200,
      'status 200': (r) => r.status === 200,
    })

    sleep(1)

    // 3. GET attendance calendar
    res = http.get(`${API_BASE}/api/attendance/month?month=2026-09`, { headers })
    check(res, { 'attendance load < 150ms': (r) => r.timings.duration < 150 })
  })

  sleep(2)
}
```

**Run locally**:
```bash
k6 run load-test-dashboard.js \
  --vus 10 \
  --duration 5m \
  --summary-export=summary.json
```

**Run cloud**:
```bash
k6 cloud load-test-dashboard.js  # Upload to Grafana Cloud
```

---

## 💾 API SDK Specification

### Objectives
1. **Drop-in Client**: Single npm package for REST API calls
2. **Type Safety**: Full TypeScript typings (auto-generated from OpenAPI)
3. **Auth Handling**: Automatic token refresh, HMAC signing for webhooks
4. **Error Handling**: Typed error responses, exponential backoff retry
5. **Multi-Tenant**: Support switching between companies (if user has access)

### Package: `@lankdev/apex-sdk`

**Installation**:
```bash
npm install @lankdev/apex-sdk
```

**Usage Example**:
```typescript
import { ApexClient, Company, Employee } from '@lankdev/apex-sdk'

// Initialize
const apex = new ApexClient({
  baseUrl: 'https://apex.lankdev.my.id',
  token: 'your-jwt-token', // From authentication endpoint
})

// Fetch current company
const company: Company = await apex.companies.getCurrent()
console.log(company.id, company.name)

// Fetch employees (with RLS enforced server-side)
const employees: Employee[] = await apex.employees.list({
  limit: 100,
  offset: 0,
})

// Calculate payroll
const payroll = await apex.payroll.calculate({
  employee_id: 'emp-123',
  month: '2026-09',
  gross: 10_000_000,
  ptkp: 'TK/0',
})
console.log(`PPh 21: Rp ${payroll.tax}`)

// Generate payslip PDF
const pdf = await apex.payroll.generateSlip({
  payroll_id: payroll.id,
  format: 'pdf', // or 'json'
})

// Send payslip via WhatsApp
const whatsappResult = await apex.webhooks.sendPayslip({
  employee_id: 'emp-123',
  payslip_month: '2026-09',
  payslip_url: 'https://example.com/slip.pdf',
})
```

### SDK Architecture

```
@lankdev/apex-sdk
├── lib/
│   ├── client.ts          # ApexClient class
│   ├── auth.ts            # JWT + token refresh
│   ├── hmac.ts            # HMAC signing for webhooks
│   ├── errors.ts          # Typed error classes
│   └── retry.ts           # Exponential backoff
├── resources/
│   ├── companies.ts       # Companies resource
│   ├── employees.ts       # Employees resource
│   ├── attendance.ts      # Attendance resource
│   ├── payroll.ts         # Payroll + tax engine
│   ├── payslips.ts        # Payslips resource
│   ├── webhooks.ts        # Webhook signing + delivery
│   └── audit.ts           # Audit logs (read-only)
├── types/
│   ├── company.ts         # Types auto-generated from Supabase schema
│   ├── employee.ts
│   ├── payroll.ts
│   └── ...
└── index.ts               # Main export
```

### Error Handling

```typescript
try {
  const employee = await apex.employees.get('emp-nonexistent')
} catch (error) {
  if (error instanceof ApexNotFoundError) {
    console.log('Employee not found')
  } else if (error instanceof ApexAuthError) {
    console.log('Authentication failed, refresh token')
  } else if (error instanceof ApexRateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter}s`)
  }
}
```

### Webhook Signing (Server-Side)

```typescript
// For integrations calling APEX webhooks
import { ApexWebhookSigner } from '@lankdev/apex-sdk'

const signer = new ApexWebhookSigner(process.env.WHATSAPP_WEBHOOK_SECRET)

// When calling /api/webhooks/whatsapp/payslip
const signature = signer.sign({
  company_id: 'comp-123',
  employee_id: 'emp-456',
  payslip_month: '2026-09',
  ts: Math.floor(Date.now() / 1000),
})

const response = await fetch('https://apex.lankdev.my.id/api/webhooks/whatsapp/payslip', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-apex-sig': signature,
  },
  body: JSON.stringify({
    company_id: 'comp-123',
    employee_id: 'emp-456',
    payslip_month: '2026-09',
    payslip_url: 'https://example.com/slip.pdf',
    ts: Math.floor(Date.now() / 1000),
  }),
})
```

---

## 📈 Performance Targets

### Load Testing Acceptance Criteria

| Metric | Target | Threshold |
|--------|--------|-----------|
| **Throughput (Dashboard)** | ≥ 500 req/s | At 100 concurrent users |
| **Latency (p95)** | ≤ 200ms | All scenarios except payroll |
| **Latency (p95, Payroll)** | ≤ 500ms | CPU-intensive tax calculation |
| **Error Rate** | ≤ 1% | Across all scenarios |
| **Rate Limit Graceful** | 429 with retry-after | Webhook scenario at 10k req/5min |
| **Multi-Tenant Isolation** | 100% pass | Zero data leakage at 500 users |
| **Memory (per instance)** | < 512 MB | Vercel Function limit |
| **Cost (1000 DAU)** | < $500/month | Infrastructure + Supabase |

---

## 🚀 Timeline (Iterasi 8)

### Phase 1: Load Test Setup (2 hours)
- [ ] Install K6 locally + Grafana Cloud account
- [ ] Write 4 test scenarios (dashboard, payroll, webhooks, multi-tenant)
- [ ] Run local load test (10–100 VUs)
- [ ] Document results + bottlenecks

### Phase 2: SDK Implementation (3 hours)
- [ ] Generate TypeScript types from Supabase schema
- [ ] Implement ApexClient + auth handling
- [ ] Implement resources (companies, employees, payroll, webhooks, etc.)
- [ ] Add error handling + retry logic
- [ ] Write SDK tests (mock server)

### Phase 3: SDK Publishing (1 hour)
- [ ] Set up npm registry (publish to @lankdev scope)
- [ ] Create SDK documentation + examples
- [ ] Add SDK to GitHub releases
- [ ] Create integration guide for partners

### Phase 4: Verification (1 hour)
- [ ] Run load tests against production
- [ ] Verify SDK works with live API
- [ ] Performance profile (Vercel Analytics dashboard)
- [ ] Document results for scaling roadmap

---

## 📝 Deliverables (Iterasi 8)

1. ✓ Load test suite (4 scenarios, K6 scripts)
2. ✓ Load test results report (latency, throughput, error rate)
3. ✓ API SDK package (@lankdev/apex-sdk on npm)
4. ✓ SDK documentation + examples
5. ✓ Integration guide for developers
6. ✓ Performance roadmap (autoscaling recommendations)

---

## 💡 Success Criteria

- [ ] All 4 load scenarios pass acceptance criteria
- [ ] p95 latency < 200ms for read-heavy operations
- [ ] Error rate < 1% at 100+ concurrent users
- [ ] SDK published to npm (@lankdev/apex-sdk)
- [ ] SDK fully typed (TypeScript)
- [ ] SDK docs + examples live
- [ ] No data leakage in multi-tenant scenario

---

## 🔮 Post-Iterasi 8 Roadmap

- **Iterasi 9**: Integration guides (Zapier, Make, webhook examples)
- **Iterasi 10**: Knowledge base + onboarding docs

---

*Authored by: Pam (Head of Product & Market Intelligence)*  
*Reviewed by: Dwight (Lead Engineer), Jim (Software Engineer)*  
*Iterasi*: 8/10  
*Status*: Ready for implementation
