import type { Business } from "@/schemas";
import { daysFromNow } from "@/lib/dates";

// MOCK: hand-written seed businesses and nonprofits (ratings are seed values).
export function seedBusinesses(): Business[] {
  const b = (id: string, name: string, kind: Business["kind"], category: string, city: Business["city"], founded: number, size: string, rating: number, description: string, ago: number): Business => ({
    id, name, kind, category, city, founded, size, rating, description, createdAt: daysFromNow(-ago),
  });
  return [
    b("biz_sunrise", "Sunrise Bakery", "business", "Bakery", "Brampton", 2011, "6 staff", 4.9, "Family-run bakery serving Brampton since 2011. Six staff, one location.", 200),
    b("biz_halton", "Halton Food Bank", "nonprofit", "Food bank", "Brampton", 2004, "120 volunteers", 4.7, "Community food bank with 120 active volunteers across the Peel and Halton regions.", 210),
    b("biz_peelhub", "Peel Youth Hub", "nonprofit", "Youth services", "Mississauga", 2015, "9 staff", 4.8, "Registered charity running after-school programs for youth ages 13 to 19.", 220),
    b("biz_greenedge", "GreenEdge Landscaping", "business", "Landscaping", "Mississauga", 2016, "8 staff", 4.6, "Residential landscaping crew of eight, serving Mississauga and Brampton.", 180),
    b("biz_maplelane", "Maple Lane Pet Grooming", "business", "Pet services", "Brampton", 2019, "3 staff", 4.8, "Two-groomer shop with a growing local following.", 170),
    b("biz_brightsmile", "Bright Smile Dental", "business", "Dental clinic", "Toronto", 2008, "11 staff", 4.5, "Two-dentist clinic near Yonge and Eglinton with about 3,000 active patients.", 190),
    b("biz_kensington", "Kensington Threads", "business", "Boutique", "Toronto", 2017, "4 staff", 4.7, "Independent clothing boutique selling Canadian-made and vintage pieces.", 160),
    b("biz_ledger", "Ledger & Co. Accounting", "business", "Accounting firm", "Mississauga", 2010, "7 staff", 4.6, "Small accounting firm doing bookkeeping and tax for local trades and shops.", 185),
    b("biz_bysl", "Brampton Youth Soccer League", "nonprofit", "Youth sports", "Brampton", 1998, "40 volunteer coaches", 4.9, "Volunteer-run league with 18 teams and about 400 players each season.", 230),
    b("biz_cedarvale", "Cedarvale Physiotherapy", "business", "Physio clinic", "Toronto", 2013, "9 staff", 4.4, "Physiotherapy and sports rehab clinic in midtown Toronto.", 150),
    b("biz_spice", "Spice Route Catering", "business", "Catering", "Mississauga", 2014, "12 staff", 4.6, "Catering company for weddings, offices and community events.", 175),
    b("biz_riverside", "Riverside Community Garden", "nonprofit", "Community garden", "Toronto", 2012, "60 members", 4.8, "Neighbourhood garden with 85 plots and a long waitlist.", 205),
    b("biz_northgate", "Northgate Auto Repair", "business", "Auto repair", "Brampton", 2005, "10 staff", 4.3, "Independent garage handling general repair and seasonal tire changes.", 165),
    b("biz_lakeshore", "Lakeshore Yoga Studio", "business", "Yoga studio", "Mississauga", 2018, "6 instructors", 4.9, "Neighbourhood yoga studio with daily classes and workshops.", 155),
    b("biz_bloom", "Bloom & Vine Florist", "business", "Florist", "Toronto", 2009, "5 staff", 4.7, "Florist and plant shop supplying weddings, offices and weekly subscriptions.", 195),
  ];
}
