/** Accepted credential formats per issuer. A matching format only means the input is plausible, not that it is real. */
export type IssuerPattern = { label: string; formats: { name: string; re: RegExp; example: string }[]; urlHosts: string[] };

const CREDLY = /^https:\/\/(www\.)?credly\.com\/badges\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/public_url)?\/?$/i;

export const ISSUERS: Record<string, IssuerPattern> = {
  aws: { label: "Amazon Web Services", urlHosts: ["www.credly.com", "aws.amazon.com"], formats: [{ name: "AWS validation number", re: /^[A-Z0-9]{12}$/, example: "K7M2P9Q4X8D1" }, { name: "Credly badge link", re: CREDLY, example: "https://www.credly.com/badges/<id>" }] },
  credly: { label: "Credly", urlHosts: ["www.credly.com"], formats: [{ name: "Credly badge link", re: CREDLY, example: "https://www.credly.com/badges/<id>" }] },
  microsoft: { label: "Microsoft Learn", urlHosts: ["learn.microsoft.com"], formats: [{ name: "Microsoft Learn shared credential link", re: /^https:\/\/learn\.microsoft\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:users\/[a-z0-9-]+\/credentials\/[a-z0-9-]+|api\/credentials\/share\/[a-z-]+\/[a-z0-9-]+\/[A-Za-z0-9]+)\/?$/i, example: "https://learn.microsoft.com/en-us/users/<name>/credentials/<id>" }] },
  comptia: { label: "CompTIA", urlHosts: ["verify.comptia.org"], formats: [{ name: "CompTIA verification code", re: /^[A-Z0-9]{15}$/, example: "COMP00AB12CD34E" }] },
  freecodecamp: { label: "freeCodeCamp", urlHosts: ["www.freecodecamp.org", "freecodecamp.org"], formats: [{ name: "freeCodeCamp certification link", re: /^https:\/\/(www\.)?freecodecamp\.org\/certification\/[a-z0-9_-]+\/[a-z0-9-]+\/?$/i, example: "https://www.freecodecamp.org/certification/<username>/<slug>" }] },
  // Verification method not yet confirmed: the mock accepts only the demo IDs below.
  isc2: { label: "ISC2", urlHosts: [], formats: [{ name: "Credential ID", re: /^[A-Z0-9-]{8,32}$/, example: "ISC2-CC-DEMO-482910" }] },
  python_institute: { label: "Python Institute", urlHosts: [], formats: [{ name: "Credential ID", re: /^[A-Z0-9-]{8,32}$/, example: "PCEP-DEMO-30-0481" }] },
  linux_foundation: { label: "Linux Foundation", urlHosts: [], formats: [{ name: "Credential ID", re: /^[A-Z0-9-]{8,32}$/, example: "LF-KCNA-DEMO-77120" }] },
  hashicorp: { label: "HashiCorp", urlHosts: [], formats: [{ name: "Credential ID", re: /^[A-Z0-9-]{8,32}$/, example: "HC-TF-DEMO-5521-AK" }] },
};

export function matchFormat(issuerKey: string, input: string): { ok: boolean; format?: string; hint: string } {
  const p = ISSUERS[issuerKey];
  if (!p) return { ok: false, hint: "This issuer is not supported yet." };
  const v = input.trim();
  const hit = p.formats.find((f) => f.re.test(v));
  return hit ? { ok: true, format: hit.name, hint: hit.name } : { ok: false, hint: `Expected ${p.formats.map((f) => `${f.name} (for example ${f.example})`).join(" or ")}.` };
}

export const normalizeCredential = (s: string) => s.trim().replace(/\/(public_url)?\/?$/i, "").toLowerCase();
