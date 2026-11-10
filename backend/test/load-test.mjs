import { performance } from 'node:perf_hooks';

const baseUrl = new URL(process.env.LOAD_TEST_BASE_URL || 'http://127.0.0.1:3000/api');
const allowedHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
if (baseUrl.protocol !== 'http:' || !allowedHosts.has(baseUrl.hostname) || baseUrl.username || baseUrl.password) {
  throw new Error('La prueba de carga solo acepta localhost/loopback; no apuntes a producción ni a servicios externos.');
}
const apiRoot = new URL(baseUrl.href.endsWith('/') ? baseUrl.href : `${baseUrl.href}/`);

const requestCount = Number(process.env.LOAD_TEST_REQUESTS || 100);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 10);
const p95LimitMs = Number(process.env.LOAD_TEST_P95_LIMIT_MS || 1500);
if (!Number.isInteger(requestCount) || requestCount < 1 || requestCount > 2500) {
  throw new Error('LOAD_TEST_REQUESTS debe ser un entero entre 1 y 2500.');
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 20) {
  throw new Error('LOAD_TEST_CONCURRENCY debe ser un entero entre 1 y 20.');
}

const paths = ['health/database', 'coupons', 'stores'];
const durations = [];
const failures = [];
let nextRequest = 0;
const startedAt = performance.now();

async function worker() {
  while (true) {
    const requestIndex = nextRequest;
    nextRequest += 1;
    if (requestIndex >= requestCount) return;

    const path = paths[requestIndex % paths.length];
    const requestStarted = performance.now();
    try {
      const response = await fetch(new URL(path, apiRoot), { signal: AbortSignal.timeout(8000) });
      await response.arrayBuffer();
      const duration = performance.now() - requestStarted;
      durations.push(duration);
      if (!response.ok) failures.push(`${path}: HTTP ${response.status}`);
    } catch (error) {
      durations.push(performance.now() - requestStarted);
      failures.push(`${path}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()));
durations.sort((a, b) => a - b);
const elapsedSeconds = (performance.now() - startedAt) / 1000;
const percentile = (value) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * value) - 1)] || 0;
const successCount = requestCount - failures.length;
const p95 = percentile(0.95);

console.log(`Target: ${baseUrl.origin}${baseUrl.pathname}`);
console.log(`Requests: ${requestCount} · concurrency: ${concurrency} · elapsed: ${elapsedSeconds.toFixed(2)}s`);
console.log(`Success: ${successCount}/${requestCount} · throughput: ${(requestCount / elapsedSeconds).toFixed(1)} req/s`);
console.log(`Latency ms: p50=${percentile(0.5).toFixed(1)} · p95=${p95.toFixed(1)} · max=${Math.max(...durations).toFixed(1)}`);

if (failures.length) {
  console.error(`Failures (${failures.length}): ${failures.slice(0, 10).join(' | ')}`);
  process.exitCode = 1;
} else if (p95 > p95LimitMs) {
  console.error(`p95 excede el límite local configurado (${p95LimitMs} ms).`);
  process.exitCode = 1;
}
