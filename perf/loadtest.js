import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 10,           
      duration: '30s',   
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],       
    http_req_duration: ['p(95)<300'],     
    checks: ['rate>0.99'],                
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'GET /api/health' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has ok=true': (r) => r.json('ok') === true,
  });

  sleep(1);
}
