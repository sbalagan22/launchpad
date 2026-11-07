import type { CertClaim } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: seeded certification claims (0 to 4 per student). Self-reported claims are never verified.
export function seedClaims(): CertClaim[] {
  const c = (n: number, studentId: string, certId: string, tier: CertClaim["tier"], daysAgo: number, extra: Partial<CertClaim> = {}): CertClaim => ({
    id: `clm_${String(n).padStart(2, "0")}`, studentId, certId, tier, verified: tier !== "self", issuedAt: daysFromNow(-daysAgo), ...extra,
  });
  return [
    c(1, "stu_aisha", "cert_gux", "issuer", 240, { credentialId: "GUX-48213-AK" }),
    c(2, "stu_marcus", "cert_gda", "issuer", 300, { credentialId: "GDA-77102-MC" }),
    c(3, "stu_daniel", "cert_meta_fe", "issuer", 270, { credentialId: "META-FE-30981" }),
    c(4, "stu_daniel", "cert_rwd", "self", 100),
    c(5, "stu_liam", "cert_aws", "issuer", 200, { credentialId: "AWS-CCP-55120" }),
    c(6, "stu_liam", "cert_js", "checked", 150),
    c(7, "stu_hannah", "cert_hs_content", "issuer", 170, { credentialId: "HS-CM-22841" }),
    c(8, "stu_hannah", "cert_ga", "issuer", 230, { credentialId: "GA-31558-HK" }),
    c(9, "stu_jordan", "cert_meta_smm", "issuer", 230, { credentialId: "SMM-60417-JL" }),
    c(10, "stu_jordan", "cert_canva", "checked", 120),
    c(11, "stu_priya", "cert_canva", "checked", 110),
    c(12, "stu_priya", "cert_figma", "self", 60, { fileName: "figma-course-certificate.pdf" }),
    c(13, "stu_arjun", "cert_pl300", "self", 45),
  ];
}
