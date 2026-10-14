import type { Advisory, NoVehicleZone, Parikrama } from "./types";

/** Ready-made pandal-hopping circuits. Orders are walk-optimised; the planner re-optimises from the user's start. */
export const PARIKRAMAS: Parikrama[] = [
  {
    id: "uttar-heritage", title: "Bonedi North walk", titleBn: "উত্তরের সাবেকি পথ",
    blurb: "Ganga-side heritage — Bagbazar to Hatibagan, entirely on foot.",
    zone: "north", bestMode: "walk", hours: "3–4 hrs",
    start: { label: "Shyambazar metro", lat: 22.6007, lng: 88.3727 },
    stops: ["bagbazar", "kumartuli-sarbojanin", "kumartuli-park", "ahiritola", "shovabazar-rajbari", "jagat-mukherjee", "hatibagan-sarbojanin", "nalin-sarkar", "kashi-bose-lane", "simla-byayam"],
  },
  {
    id: "tala-dumdum", title: "Tala to Dum Dum Park", titleBn: "টালা থেকে দমদম পার্ক",
    blurb: "Two Tala heavyweights, then the Dum Dum Park lanes by metro + auto.",
    zone: "dumdum", bestMode: "smart", hours: "4–5 hrs",
    start: { label: "Belgachia metro", lat: 22.6061, lng: 88.3807 },
    stops: ["tala-prattoy", "tala-barowari", "ddp-bharat-chakra", "ddp-tarun-sangha", "ddp-tarun-dal"],
  },
  {
    id: "lake-town-night", title: "Lake Town night run", titleBn: "লেকটাউন রাত-পরিক্রমা",
    blurb: "Sreebhumi after midnight, then Dum Dum Park while the lanes are empty.",
    zone: "dumdum", bestMode: "smart", hours: "4–6 hrs",
    start: { label: "Lake Town Jaya", lat: 22.6035, lng: 88.4015 },
    stops: ["lake-town-adhibasi", "sreebhumi", "ddp-tarun-dal", "ddp-tarun-sangha", "ddp-bharat-chakra"],
  },
  {
    id: "saltlake-blocks", title: "Salt Lake block-hop", titleBn: "সল্টলেক ব্লক ঘোরা",
    blurb: "Wide roads, short hops — the easiest family circuit, autos run till late.",
    zone: "saltlake", bestMode: "auto", hours: "2–3 hrs",
    start: { label: "City Centre", lat: 22.5876, lng: 88.4085 },
    stops: ["fd-block", "bd-block", "bj-block", "ae-block"],
  },
  {
    id: "madhya-classic", title: "Central classics", titleBn: "মধ্য কলকাতার ক্লাসিক",
    blurb: "Md Ali Park, College Square's lit tank and Santosh Mitra's spectacle.",
    zone: "central", bestMode: "walk", hours: "3–4 hrs",
    start: { label: "Central metro", lat: 22.5732, lng: 88.3561 },
    stops: ["md-ali-park", "college-square", "santosh-mitra", "taltala"],
  },
  {
    id: "dakshin-theme", title: "South theme trail", titleBn: "দক্ষিণের থিম-পথ",
    blurb: "Kalighat metro as base: Lake Market cluster to Chetla and Suruchi.",
    zone: "south", bestMode: "smart", hours: "5–6 hrs",
    start: { label: "Kalighat metro", metro: { station: "Kalighat", walkMin: 0 }, lat: 22.5182, lng: 88.3459 },
    stops: ["deshapriya", "tridhara", "samaj-sebi", "shibmandir", "mudiali", "badamtala", "chetla-agrani", "alipore-sarbojanin", "suruchi"],
  },
  {
    id: "gariahat-art", title: "Gariahat art circuit", titleBn: "গড়িয়াহাট শিল্প-পরিক্রমা",
    blurb: "Somnath at Ekdalia, Jojon at Ballygunge Cultural, then Kasba's quiet art pujas.",
    zone: "south", bestMode: "smart", hours: "4–5 hrs",
    start: { label: "Gariahat mor", lat: 22.5181, lng: 88.3667 },
    stops: ["maddox-square", "singhi-park", "ekdalia", "hindusthan-club", "ballygunge-cultural", "bosepukur", "south-city", "santoshpur-lake-pally"],
  },
  {
    id: "behala-naktala", title: "Behala & Naktala", titleBn: "বেহালা ও নাকতলা",
    blurb: "Purple Line hop through Behala, then the Blue Line to Naktala.",
    zone: "south", bestMode: "metro", hours: "3–4 hrs",
    start: { label: "Behala Chowrasta", lat: 22.4975, lng: 88.3165 },
    stops: ["behala-notun-dal", "barisha-club", "naktala"],
  },
];


export interface Area {
  id: string;
  label: string;
  bn: string;
  lat: number;
  lng: number;
  kind: "metro" | "area";
  metro?: { station: string; walkMin: number };
}

const st = (id: string, label: string, bn: string, lat: number, lng: number, station = label): Area =>
  ({ id, label, bn, lat, lng, kind: "metro", metro: { station, walkMin: 0 } });

/**
 * Metro stations — the main way people start a pandal hop. Positions are approximate
 * station entrances; nudge them in Google Maps if a pin looks off.
 */
export const METRO_STATIONS: Area[] = [
  st("m-dumdum", "Dum Dum", "দমদম", 22.6213, 88.393),
  st("m-belgachia", "Belgachia", "বেলগাছিয়া", 22.6061, 88.3807),
  st("m-shyambazar", "Shyambazar", "শ্যামবাজার", 22.6007, 88.3727),
  st("m-shobhabazar", "Shobhabazar Sutanuti", "শোভাবাজার", 22.5966, 88.3685),
  st("m-girishpark", "Girish Park", "গিরিশ পার্ক", 22.5868, 88.3623),
  st("m-mgroad", "MG Road", "এমজি রোড", 22.58, 88.3595),
  st("m-central", "Central", "সেন্ট্রাল", 22.5732, 88.3561),
  st("m-sealdah", "Sealdah", "শিয়ালদহ", 22.5678, 88.3706, "Sealdah (Green)"),
  st("m-esplanade", "Esplanade", "এসপ্ল্যানেড", 22.5646, 88.3517),
  st("m-parkstreet", "Park Street", "পার্ক স্ট্রিট", 22.5546, 88.3507),
  st("m-rabindrasadan", "Rabindra Sadan", "রবীন্দ্র সদন", 22.541, 88.3475),
  st("m-netajibhawan", "Netaji Bhawan", "নেতাজি ভবন", 22.5335, 88.346),
  st("m-jatindaspark", "Jatin Das Park", "যতীন দাস পার্ক", 22.5265, 88.346),
  st("m-kalighat", "Kalighat", "কালীঘাট", 22.5182, 88.3459),
  st("m-rabindrasarobar", "Rabindra Sarobar", "রবীন্দ্র সরোবর", 22.5085, 88.3465),
  st("m-tollygunge", "Tollygunge", "টালিগঞ্জ", 22.4995, 88.3465, "Mahanayak Uttam Kumar"),
  st("m-gitanjali", "Gitanjali", "গীতাঞ্জলি", 22.4783, 88.3662),
  st("m-citycentre", "City Centre", "সিটি সেন্টার", 22.5876, 88.4085, "City Centre (Green)"),
  st("m-bengalchemical", "Bengal Chemical", "বেঙ্গল কেমিক্যাল", 22.5835, 88.399, "Bengal Chemical (Green)"),
  st("m-jessoreroad", "Jessore Road", "যশোর রোড", 22.617, 88.405, "Jessore Road (Yellow)"),
  st("m-behala", "Behala Chowrasta", "বেহালা চৌরাস্তা", 22.4975, 88.3165, "Behala Chowrasta (Purple)"),
  st("m-sakherbazar", "Sakherbazar", "সখেরবাজার", 22.482, 88.3125, "Sakherbazar (Purple)"),
];

const ar = (id: string, label: string, bn: string, lat: number, lng: number): Area => ({ id, label, bn, lat, lng, kind: "area" });

/** Localities, for people starting from home or a para rather than a station. */
export const LOCALITIES: Area[] = [
  ar("a-laketown", "Lake Town", "লেকটাউন", 22.6035, 88.4015),
  ar("a-dumdumpark", "Dum Dum Park", "দমদম পার্ক", 22.6105, 88.411),
  ar("a-saltlake", "Salt Lake", "সল্টলেক", 22.585, 88.41),
  ar("a-newtown", "New Town", "নিউটাউন", 22.5806, 88.4645),
  ar("a-tala", "Tala", "টালা", 22.6065, 88.378),
  ar("a-kumartuli", "Kumartuli", "কুমোরটুলি", 22.5995, 88.3635),
  ar("a-hatibagan", "Hatibagan", "হাতিবাগান", 22.5935, 88.371),
  ar("a-college-st", "College Street", "কলেজ স্ট্রিট", 22.5747, 88.3633),
  ar("a-bhowanipore", "Bhowanipore", "ভবানীপুর", 22.53, 88.348),
  ar("a-ballygunge", "Ballygunge", "বালিগঞ্জ", 22.5277, 88.364),
  ar("a-gariahat", "Gariahat", "গড়িয়াহাট", 22.5181, 88.3667),
  ar("a-kasba", "Kasba", "কসবা", 22.515, 88.388),
  ar("a-new-alipore", "New Alipore", "নিউ আলিপুর", 22.511, 88.336),
  ar("a-jadavpur", "Jadavpur", "যাদবপুর", 22.4975, 88.3712),
  ar("a-naktala", "Naktala", "নাকতলা", 22.4728, 88.3655),
  ar("a-behala", "Behala", "বেহালা", 22.4975, 88.3165),
  ar("a-howrah", "Howrah", "হাওড়া", 22.5839, 88.3424),
];

export const AREAS: Area[] = [...METRO_STATIONS, ...LOCALITIES];

/** Starting points offered in the "Setting out from" field (besides live location and any pandal). */
export const PLACES: { label: string; lat: number; lng: number; metro?: { station: string; walkMin: number } }[] = [
  { label: "Dum Dum metro", metro: { station: "Dum Dum", walkMin: 0 }, lat: 22.6213, lng: 88.393 },
  { label: "Shyambazar 5-point", metro: { station: "Shyambazar", walkMin: 2 }, lat: 22.6007, lng: 88.3727 },
  { label: "Shobhabazar Sutanuti metro", metro: { station: "Shobhabazar Sutanuti", walkMin: 0 }, lat: 22.5966, lng: 88.3685 },
  { label: "Girish Park metro", metro: { station: "Girish Park", walkMin: 0 }, lat: 22.5868, lng: 88.3623 },
  { label: "Sealdah station", metro: { station: "Sealdah (Green)", walkMin: 4 }, lat: 22.5678, lng: 88.3706 },
  { label: "Esplanade", metro: { station: "Esplanade", walkMin: 0 }, lat: 22.5646, lng: 88.3517 },
  { label: "Howrah station", lat: 22.5839, lng: 88.3424 },
  { label: "Kalighat metro", metro: { station: "Kalighat", walkMin: 0 }, lat: 22.5182, lng: 88.3459 },
  { label: "Gariahat mor", lat: 22.5181, lng: 88.3667 },
  { label: "Salt Lake City Centre", lat: 22.5876, lng: 88.4085 },
  { label: "Lake Town", lat: 22.6035, lng: 88.4015 },
  { label: "Behala Chowrasta", lat: 22.4975, lng: 88.3165 },
  { label: "New Town (Biswa Bangla Gate)", lat: 22.5806, lng: 88.4645 },
  { label: "Jadavpur 8B", lat: 22.4975, lng: 88.3712 },
];

/**
 * Kolkata Police traffic arrangements. "confirmed-2026" items come from 2026 reporting of the
 * police order; "pattern-2025" items are last year's puja-day one-ways that usually repeat.
 */
export const ADVISORIES: Advisory[] = [
  {
    id: "pedestrian-grid", status: "confirmed-2026",
    title: "Pedestrian-first grids around big clusters",
    body: "One-ways and walk-only grids around major pandal clusters start ~3 pm daily. Cabs and autos stop short; expect the last stretch on foot.",
    when: "From 3 pm daily, 14–19 Oct",
    source: { label: "NativePlanet", url: "https://www.nativeplanet.com/travel-guide/kolkata-durga-puja-2026-traffic-restrictions-idol-transport-routes-metro-guide-011-24773.html" },
  },
  {
    id: "lanes-closed", status: "confirmed-2026",
    title: "Lanes closed to all but residents' vehicles",
    body: "B.K. Paul Ave, Bhaba Nath Sen St, Dover Lane, Charu Ave, Tilak Rd, North Sealdah Rd and Kalighat Rd among dozens of roads closed from ~3–4 pm.",
    when: "Puja days, from 3–4 pm",
    source: { label: "Telegraph via Modernforce", url: "https://www.modernforce.com/durga-puja-2026-traffic-restrictions-what-changes-from-mahalaya-to-immersion/" },
  },
  {
    id: "goods-ban", status: "confirmed-2026",
    title: "Goods vehicles barred citywide",
    body: "Daily windows from 6–8 am until past midnight through Navami. Roads are freer for buses and cabs early morning.",
    when: "13–19 Oct",
    source: { label: "Telegraph via Modernforce", url: "https://www.modernforce.com/durga-puja-2026-traffic-restrictions-what-changes-from-mahalaya-to-immersion/" },
  },
  {
    id: "idol-curbs", status: "confirmed-2026",
    title: "Idol-transport curbs on north–south corridors",
    body: "Kumartuli and Kalighat idol movement: closures near B.K. Paul Ave, Aurobinda Sarani, Garpar, Kailash Bose St and around Gariahat, Deshapriya Park and Lake.",
    when: "8 Oct 2 pm → 16 Oct 4 am",
    source: { label: "KTV Bangla", url: "https://ktvbangla.com/durga-puja-traffic-2026/" },
  },
  {
    id: "immersion", status: "confirmed-2026",
    title: "Immersion diversions",
    body: "50+ roads including Strand Rd, Nimtala Ghat St, Beadon St and Bagbazar St divert from 3 pm. Strand Rd one-way north→south.",
    when: "From Dashami, 21 Oct",
    source: { label: "Telegraph via Modernforce", url: "https://www.modernforce.com/durga-puja-2026-traffic-restrictions-what-changes-from-mahalaya-to-immersion/" },
  },
  {
    id: "one-ways-2025", status: "pattern-2025",
    title: "Usual puja one-ways (last year's plan)",
    body: "B.B. Ganguly St west→east; College St/Bidhan Sarani north→south; Lake Rd & Purna Das Rd west→east; Harish Mukherjee Rd north→south. Taxis barred on Maniktala Main Rd.",
    when: "Check this year's order",
    source: { label: "Bengal Info (2025 plan)", url: "https://bengalinfo.com/newsdetail.php?newsid=421801" },
  },
];

/**
 * Approximate no-vehicle bubbles used by the planner: when a leg ends inside one after 3 pm,
 * cabs/autos drop at the edge and the planner adds the walk. Centres/radii are estimates.
 */
export const NO_VEHICLE_ZONES: NoVehicleZone[] = [
  { id: "kumartuli", label: "Kumartuli–Bagbazar grid", lat: 22.5995, lng: 88.3635, radiusM: 550, hours: "3 pm – 4 am", roads: ["Bagbazar St", "Rabindra Sarani (part)", "Kumartuli lanes"] },
  { id: "hatibagan", label: "Hatibagan–Beadon St", lat: 22.591, lng: 88.369, radiusM: 450, hours: "3 pm – 4 am", roads: ["Beadon St", "Nalin Sarkar St", "Kashi Bose Lane"] },
  { id: "college", label: "College Square–Md Ali Park", lat: 22.5762, lng: 88.361, radiusM: 450, hours: "3 pm – 4 am", roads: ["College St (one-way)", "Bidhan Sarani (one-way)"] },
  { id: "sealdah", label: "Santosh Mitra Square", lat: 22.565, lng: 88.366, radiusM: 400, hours: "3 pm – 4 am", roads: ["North Sealdah Rd", "B.B. Ganguly St (one-way)"] },
  { id: "tala", label: "Tala Park", lat: 22.6065, lng: 88.378, radiusM: 400, hours: "3 pm – 4 am", roads: ["Belgachia Rd (part)"] },
  { id: "ddp", label: "Dum Dum Park lanes", lat: 22.6115, lng: 88.413, radiusM: 550, hours: "3 pm – 4 am", roads: ["Dum Dum Park internal roads"] },
  { id: "lake-town", label: "Sreebhumi–Lake Town", lat: 22.6025, lng: 88.403, radiusM: 500, hours: "3 pm – 4 am", roads: ["Lake Town lanes", "VIP Rd service lane"] },
  { id: "lake-market", label: "Lake Market–Deshapriya", lat: 22.5172, lng: 88.354, radiusM: 550, hours: "3 pm – 4 am", roads: ["Lake Rd (one-way)", "Purna Das Rd (one-way)", "Tilak Rd"] },
  { id: "kalighat", label: "Kalighat–Badamtala", lat: 22.5105, lng: 88.343, radiusM: 400, hours: "3 pm – 4 am", roads: ["Kalighat Rd"] },
  { id: "gariahat", label: "Ekdalia–Dover Lane", lat: 22.5168, lng: 88.367, radiusM: 450, hours: "3 pm – 4 am", roads: ["Dover Lane", "Ekdalia Rd"] },
  { id: "new-alipore", label: "Suruchi–Chetla", lat: 22.511, lng: 88.335, radiusM: 500, hours: "3 pm – 4 am", roads: ["Chetla Rd (part)", "New Alipore Block G"] },
];

export const PUJA_DAYS = [
  { key: "shashthi", bn: "ষষ্ঠী", en: "Shashthi", date: "2026-10-17" },
  { key: "saptami", bn: "সপ্তমী", en: "Saptami", date: "2026-10-18" },
  { key: "ashtami", bn: "অষ্টমী", en: "Ashtami", date: "2026-10-19" },
  { key: "navami", bn: "নবমী", en: "Navami", date: "2026-10-20" },
  { key: "dashami", bn: "দশমী", en: "Dashami", date: "2026-10-21" },
];
