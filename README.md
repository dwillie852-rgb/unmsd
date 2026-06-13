# Doctors Without Border Website

Working local product for a humanitarian medical relief organisation with programmes, field operations, support pathways, accountability, staff care, and a dedicated leave relief application workflow.

## Open locally

Run the product server:

```sh
npm start
```

Then visit `http://localhost:4173`.

The admin dashboard is available at `http://localhost:4173/admin.html`.

For local development, the default admin token is:

```text
local-admin-token
```

Set a real token before deployment:

```sh
ADMIN_TOKEN="replace-with-a-long-secret" npm start
```

## What is included

- Mission-led homepage modeled on medical humanitarian operations.
- About and principles section for impartial care, independence, and local partnership.
- Programme sections for emergency care, HIV/AIDS/TB/malaria, mobile clinics, and displacement care.
- Emergency desk, donor/support, roster, and accountability sections.
- Field desk filter for conflict, displacement, and outbreak operations.
- Staff-care area on the homepage that links to a full `leave-relief.html` programme page.
- Dedicated leave relief page with process, eligibility, fee use, documents, FAQ, and a live replacement staffing cost estimate.
- Transparent fee breakdown for replacement coverage, handover, travel coordination, and operations reserve.
- Privacy and terms pages that describe data controls, fee/refund rules, deployment requirements, and payment requirements.
- Local `vendor/lucide.min.js` icon bundle so the site does not depend on a third-party script at runtime.
- Node product server with `/api/leave-applications`, persistent JSON storage, server-side validation, admin status updates, payment-status tracking, and audit events.

## Data storage

Leave relief applications are stored in `data/applications.json`. The `data/` directory is ignored by git because it contains operational records.

## References and asset notes

The visual direction was informed by the public MSF website structure and tone, while avoiding use of MSF logos, copy, or brand assets. The local images in `assets/` were downloaded from Unsplash photo URLs used during the initial design pass.

- MSF reference: https://www.msf.org/
- Hero clinic image: https://images.unsplash.com/photo-1576091160399-112ba8d25d1d
- Emergency care image: https://images.unsplash.com/photo-1576091160550-2173dba999ef
- Consultation image: https://images.unsplash.com/photo-1584515933487-779824d29309
- Supplies image: https://images.unsplash.com/photo-1582750433449-648ed127bb54
- Field note image: https://images.unsplash.com/photo-1559757148-5c350d0d3c56
- Medical supplies image: https://images.unsplash.com/photo-1530497610245-94d3c16cda28
