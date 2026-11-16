# IAAS Global vs Imara — Gap Analysis

**Prepared:** 15 November 2026  
**Reference documents:** IAAS_Global_Licensing_Proposal.pdf · IAAS_Global_Three_Slide_Concept.pdf · WAQAF_Global_Architecture_Slide.pdf  
**Author:** Gerard Espinas / Imara build team

---

## Overview

The three documents describe **IAAS** (Jurisdiction-Aware Islamic Giving Infrastructure) by Caliph BUMI, with **Waqaf Global** as its flagship product. This is a significantly more ambitious architecture than Imara's current Waqf MVP. Here is where we stand.

---

## What IAAS envisions that Imara doesn't have

### 1. Multi-tenancy (Critical)

**IAAS:** One platform, institution-isolated tenants. MUIS, Malaysian State Councils, BWI Indonesia each have their own data boundary, their own bank accounts, their own legal title.  
**Imara today:** Single-mosque instance. All Waqf assets belong to one tenant.  
**Gap:** No `institution_id`, no tenant isolation, no concept of multiple institutions sharing the platform.

---

### 2. Licence-controlled operating modes (Critical)

**IAAS:** A paid subscription does NOT unlock regulatory permission. Each module (Sadaqah, Zakat, Waqaf, Continuing Charity) requires verified evidence → independent compliance review → activation. Permission has an expiry date and can be suspended.  
**Imara today:** Admin can create any Waqf asset immediately. No licence wizard, no permission states.  
**Gap:** No `permission_status` model (`disabled → pending_review → active → suspended → expired`), no licence activation flow, no independent reviewer role separate from admin.

---

### 3. Am/Khas designation (Critical for Waqaf compliance)

**IAAS:** Every waqaf must be designated Am (general purpose) or Khas (specific purpose, deed-based). Khas waqaf cannot spend outside the deed. This is a non-bypassable check.  
**Imara today:** `WaqfAsset` has `type: 'cash' | 'property' | 'sukuk' | 'other'`. No Am/Khas field. No deed-based purpose restrictions.  
**Gap:** Missing `designation: 'am' | 'khas'`, missing `purpose_restrictions: string[]`, no deed-to-action enforcement.

---

### 4. Deed management / Document vault (Critical)

**IAAS:** Digital Passport = verified deed + assets + roles + full historical record. All decisions require auditable documents.  
**Imara today:** `shariah_cert_ref` and `registry_ref` are free-text strings. No document storage, no deed upload, no evidence attachments.  
**Gap:** No document vault, no deed entity, no evidence linking to transactions.

---

### 5. Jurisdiction packs with rule versions (High)

**IAAS:** SG, MY (state-by-state), ID each have their own rule configuration with effective dates, source citations, approver, and legal references. Rule version is stamped on every transaction.  
**Imara today:** `country` is a free-text string (`"Jordan"`, `"Global"`). No jurisdiction-specific rules, no rule versioning.  
**Gap:** No `JurisdictionPack` model, no `rule_version` on transactions, no jurisdiction-based workflow branching.

---

### 6. Double-entry ledger (High)

**IAAS:** Waqaf principal and income must occupy separate accounting buckets. Zakat must be distinct from sadaqah. The $100 journey must be traceable from donor intent → lawful custody → approval → claim/asset → settlement → reporting.  
**Imara today:** `principal`, `returns_available`, `returns_ytd`, `returns_lifetime` are four counters on `WaqfAsset`. Not a double-entry ledger. `WaqfTransaction` has `amount` and `note` but no `ledger_bucket`, no `custodian`, no `rule_version`, no `authorisation_ref`.  
**Gap:** No formal ledger model. Current system is accounting-lite — good for demo, not audit-grade.

---

### 7. Zakat as a regulated module (High)

**IAAS:** Zakat requires asnaf eligibility verification, authorised zakat administration, eligible asnaf distribution, and reconciliation — entirely different workflow from Sadaqah.  
**Imara today:** `DonationCategory` includes `'zakat'` as a label on the donation form. No asnaf model, no zakat authority verification, no asnaf distribution workflow.  
**Gap:** Zakat exists as a UI label only. Zero regulatory workflow behind it.

---

### 8. Beneficiary / claim management (High)

**IAAS:** The $100 journey ends at: beneficiary claim → evidence → settlement → outcome report. Claims must have evidence and approval before disbursement.  
**Imara today:** Disburse API takes `amount` + `note`. No beneficiary registry, no claim workflow, no evidence upload, no outcome reporting.  
**Gap:** Disbursement is admin-only free-form. No downstream beneficiary tracking.

---

### 9. Independent Shariah/compliance reviewer role (High)

**IAAS Safeguard:** "No self-approval by a client administrator to unlock regulated modules."  
**Imara today:** Single `admin` role. Admin creates assets, confirms shares, records returns, disburses — all without an independent check.  
**Gap:** No `compliance_reviewer` role, no second-approval workflow.

---

### 10. Sadaqah as regulated workflow (Medium)

**IAAS:** Sadaqah has mandatory treatment — donor purpose restrictions, approved charitable allocation, claim evidence, settlement report.  
**Imara today:** Donations accept `sadaqah` category and store to Redis. No allocation tracking, no claim evidence, no settlement.  
**Gap:** Sadaqah is a category label. IAAS wants it as a full fund-to-claim workflow.

---

### 11. Sadaqah Jariyah as distinct product (Medium)

**IAAS explicitly warns:** "Never use renaming to evade statutory waqaf requirements." Sadaqah Jariyah must be legally and substantively distinct from waqaf.  
**Imara today:** Not implemented.  
**Gap:** No Sadaqah Jariyah product at all.

---

### 12. Impact traceability (Medium)

**IAAS:** Asset → income → approved benefit → outcomes. Must show the full chain.  
**Imara today:** Transaction log shows contribution/return/disbursement. No outcomes field, no impact reporting.  
**Gap:** Disbursement is the last tracked step. IAAS wants it to continue to measurable outcomes.

---

## What Imara already has that aligns with IAAS

| IAAS requirement | Imara status |
|---|---|
| Principal never disbursed (code-enforced) | ✅ `disburse` API rejects if `amount > returns_available` |
| Principal and income tracked separately | ✅ `principal` vs `returns_available` are distinct fields |
| Non-custodial (platform doesn't own assets) | ✅ Correct mental model |
| Zero platform deduction from waqaf | ✅ No fee taken from waqaf funds |
| Multi-currency (USD, JOD, GBP, MYR...) | ✅ 8 currencies via `Intl.NumberFormat` |
| Shariah cert reference field | ✅ Free-text field exists |
| Registry reference (MUIS, JAWF, BWI) | ✅ Free-text field exists |
| Transaction history with types | ✅ `contribution \| return_earned \| disbursement \| admin_fee` |
| Asset status lifecycle | ✅ `active \| suspended \| terminated` |
| International waqaf (Jordan, Global) | ✅ Al-Quds Relief in JOD |

---

## Priority gaps to close for IAAS alignment

### For the next investor demo (adds immediate credibility)

1. Add `designation: 'am' | 'khas'` to `WaqfAsset` — the most visible Shariah compliance signal
2. Add `trustee_name` and `deed_ref` fields to `WaqfAsset` — shows mutawalli awareness
3. Add `jurisdiction_code` field (`SG`, `MY-JHR`, `ID-BWI`, `JO`, etc.) — replaces the free-text `country` string
4. Stamp `jurisdiction_code` and `rule_note` on `WaqfTransaction` — partial audit trail
5. Add a "Licence / Permissions" stub page in admin — shows the architecture exists even if not fully gated

### For Phase 2 (real IAAS build)

- Multi-tenancy with institution model
- Licence activation wizard (6-step flow from IAAS §4)
- Am/Khas deed-to-action enforcement (Khas blocks disbursement outside deed purpose)
- Double-entry ledger replacing the counter model
- Zakat module with asnaf workflow
- Beneficiary registry + claim workflow
- Compliance reviewer role separate from admin
- Document vault for deeds and evidence
- Jurisdiction packs (SG, MY, ID) with rule versioning

---

## Bottom line

Imara's Waqf MVP correctly captures the **financial controls** IAAS cares most about (principal protection, principal/income separation, non-custodial model, zero platform fee). That's the defensible core.

The **entire governance layer** is missing: licence activation, Am/Khas, deed management, jurisdiction packs, compliance reviewer, beneficiary claims, and audit-grade ledger. That's what transforms it from a mosque tool into the institutional IAAS infrastructure the Jordanian investor and Caliph BUMI are describing.

The quickest win: add `designation` (Am/Khas), `trustee_name`, `deed_ref`, and `jurisdiction_code` fields to the existing `WaqfAsset` type and surface them in the create form. That signals architectural intent without a full rewrite.
