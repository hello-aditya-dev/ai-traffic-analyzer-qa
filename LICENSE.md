# AI Traffic Analyzer — Software License Agreement

**Version 1.0.0 — Effective with the initial release of AI Traffic Analyzer**

This Software License Agreement ("Agreement") is a legal agreement between you ("Licensee", "you", or "your") and the copyright holder of AI Traffic Analyzer ("Licensor", "we", or "us") governing your use of the AI Traffic Analyzer software product, including its source code, documentation, and accompanying files (collectively, the "Software").

By downloading, installing, copying, modifying, deploying, or otherwise using the Software, you agree to be bound by the terms of this Agreement. If you do not agree, do not use the Software.

This is a **proprietary** commercial license. It is not an open-source license (it is not MIT, GPL, Apache, or any similar license). The Software is sold as a source-code product under the rights granted by your purchased license tier.

---

## 1. Intellectual Property

1.1 **Ownership.** The Licensor retains all right, title, and interest in and to the Software, including all intellectual property rights therein. The Software is licensed, not sold. This Agreement grants you a copy of the Software and a limited set of rights; it does not transfer ownership of the Software or its intellectual property to you.

1.2 **Your modifications.** Modifications you make to your copy of the Software are your property. The underlying original Software remains the property of the Licensor. Nothing in this Agreement transfers ownership of the original Software to you, even if you substantially modify your copy.

1.3 **Third-party components.** The Software includes third-party open-source components, each of which is governed by its own license. Those licenses continue to apply to the respective components and are not superseded by this Agreement. See `docs/THIRD_PARTY_LICENSES.md` for the full list and license obligations. You are responsible for compliance with the licenses of all third-party components included in your deployment.

1.4 **Trademarks.** This Agreement does not grant you any right to use the trade names, trademarks, service marks, or product names of the Licensor, except as required to reproduce the attribution notices required by this Agreement or by the third-party licenses. You may not use the Licensor's marks in a way that implies endorsement, certification, or affiliation.

---

## 2. License Tiers

The rights granted to you depend on the license tier you purchased. The tier descriptions below are summaries; the specific rights and restrictions for each tier are set out in Sections 3 through 6. If there is a conflict between a tier summary and the specific provisions, the specific provisions control.

| Tier | Price (launch) | Summary |
| --- | --- | --- |
| **Personal** | $59 | Evaluation, learning, and internal non-commercial experimentation only. |
| **Commercial** | $199 | One commercial deployment for one organization. |
| **Agency** | $499 | Multiple client deployments as customized/deployed systems; limited white-label. |
| **Extended / Reseller** | $999+ | Unlimited deployments; source redistribution and white-label permitted under this Agreement. |

Prices are launch positioning targets and are recorded as marketing metadata in `marketing/PRODUCT_LISTING.md`. They are not read by the Software and may be changed without modifying the Software.

---

## 3. Personal Tier

3.1 **Permitted.** Subject to your compliance with this Agreement, you may:
- (a) download and read the complete source code of the Software;
- (b) run one internal instance of the Software for evaluation, learning, and non-commercial experimentation;
- (c) modify the Software for your own internal learning and experimentation;
- (d) use any AI provider configuration supported by the Software (including the `mock` provider, the `generic-http` adapter, or a `local-inference` worker you implement).

3.2 **Prohibited.** You may not, under the Personal tier:
- (a) use the Software in any commercial deployment, product, or service;
- (b) redistribute the Software, in whole or in part, in source or binary form, to any third party;
- (c) sell, sublicense, lease, rent, or otherwise transfer rights to the Software;
- (d) use the Software to deliver any service to a third party;
- (e) remove or alter any copyright, attribution, or license notice in the Software.

3.3 **Modifications.** Modifications you make are for your own use only. You may not distribute modified versions of the Software under the Personal tier.

---

## 4. Commercial Tier

4.1 **Permitted.** Subject to your compliance with this Agreement, you may:
- (a) exercise all rights granted under the Personal tier;
- (b) deploy the Software in one commercial deployment for one organization, in source or built form;
- (c) modify the Software for internal use in that deployment;
- (d) generate, own, and distribute the outputs (reports, exports, snapshots) produced by your deployment — outputs are your data, not the Software;
- (e) make backups of the Software for your own disaster-recovery purposes.

4.2 **Prohibited.** You may not, under the Commercial tier:
- (a) deploy the Software in more than one commercial deployment — additional deployments require additional Commercial licenses or an upgrade to a higher tier;
- (b) redistribute the Software, in whole or in part, in source or binary form, to any third party;
- (c) sell, resell, sublicense, lease, rent, or otherwise transfer rights to the Software;
- (d) remove or alter the copyright, attribution, IP-ownership, or license notices in the Software, except where this Agreement or the third-party licenses expressly permit modification of notices;
- (e) use the Software in a way that violates the third-party licenses of bundled components.

---

## 5. Agency Tier

5.1 **Permitted.** Subject to your compliance with this Agreement, you may:
- (a) exercise all rights granted under the Commercial tier, extended to multiple client projects;
- (b) deploy customized and/or deployed instances of the Software for multiple client engagements, provided each deployment is associated with a real client engagement and is delivered to that client as a deployed or customized system;
- (c) modify the Software per client engagement;
- (d) rebrand the client-facing fork of the Software for each client (logo, colors, product name) provided that you do not remove or obscure the IP-ownership clause in this `LICENSE.md` file;
- (e) distribute the outputs (reports, exports, snapshots) produced by your deployments to your clients.

5.2 **Prohibited.** You may not, under the Agency tier:
- (a) deliver the **raw original source code** of the Software to your clients. If a client requires source access, the client must purchase its own license, or you must operate under the Extended/Reseller tier;
- (b) sell or distribute the Software as-is under your own brand as a product (this requires the Extended/Reseller tier);
- (c) redistribute the Software to parties that are not your direct clients under a real engagement;
- (d) use the Agency tier as a vehicle for unlimited resale — each deployment must correspond to a real client engagement;
- (e) remove or alter the IP-ownership clause in this `LICENSE.md` file.

---

## 6. Extended / Reseller Tier

6.1 **Permitted.** Subject to your compliance with this Agreement, you may:
- (a) exercise all rights granted under the Agency tier, extended to unlimited deployments;
- (b) redistribute the Software, in whole or in part, in source or binary form, as part of a product you sell under your own brand, subject to the redistribution conditions in Section 7;
- (c) rebrand, repackage, and customize the Software for resale;
- (d) include the Software within a larger commercial offering;
- (e) distribute the outputs of the Software without restriction;
- (f) grant your direct customers rights to use the redistributed product under your own terms, provided those terms are at least as restrictive as this Agreement with respect to the underlying original Software.

6.2 **Prohibited.** You may not, under the Extended/Reseller tier:
- (a) represent the original Software as your own creation in a way that conflicts with the Licensor's retained IP under Section 1;
- (b) remove or obscure the IP-ownership clause in this `LICENSE.md` file in redistributed source distributions, except where a separate written agreement with the Licensor expressly permits it;
- (c) grant your customers rights that purport to sublicense the original Software under an open-source license (e.g. MIT, GPL, Apache) without the Licensor's prior written permission;
- (d) use the Licensor's trademarks to imply endorsement, certification, or affiliation, except as expressly permitted in writing;
- (e) redistribute the Software in a manner that violates the third-party licenses of bundled components.

---

## 7. Redistribution Conditions (Extended / Reseller Tier only)

If you redistribute the Software under Section 6, you must:

7.1 **Retain attribution.** Include a copy of this `LICENSE.md` file (or an equivalent notice that references this Agreement and the Licensor's retained IP) in every redistribution of the source code of the Software.

7.2 **Honor third-party licenses.** Comply with the licenses of all third-party components included in the Software, as listed in `docs/THIRD_PARTY_LICENSES.md`. This includes, without limitation, retaining copyright and permission notices for MIT, Apache-2.0, BSD, ISC, and similar licenses, and complying with the LGPL (and avoiding GPL obligations where applicable) for components such as `libvips` and `FFmpeg`.

7.3 **Termination of the redistribution chain.** Recipients of your redistribution receive rights from you, not from the Licensor. Your customers' rights to further redistribute the Software are governed by their agreement with you, not by this Agreement, unless they separately purchase a license directly from the Licensor.

7.4 **No implied warranty from the Licensor.** Your redistributions are made on your own warranty and support terms. The Licensor's disclaimer of warranty (Section 10) applies to the Software as originally delivered and is not extended by you to your customers unless you choose to do so at your own cost.

7.5 **What you may redistribute.** You may redistribute the source code, built binaries, Docker images, or modified versions of the Software, provided the conditions in this Section are met.

7.6 **What you may not represent.** You may not represent that your redistribution is the official or original AI Traffic Analyzer product, nor that it is endorsed or certified by the Licensor.

---

## 8. Common Provisions (All Tiers)

8.1 **Outputs are yours.** The outputs of the Software (vehicle counts, classifications, tracks, events, reports, exports, snapshots) are your data. You own them and may distribute them subject to applicable law and your responsibility for the legal basis of processing the video that produced them (see Section 11).

8.2 **Provider independence.** The Software is vendor-neutral with respect to AI inference. You may use the `mock` provider, the `generic-http` adapter with any compatible vision API, or a `local-inference` worker you implement. The Licensor does not warrant the accuracy, availability, or lawfulness of any third-party AI provider you configure.

8.3 **No enforcement or surveillance capabilities.** The Software does not perform facial recognition, biometric identification, person re-identification, automated enforcement, or fines. No license tier grants a right to claim that the Software performs these capabilities. The estimated-speed feature is a relative motion indicator and is **not** a certified measurement. You may not use the Software, or represent the Software as being usable, for automated law-enforcement decisions.

8.4 **No phone-home.** The Software does not contact the Licensor's servers and does not transmit telemetry. You are responsible for your own deployment, billing (if applicable), and license enforcement.

8.5 **Prices are not contractual.** Prices listed in `marketing/PRODUCT_LISTING.md` are positioning targets and may be changed. The rights granted by your purchased tier are contractual and are not affected by price changes after your purchase.

8.6 **Upgrades.** You may upgrade to a higher tier by paying the price difference at the Licensor's then-current rates. Upgrades do not require re-deployment. Your existing modifications remain yours.

8.7 **Refunds.** Refunds (if any) are governed by the storefront from which you purchased the license. The Software is delivered as digital source code; some storefronts do not offer refunds after download.

8.8 **Support.** Support entitlements by tier are described in `docs/LICENSING.md`. Support covers the Software as shipped and does not cover your customizations, your AI provider's APIs, your hosting environment, or your data.

---

## 9. Restrictions (All Tiers)

You may not, regardless of tier:

9.1 Reverse engineer, decompile, or disassemble any portion of the Software that is provided to you in binary form only, except to the extent that applicable law prohibits this restriction.

9.2 Remove, alter, or obscure any copyright, trademark, attribution, IP-ownership, or license notice in the Software, except as expressly permitted by this Agreement or by a third-party license.

9.3 Use the Software in violation of applicable law, including any law governing privacy, surveillance, biometric processing, or automated decision-making.

9.4 Use the Software to process video in a manner that infringes the rights of any third party, including privacy and publicity rights.

9.5 Sublicense the Software, or a modified version of it, under an open-source license, without the Licensor's prior written permission.

9.6 Represent the Software as certified, accredited, or warranted for any safety-critical, enforcement, or regulated use case.

9.7 Use the Licensor's trademarks to imply endorsement, certification, or affiliation, except as expressly permitted in writing.

---

## 10. Disclaimer of Warranty

THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. THE LICENSOR DOES NOT WARRANT THAT THE SOFTWARE WILL BE ERROR-FREE, UNINTERRUPTED, ACCURATE, OR SUITABLE FOR ANY PARTICULAR PURPOSE, NOR THAT DEFECTS WILL BE CORRECTED.

THE `mock` AI PROVIDER IS DETERMINISTIC AND SYNTHETIC. ITS OUTPUT IS NOT REPRESENTATIVE OF REAL-WORLD TRAFFIC AND MUST NOT BE USED FOR OPERATIONAL DECISIONS. THE ESTIMATED-SPEED FEATURE IS A RELATIVE MOTION INDICATOR AND IS NOT A CERTIFIED OR CALIBRATED MEASUREMENT.

YOU BEAR ALL RISK OF USE OF THE SOFTWARE, INCLUDING THE SELECTION OF ANY AI PROVIDER AND THE ACCURACY OF ITS OUTPUT.

---

## 11. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, BUSINESS, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SOFTWARE, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, EVEN IF THE LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

THE TOTAL AGGREGATE LIABILITY OF THE LICENSOR UNDER THIS AGREEMENT SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE LICENSE. THIS LIMITATION APPLIES EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.

---

## 12. Privacy and Legal Basis

12.1 The Software does not perform facial recognition, biometric identification, or person re-identification. It analyzes vehicle motion and counts.

12.2 You are solely responsible for establishing and documenting the legal basis for processing any video with the Software in your jurisdiction, including compliance with applicable privacy and data-protection laws (such as the GDPR, CCPA, and local CCTV and traffic regulations), posting any required notices, and honoring data-subject rights.

12.3 You are responsible for retention limits on source videos, snapshots, and reports, and for securing any personal data that may be incidentally captured in video.

12.4 The Licensor does not process your data. The Software runs entirely on your infrastructure.

---

## 13. Termination

13.1 This Agreement terminates automatically if you breach any of its terms, subject to any cure period required by applicable law.

13.2 Upon termination, you must cease all use of the Software and destroy all copies in your possession or control, except that:
- (a) you may retain copies solely for archival/disaster-recovery purposes, provided they are not used; and
- (b) outputs you have already generated remain your data and are not affected by termination.

13.3 Sections 1 (Intellectual Property), 9 (Restrictions), 10 (Disclaimer), 11 (Limitation of Liability), 12 (Privacy and Legal Basis), 14 (Governing Law), and 15 (Miscellaneous) survive termination.

13.4 Termination of this Agreement does not affect the rights of your customers under the Extended/Reseller tier to use redistributions they have already received from you, subject to the terms under which you granted those rights.

---

## 14. Governing Law and Dispute Resolution

14.1 This Agreement is governed by the laws of the jurisdiction in which the Licensor is established, without regard to its conflict-of-laws principles.

14.2 The parties shall attempt in good faith to resolve any dispute informally before initiating formal proceedings.

14.3 Any claim or dispute arising out of or related to this Agreement shall be brought exclusively in the courts of the Licensor's jurisdiction, except where prohibited by applicable consumer-protection law.

---

## 15. Miscellaneous

15.1 **Entire agreement.** This Agreement, together with `docs/LICENSING.md` (tier descriptions) and `docs/THIRD_PARTY_LICENSES.md` (third-party license obligations), constitutes the entire agreement between you and the Licensor regarding the Software.

15.2 **Amendment.** The Licensor may amend this Agreement from time to time. Amendments apply prospectively to copies of the Software downloaded after the effective date of the amendment. Your existing license continues under the terms in effect at the time of your purchase, except where required by law or where you accept an amended agreement by continuing to use a newer version of the Software.

15.3 **Assignment.** You may not assign or transfer this Agreement or your rights under it without the Licensor's prior written consent, except in connection with a merger, acquisition, or sale of all or substantially all of your assets, provided the assignee agrees in writing to be bound by this Agreement.

15.4 **Severability.** If any provision of this Agreement is held unenforceable, the remaining provisions remain in full force and effect.

15.5 **Waiver.** No waiver of any provision of this Agreement is effective unless in writing and signed by the waiving party. No failure or delay in exercising any right is a waiver of that right.

15.6 **Headings.** Section headings are for convenience only and do not affect interpretation.

15.7 **Contact.** For questions about this Agreement, contact the Licensor at the address listed in `marketing/PRODUCT_LISTING.md`.

---

## 16. Acknowledgement

BY USING THE SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ THIS AGREEMENT, UNDERSTAND IT, AND AGREE TO BE BOUND BY ITS TERMS AND CONDITIONS.

You further acknowledge that the Software is a source-code product licensed under a tiered commercial model, that it is not open-source software, and that the Licensor retains all intellectual property rights in the original Software.

---

*AI Traffic Analyzer — Software License Agreement v1.0.0. Companion documents: `docs/LICENSING.md` (tier explanations), `docs/THIRD_PARTY_LICENSES.md` (third-party licenses), `marketing/PRODUCT_LISTING.md` (pricing).*
