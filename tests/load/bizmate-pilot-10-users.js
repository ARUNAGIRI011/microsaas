import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = (__ENV.BASE_URL || '').replace(/\/$/, '');
if (!baseUrl) throw new Error('Set BASE_URL to the staging deployment URL.');

export const options = {
  vus: 10,
  duration: '2m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<2000']
  }
};

export default function () {
  const health = http.get(`${baseUrl}/api/health`, { tags: { scenario: 'health' } });
  check(health, {
    'health returns 200': (r) => r.status === 200,
    'health response is JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json')
  });

  const plans = http.get(`${baseUrl}/api/v1/plans`, { tags: { scenario: 'public-plans' } });
  check(plans, {
    'plans returns 200': (r) => r.status === 200,
    'plans response is JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
    'plans response includes success': (r) => {
      try { return JSON.parse(r.body).success === true; } catch { return false; }
    }
  });

  // First pilot intentionally avoids paid AI generation and payment endpoints.
  sleep(1);
}
