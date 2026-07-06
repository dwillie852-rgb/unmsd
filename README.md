# UNMISSDOCTORS Website

Working local product for a humanitarian medical relief organisation with programmes, field operations, support pathways, accountability, staff care, and a dedicated leave relief application workflow.

## Open locally

Ensure you are using Node.js 20.11.0 or higher.
Install dependencies:
```sh
npm install
```

Copy the `.env.example` file to `.env` and set your variables:
```sh
cp .env.example .env
```

Run the product server:
```sh
npm start
```

Then visit \`http://localhost:4173\`.

The admin dashboard is available at \`http://localhost:4173/admin.html\`.

## Architecture & Codebase

The backend is a pure Node.js modular server (no Express or heavy frameworks):
- \`server.mjs\` - Entry point and HTTP server lifecycle.
- \`src/config.mjs\` - Environment variables and constants.
- \`src/db.mjs\` - File-based JSON database with atomic writes.
- \`src/middleware.mjs\` - Request parsing, error handling, security headers.
- \`src/auth.mjs\` - Session management and rate limiting.
- \`src/email.mjs\` - Resend email integrations.
- \`src/validation.mjs\` - Application and fee settings validation logic.
- \`src/static.mjs\` - Static file serving with gzip/deflate compression.
- \`src/routes/\` - Modular routing for applications, admin, settings, and payments.

## Testing

Run the unit tests via Node's native test runner:
```sh
npm test
```

## Production Deployment

Set \`NODE_ENV=production\` with a real \`ADMIN_TOKEN\` in your environment or \`.env\` file. The server refuses to start in production without an explicit admin token.

```sh
NODE_ENV=production ADMIN_TOKEN="replace-with-a-long-secret" npm start
```

## What is included

- Mission-led homepage modeled on medical humanitarian operations.
- About and principles section for impartial care, independence, and local partnership.
- Programme sections for emergency care, HIV/AIDS/TB/malaria, mobile clinics, and displacement care.
- Emergency desk, donor/support, roster, and accountability sections.
- Field desk filter for conflict, displacement, and outbreak operations.
- Staff-care area on the homepage that links to a full \`leave-relief.html\` programme page.
- Dedicated leave relief page with process, eligibility, fee use, documents, FAQ, and a live replacement staffing cost estimate.
- Public \`status.html\` lookup where applicants can check a leave request using the reference and applicant email.
- Transparent, admin-configurable fee breakdown for replacement coverage, mission pressure multipliers, handover, travel coordination, and operations reserve.
- Privacy and terms pages that describe data controls, fee/refund rules, deployment requirements, and payment requirements.
- Modular JavaScript frontend with shared utils in \`shared.js\` and local \`vendor/lucide.min.js\` icons.
- Node product server with modular routes, persistent JSON storage, server-side validation, session-based admin auth, CSRF-protected admin updates, rate-limited status lookup, payment-status tracking, configurable fee tables, and audit events.
- Advanced performance and SEO optimizations including native lazy loading, strict CSP headers, content-visibility, and gzip static compression.

## Data storage

Leave relief applications are stored in \`data/applications.json\`. The \`data/\` directory is ignored by git because it contains operational records.

Fee settings are stored in the same local JSON database and are used by both the public estimator and server-side application pricing. Existing applications keep their original calculated costs and fee snapshot.

## References and asset notes

The visual direction was informed by the public MSF website structure and tone, while avoiding use of MSF logos, copy, or brand assets. The local images in \`assets/\` were downloaded from Unsplash photo URLs used during the initial design pass.

- MSF reference: https://www.msf.org/
- Hero clinic image: https://images.unsplash.com/photo-1576091160399-112ba8d25d1d
- Emergency care image: https://images.unsplash.com/photo-1576091160550-2173dba999ef
- Consultation image: https://images.unsplash.com/photo-1584515933487-779824d29309
- Supplies image: https://images.unsplash.com/photo-1582750433449-648ed127bb54
- Field note image: https://images.unsplash.com/photo-1559757148-5c350d0d3c56
- Medical supplies image: https://images.unsplash.com/photo-1530497610245-94d3c16cda28
