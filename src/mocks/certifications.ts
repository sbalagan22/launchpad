import type { Certification } from "@/schemas";

// MOCK: real certifications and providers with their public course pages. Estimated
// hours are approximations. Credential verification itself is simulated in services/certs.ts.
export function seedCertifications(): Certification[] {
  const c = (id: string, name: string, provider: string, issuedVia: string | undefined, field: string, url: string, hours: number, length: string, unlocks: Certification["unlocks"], skills: string[]): Certification => ({
    id, name, provider, issuedVia, field, url, hours, length, unlocks, skills,
  });
  return [
    c("cert_gux", "Google UX Design", "Google", "Coursera", "Design", "https://www.coursera.org/professional-certificates/google-ux-design", 200, "6 months", ["design", "web"], ["UX Design", "Figma", "Prototyping"]),
    c("cert_figma", "Figma for Beginners", "Figma", undefined, "Design", "https://help.figma.com/hc/en-us/articles/360040328273", 2, "2 hours", ["design"], ["Figma"]),
    c("cert_canva", "Canva Design Essentials", "Canva", undefined, "Design", "https://www.canva.com/designschool/", 6, "1 week", ["design", "marketing"], ["Canva", "Branding"]),
    c("cert_rwd", "Responsive Web Design", "freeCodeCamp", undefined, "Web development", "https://www.freecodecamp.org/learn/2022/responsive-web-design/", 300, "300 hours", ["web"], ["HTML", "CSS"]),
    c("cert_js", "JavaScript Algorithms and Data Structures", "freeCodeCamp", undefined, "Web development", "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/", 300, "300 hours", ["web"], ["JavaScript"]),
    c("cert_meta_fe", "Meta Front-End Developer", "Meta", "Coursera", "Web development", "https://www.coursera.org/professional-certificates/meta-front-end-developer", 220, "7 months", ["web"], ["JavaScript", "React", "HTML", "CSS"]),
    c("cert_gda", "Google Data Analytics", "Google", "Coursera", "Data", "https://www.coursera.org/professional-certificates/google-data-analytics", 180, "6 months", ["data"], ["SQL", "Excel", "Data Cleaning", "Data Visualization"]),
    c("cert_ibm_da", "IBM Data Analyst", "IBM", "Coursera", "Data", "https://www.coursera.org/professional-certificates/ibm-data-analyst", 160, "5 months", ["data"], ["Excel", "SQL", "Python"]),
    c("cert_pl300", "Microsoft Power BI Data Analyst (PL-300)", "Microsoft", undefined, "Data", "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/", 60, "2 months", ["data"], ["Power BI", "Data Visualization"]),
    c("cert_gbi", "Google Business Intelligence", "Google", "Coursera", "Data", "https://www.coursera.org/professional-certificates/google-business-intelligence", 100, "3 months", ["data", "admin"], ["SQL", "Data Visualization"]),
    c("cert_ga", "Google Analytics Certification", "Google", "Skillshop", "Marketing", "https://skillshop.withgoogle.com/", 6, "1 week", ["marketing", "writing"], ["SEO", "Analytics"]),
    c("cert_gdm", "Google Digital Marketing and E-commerce", "Google", "Coursera", "Marketing", "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce", 150, "6 months", ["marketing", "writing"], ["SEO", "Email Marketing", "Social Media"]),
    c("cert_meta_smm", "Meta Social Media Marketing", "Meta", "Coursera", "Marketing", "https://www.coursera.org/professional-certificates/facebook-social-media-marketing", 120, "5 months", ["marketing"], ["Social Media", "Research"]),
    c("cert_hs_content", "HubSpot Content Marketing", "HubSpot", "HubSpot Academy", "Marketing", "https://academy.hubspot.com/courses/content-marketing", 5, "5 hours", ["marketing", "writing"], ["Writing", "Content Strategy"]),
    c("cert_hs_social", "HubSpot Social Media Marketing", "HubSpot", "HubSpot Academy", "Marketing", "https://academy.hubspot.com/courses/social-media", 5, "5 hours", ["marketing"], ["Social Media"]),
    c("cert_gpm", "Google Project Management", "Google", "Coursera", "Business", "https://www.coursera.org/professional-certificates/google-project-management", 140, "6 months", ["admin", "web"], ["Project Management", "Documentation"]),
    c("cert_it", "Google IT Support", "Google", "Coursera", "IT and cloud", "https://www.coursera.org/professional-certificates/google-it-support", 120, "5 months", ["admin"], ["IT Support"]),
    c("cert_aws", "AWS Certified Cloud Practitioner", "Amazon Web Services", undefined, "IT and cloud", "https://aws.amazon.com/certification/certified-cloud-practitioner/", 40, "6 weeks", ["web", "data"], ["Cloud"]),
    c("cert_ai900", "Microsoft Azure AI Fundamentals (AI-900)", "Microsoft", undefined, "IT and cloud", "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/", 20, "3 weeks", ["data"], ["AI Fundamentals"]),
    c("cert_gcyber", "Google Cybersecurity", "Google", "Coursera", "IT and cloud", "https://www.coursera.org/professional-certificates/google-cybersecurity", 150, "6 months", ["admin", "web"], ["Security"]),
  ];
}

/** MOCK: credential IDs the simulated issuer lookup accepts, mapped to the certification they confirm. */
export const DEMO_CREDENTIAL_IDS: Record<string, { certId: string; issuedTo: string; issued: string }> = {
  "GUX-48213-AK": { certId: "cert_gux", issuedTo: "Aisha Khan", issued: "March 2026" },
  "GDA-77102-MC": { certId: "cert_gda", issuedTo: "Marcus Chen", issued: "January 2026" },
  "META-FE-30981": { certId: "cert_meta_fe", issuedTo: "Daniel Okafor", issued: "February 2026" },
  "AWS-CCP-55120": { certId: "cert_aws", issuedTo: "Liam O'Brien", issued: "April 2026" },
  "HS-CM-22841": { certId: "cert_hs_content", issuedTo: "Hannah Kim", issued: "May 2026" },
  "AI900-90317": { certId: "cert_ai900", issuedTo: "Aisha Khan", issued: "June 2026" },
  "SMM-60417-JL": { certId: "cert_meta_smm", issuedTo: "Jordan Lee", issued: "March 2026" },
  "GA-31558-HK": { certId: "cert_ga", issuedTo: "Hannah Kim", issued: "March 2026" },
};
