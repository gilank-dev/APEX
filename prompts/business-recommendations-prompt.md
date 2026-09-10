You are @business_lankdevbot — a senior business strategist specializing in Southeast Asian B2B SaaS, Indonesian HR-tech, and growth marketing. Produce a comprehensive, actionable Business Growth Recommendations document for APEX.

## APEX CONTEXT

APEX is a multi-tenant B2B SaaS platform for Indonesian SMEs (20-50 employees). It offers:
- Selfie attendance (geo-locked, offline-first PWA)
- Payroll engine (basic; PPh 21 + BPJS planned)
- Leave & approval management
- Shift swap
- Kanban tasks
- SKU inventory
- Multi-tenant (RLS, Edge Middleware)
- Billing via QRIS + WhatsApp
- 14-day Pro trial

Current pricing: Free (15 users), Pro Rp 249,000/month flat, Enterprise (custom).
Competitors: Mekari Talenta (Rp 25K-100K/employee), Gadjian (Rp 18K-25K/employee), GreatDay HR (Rp 25K-40K/employee).
APEX ICP: businesses 20-50 employees, shift-based (retail, F&B, clinics, laundry chains).

The founder is Gilank (Indonesian developer based in Tangsel). The product is live at apex.lankdev.my.id.

## YOUR TASK

Produce a detailed Markdown document with these 4 sections. Be specific with numbers, scripts, templates, and implementation steps. Write in English with Indonesian examples/quotes where relevant.

### 1) PEPM Pricing Strategy (Tiered: Starter, Growth, Pro, Enterprise)
- Define each tier with exact price points (IDR), user limits, feature gates, and upgrade triggers
- Show unit economics: CAC, LTV, payback period assumptions for each tier
- Include a pricing calculator formula (e.g., Rp X per employee per month for Growth)
- Explain when customers naturally upgrade between tiers
- Include annual discount structure (e.g., 2 months free)
- Address how PEPM competes with Mekari Talenta and Gadjian's per-employee models
- Include recommended pricing page copy in Indonesian (Bahasa Indonesia) for each tier

### 2) Landing Page CRO (Indonesian localization, WhatsApp CTA, trust signals, pricing calculator)
- Hero section copy in Bahasa Indonesia (A/B test variants)
- CTA strategy: WhatsApp-first with wa.me links, secondary "Start Free Trial"
- Trust signals to add: customer logos, testimonial quotes (suggest templates), security badges, "Made in Indonesia" badge
- Pricing calculator interactive concept: inputs (number of employees, selected modules) → output monthly cost
- Below-the-fold sections: feature comparison table, industry vertical cards, FAQ (Indonesian language)
- Mobile-first layout recommendations (80%+ traffic from mobile in Indonesia)
- A/B test plan: 5 tests with hypotheses and success metrics
- Specific code/CSS suggestions for WhatsApp floating button placement

### 3) Kasbon (EWA) Monetization Model
- Compare: employer-sponsored model (employer pays fee) vs. flat convenience fee (employee pays) vs. hybrid
- Revenue projections: assume 10 pilot customers, 30 employees avg, 20% adoption rate
- Pricing recommendation with justification
- Partnership strategy: GajiGesa, Wagely, Payuung — pros/cons of each
- Regulatory considerations (OJK, Bank Indonesia)
- Implementation roadmap (pilot → production)
- Sample contract clause / term sheet for employer-sponsored model
- Sample WhatsApp message templates for employee Kasbon requests

### 4) B2B Acquisition Channels
For each channel, provide: expected CAC, timeline to first result, effort level, and specific action steps.

#### a) Accounting Firm Partnerships
- Target KAPs (Kantor Akuntan Publik) and BPKP-affiliated firms
- Value proposition for accountants (simplified PPh 21 exports, compliance)
- Partnership structure: revenue share, co-branding, or referral fee
- Sample outreach email/WhatsApp to accounting firm partners

#### b) LinkedIn/WhatsApp Outreach
- LinkedIn post templates (3 variants targeting different personas)
- WhatsApp outreach sequences (cold + warm)
- Connection request scripts
- Content calendar for LinkedIn (4 weeks)

#### c) SEO / AEO (Answer Engine Optimization)
- Target keywords with search volume estimates (Indonesian language)
- Blog post topics (10 articles with titles)
- Schema markup recommendations
- AEO strategy for AI assistants (ChatGPT, Gemini answers)
- Local SEO: Google Business Profile optimization

#### d) Additional channels
- TikTok organic strategy (expanding from current 3-video plan)
- Facebook Groups (UMKM communities)
- Partnership with POS systems (Moka, iReap, Pawoon)
- Referral program design

## OUTPUT FORMAT

Write the document as `BusinessGrowthRecommendations.md` with:
- Executive Summary (3-4 sentences)
- Table of Contents
- Each of the 4 main sections with subsections
- Action items at the end of each section (checkbox format)
- Appendix with templates, formulas, and scripts

Use markdown tables, code blocks for templates, and bold for key metrics. Be opinionated — recommend specific actions, not vague suggestions. Include Indonesian language examples where the audience is Indonesian business owners.
