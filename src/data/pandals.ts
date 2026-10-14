import type { Pandal } from "./types";
import { MORE_PANDALS, VERIFIED_PINS } from "./more-pandals";
import { METRO_STATIONS } from "./parikramas";

/**
 * Curated pandal data for Durga Puja 2026 (Shashthi 17 Oct → Dashami 21 Oct).
 * Themes were checked against KolkataKhoj, District, IndianEagle and myaaspaas (Sept–Oct 2026).
 * `theme: null` = committee had not revealed a theme when this was compiled.
 * Pins marked "approx" are placed from local knowledge — verify on Google Maps before go-live.
 * `vehicleDrop` is the closest point cabs/autos usually reach once evening no-entry kicks in;
 * treat walking distances as estimates.
 */
const CURATED: Pandal[] = [
  // ───────── NORTH — Bagbazar · Kumartuli · Shobhabazar · Hatibagan ─────────
  {
    id: "bagbazar", name: "Bagbazar Sarbojanin", nameBn: "বাগবাজার সার্বজনীন",
    zone: "north", locality: "Bagbazar", lat: 22.6028, lng: 88.366,
    theme: "Sabeki — no theme, by tradition", themeMeaning: "Ekchala idol with daker saj",
    note: "One of the oldest community pujas, on the Ganga bank. Big mela grounds.",
    kind: "sabeki", mustSee: true, crowd: 3, dwell: 30, bestTime: "Morning / after midnight",
    metro: { station: "Shyambazar", walkMin: 12 },
    vehicleDrop: { label: "Bagbazar St × Girish Avenue", walkM: 300 },
    autoStand: "Shyambazar 5-point crossing", buses: ["S-11", "3B", "215"], pin: "approx",
  },
  {
    id: "kumartuli-park", name: "Kumartuli Park", nameBn: "কুমোরটুলি পার্ক",
    zone: "north", locality: "Kumartuli", lat: 22.599, lng: 88.362,
    theme: "O Ganga Tumi Boichho Keno", themeMeaning: "O Ganga, why do you flow?",
    note: "From the neighbourhood that sculpts the city's idols. Pair with Kumartuli Sarbojanin.",
    kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Before 11 am",
    metro: { station: "Shobhabazar Sutanuti", walkMin: 7 },
    vehicleDrop: { label: "Rabindra Sarani near Shobhabazar crossing", walkM: 350 },
    autoStand: "Shobhabazar metro", buses: ["S-11", "3D"], pin: "approx",
  },
  {
    id: "kumartuli-sarbojanin", name: "Kumartuli Sarbojanin", nameBn: "কুমোরটুলি সার্বজনীন",
    zone: "north", locality: "Kumartuli", lat: 22.6001, lng: 88.3612,
    theme: "Mon Diye Dekhun", themeMeaning: "Look closely",
    kind: "theme", crowd: 3, dwell: 25, bestTime: "Before 11 am",
    metro: { station: "Shobhabazar Sutanuti", walkMin: 9 },
    vehicleDrop: { label: "Rabindra Sarani near Kumartuli Ghat Rd", walkM: 400 },
    autoStand: "Shobhabazar metro", pin: "approx",
  },
  {
    id: "ahiritola", name: "Ahiritola Sarbojanin", nameBn: "আহিরীটোলা সার্বজনীন",
    zone: "north", locality: "Ahiritola", lat: 22.5958, lng: 88.3598,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    metro: { station: "Shobhabazar Sutanuti", walkMin: 10 },
    vehicleDrop: { label: "Rabindra Sarani (Ahiritola St mouth)", walkM: 300 }, pin: "approx",
  },
  {
    id: "jagat-mukherjee", name: "Jagat Mukherjee Park", nameBn: "জগৎ মুখার্জি পার্ক",
    zone: "north", locality: "Shobhabazar", lat: 22.5966, lng: 88.3693,
    theme: "Pandulipi", themeMeaning: "Manuscripts — the old world of handwritten pages",
    note: "Concept by Abhijit Ghatak, idol by Amal Pal.",
    kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Afternoon / late night",
    metro: { station: "Shobhabazar Sutanuti", walkMin: 5 },
    vehicleDrop: { label: "Jatindra Mohan Avenue near the metro", walkM: 250 },
    autoStand: "Shobhabazar metro", buses: ["S-11", "AC-1"], pin: "approx",
  },
  {
    id: "shovabazar-rajbari", name: "Shovabazar Rajbari", nameBn: "শোভাবাজার রাজবাড়ি",
    zone: "north", locality: "Shobhabazar", lat: 22.5963, lng: 88.3652,
    theme: "Bonedi barir pujo", themeMeaning: "Family puja inside a 1757 thakurdalan",
    kind: "bonedi", mustSee: true, crowd: 2, dwell: 20, bestTime: "Morning (rituals)",
    metro: { station: "Shobhabazar Sutanuti", walkMin: 4 },
    vehicleDrop: { label: "Raja Nabakrishna St at Jatindra Mohan Ave", walkM: 200 }, pin: "approx",
  },
  {
    id: "hatibagan-sarbojanin", name: "Hatibagan Sarbojanin", nameBn: "হাতিবাগান সার্বজনীন",
    zone: "north", locality: "Hatibagan", lat: 22.5937, lng: 88.3722,
    theme: "Chhandachhara Chhannachhara", themeMeaning: "Rhythmless, orderless — chaos in abstract form",
    kind: "art", crowd: 4, dwell: 30, bestTime: "5–9 am",
    metro: { station: "Shyambazar", walkMin: 10 },
    vehicleDrop: { label: "Hatibagan crossing (Bidhan Sarani × Aurobinda Sarani)", walkM: 150 },
    autoStand: "Hatibagan", buses: ["S-11", "3B"], pin: "approx",
  },
  {
    id: "nalin-sarkar", name: "Nalin Sarkar Street", nameBn: "নলিন সরকার স্ট্রিট",
    zone: "north", locality: "Hatibagan", lat: 22.5925, lng: 88.3708,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    metro: { station: "Shyambazar", walkMin: 12 },
    vehicleDrop: { label: "Bidhan Sarani at Hatibagan", walkM: 350 }, pin: "approx",
  },
  {
    id: "kashi-bose-lane", name: "Kashi Bose Lane", nameBn: "কাশী বোস লেন",
    zone: "north", locality: "Beadon St", lat: 22.5891, lng: 88.3657,
    theme: null, note: "Beadon St sees diversions from 3 pm — walk in from Bidhan Sarani.",
    kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    metro: { station: "Girish Park", walkMin: 8 },
    vehicleDrop: { label: "Bidhan Sarani × Beadon St", walkM: 400 }, pin: "approx",
  },
  {
    id: "simla-byayam", name: "Simla Byayam Samiti", nameBn: "সিমলা ব্যায়াম সমিতি",
    zone: "north", locality: "Simla", lat: 22.5868, lng: 88.3652,
    theme: "Sabeki heritage", themeMeaning: "Freedom-movement-era puja, Birastami martial arts",
    kind: "sabeki", crowd: 2, dwell: 20, bestTime: "5–8 am",
    metro: { station: "Girish Park", walkMin: 8 },
    vehicleDrop: { label: "Bidhan Sarani at Hedua", walkM: 300 }, pin: "approx",
  },
  {
    id: "chorebagan", name: "Chorebagan Sarbojanin", nameBn: "চোরবাগান সার্বজনীন",
    zone: "north", locality: "Chorebagan", lat: 22.5835, lng: 88.3628,
    theme: "Beyond Sound", note: "Third big theme this year by Sushanta Shibani Pal.",
    kind: "art", crowd: 3, dwell: 25, bestTime: "Evening lights",
    metro: { station: "Girish Park", walkMin: 6 },
    vehicleDrop: { label: "Muktaram Babu St at CR Avenue", walkM: 400 }, pin: "approx",
  },
  {
    id: "chaltabagan", name: "Chaltabagan Lohapatty", nameBn: "চালতাবাগান লোহাপট্টি",
    zone: "north", locality: "Maniktala", lat: 22.585, lng: 88.378,
    theme: "Nishan — The Mark", themeMeaning: "The Ramnami Samaj of Chhattisgarh; music by Pt. Vishwa Mohan Bhatt",
    kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    metro: { station: "Girish Park", walkMin: 18 },
    vehicleDrop: { label: "Bidhan Sarani at Maniktala crossing", walkM: 300 },
    buses: ["3D", "S-21"], pin: "approx",
  },
  {
    id: "tala-prattoy", name: "Tala Prattoy", nameBn: "টালা প্রত্যয়",
    zone: "north", locality: "Tala", lat: 22.6075, lng: 88.379,
    theme: "Biyojon", themeMeaning: "Separation — mirrors Ballygunge Cultural's 'Jojon'",
    note: "101st year on a NEW, smaller site — expect tight queues. Re-check the pin.",
    kind: "art", mustSee: true, crowd: 5, dwell: 50, bestTime: "Early morning",
    metro: { station: "Belgachia", walkMin: 10 },
    vehicleDrop: { label: "Belgachia Rd near Tala Park", walkM: 450 },
    buses: ["DN-9", "3C/1"], pin: "approx",
  },
  {
    id: "tala-barowari", name: "Tala Barowari", nameBn: "টালা বারোয়ারি",
    zone: "north", locality: "Tala", lat: 22.605, lng: 88.3768,
    theme: "Barowarir Durgabari", themeMeaning: "The history of Durga Puja itself — 106th year",
    kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    metro: { station: "Belgachia", walkMin: 12 },
    vehicleDrop: { label: "Bhupen Bose Avenue", walkM: 300 }, pin: "approx",
  },

  // ───────── DUM DUM · LAKE TOWN ─────────
  {
    id: "ddp-tarun-sangha", name: "Dum Dum Park Tarun Sangha", nameBn: "দমদম পার্ক তরুণ সংঘ",
    zone: "dumdum", locality: "Dum Dum Park", lat: 22.6118, lng: 88.4135,
    theme: "Banijye Basate Lakshmi", themeMeaning: "Fortune lives in trade — Bengal's merchant story",
    kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Late night",
    metro: { station: "Jessore Road (Yellow)", walkMin: 15 },
    vehicleDrop: { label: "Dum Dum Park main road, Jessore Rd end", walkM: 700 },
    autoStand: "Dum Dum Park bus stop (VIP Rd)", buses: ["DN-18", "AC-23"], pin: "approx",
  },
  {
    id: "ddp-bharat-chakra", name: "Dum Dum Park Bharat Chakra", nameBn: "দমদম পার্ক ভারতচক্র",
    zone: "dumdum", locality: "Dum Dum Park", lat: 22.61, lng: 88.41,
    theme: "Antarjami", themeMeaning: "Bengal's old chariots — Guptipara, Mahesh and more",
    kind: "theme", crowd: 4, dwell: 30, bestTime: "Late night",
    metro: { station: "Jessore Road (Yellow)", walkMin: 12 },
    vehicleDrop: { label: "Dum Dum Park main road", walkM: 600 }, pin: "approx",
  },
  {
    id: "ddp-tarun-dal", name: "Dum Dum Park Tarun Dal", nameBn: "দমদম পার্ক তরুণ দল",
    zone: "dumdum", locality: "Dum Dum Park", lat: 22.6135, lng: 88.4155,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Late night",
    metro: { station: "Jessore Road (Yellow)", walkMin: 18 },
    vehicleDrop: { label: "VIP Road service lane", walkM: 600 }, pin: "approx",
  },
  {
    id: "sreebhumi", name: "Sreebhumi Sporting Club", nameBn: "শ্রীভূমি স্পোর্টিং ক্লাব",
    zone: "dumdum", locality: "Lake Town", lat: 22.6015, lng: 88.404,
    theme: "Hawa Mahal", themeMeaning: "Jaipur's Palace of Winds — all 953 windows; traditional idol",
    note: "Plan ~2 hrs at peak; queue has reached VIP Road before. Phones jam — fix a meeting point.",
    kind: "replica", mustSee: true, crowd: 5, dwell: 100, bestTime: "First light or after 2 am",
    rail: "Bidhannagar Road (auto to Lake Town)",
    vehicleDrop: { label: "VIP Road near Lake Town / Jaya cinema", walkM: 800 },
    autoStand: "Lake Town Jaya", buses: ["DN-18", "AC-39", "S-10"], pin: "approx",
  },
  {
    id: "lake-town-adhibasi", name: "Lake Town Adhibasi Brinda", nameBn: "লেকটাউন অধিবাসীবৃন্দ",
    zone: "dumdum", locality: "Lake Town", lat: 22.604, lng: 88.4005,
    theme: null, kind: "theme", crowd: 3, dwell: 20, bestTime: "Evening",
    rail: "Bidhannagar Road",
    vehicleDrop: { label: "Lake Town Jaya", walkM: 400 }, pin: "approx",
  },

  // ───────── SALT LAKE · NEW TOWN ─────────
  {
    id: "fd-block", name: "Salt Lake FD Block", nameBn: "সল্টলেক এফডি ব্লক",
    zone: "saltlake", locality: "Salt Lake Sector III", lat: 22.5868, lng: 88.4055,
    theme: null, kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Afternoon",
    metro: { station: "Bengal Chemical (Green)", walkMin: 15 },
    vehicleDrop: { label: "FD Market road", walkM: 250 }, pin: "approx",
  },
  {
    id: "ae-block", name: "Salt Lake AE Block", nameBn: "সল্টলেক এই ব্লক",
    zone: "saltlake", locality: "Salt Lake Sector I", lat: 22.5905, lng: 88.415,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Evening",
    metro: { station: "City Centre (Green)", walkMin: 15 },
    vehicleDrop: { label: "AE Block main road", walkM: 200 }, pin: "approx",
  },
  {
    id: "bj-block", name: "Salt Lake BJ Block", nameBn: "সল্টলেক বিজে ব্লক",
    zone: "saltlake", locality: "Salt Lake Sector II", lat: 22.579, lng: 88.4185,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Evening",
    metro: { station: "City Centre (Green)", walkMin: 12 },
    vehicleDrop: { label: "BJ Block main road", walkM: 250 }, pin: "approx",
  },
  {
    id: "bd-block", name: "Salt Lake BD Block", nameBn: "সল্টলেক বিডি ব্লক",
    zone: "saltlake", locality: "Salt Lake Sector I", lat: 22.582, lng: 88.4105,
    theme: null, kind: "theme", crowd: 2, dwell: 20, bestTime: "Evening",
    metro: { station: "City Centre (Green)", walkMin: 10 },
    vehicleDrop: { label: "BD Block island", walkM: 150 }, pin: "approx",
  },
  {
    id: "newtown-sarbojanin", name: "New Town Sarbojanin", nameBn: "নিউটাউন সার্বজনীন",
    zone: "east", locality: "New Town", lat: 22.581, lng: 88.46,
    theme: "Padmabhushan", themeMeaning: "Inspired by the national civilian honour",
    kind: "theme", crowd: 2, dwell: 25, bestTime: "4–7 pm",
    vehicleDrop: { label: "Major Arterial Road, Action Area I", walkM: 300 }, pin: "approx",
  },

  // ───────── CENTRAL ─────────
  {
    id: "md-ali-park", name: "Mohammad Ali Park", nameBn: "মহম্মদ আলি পার্ক",
    zone: "central", locality: "Chittaranjan Ave", lat: 22.5776, lng: 88.3585,
    theme: null, note: "Draw is the scale and the crowd, whatever the theme.",
    kind: "theme", mustSee: true, crowd: 5, dwell: 45, bestTime: "Before noon",
    metro: { station: "Central / MG Road", walkMin: 6 },
    vehicleDrop: { label: "CR Avenue at MG Road crossing", walkM: 300 }, buses: ["AC-1", "S-11"], pin: "approx",
  },
  {
    id: "college-square", name: "College Square", nameBn: "কলেজ স্কোয়ার",
    zone: "central", locality: "College Street", lat: 22.5747, lng: 88.3633,
    theme: "The Himalayan Abode", themeMeaning: "Mount Kailash — and the lights on the tank water",
    note: "College St/Bidhan Sarani typically run one-way north→south on puja days.",
    kind: "theme", mustSee: true, crowd: 5, dwell: 40, bestTime: "After 10 pm",
    metro: { station: "MG Road", walkMin: 9 },
    vehicleDrop: { label: "MG Road at College St crossing", walkM: 300 }, pin: "approx",
  },
  {
    id: "santosh-mitra", name: "Santosh Mitra Square", nameBn: "সন্তোষ মিত্র স্কোয়ার",
    zone: "central", locality: "Lebutala, Sealdah", lat: 22.565, lng: 88.366,
    theme: "Sanatani Chetanay Vande Mataram", themeMeaning: "150 years of Bankim Chandra's song — light & sound",
    note: "Artist: Shibshankar Das. Historically 70–80k visitors an hour.",
    kind: "theme", mustSee: true, crowd: 5, dwell: 50, bestTime: "Morning",
    metro: { station: "Sealdah (Green)", walkMin: 10 },
    vehicleDrop: { label: "BB Ganguly St / Sealdah side", walkM: 500 }, pin: "approx",
  },
  {
    id: "taltala", name: "Taltala Sarbojanin", nameBn: "তালতলা সার্বজনীন",
    zone: "central", locality: "Janbazar", lat: 22.5605, lng: 88.3555,
    theme: "Vande Mataram", note: "Artists Amit & Arindam.",
    kind: "theme", crowd: 2, dwell: 20, bestTime: "Any time",
    metro: { station: "Esplanade", walkMin: 12 },
    vehicleDrop: { label: "SN Banerjee Rd, Janbazar", walkM: 200 }, pin: "approx",
  },

  // ───────── SOUTH — Bhowanipore · Kalighat · Lake Market · New Alipore ─────────
  {
    id: "abasar", name: "Abasar Sarbojanin", nameBn: "অবসর সার্বজনীন",
    zone: "south", locality: "Bhowanipore", lat: 22.53, lng: 88.348,
    theme: "Anya Jekhane Ananya", themeMeaning: "Tribute to painter Shanu Lahiri",
    kind: "art", crowd: 2, dwell: 20, bestTime: "Afternoon",
    metro: { station: "Jatin Das Park", walkMin: 7 },
    vehicleDrop: { label: "SP Mukherjee Rd, Jadubabu Bazar", walkM: 300 }, pin: "approx",
  },
  {
    id: "maddox-square", name: "Maddox Square", nameBn: "ম্যাডক্স স্কোয়ার",
    zone: "south", locality: "Ballygunge", lat: 22.523, lng: 88.3615,
    theme: null, note: "The city's favourite adda ground — come for the crowd, not the theme.",
    kind: "sabeki", crowd: 4, dwell: 30, bestTime: "Late night",
    metro: { station: "Jatin Das Park", walkMin: 12 },
    vehicleDrop: { label: "Hazra Road near Maddox Square", walkM: 300 }, pin: "approx",
  },
  {
    id: "deshapriya", name: "Deshapriya Park", nameBn: "দেশপ্রিয় পার্ক",
    zone: "south", locality: "Rashbehari", lat: 22.5188, lng: 88.353,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    metro: { station: "Kalighat", walkMin: 7 },
    vehicleDrop: { label: "Rashbehari Ave, Deshapriya Park stop", walkM: 200 }, pin: "approx",
  },
  {
    id: "tridhara", name: "Tridhara Sammilani", nameBn: "ত্রিধারা সম্মিলনী",
    zone: "south", locality: "Vivekananda Park", lat: 22.518, lng: 88.3565,
    theme: "Surasur", themeMeaning: "Mythic battles — Ram vs Ravana, Krishna vs Kansa, Durga vs the asuras",
    kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Morning",
    metro: { station: "Kalighat", walkMin: 9 },
    vehicleDrop: { label: "Rashbehari Ave near Vivekananda Park", walkM: 300 }, pin: "approx",
  },
  {
    id: "samaj-sebi", name: "Samaj Sebi Sangha", nameBn: "সমাজসেবী সংঘ",
    zone: "south", locality: "Lake Market", lat: 22.5152, lng: 88.3555,
    theme: "Mahapujoy Mahanayak", themeMeaning: "Uttam Kumar at 100 — all 208 film posters",
    kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Afternoon",
    metro: { station: "Kalighat", walkMin: 10 },
    vehicleDrop: { label: "Lake Road at Southern Avenue", walkM: 300 }, pin: "approx",
  },
  {
    id: "shibmandir", name: "Shibmandir Sarbojanin", nameBn: "শিবমন্দির সার্বজনীন",
    zone: "south", locality: "Lake Terrace", lat: 22.5165, lng: 88.3495,
    theme: "Parab", themeMeaning: "Rajasthan's Gangaur festival",
    kind: "theme", crowd: 3, dwell: 25, bestTime: "Evening",
    metro: { station: "Kalighat", walkMin: 8 },
    vehicleDrop: { label: "Southern Avenue", walkM: 300 }, pin: "approx",
  },
  {
    id: "badamtala", name: "Badamtala Ashar Sangha", nameBn: "বাদামতলা আষাঢ় সংঘ",
    zone: "south", locality: "Kalighat", lat: 22.5095, lng: 88.3425,
    theme: null, note: "Kalighat Road is closed to traffic from ~3 pm — walk from the metro.",
    kind: "theme", crowd: 4, dwell: 30, bestTime: "Morning",
    metro: { station: "Kalighat", walkMin: 8 },
    vehicleDrop: { label: "SP Mukherjee Rd near Kalighat metro", walkM: 550 }, pin: "approx",
  },
  {
    id: "mudiali", name: "Mudiali Club", nameBn: "মুদিয়ালি ক্লাব",
    zone: "south", locality: "Rabindra Sarobar", lat: 22.509, lng: 88.346,
    theme: "Oitijhyer Lokkotha", themeMeaning: "Folk tales of heritage",
    kind: "theme", crowd: 3, dwell: 30, bestTime: "Evening",
    metro: { station: "Rabindra Sarobar", walkMin: 10 },
    vehicleDrop: { label: "Southern Ave at Mudiali", walkM: 200 }, pin: "approx",
  },
  {
    id: "chetla-agrani", name: "Chetla Agrani", nameBn: "চেতলা অগ্রণী",
    zone: "south", locality: "Chetla", lat: 22.516, lng: 88.336,
    theme: null, kind: "theme", mustSee: true, crowd: 4, dwell: 35, bestTime: "Afternoon",
    metro: { station: "Kalighat", walkMin: 18 },
    vehicleDrop: { label: "Chetla Road near Chetla Hat", walkM: 400 }, pin: "approx",
  },
  {
    id: "alipore-sarbojanin", name: "Alipore Sarbojanin", nameBn: "আলিপুর সার্বজনীন",
    zone: "south", locality: "Alipore", lat: 22.524, lng: 88.333,
    theme: "Ramayana: An Epic Woven in Time", themeMeaning: "Exile to Akal Bodhon, painted across the pandal",
    note: "Artist: Anirban Das. Near Alipore Jail Museum.",
    kind: "art", crowd: 3, dwell: 30, bestTime: "Afternoon",
    metro: { station: "Jatin Das Park", walkMin: 20 },
    vehicleDrop: { label: "Alipore Road near the Jail Museum", walkM: 200 }, pin: "approx",
  },
  {
    id: "suruchi", name: "Suruchi Sangha", nameBn: "সুরুচি সংঘ",
    zone: "south", locality: "New Alipore", lat: 22.5065, lng: 88.3335,
    theme: "Utsho", themeMeaning: "The source",
    kind: "theme", mustSee: true, crowd: 5, dwell: 45, bestTime: "Early morning",
    rail: "New Alipore",
    vehicleDrop: { label: "New Alipore Block G main road", walkM: 400 }, pin: "approx",
  },

  // ───────── SOUTH — Gariahat · Ballygunge · Kasba ─────────
  {
    id: "ekdalia", name: "Ekdalia Evergreen", nameBn: "একডালিয়া এভারগ্রিন",
    zone: "south", locality: "Gariahat", lat: 22.519, lng: 88.37,
    theme: "Somnath Temple", themeMeaning: "Gujarat's Shiva shrine, first jyotirlinga; traditional idol",
    kind: "replica", mustSee: true, crowd: 5, dwell: 50, bestTime: "Before 10 am",
    rail: "Ballygunge",
    vehicleDrop: { label: "Gariahat Rd at Ekdalia crossing", walkM: 300 },
    autoStand: "Gariahat", buses: ["AC-6", "S-9"], pin: "approx",
  },
  {
    id: "singhi-park", name: "Singhi Park", nameBn: "সিংহী পার্ক",
    zone: "south", locality: "Gariahat", lat: 22.5175, lng: 88.3672,
    theme: null, kind: "theme", crowd: 4, dwell: 30, bestTime: "Morning",
    rail: "Ballygunge",
    vehicleDrop: { label: "Gariahat mor", walkM: 300 }, autoStand: "Gariahat", pin: "approx",
  },
  {
    id: "hindusthan-club", name: "Hindusthan Club", nameBn: "হিন্দুস্থান ক্লাব",
    zone: "south", locality: "Gariahat", lat: 22.5145, lng: 88.368,
    theme: "Durgadalan", themeMeaning: "The pillared hall where old households worship",
    kind: "theme", crowd: 3, dwell: 25, bestTime: "Afternoon",
    rail: "Ballygunge",
    vehicleDrop: { label: "Gariahat Rd at Dover Lane mouth", walkM: 400 }, pin: "approx",
  },
  {
    id: "ballygunge-cultural", name: "Ballygunge Cultural", nameBn: "বালিগঞ্জ কালচারাল",
    zone: "south", locality: "Dover Lane", lat: 22.5162, lng: 88.364,
    theme: "Jojon", themeMeaning: "Joining — built from chips packets, bottles, flex and puja flowers",
    note: "Dover Lane closes to vehicles from ~3 pm.",
    kind: "art", mustSee: true, crowd: 4, dwell: 35, bestTime: "Morning",
    metro: { station: "Kalighat", walkMin: 22 },
    vehicleDrop: { label: "Gariahat Rd at Dover Lane", walkM: 450 }, pin: "approx",
  },
  {
    id: "bosepukur", name: "Bosepukur Sitala Mandir", nameBn: "বোসপুকুর শীতলা মন্দির",
    zone: "south", locality: "Kasba", lat: 22.515, lng: 88.388,
    theme: "Chup", themeMeaning: "Hush — a theme of silence",
    kind: "art", crowd: 3, dwell: 30, bestTime: "Afternoon",
    vehicleDrop: { label: "Bosepukur Rd at Kasba", walkM: 400 }, autoStand: "Kasba / Gariahat", pin: "approx",
  },
  {
    id: "santoshpur-lake-pally", name: "Santoshpur Lake Pally", nameBn: "সন্তোষপুর লেক পল্লী",
    zone: "south", locality: "Santoshpur", lat: 22.491, lng: 88.388,
    theme: "Tandav", themeMeaning: "Shiva's cosmic dance. Artist: Rintu Das",
    kind: "art", crowd: 3, dwell: 30, bestTime: "Evening",
    vehicleDrop: { label: "Santoshpur Avenue", walkM: 300 }, pin: "approx",
  },
  {
    id: "south-city", name: "South City Mall Puja", nameBn: "সাউথ সিটি মল",
    zone: "south", locality: "Prince Anwar Shah Rd", lat: 22.501, lng: 88.3615,
    theme: "Jatra", themeMeaning: "The mall's first puja, by Subhankar Dutta",
    kind: "theme", crowd: 2, dwell: 20, bestTime: "Any time — loos & food here",
    rail: "Jadavpur",
    vehicleDrop: { label: "Prince Anwar Shah Road", walkM: 50 }, pin: "approx",
  },
  {
    id: "naktala", name: "Naktala Udayan Sangha", nameBn: "নাকতলা উদয়ন সংঘ",
    zone: "south", locality: "Naktala", lat: 22.4728, lng: 88.3655,
    theme: null, kind: "theme", crowd: 4, dwell: 30, bestTime: "Afternoon",
    metro: { station: "Gitanjali", walkMin: 8 },
    vehicleDrop: { label: "NSC Bose Rd at Naktala", walkM: 400 }, pin: "approx",
  },
  {
    id: "behala-notun-dal", name: "Behala Notun Dal", nameBn: "বেহালা নতুন দল",
    zone: "south", locality: "Behala", lat: 22.495, lng: 88.315,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Evening",
    metro: { station: "Behala Chowrasta (Purple)", walkMin: 8 },
    vehicleDrop: { label: "Diamond Harbour Rd at Chowrasta", walkM: 400 }, pin: "approx",
  },
  {
    id: "barisha-club", name: "Barisha Club", nameBn: "বড়িশা ক্লাব",
    zone: "south", locality: "Behala", lat: 22.481, lng: 88.31,
    theme: null, kind: "theme", crowd: 3, dwell: 25, bestTime: "Evening",
    metro: { station: "Sakherbazar (Purple)", walkMin: 8 },
    vehicleDrop: { label: "Diamond Harbour Rd at Sakherbazar", walkM: 400 }, pin: "approx",
  },
];

/** Straight-line metres between two points. */
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** Nearest metro within ~2 km straight line, as a walking estimate. */
function nearestMetro(p: Pandal): Pandal["metro"] {
  let best: { station: string; d: number } | null = null;
  for (const s of METRO_STATIONS) {
    const d = metres(p, s);
    if (!best || d < best.d) best = { station: s.metro?.station ?? s.label, d };
  }
  if (!best || best.d > 2000) return undefined;
  return { station: best.station, walkMin: Math.max(2, Math.round((best.d * 1.35) / 70)) };
}

/** Curated pandals (with 2026 themes) on verified pins, plus the wider directory. */
export const PANDALS: Pandal[] = [
  ...CURATED.map((p) => {
    const pin = VERIFIED_PINS[p.id];
    return pin ? { ...p, lat: pin[0], lng: pin[1], pin: "verified" as const } : p;
  }),
  ...MORE_PANDALS,
].map((p) => (p.metro ? p : { ...p, metro: nearestMetro(p) }));

export const PANDAL_BY_ID = Object.fromEntries(PANDALS.map((p) => [p.id, p]));

export const ZONE_LABEL: Record<string, { en: string; bn: string }> = {
  north: { en: "North", bn: "উত্তর" },
  central: { en: "Central", bn: "মধ্য" },
  south: { en: "South", bn: "দক্ষিণ" },
  saltlake: { en: "Salt Lake", bn: "সল্টলেক" },
  dumdum: { en: "Dum Dum", bn: "দমদম" },
  east: { en: "New Town", bn: "নিউটাউন" },
};
