// Real CVE data from the US National Vulnerability Database (NVD) API 2.0.
// CORS-enabled, no API key required (rate limit ~5 req / 30 s anonymous).

export type ThreatKind = "cve" | "malware" | "phishing" | "ddos" | "breach" | "attack";

export interface RealCve {
  id: string; // CVE-2025-12345
  published: Date;
  lastModified: Date;
  severity: "critical" | "high" | "medium" | "low";
  score: number | null;
  vector: string | null;
  description: string;
  kind: ThreatKind; // keyword-derived category
  weaknesses: string[]; // CWE ids
  products: string[]; // affected products (from CPE criteria)
  references: string[]; // advisory URLs
  nvdUrl: string;
}

interface NvdMetric {
  cvssData: {
    baseScore: number;
    baseSeverity?: string;
    vectorString?: string;
  };
}

interface NvdCveItem {
  cve: {
    id: string;
    published: string;
    lastModified: string;
    descriptions?: { lang: string; value: string }[];
    metrics?: {
      cvssMetricV31?: NvdMetric[];
      cvssMetricV30?: NvdMetric[];
      cvssMetricV2?: NvdMetric[];
    };
    weaknesses?: { description?: { lang: string; value: string }[] }[];
    configurations?: { nodes?: { cpeMatch?: { criteria: string }[] }[] }[];
    references?: { url: string }[];
  };
}

interface NvdResponse {
  vulnerabilities?: NvdCveItem[];
}

function classifyKind(description: string): ThreatKind {
  const d = description.toLowerCase();
  if (/ransomware|malware|trojan|spyware|backdoor|worm/.test(d)) return "malware";
  if (/phishing|social engineering/.test(d)) return "phishing";
  if (/denial of service|\bddos\b|\bdos\b/.test(d)) return "ddos";
  if (/data breach|information disclosure|exfiltrat/.test(d)) return "breach";
  return "cve";
}

function normalizeSeverity(raw: string | undefined, score: number | null): RealCve["severity"] {
  const s = (raw || "").toLowerCase();
  if (s === "critical" || s === "high" || s === "medium" || s === "low") return s;
  if (score === null) return "medium";
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function prettyCpe(criteria: string): string {
  // cpe:2.3:a:vendor:product:version:... → "vendor product version"
  const parts = criteria.split(":");
  if (parts.length >= 6) {
    return [parts[3], parts[4], parts[5] !== "*" ? parts[5] : ""]
      .filter(Boolean)
      .join(" ")
      .replace(/_/g, " ");
  }
  return criteria;
}

function parseCve(item: NvdCveItem): RealCve | null {
  const c = item.cve;
  if (!c?.id) return null;
  const description =
    c.descriptions?.find((d) => d.lang === "en")?.value || c.descriptions?.[0]?.value || "(no description)";
  // Skip rejected/disputed entries
  if (/^\*\* (REJECT|DISPUTED)/.test(description)) return null;

  const metric =
    c.metrics?.cvssMetricV31?.[0] || c.metrics?.cvssMetricV30?.[0] || c.metrics?.cvssMetricV2?.[0] || null;
  const score = metric?.cvssData?.baseScore ?? null;

  const products = new Set<string>();
  c.configurations?.forEach((cfg) => {
    cfg.nodes?.forEach((node) => {
      node.cpeMatch?.slice(0, 3).forEach((m) => {
        if (m.criteria) products.add(prettyCpe(m.criteria));
      });
    });
  });

  return {
    id: c.id,
    published: new Date(c.published),
    lastModified: new Date(c.lastModified),
    severity: normalizeSeverity(metric?.cvssData?.baseSeverity, score),
    score,
    vector: metric?.cvssData?.vectorString ?? null,
    description,
    kind: classifyKind(description),
    weaknesses:
      c.weaknesses
        ?.flatMap((w) => w.description?.map((d) => d.value) || [])
        .filter((v) => v.startsWith("CWE-"))
        .slice(0, 4) || [],
    products: [...products].slice(0, 6),
    references: c.references?.map((r) => r.url).slice(0, 6) || [],
    nvdUrl: `https://nvd.nist.gov/vuln/detail/${c.id}`,
  };
}

function isoNvd(date: Date): string {
  // NVD expects ISO-8601 extended without the trailing Z: 2025-09-06T00:00:00.000
  return date.toISOString().slice(0, 23);
}

/** Fetch CVEs published in the last `hoursBack` hours. Throws on network/API failure. */
export async function fetchRecentCves(hoursBack: number = 48, limit: number = 40): Promise<RealCve[]> {
  const now = new Date();
  const start = new Date(now.getTime() - hoursBack * 3600 * 1000);
  const url =
    "https://services.nvd.nist.gov/rest/json/cves/2.0" +
    `?pubStartDate=${isoNvd(start)}&pubEndDate=${isoNvd(now)}&resultsPerPage=${limit}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`NVD HTTP ${res.status}`);
    const data: NvdResponse = await res.json();
    const parsed = (data.vulnerabilities || [])
      .map(parseCve)
      .filter((c): c is RealCve => c !== null)
      .sort((a, b) => b.published.getTime() - a.published.getTime());
    if (parsed.length === 0) throw new Error("NVD returned no usable CVEs");
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}
