// Churches shown on "Find your church". Only Invitation Hill is active in this
// demo; the others are made-up examples that show what the search would look
// like with more churches.
import { CHURCH } from "@/lib/church";

export const CHURCHES = [
  {
    slug: "invitation-hill",
    name: CHURCH.name,
    street: CHURCH.street,
    city: CHURCH.cityStateZip,
    active: true,
    // A 555 number: reserved for fiction, so it never reaches a real phone.
    textNumber: "(701) 555-0142",
    textKeyword: "GIVE",
    qrImage: "/qr/invitation-hill.svg",
  },
  { slug: "prairie-light", name: "Prairie Light SDA Church", city: "Belfield, ND", active: false },
  { slug: "cedar-ridge", name: "Cedar Ridge SDA Church", city: "Medora, ND", active: false },
  { slug: "hope-valley", name: "Hope Valley SDA Fellowship", city: "Richardton, ND", active: false },
  { slug: "riverside-chapel", name: "Riverside SDA Chapel", city: "Beach, ND", active: false },
  { slug: "north-star", name: "North Star SDA Company", city: "Killdeer, ND", active: false },
];

export function findChurch(slug) {
  return CHURCHES.find((c) => c.slug === slug && c.active) ?? null;
}

// The church page's full web address, for the QR code and the poster.
export const SITE_URL = "https://tithely-clone.vercel.app";
