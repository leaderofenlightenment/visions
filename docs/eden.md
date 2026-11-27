# Eden integration and fulfillment

## Available in VISIONS

Business links to Eden for creator education, research, and scheduling. The referral button uses Eric's URL and identifies it as an affiliate link. Paid Eden features depend on the learner's own Eden plan. [Eden referral program](https://eden.so/affiliates/) · [Eden plans](https://eden.so/help/account/plans-and-pricing/)

An enrolled VISIONS learner can send a draft to their own Eden Library.

1. In Eden, open **Settings → API** and create a personal key with Library edit access. For a limited key, leave unrelated scopes off. [Eden API key setup](https://eden.so/help/api/use-the-eden-api/)
2. In VISIONS, open **Business → Research, create, and publish → Send a business draft to Eden**. Load the Business Plan or enter a draft manually, then review the exact title and text.
3. Enter the key and confirm the transfer. VISIONS calls Eden's document creation endpoint. The request uses the learner's default Eden workspace. Scheduling and publication take place inside Eden. [Eden workspace API](https://eden.so/help/api/workspace-api/)

VISIONS requires enrollment and a same-origin request. The key is cleared from the browser form at submission and is used only for the server request to Eden. The integration does not persist it or load lifestyle answers, relationship records, course applications, or unpublished worksheet responses into the draft. If a transfer times out, check Eden before retrying.

## Include Eden with a VISIONS purchase

1. Apply for **Bundles and partner pricing** through Eden. Ask for the exact plan and term, whether the creator course is included, the cost per redeemed seat, support for existing Eden accounts, and how renewals and refunds work. Confirm which VISIONS tiers include Eden. [Eden partnerships](https://eden.so/partnerships/)
2. Ask how an eligible customer redeems access. A partner claim link or a batch of one-time codes can serve the initial launch. Send the assigned code or claim link after confirming payment. Ask Eden for an approved provisioning method if access should be granted automatically. Eden's public store API grants access to products in your Eden store. The partner agreement must establish how an Eden platform subscription is delivered. [Eden Store API](https://eden.so/developers/store-reference/)
3. When you have a checkout provider and approved fulfillment method, use a verified payment event to grant the VISIONS tier and issue the Eden entitlement once per order. Store fulfillment state and follow the agreed refund and cancellation rules. Test successful payments, duplicate notifications, existing Eden accounts, and refunds before advertising included access.

Current release uses owner-assigned VISIONS enrollment. Checkout, automated Eden account provisioning, and revocation require the commercial agreement and payment setup above.
