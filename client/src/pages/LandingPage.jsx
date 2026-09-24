import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  Cpu,
  ArrowRight,
  Terminal,
  Check,
  Copy,
  Activity,
  Server,
  Key,
  AlertCircle,
  Database,
  Flame,
} from 'lucide-react';
import { Layout } from '../components/Layout.jsx';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';

function SectionHeader({ badge, title, description, id }) {
  return (
    <div id={id} className="text-center sm:text-left mb-10">
      {badge && <Badge color="purple" className="mb-3">{badge}</Badge>}
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export function LandingPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [simTraffic, setSimTraffic] = useState('normal'); // 'normal' | 'burst'
  const [activeCodeTab, setActiveCodeTab] = useState('curl');

  const liveCurlCommand = `curl.exe -i -H "X-API-Key: rg_MUNPtIytnZnLzTeTMuAJm2ByqsUX33p__rO7C_cpkXw" \\
  "https://rategate-api.onrender.com/proxy/6aac1cc0438c9e5498b7efbd"`;

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(liveCurlCommand);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const codeSnippets = {
    curl: `curl.exe -i -X GET \\
  -H "X-API-Key: rg_MUNPtIytnZnLzTeTMuAJm2ByqsUX33p__rO7C_cpkXw" \\
  "https://rategate-api.onrender.com/proxy/6aac1cc0438c9e5498b7efbd/items?limit=10"`,
    node: `// Node.js (Fetch API)
const response = await fetch('https://rategate-api.onrender.com/proxy/6aac1cc0438c9e5498b7efbd/items', {
  headers: {
    'X-API-Key': 'rg_MUNPtIytnZnLzTeTMuAJm2ByqsUX33p__rO7C_cpkXw',
    'Content-Type': 'application/json'
  }
});

console.log('Status:', response.status);
console.log('Limit:', response.headers.get('x-ratelimit-limit'));
console.log('Remaining:', response.headers.get('x-ratelimit-remaining'));
const data = await response.json();`,
    python: `# Python (Requests)
import requests

url = "https://rategate-api.onrender.com/proxy/6aac1cc0438c9e5498b7efbd/items"
headers = {
    "X-API-Key": "rg_MUNPtIytnZnLzTeTMuAJm2ByqsUX33p__rO7C_cpkXw"
}

res = requests.get(url, headers=headers)
print("Status:", res.status_code)
print("Remaining:", res.headers.get("X-RateLimit-Remaining"))
print("Data:", res.json())`,
  };

  const architectureLayers = [
    {
      step: '01',
      title: 'Ingress Reverse Proxy',
      tag: 'Undici HTTP Client',
      desc: 'Transparently routes incoming requests on /proxy/:endpointId with full path, query param, and header preservation directly to your registered upstream microservices.',
      metric: 'Duplex Stream',
      icon: Server,
    },
    {
      step: '02',
      title: 'Cryptographic Auth',
      tag: 'SHA-256 Digest',
      desc: 'Fast API key validation. Raw keys are verified against SHA-256 digests in memory to ensure complete tenant security without storing plaintext secrets.',
      metric: '0.1 ms overhead',
      icon: Key,
    },
    {
      step: '03',
      title: 'In-Process TTL Cache',
      tag: 'Zero-DB Hot Path',
      desc: '30-second in-memory LRU cache stores endpoint configurations. Hot proxy requests never touch MongoDB, eliminating database bottlenecks.',
      metric: '0.0 ms DB latency',
      icon: Database,
    },
    {
      step: '04',
      title: 'Atomic Redis ZSET Lua',
      tag: 'Sliding-Window Log',
      desc: 'Executes an atomic Lua script on Redis 7 sorted sets. Trims timestamps older than (now - windowMs) and tests ZCARD against quota in a single network roundtrip.',
      metric: '< 0.85 ms check',
      icon: Cpu,
    },
    {
      step: '05',
      title: 'IETF RateLimit Headers',
      tag: 'RFC Standard',
      desc: 'Injects standard X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, and Retry-After (on HTTP 429) for clean downstream client handling.',
      metric: 'RFC Standard',
      icon: Shield,
    },
    {
      step: '06',
      title: 'Async Telemetry Logger',
      tag: 'Fire-and-Forget',
      desc: 'Dispatches request outcome metrics to MongoDB asynchronously. Background worker flushes audit events with automatic 7-day TTL expiration.',
      metric: 'Non-blocking',
      icon: Activity,
    },
  ];

  const coreFeatures = [
    {
      title: 'Sub-Millisecond Sliding Window',
      desc: 'Eliminates the dangerous double-burst boundary flaw of fixed counters. Every request timestamp is evaluated in rolling real time.',
      badge: 'Redis 7 ZSET',
    },
    {
      title: 'Zero-Code Reverse Proxy',
      desc: 'Place RateGate in front of existing APIs without modifying application code. Just point clients to your RateGate endpoint URL.',
      badge: 'Transparent',
    },
    {
      title: 'Zero-DB Latency on Hot Path',
      desc: 'In-process 30s TTL cache serves endpoint rules directly from memory. MongoDB is never queried during the request proxy pipeline.',
      badge: '0ms Latency',
    },
    {
      title: 'Real-Time Timeseries Analytics',
      desc: 'Interactive visual volume charts over 1h, 6h, 24h, and 7d periods. Track allowed vs throttled traffic with sub-minute granularity.',
      badge: 'Recharts',
    },
    {
      title: 'Top Client Abuse Tracking',
      desc: 'Identifies high-frequency client identifiers, per-client block rates, and downstream response latency in live audit tables.',
      badge: 'Telemetry',
    },
    {
      title: 'Instant API Key Rotation',
      desc: 'One-click API key regeneration with immediate global invalidation. Securely provision master tokens in seconds.',
      badge: 'SHA-256',
    },
  ];

  return (
    <Layout>
      {/* 1. HERO SECTION */}
      <section className="pt-6 pb-16 sm:pt-10 sm:pb-20 text-center sm:text-left mb-16 sm:mb-20">
        <div className="max-w-4xl mx-auto sm:mx-0">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-purple-800/60 bg-purple-950/40 text-xs font-medium text-purple-300 mb-6 backdrop-blur-md">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 flex items-center justify-center shrink-0">
              <img src="/ratelimitlogo.png" alt="RateGate" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-white">RateGate Engine v1.0</span>
            <span className="text-purple-400/60">•</span>
            <span>Distributed Sliding-Window RLaaS</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            High-Performance API Rate Limiter{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-400">
              as a Service.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Multi-tenant reverse proxy gateway featuring sub-millisecond atomic sliding-window enforcement via Redis Lua scripts, zero-DB hot-path caching, and real-time developer telemetry.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-3.5">
            <Link to="/signup">
              <Button
                size="md"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Deploy Endpoint</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="secondary"
                size="md"
                className="bg-white/80 dark:bg-[#0e1526] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
              >
                Developer Console
              </Button>
            </Link>
            <a href="#quickstart">
              <Button
                variant="ghost"
                size="md"
                className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="h-4 w-4 text-purple-500" />
                <span>Quickstart cURL</span>
              </Button>
            </a>
          </div>

          {/* Quick Metrics Pills */}
          <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">&lt; 0.85 ms</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enforcement Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">0.0 ms</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">DB Latency (TTL Cache)</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-500">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Boundary Protection</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">Redis 7</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">ZSET Lua Atomic Script</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE GATEWAY FLOW SIMULATION */}
      <section className="mb-20 sm:mb-24">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Live Gateway Pipeline Architecture
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                How requests travel through RateGate's sub-millisecond reverse proxy pipeline.
              </p>
            </div>

            {/* Simulation Toggle */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-[#080c14] p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setSimTraffic('normal')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  simTraffic === 'normal'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                Normal (80 req/min)
              </button>
              <button
                onClick={() => setSimTraffic('burst')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  simTraffic === 'burst'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-400'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                Burst (250 req/min)
              </button>
            </div>
          </div>

          {/* Visual Diagram */}
          <div className="py-8 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Step 1: Client */}
            <div className="md:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080c14] p-5 text-center sm:text-left">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                01. Ingress Request
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
                {simTraffic === 'burst' ? '250 req / 60s' : '80 req / 60s'}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                /proxy/:endpointId
              </p>
              <div className="mt-3 text-xs text-slate-400 bg-white dark:bg-[#0f1628] p-2 rounded-lg border border-slate-200 dark:border-slate-800/80 font-mono">
                Header: X-API-Key
              </div>
            </div>

            {/* Arrow */}
            <div className="md:col-span-1 text-center text-purple-500 font-bold text-xl hidden md:block">
              ➔
            </div>

            {/* Step 2: RateGate Engine */}
            <div className="md:col-span-3 rounded-xl border-2 border-purple-500/80 bg-gradient-to-b from-purple-950/30 to-indigo-950/20 p-5 text-center shadow-lg shadow-purple-900/20">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 mx-auto mb-2.5 flex items-center justify-center p-1 shadow-md overflow-hidden">
                <img src="/ratelimitlogo.png" alt="RateGate Core" className="w-full h-full object-contain" />
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-base">
                RateGate Core Engine
              </div>
              <div className="text-xs text-purple-400 font-mono mt-0.5">
                Atomic Redis ZSET Lua
              </div>
              <div className="mt-3 py-1.5 px-2.5 bg-purple-900/30 rounded-lg text-xs font-mono text-purple-200 border border-purple-800/50">
                Quota: 100 req / 60s
              </div>
            </div>

            {/* Arrow */}
            <div className="md:col-span-1 text-center text-purple-500 font-bold text-xl hidden md:block">
              ➔
            </div>

            {/* Step 3: Outcomes */}
            <div className="md:col-span-3 space-y-3">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {simTraffic === 'burst' ? '100 Allowed' : '80 Allowed'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    HTTP 200 Streamed Upstream
                  </div>
                </div>
                <Badge color="green">
                  {simTraffic === 'burst' ? '40%' : '100%'}
                </Badge>
              </div>

              <div className={`rounded-xl border p-4 flex items-center justify-between transition-all ${
                simTraffic === 'burst'
                  ? 'border-rose-500/60 bg-rose-500/15'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080c14]/50'
              }`}>
                <div>
                  <div className={`font-bold text-sm ${
                    simTraffic === 'burst' ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {simTraffic === 'burst' ? '150 Throttled' : '0 Throttled'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    HTTP 429 Retry-After Header
                  </div>
                </div>
                <Badge color={simTraffic === 'burst' ? 'red' : 'gray'}>
                  {simTraffic === 'burst' ? '60%' : '0%'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DETAILED 6-STEP INFRASTRUCTURE PIPELINE */}
      <section className="mb-20 sm:mb-24" id="architecture">
        <SectionHeader
          badge="System Architecture"
          title="How RateGate Operates Internally"
          description="A breakdown of the 6 execution layers that process each incoming request in under 1 millisecond."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {architectureLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.title}
                className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-6 flex flex-col justify-between hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-950/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center border border-purple-200/60 dark:border-purple-900/50">
                      <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {layer.step}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {layer.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {layer.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {layer.tag}
                  </span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {layer.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SLIDING WINDOW LOG VS FIXED WINDOW COUNTER */}
      <section className="mb-20 sm:mb-24" id="algorithm">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <SectionHeader
            badge="Algorithm Deep Dive"
            title="Why Sliding Window Log Eliminates the 2x Burst Flaw"
            description="Traditional rate limiters use Fixed Window Counters, which permit double the allowed quota across window boundaries. RateGate uses Redis Sorted Sets to ensure 100% quota precision."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Flawed Fixed Window */}
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                    Fixed Window Counter (Vulnerable)
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded-md">
                    200% Spike
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  If the quota is 100 requests per minute, an attacker can fire 100 requests at 11:59:59 and another 100 requests at 12:00:01.
                </p>
              </div>
              <div className="mt-5 p-4 rounded-lg bg-white dark:bg-[#080c14] border border-rose-200 dark:border-rose-900/50 text-xs font-mono text-slate-800 dark:text-slate-200">
                <div className="text-rose-500 font-bold mb-1">Resulting Flaw:</div>
                Over a 2-second period across the boundary, 200 requests pass through, easily crashing fragile downstream databases.
              </div>
            </div>

            {/* RateGate Sliding Window Log */}
            <div className="rounded-xl border border-purple-500/50 bg-purple-500/5 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                    RateGate Sliding-Window Log (Exact)
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-md">
                    Zero Spikes
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Individual timestamps are stored in a Redis Sorted Set (ZSET). An atomic Lua script purges all elements older than <code>(now - windowMs)</code> and counts remaining members.
                </p>
              </div>
              <div className="mt-5 p-4 rounded-lg bg-white dark:bg-[#080c14] border border-purple-200 dark:border-purple-900/50 text-xs font-mono text-slate-800 dark:text-slate-200">
                <div className="text-purple-400 font-bold mb-1">Guaranteed Safety:</div>
                Exactly ≤ 100 requests can pass in ANY rolling 60-second window, completely eliminating boundary vulnerability.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. IETF RATE LIMIT HEADERS SPECIFICATION */}
      <section className="mb-20 sm:mb-24">
        <SectionHeader
          badge="HTTP Standards"
          title="IETF RateLimit Response Headers"
          description="Every response through the RateGate reverse proxy injects standard headers for client consumption."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-5 flex flex-col justify-between">
            <div>
              <code className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 block mb-2">
                X-RateLimit-Limit
              </code>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The maximum number of allowed requests configured for this endpoint within the current sliding window.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
              Integer quota
            </div>
          </div>

          <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-5 flex flex-col justify-between">
            <div>
              <code className="text-sm font-mono font-bold text-emerald-500 block mb-2">
                X-RateLimit-Remaining
              </code>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The number of remaining requests the client can send before being throttled to HTTP 429.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
              Decrementing count
            </div>
          </div>

          <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-5 flex flex-col justify-between">
            <div>
              <code className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 block mb-2">
                X-RateLimit-Reset
              </code>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Unix timestamp in seconds indicating when the oldest request exits the rolling sliding window.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
              Epoch seconds
            </div>
          </div>

          <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-5 flex flex-col justify-between">
            <div>
              <code className="text-sm font-mono font-bold text-rose-500 block mb-2">
                Retry-After
              </code>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Present on HTTP 429 responses; indicates the exact number of seconds a throttled client must pause before retrying.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
              Seconds delay
            </div>
          </div>
        </div>
      </section>

      {/* 6. INSTANT TERMINAL VERIFICATION (POWERSHELL & CURL) */}
      <section className="mb-20 sm:mb-24" id="quickstart">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <Badge color="purple" className="mb-2.5">Live Verification</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Test the Live Reverse Proxy from Terminal
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Send a real request right now through the live Render deployment using PowerShell or Bash.
              </p>
            </div>

            <button
              onClick={copyCurl}
              className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              {copiedCurl ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied cURL!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy PowerShell cURL</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#070b12] border border-slate-800 text-slate-200 font-mono text-xs sm:text-sm overflow-x-auto select-all leading-relaxed">
            <pre>{liveCurlCommand}</pre>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-slate-50 dark:bg-[#080c14] border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-2.5 text-xs sm:text-sm text-slate-500">
            <AlertCircle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <strong>Windows PowerShell Note:</strong> Use <code className="text-purple-400 font-mono font-semibold">curl.exe</code> rather than plain <code className="text-purple-400 font-mono">curl</code> to bypass PowerShell's built-in <code className="text-slate-400 font-mono">Invoke-WebRequest</code> alias.
            </div>
          </div>
        </div>
      </section>

      {/* 7. CODE INTEGRATION EXAMPLES */}
      <section className="mb-20 sm:mb-24">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <Badge color="purple" className="mb-2.5">Code Snippets</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Developer Integration Examples
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Route API calls through RateGate in your favorite language or framework.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#080c14] p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {['curl', 'node', 'python'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-mono font-medium transition-all cursor-pointer ${
                    activeCodeTab === tab
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {tab === 'node' ? 'Node.js' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#070b12] border border-slate-800 text-purple-300 font-mono text-xs sm:text-sm overflow-x-auto select-all leading-relaxed">
            <pre>{codeSnippets[activeCodeTab]}</pre>
          </div>
        </div>
      </section>

      {/* 8. CORE PROJECT CAPABILITIES MATRIX */}
      <section className="mb-20 sm:mb-24">
        <SectionHeader
          badge="Full Specifications"
          title="Everything Built Into This Repository"
          description="Every feature below is implemented in production code across this project."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreFeatures.map((f) => (
            <div
              key={f.title}
              className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1526]/90 p-6 flex flex-col justify-between hover:border-purple-500/40 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 shrink-0 ml-2">
                    {f.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                <span>Active in core proxy</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. BOTTOM CTA BANNER */}
      <section className="mb-16 sm:mb-20">
        <div className="rounded-3xl border border-purple-800/60 bg-gradient-to-tr from-purple-950/50 via-indigo-950/30 to-[#0e1526] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10" />

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to protect your APIs from traffic spikes?
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Create an endpoint in seconds, configure rolling rate limits, and monitor live timeseries traffic without writing custom middleware.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link to="/signup">
              <Button
                size="md"
                className="bg-white text-slate-950 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl shadow-lg shadow-white/10 text-sm cursor-pointer"
              >
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="secondary"
                size="md"
                className="bg-purple-950/60 hover:bg-purple-900/60 text-white border border-purple-700/60 font-semibold px-6 py-3 rounded-xl text-sm cursor-pointer"
              >
                Developer Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. TECHNICAL FOOTER */}
      <footer className="pt-8 pb-12 border-t border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 overflow-hidden shadow-xs">
              <img src="/ratelimitlogo.png" alt="RateGate" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">RateGate</span>
            <span>— Rate Limiter as a Service</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <a href="#architecture" className="hover:text-purple-400 transition-colors">
              Architecture
            </a>
            <a href="#algorithm" className="hover:text-purple-400 transition-colors">
              Sliding Window
            </a>
            <a href="#quickstart" className="hover:text-purple-400 transition-colors">
              PowerShell Test
            </a>
            <a
              href="https://github.com/shubham-pattewar/RATEGATE"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-4 text-center sm:text-left text-xs text-slate-600 dark:text-slate-500">
          Reverse Proxy Engine with Redis Lua Sliding-Window Quotas &amp; In-Process Hot-Path Caching.
        </p>
      </footer>
    </Layout>
  );
}
