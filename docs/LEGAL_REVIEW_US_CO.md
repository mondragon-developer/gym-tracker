# U.S. and Colombia launch: legal review packet

Prepared October 2, 2026. Intended audience: the owner and retained U.S./Colombian counsel. This is an engineering fact sheet and decision list, not approved legal language or a certification of compliance. Nothing in this packet has been sent to counsel or published as policy.

## Scope and documents

Initial audience: adults in the United States and Colombia. The service is a bilingual English/Spanish workout-planning and recording web app/PWA, currently free. It offers templates, exercise demonstrations, AI-generated plans, and independent trainer/client sharing. It is not intended to diagnose or treat conditions. A country-scoped launch plan does not itself restrict website access from other countries.

The current documents name **Jose Mondragon** as operator, use Florida governing law, and give **legal@mdragonsolutions.com** as the contact. Company registration, business address, insurance and operation of this mailbox have not been verified.

Review materials:

- [Current terms, privacy policy and consent summary (EN/ES)](../src/legal/legalText.js), version [2026-10-01](../src/legal/version.js).
- [Readable snapshot of those documents](legal-review/2026-10-01-policy-snapshot.md). This is a review copy generated from the local source, not proof of what every historical deployment served.
- [Consent storage and acceptance RPC](../supabase/legal-acceptance.sql), [consent UI gate](../src/components/LegalGate.jsx).
- [Trainer access release and acceptance procedure](TRAINER_ACCESS_RELEASE.md), [new trainer access migration](../supabase/trainer-access.sql).
- [Account deletion implementation](../supabase/functions/delete-account/index.ts), [workout backup format](../src/utils/backup.js).
- [AI instructions and deployment notes](chatbot/README.md), [remaining launch work](WISHLIST.md).

No public policy text or `LEGAL_VERSION` has been changed by this release. Counsel-approved substantive revisions need synchronized EN/ES text and a new version before publication.

## Data inventory

This inventory describes repository behavior and policy statements. It does not verify dashboard settings, executed migrations, vendor agreements, retention configuration or subprocessor lists.

| Data / purpose | Recipients and storage | Deletion / retention evidence | Owner evidence still needed |
|---|---|---|---|
| Email, optional/provider name, password authentication, OAuth identity, sessions | Supabase Auth; Google for Google sign-in; authentication email delivery provider | Auth deletion function removes the caller's account. Credentials/session handling is delegated to Supabase. | Actual SMTP provider, project region, log and backup retention, contracts; verify profile email stays synchronized after account changes. |
| Workout plans/history, weights lifted, reps, completed sets, notes and custom movements | Supabase `workout_plans`; authorized trainers and admins; browser storage | Account deletion cascades app rows. Browser copies remain until cleared. | Production RLS tests, backup expiry and restore process; verify which data persists on shared devices/sign-out. |
| Preferences, activity timestamps, role/profile | Supabase `user_preferences` / `profiles`, browser storage | Account-linked rows cascade; browser settings persist. | Minimize staff access; confirm actual log retention and staff MFA. |
| Trainer links and invite codes; pending invitation reminder | Supabase `trainer_clients`, profiles and auth metadata | New self-service approval stores time/version/language on the relationship. Removal deletes the relationship; account deletion cascades. | Whether historical/admin assignments need fresh approval; lawful evidence-retention policy. |
| Global terms acceptance, language and version | Supabase `legal_acceptances`; local acceptance cache | Account deletion removes server acceptance records. Exact policy text is not stored with each row. | Whether to retain limited evidence after deletion; immutable publication snapshots and approved retention duration. |
| Chat prompts and AI responses | Chatbase and its configured model provider; administrators may read chats | No integrated chat deletion in the app. Policy directs users to email for deletion. | Current model/provider, region, training-use settings, retention, deletion/export procedure, DPA/subprocessors, user/session identification method. |
| Feedback name/email/message | EmailJS and the receiving mailbox/provider | Separate from account deletion; manual request route disclosed | Template fields, actual receiving mailbox, retention in both systems, deletion steps and request authentication. |
| Invite recipient address and invitation message | Supabase Edge Function → Brevo transactional API | Recipient delivery records may exist independently of app account | Brevo log/message retention, processing contract, abuse limits, handling unsolicited invites and recipient objections. |
| Rest-timer push endpoint/subscription and schedule | Supabase function/table and browser push provider (e.g. Apple, Google, Mozilla) | Code describes sent-row deletion and later cleanup of canceled rows; account cascade | Deployed cleanup schedule, provider logs, notification contents and minimum retention. |
| Hosting/network metadata such as requests/IP information | Vercel (identified in policy), Supabase and other contacted providers | Not covered by the app's account-row cascade | Actual hosting analytics/cookies/security logs, purposes, retention and access; verify the policy's no-tracking claim against deployed scripts. |
| Exercise media/text and licenses | App bundle and Supabase Storage | Not per-user information | Original license evidence, permission for each media source and required attribution/notices. |

The backup download contains workout history. It is **not** a complete subject-access export of auth/profile, legal acceptance, chat, feedback and vendor logs. Do not describe it as fulfilling every possible privacy-access request.

## Questions for U.S. counsel

1. Evaluate the release of exercise risks, negligence language, $50/minimum fee-based liability cap, indemnity and forum clause for the actual service. Identify non-waivable duties and any state-specific changes. Review the trainer relationship language against actual control, marketing and administrative assignment powers.
2. Determine whether identifiable workout records and client/trainer inputs bring the service within the FTC Health Breach Notification Rule. Document the multiple-source analysis and incident obligations; do not assume either HIPAA coverage or exemption from privacy rules. [FTC applicability guidance](https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0).
3. Assess Washington consumer-health-data law and other relevant state health/general privacy laws, including Nevada and threshold-dependent requirements elsewhere. Identify any separate notice, consent, sharing, deletion/appeal or processor-contract requirements. Florida review alone is not nationwide clearance. [Washington Attorney General guidance](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy).
4. Confirm appropriate adult-only onboarding and response to known minors. The current age acknowledgment occurs after account creation, so it does not prevent initial collection from someone who later declines the age/terms screen.
5. Review the AI assistant's actual prompts, responses, name and marketing claims, including the tension between personalized-looking plans and the statement that nothing is a program designed for the user. Confirm wellness positioning and boundaries rather than relying on a disclaimer alone. [FDA general-wellness guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices).
6. Advise on entity formation, contracting party, trainer terms, liability/cyber insurance and any bodily-injury or AI exclusions. No insurance coverage is established by this packet.

## Questions for Colombian counsel

1. Determine applicability and the operator's controller/processor roles under Ley 1581 and implementing rules, including any Colombian presence or registration obligations. Review whether exercise records or inferences are sensitive data; whether a distinct express authorization is needed; and whether optional processing can be refused without losing core service. [Ley 1581](https://www.cancilleria.gov.co/normograma/compilacion/docs/ley_1581_2012.htm).
2. Map each international data flow as a transfer or transmission and specify the correct mechanism, contracts and disclosures. The current policy's blanket authorization for overseas processing is a review point, not evidence that every provider arrangement is valid.
3. Confirm the Spanish privacy notice/controller identification, request channels, evidence of authorization, and procedures for consultations and complaints. The policy currently promises 10 business days for consultations and 15 for complaints; define applicable extensions, routing and calendar handling before making operational commitments.
4. Review the liability cap, indemnity, releases, Florida forum, English-precedence clause and discontinuation rights against mandatory consumer protections. Article 43 addresses ineffective abusive clauses, including limits on statutory supplier duties and waiver of consumer rights. [Ley 1480](https://normograma.crcom.gov.co/crc/compilacion/docs/ley_1480_2011.htm).
5. Identify any Spanish consumer-service, operator identification, complaint or later paid-service requirements. Confirm RNBD applicability rather than assuming every small foreign app must register or is exempt.

## Operational decisions before broad release

| Owner | Decision or evidence | Completion criterion |
|---|---|---|
| Owner + counsel | Operating entity, address and insurance | Exact contracting identity approved; required coverage/exclusions reviewed. |
| Owner | Privacy/support mailbox | A test request is received and answered; primary and backup handlers assigned. |
| Owner + counsel | Retention schedule | Named duration/trigger for each inventory row, including logs, backups, chat and consent evidence. No vague promise of immediate deletion everywhere. |
| Engineering + owner | Provider inventory | Actual regions, model, processors/subprocessors, settings and executed agreements collected without exposing API keys. |
| Engineering | Trainer permissions | Migration and rollback-only SQL pass in staging; two-trainer/client acceptance pass; historical/admin assignment policy resolved. |
| Owner + counsel | Privacy requests | Verified identity with minimal additional collection; request register, deadlines, vendor tasks, exceptions and response template. Test access/correction/deletion end to end. |
| Engineering + owner | Security incidents | Named lead and counsel contact, containment steps, evidence preservation and jurisdiction-specific notification decision process. Rehearse a synthetic incident. |
| Owner | AI release | Upload/retrain approved EN/ES sources; warning visible; synthetic safety evaluation logged; domain/rate settings verified. Optional loading/session reset remains separate engineering work. |
| Engineering | Public legal URLs and accessibility | Policies available without login at stable URLs; mobile/keyboard/EN/ES acceptance checks completed. |
| Owner | Content licenses | Source/license manifest and notices retained for all distributed exercise materials. |

## Proposed privacy-request workflow for approval

1. Receive and timestamp the request in a restricted register; assign a handler and the applicable deadline. Confirm receipt without requesting diagnoses or unnecessary identity documents.
2. Verify control of the relevant account using an appropriate existing channel. For anonymous chat or feedback, agree on a safe way to locate the record without disclosing someone else's conversation.
3. Identify all applicable records from the inventory, including external vendors and trainer-held copies. Escalate retention exceptions or independent trainer-controller questions to counsel.
4. Execute approved actions, record provider confirmations, and explain any lawful exceptions, backup expiry or local-device limitations. Never equate deleting a database row with deleting every vendor copy.
5. Respond in the requester's language and retain only the request-handling evidence allowed by the approved schedule.

This procedure is proposed, not an existing staffed service. Before release, attach counsel's decisions, vendor evidence and the completed staging record. Paid tiers, international expansion and new health/readiness features require a new scope review.
