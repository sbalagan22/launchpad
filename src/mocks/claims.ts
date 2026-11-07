import type { CertClaim } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: seeded certification claims (0 to 4 per student). Two tiers only: issuer-verified or self-reported.
// A self-reported claim is never verified, with or without a file.
export function seedClaims(): CertClaim[] {
  const base = (n: number, studentId: string, certId: string, status: CertClaim["status"], ago: number, extra: Partial<CertClaim> = {}): CertClaim => ({
    id: `clm_${String(n).padStart(2, "0")}`, studentId, certId, tier: "self", status, createdAt: daysFromNow(-ago), ...extra,
  });
  const issuer = (n: number, studentId: string, certId: string, ref: string, issuedAgo: number, validYears: number | null): CertClaim =>
    base(n, studentId, certId, "earned", issuedAgo, { tier: "issuer", credentialRef: ref, issuedAt: daysFromNow(-issuedAgo), ...(validYears ? { expiresAt: daysFromNow(-issuedAgo + Math.round(validYears * 365)) } : {}), issuerUrl: ref.startsWith("http") ? ref : undefined });
  return [
    issuer(1, "stu_aisha", "fcc-rwd", "https://www.freecodecamp.org/certification/aisha-khan/responsive-web-design", 170, null),
    base(2, "stu_aisha", "gh-foundations", "planned", 5),
    base(3, "stu_aisha", "azure-az900", "in_progress", 12),
    issuer(4, "stu_marcus", "gda", "https://www.credly.com/badges/7e6d5c4b-3a29-4180-9f7e-6d5c4b3a2918", 130, null),
    issuer(5, "stu_daniel", "gh-foundations", "https://www.credly.com/badges/9d8c7b6a-5e4f-4a3b-8c2d-1e0f9a8b7c6d", 60, 2),
    base(6, "stu_daniel", "mongodb-dev", "in_progress", 20),
    base(7, "stu_liam", "aws-clf", "earned", 150),
    base(8, "stu_liam", "pcap", "planned", 10),
    base(9, "stu_priya", "other", "earned", 220, { customName: "Adobe Certified Professional, Illustrator", fileName: "adobe-certificate.pdf" }),
    base(10, "stu_arjun", "pl300", "in_progress", 30),
    base(11, "stu_fatima", "psm1", "planned", 15),
    base(12, "stu_jordan", "gda", "planned", 25),
  ];
}
