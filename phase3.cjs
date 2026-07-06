const fs = require('fs');
const path = require('path');

const root = process.cwd();

// 2. Modify JS files
const scriptJsPath = path.join(root, 'script.js');
let scriptJs = fs.readFileSync(scriptJsPath, 'utf8');
scriptJs = scriptJs.replace(/const money = new Intl\.NumberFormat[\s\S]*?\}\);/m, '');
scriptJs = scriptJs.replace(/money\.format/g, 'formatMoney');
fs.writeFileSync(scriptJsPath, scriptJs);

const statusJsPath = path.join(root, 'status.js');
let statusJs = fs.readFileSync(statusJsPath, 'utf8');
statusJs = statusJs.replace(/const statusMoney = new Intl\.NumberFormat[\s\S]*?\}\);/m, '');
statusJs = statusJs.replace(/statusMoney\.format/g, 'formatMoney');
statusJs = statusJs.replace(/function escapeStatusHtml[\s\S]*?\}/m, '');
statusJs = statusJs.replace(/escapeStatusHtml/g, 'escapeHtml');
statusJs = statusJs.replace(/function labelStatus[\s\S]*?\}/m, '');
statusJs = statusJs.replace(/labelStatus/g, 'formatStatus');
statusJs = statusJs.replace(/function formatStatusDate[\s\S]*?\}/m, '');
statusJs = statusJs.replace(/formatStatusDate/g, 'formatDate');
fs.writeFileSync(statusJsPath, statusJs);

const adminJsPath = path.join(root, 'admin.js');
let adminJs = fs.readFileSync(adminJsPath, 'utf8');
adminJs = adminJs.replace(/const adminMoney = new Intl\.NumberFormat[\s\S]*?\}\);/m, '');
adminJs = adminJs.replace(/adminMoney\.format/g, 'formatMoney');
adminJs = adminJs.replace(/function escapeHtml[\s\S]*?\}/m, '');
adminJs = adminJs.replace(/function formatStatus[\s\S]*?\}/m, '');
adminJs = adminJs.replace(/function formatDate\([\s\S]*?\)[ \S\n\r]*?\}[ \n\r]*?\}/m, '');
adminJs = adminJs.replace(/function formatDateTime[\s\S]*?\}/m, '');
fs.writeFileSync(adminJsPath, adminJs);

// 3. Modify HTML files
const htmlFiles = ['index.html', 'apply.html', 'status.html', 'leave-relief.html', 'privacy.html', 'terms.html', 'admin.html'];

for (const file of htmlFiles) {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, 'utf8');

  // Add shared.js
  if (html.includes('<script src="script.js" defer></script>')) {
    html = html.replace('<script src="script.js" defer></script>', '<script src="shared.js" defer></script>\n    <script src="script.js" defer></script>');
  } else if (html.includes('<script src="status.js" defer></script>')) {
    html = html.replace('<script src="status.js" defer></script>', '<script src="shared.js" defer></script>\n    <script src="status.js" defer></script>');
  } else if (html.includes('<script src="admin.js" defer></script>')) {
    html = html.replace('<script src="admin.js" defer></script>', '<script src="shared.js" defer></script>\n    <script src="admin.js" defer></script>');
  }

  // SEO & lazy load
  if (!html.includes('<meta name="description"')) {
    html = html.replace(/<title>/, '<meta name="description" content="Doctors Without Border provides emergency medical response and relief globally." />\n    <title>');
  }
  html = html.replace(/<img /g, '<img loading="lazy" ');
  
  if (file === 'apply.html') {
    html = html.replace('type="date"', 'type="date" min="' + new Date().toISOString().split("T")[0] + '"');
  }

  if (file === 'index.html') {
    html = html.replace(/class="region-card"/g, 'class="region-card" role="tabpanel"');
  }
  
  if (file === 'leave-relief.html') {
    html = html.replace(/leave-relief.html#apply/g, 'apply.html');
  }

  fs.writeFileSync(p, html);
}

// 4. Overhaul styles.css
const cssPath = path.join(root, 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');
// Fix color contrast
css = css.replace(/#86868b/g, '#636366'); // darker muted
css = css.replace(/#ff9f0a/g, '#d97706'); // darker amber
css = css.replace(/#34c759/g, '#22c55e'); // darker green

// Add reduced motion
if (!css.includes('prefers-reduced-motion')) {
  css += `

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
}

// Add content-visibility
css = css.replace(/\.features-grid \{/g, '.features-grid {\n  content-visibility: auto;');
css = css.replace(/\.region-grid \{/g, '.region-grid {\n  content-visibility: auto;');

fs.writeFileSync(cssPath, css);
