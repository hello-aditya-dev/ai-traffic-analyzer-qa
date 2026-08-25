# Licensing

**AI Traffic Analyzer** is sold as a **source-code product**, not as a SaaS. When you purchase a license, you receive a copy of the complete source code under the terms of the tier you bought. The creator retains all intellectual property rights in the original work.

This document describes the four license tiers, what each permits, and the restrictions that apply across all tiers. The binding legal text is the root `LICENSE.md`. If anything here is ambiguous, the `LICENSE.md` text controls.

---

## 1. Important Principles (All Tiers)

1. **This is a commercial proprietary license.** It is not MIT, GPL, Apache, or any open-source license. Do not treat the repository as open source.
2. **The creator retains IP.** Buying a license grants you a copy and a set of rights. It does not transfer ownership of the original product, its name, or its trademarks.
3. **You own your customizations.** Changes you make to your copy are yours. The underlying original code remains the creator's IP.
4. **Redistribution of source is tier-restricted.** Lower tiers cannot redistribute source at all. Higher tiers (Extended/Reseller) may, under the conditions in §6.
5. **No implied warranty.** The software is provided "AS IS". See `LICENSE.md` for the full disclaimer.
6. **No enforcement, biometric, or surveillance-implication features are licensed as capabilities.** The product does not perform facial recognition, biometric identification, person re-identification, automated enforcement, or fines. You are responsible for the legal basis of any deployment that processes video of people or vehicles, regardless of license tier.
7. **Prices are not hardcoded in the application.** Prices live in `marketing/PRODUCT_LISTING.md` as marketing metadata and can be changed without touching application logic. The application never reads prices.

---

## 2. Tier Overview

| Tier | Price (launch) | Best for | Deployments | Source redistribution | White-label |
| --- | --- | --- | --- | --- | --- |
| **Personal** | $59 | Evaluation, learning, internal experimentation | 1 internal (non-commercial) | Not permitted | No |
| **Commercial** | $199 | One organization running it in production | 1 commercial deployment | Not permitted | No |
| **Agency** | $499 | Agencies/customizers delivering to multiple clients | Multiple client projects (per-client) | Not permitted (you deliver **deployed** artifacts or your own customizations, not the raw original source) | Limited (your client-facing fork) |
| **Extended / Reseller** | $999+ | Resale, extended distribution, broad white-label | Unlimited (per terms) | Permitted under the reseller schedule | Yes |

> Prices are launch positioning targets and are editable in `marketing/PRODUCT_LISTING.md`. They are not encoded in the application.

---

## 3. Personal — $59

**Permits:**

- Download and read the complete source code.
- Run one internal instance for evaluation, learning, and non-commercial experimentation.
- Make modifications for your own learning.
- Use the `mock` provider or any provider you configure.

**Restrictions:**

- No commercial deployment.
- No redistribution of the source code, in whole or in part.
- No re-sale, no sub-licensing.
- Cannot be used to deliver a service to a third party.
- Modifications you make are for your own use only; you may not distribute modified versions.

**Recommended for:** developers evaluating whether the product fits their needs, students, and internal R&D teams building a proof of concept.

---

## 4. Commercial — $199

**Permits:**

- One commercial deployment of the product, in source or built form, for one organization.
- Internal customization of the source to fit your use case.
- Use of any configured AI provider.
- Generation and distribution of **outputs** (reports, exports, screenshots) produced by your deployment. Outputs are your data, not the software.

**Restrictions:**

- One commercial deployment. A "deployment" is a single running instance serving one organization's users. Additional deployments require additional Commercial licenses or an upgrade.
- No redistribution of the source code to third parties.
- No re-sale of the product or a rebranded version.
- You may not remove or obscure license/branding notices except as explicitly permitted (and only if your tier includes white-label rights — Commercial does not).

**Recommended for:** A single organization that wants to run AI Traffic Analyzer internally or as part of an internal product.

---

## 5. Agency — $499

**Permits:**

- Multiple deployments of the product across multiple client projects, **where each deployment is delivered as a customized or deployed system to that client**.
- Customization of the source for each client engagement.
- Use of any configured AI provider.
- Distribution of outputs (reports, exports) to your clients.

**Restrictions:**

- You may deliver **deployed/customized systems** to your clients. You may **not** deliver the **raw original source code** of AI Traffic Analyzer to clients. If a client requires source access, they must purchase their own license, or you must operate under the Extended/Reseller tier.
- You may not sell or distribute the product as-is under your own brand.
- Each client deployment must be related to a real client engagement; this is not a blanket redistribution license.
- Branding: you may rebrand your client-facing fork (logo, colors, product name) for that client. You may not strip the underlying IP-ownership clause from `LICENSE.md`.

**Recommended for:** AI agencies, traffic consultancies, system integrators who deliver traffic analytics solutions to multiple clients and need to customize per engagement.

---

## 6. Extended / Reseller — $999+

**Permits:**

- Unlimited deployments of the product.
- Redistribution of the source code **as part of a product you sell** under your own brand (white-label), subject to the reseller schedule in `LICENSE.md`.
- Customization, rebranding, repackaging, and resale of modified versions.
- Inclusion of the product within a larger commercial offering.
- Distribution of outputs without restriction.

**Restrictions:**

- You may not represent the original product as your own creation in a way that conflicts with the creator's retained IP. The `LICENSE.md` clause acknowledging creator IP must remain in redistributed source, even in rebranded distributions, except where a separate written agreement explicitly waives it.
- The reseller schedule defines which artifacts (source, built binaries, Docker images, etc.) you may redistribute and under what conditions. See `LICENSE.md` for the binding text.
- This is **not** an open-source grant. Recipients of your redistribution receive rights from you, not from the original creator, and the redistribution chain terminates at your direct customers unless separately licensed.
- Trademarks: you may not use the creator's product name, logo, or trademarks to imply endorsement, certification, or affiliation, except as expressly permitted in writing.

**Recommended for:** Companies that want to white-label and resell AI Traffic Analyzer as part of their own product portfolio, or that need broad internal deployment rights.

---

## 7. What Every Tier Permits

Regardless of tier:

- Use of any AI provider (mock, generic-http, or your own local-inference worker). The provider is your choice; the product does not bundle or require a specific commercial AI vendor.
- Generation, ownership, and distribution of analysis outputs (counts, events, reports, exports) produced by your deployment. Outputs are your data.
- Backups, internal forks for your own development, and modifications that you do not redistribute.

---

## 8. What No Tier Permits

- Claiming ownership of the original product's intellectual property.
- Removing or altering the IP-ownership clause in `LICENSE.md` (except as expressly permitted in writing for the Extended/Reseller tier, and only within the limits set there).
- Representing the product as licensed for surveillance, enforcement, or biometric identification use cases. The product does not perform facial recognition, biometric identification, person re-identification, automated enforcement, or fines, and no tier grants a right to claim otherwise.
- Using the product in a way that infringes third-party rights (e.g. the licenses of bundled dependencies — see `docs/THIRD_PARTY_LICENSES.md`). You remain responsible for compliance with the licenses of the dependencies included in your deployment.
- Sublicensing the product or a modified version under an open-source license without explicit written permission.

---

## 9. Pricing Is Configurable

The prices above are launch positioning targets and live in `marketing/PRODUCT_LISTING.md`. The application does **not** read prices and does **not** enforce tier checks at runtime. There is no license-key check, no phone-home, and no telemetry.

If you (as a buyer operating under the Agency or Extended/Reseller tier) choose to sell the product or a customized version of it, you are responsible for your own billing, fulfillment, and license-key mechanisms. V1 intentionally ships without billing infrastructure (see the "Not Included" list in `marketing/PRODUCT_LISTING.md`).

---

## 10. Upgrades

- Upgrade from Personal → Commercial: pay the price difference (at the creator's discretion).
- Upgrade from Commercial → Agency: pay the price difference.
- Upgrade from Agency → Extended/Reseller: pay the price difference.

Upgrades do not require re-deployment. Your existing customizations remain yours.

---

## 11. Refunds

Refunds (if any) are governed by the storefront from which you purchased the license, not by this document. The product is delivered as digital source code; once the source has been downloaded, some storefronts do not offer refunds. Review the storefront's refund policy before purchasing.

---

## 12. Support

- **Personal:** Community resources only (if any). No guaranteed response time.
- **Commercial:** Best-effort email support, target first response within 5 business days.
- **Agency:** Best-effort email support, target first response within 3 business days.
- **Extended/Reseller:** Priority email support, target first response within 2 business days, plus one onboarding call if purchased.

Support covers the **product as shipped**. It does not cover your customizations, your AI provider's APIs, your hosting environment, or your data. Issues caused by modifications you made are out of scope unless separately agreed.

---

## 13. Cross-References

- `LICENSE.md` (repo root) — binding legal text.
- `marketing/PRODUCT_LISTING.md` — pricing, storefront copy, FAQ.
- `docs/THIRD_PARTY_LICENSES.md` — licenses of bundled dependencies.
- `docs/SECURITY.md` — privacy-by-default notes and your responsibility for legal basis.
