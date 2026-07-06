import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, ok: res.ok, json, text };
  } catch (error) {
    return { error: error.message };
  }
}

async function runSmokeTests() {
  console.log('Starting E2E Smoke Tests...\\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check Home Page
  console.log('--- Testing Public Routes ---');
  let res = await request('/');
  assert(res.ok && res.status === 200, 'Home page loads (200 OK)');
  assert(res.text && res.text.includes('Medical Services Division'), 'Home page contains expected content');

  res = await request('/operations');
  assert(res.ok && res.status === 200, 'Operations page loads (200 OK)');

  // 2. Check Leave Relief Apply Flow
  console.log('\\n--- Testing Leave Relief API ---');
  const testEmail = `test-${Date.now()}@example.com`;
  res = await request('/api/leave-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      applicant: 'Smoke Test User',
      email: testEmail,
      doctorEmail: 'doctor@un.org',
      doctor: 'Dr. Jane Doe',
      station: 'Juba HQ',
      startDate: '2026-08-01',
      role: 'medical',
      zone: 'standard',
      days: 14,
      travel: true,
      consent: true,
      familyNotes: 'Test notes'
    })
  });
  
  assert(res.ok && (res.status === 200 || res.status === 201), `Create leave application API returns OK. Status: ${res.status}, Body: ${res.text}`);
  assert(res.json && res.json.application, `Create leave application API returned application data`);
  
  const ref = res.json?.application?.reference;
  assert(!!ref, `Created application reference: ${ref}`);

  // 3. Check Status API
  if (ref) {
    res = await request('/api/leave-applications/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: ref, email: testEmail })
    });
    
    assert(res.ok && res.status === 200, `Status API returns 200 OK. Status: ${res.status}`);
    assert(res.json && res.json.application && res.json.application.reference === ref, 'Status API returns correct application data');
  }

  // 4. Check Admin Login
  console.log('\\n--- Testing Admin Auth ---');
  res = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'local-admin-password' })
  });
  
  assert(res.ok && res.status === 200, `Admin login API returns 200 OK. Status: ${res.status}, Body: ${res.text}`);
  assert(res.json && res.json.authenticated, 'Admin login authenticated flag is true');

  console.log(`\\n--- Smoke Test Summary ---`);
  console.log(`Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch(console.error);
