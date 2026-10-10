import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Safe by default: require an explicit target URL. Run against staging first.
// Do not point this at production without an approved test window and budget.
const baseUrl = (__ENV.BASE_URL || '').replace(/\/$/, '');
if (!baseUrl) throw new Error('Set BASE_URL to the staging deployment URL.');

const errors = new Rate('http_errors');
const apiLatency = new Trend('api_latency', true);

export const options = {
  scenarios: {
    ramp_to_1000_vus: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 100 },
        { duration: '3m', target: 250 },
        { duration: '3m', target: 500 },
        { duration: '3m', target: 1000 },
        { duration: '2m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    api_latency: ['p(95)<800'],
  },
};

export default function () {
  const health = http.get(`${baseUrl}/api/health`, { tags: { endpoint: 'health' } });
  apiLatency.add(health.timings.duration);
  errors.add(health.status < 200 || health.status >= 400);
  check(health, {
    'health returns 200': (r) => r.status === 200,
    'health reports service': (r) => {
      try { return JSON.parse(r.body).service === 'bizmate-ai-api'; } catch (_) { return false; }
    },
  });

  const plans = http.get(`${baseUrl}/api/v1/plans`, { tags: { endpoint: 'plans' } });
  apiLatency.add(plans.timings.duration);
  errors.add(plans.status < 200 || plans.status >= 400);
  check(plans, { 'plans endpoint is successful': (r) => r.status === 200 });

  sleep(0.5);
}
