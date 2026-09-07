import { DETAIL_PACKAGES, SPECIALTY_SERVICES } from './detailCatalog';

export {
  BOOKABLE_SERVICES,
  DETAIL_FAMILIES,
  DETAIL_FAMILY_COPY,
  DETAIL_PACKAGES,
  DETAIL_SELVES,
  DETAIL_SELF_COPY,
  SPECIALTY_SERVICES,
  checklistForService,
  compareRowsForFamily,
  findDetailPackage,
  minutesForService,
  packageForSelf,
  packagesForFamily,
  priceForService,
  serviceSelectGroups,
} from './detailCatalog';
export type { DetailFamily, DetailPackage, DetailSelf, DetailStep } from './detailCatalog';

const SERVICE_IMAGES: Record<string, { image: string; savingsMultiplier: number; category: string }> = {
  'Exterior Essential': { category: 'Exterior', savingsMultiplier: 2.5, image: 'https://images.pexels.com/photos/14231668/pexels-photo-14231668.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Exterior Signature': { category: 'Exterior', savingsMultiplier: 3, image: 'https://images.pexels.com/photos/14231668/pexels-photo-14231668.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Exterior Elite': { category: 'Exterior', savingsMultiplier: 4, image: 'https://images.pexels.com/photos/6870296/pexels-photo-6870296.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Interior Essential': { category: 'Interior', savingsMultiplier: 2, image: 'https://images.pexels.com/photos/6873185/pexels-photo-6873185.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Interior Signature': { category: 'Interior', savingsMultiplier: 2.5, image: 'https://images.pexels.com/photos/6873185/pexels-photo-6873185.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Interior Elite': { category: 'Interior', savingsMultiplier: 3.5, image: 'https://images.pexels.com/photos/6872599/pexels-photo-6872599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Luxe Essential': { category: 'Detail', savingsMultiplier: 3, image: 'https://images.pexels.com/photos/6872599/pexels-photo-6872599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Luxe Signature': { category: 'Detail', savingsMultiplier: 4, image: 'https://images.pexels.com/photos/6872599/pexels-photo-6872599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Luxe Elite': { category: 'Detail', savingsMultiplier: 6, image: 'https://images.pexels.com/photos/7154635/pexels-photo-7154635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Paint Correction': { category: 'Paint', savingsMultiplier: 8, image: 'https://images.pexels.com/photos/6870296/pexels-photo-6870296.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  'Luxe Ceramic Coating': { category: 'Ceramic', savingsMultiplier: 12, image: 'https://images.pexels.com/photos/7154635/pexels-photo-7154635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
};

const POPULAR_TITLES = new Set([
  'Exterior Signature',
  'Interior Signature',
  'Luxe Signature',
  'Luxe Ceramic Coating',
]);

export const SERVICES = [...DETAIL_PACKAGES, ...SPECIALTY_SERVICES].map((pkg) => {
  const meta = SERVICE_IMAGES[pkg.name] || { category: 'Detail', savingsMultiplier: 3, image: SERVICE_IMAGES['Luxe Signature'].image };
  return {
    title: pkg.name,
    price: pkg.price,
    minutes: pkg.minutes,
    category: meta.category,
    desc: pkg.desc,
    items: pkg.features.slice(0, 6),
    image: meta.image,
    savingsMultiplier: meta.savingsMultiplier,
    popular: POPULAR_TITLES.has(pkg.name),
  };
});

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hr${hours === 1 ? '' : 's'}`;
  const whole = Math.floor(hours);
  const mins = minutes % 60;
  if (mins === 30) return `${whole}.5 hrs`;
  return `${whole} hr ${mins} min`;
}

/** All nine detail selves: Exterior, Interior, and Full vehicle × Essential / Signature / Elite. */
export const PACKAGES = DETAIL_PACKAGES;

export const DEFAULT_PACKAGE_ID = 'full-signature';

export const COATING_TIERS: {
  label: string;
  years: 1 | 3 | 5;
  price: number;
  suited: string;
  popular?: boolean;
  includes: string[];
}[] = [
  {
    label: '1 YEAR',
    years: 1,
    price: 650,
    suited: 'Daily drivers that get washed often',
    includes: ['Single-layer coating', 'Full paint prep', '7-day cure care sheet'],
  },
  {
    label: '3 YEAR',
    years: 3,
    price: 950,
    suited: 'Most owners — the studio standard',
    popular: true,
    includes: ['Thicker film build', 'Corrected paint before coat', 'Priority recert visits'],
  },
  {
    label: '5 YEAR',
    years: 5,
    price: 1250,
    suited: 'Kept indoors or on a membership',
    includes: ['Maximum film thickness', 'Inspection at 12 months', 'Written care plan'],
  },
];

export const PROTECTION_PROCESS = [
  { step: '01', title: 'Inspect & map', copy: 'Paint thickness, swirl map, and a finish goal before any product hits the panel.' },
  { step: '02', title: 'Prep the surface', copy: 'Wash, clay, and polish so the coating bonds to clean, corrected paint — not dirt.' },
  { step: '03', title: 'Apply the coating', copy: 'Even coverage, flash, and leveling. 1-, 3-, or 5-year film depending on the tier.' },
  { step: '04', title: 'Cure & inspect', copy: 'Controlled cure window, a panel walk, and a care sheet for the first seven days.' },
];

export const PROTECTION_AFTERCARE = [
  'No automatic washes for 7 days',
  'pH-neutral soap only',
  'We reinspect if you stay on a membership',
];

export const GALLERY_PIECES: { id: string; tag: string; title: string; caption: string; src: string; layout?: 'main' | 'wide' }[] = [
  { id: 'sig', tag: 'Full', title: 'Luxe Signature', caption: 'Full-vehicle Signature — paint, wheels, and cabin in one visit', src: SERVICE_IMAGES['Luxe Signature'].image, layout: 'main' },
  { id: 'int', tag: 'Interior', title: 'Interior Signature', caption: 'Leather, panels, and glass reset to a quiet cabin', src: SERVICE_IMAGES['Interior Signature'].image },
  { id: 'paint', tag: 'Paint', title: 'Paint Correction', caption: 'Machine polish to pull swirls and restore depth', src: SERVICE_IMAGES['Paint Correction'].image },
  { id: 'ceramic', tag: 'Ceramic', title: 'Ceramic Coating', caption: 'Hydrophobic film after a full paint prep', src: SERVICE_IMAGES['Luxe Ceramic Coating'].image, layout: 'wide' },
  { id: 'ext', tag: 'Exterior', title: 'Exterior Signature', caption: 'Decontaminated paint, dressed tires, sealed finish', src: SERVICE_IMAGES['Exterior Signature'].image },
  { id: 'elite-int', tag: 'Interior', title: 'Interior Elite', caption: 'Extraction, leather treatment, and interior protection', src: SERVICE_IMAGES['Interior Elite'].image },
  { id: 'elite-ext', tag: 'Exterior', title: 'Exterior Elite', caption: 'Paint enhancement pass and a panel-by-panel inspection', src: SERVICE_IMAGES['Exterior Elite'].image },
];

export const GALLERY_FILTERS = ['All', 'Exterior', 'Interior', 'Full', 'Paint', 'Ceramic'] as const;

export const MEMBERSHIPS = [
  {
    name: 'Luxe Monthly',
    price: 99,
    billed: 'Billed monthly · Pause anytime',
    desc: 'Consistent upkeep for drivers who like their vehicle ready every month.',
    features: ['Monthly exterior wash', 'Wheel cleaning', 'Tire dressing', 'Interior maintenance', 'Glass cleaning'],
    savings: 'Protects up to $800/yr in minor paint degradation',
  },
  {
    name: 'Luxe Plus',
    price: 149,
    billed: 'Billed monthly · Most members choose this',
    recommended: true,
    desc: 'A deeper maintenance rhythm with protection and priority scheduling.',
    features: ['Everything in Monthly', 'Interior deep clean every 3 months', 'Spray protection', 'Priority scheduling'],
    savings: 'Protects up to $1,500/yr in interior & exterior wear',
  },
  {
    name: 'Luxe VIP',
    price: 249,
    billed: 'Billed monthly · Highest-touch plan',
    desc: 'Our highest-touch maintenance plan for vehicles that stay immaculate.',
    features: ['Monthly full maintenance detail', 'Interior protection', 'Exterior protection', 'Priority scheduling', 'Quarterly complimentary add-on'],
    savings: 'Protects up to $3,000/yr in total vehicle value',
  },
];

export const MEMBERSHIP_COMPARE = [
  { label: 'Monthly exterior wash', monthly: true, plus: true, vip: true },
  { label: 'Interior maintenance', monthly: true, plus: true, vip: true },
  { label: 'Interior deep clean (quarterly)', monthly: false, plus: true, vip: true },
  { label: 'Spray protection', monthly: false, plus: true, vip: true },
  { label: 'Priority scheduling', monthly: false, plus: true, vip: true },
  { label: 'Monthly full maintenance detail', monthly: false, plus: false, vip: true },
  { label: 'Quarterly complimentary add-on', monthly: false, plus: false, vip: true },
];

export const ADD_ONS: [string, number][] = [
  ['Pet Hair Removal', 75],
  ['Odor Treatment', 75],
  ['Engine Bay Detail', 100],
  ['Headlight Restoration', 100],
  ['Leather Conditioning', 75],
  ['Glass Coating', 125],
  ['Wheel Ceramic Coating', 250],
  ['Trim Restoration', 100],
  ['Carpet Extraction', 100],
  ['Ceramic Interior Protection', 200],
];

export const VEHICLE_SIZES = [
  { name: 'Sedan / Coupe', extra: 0 },
  { name: 'Small SUV / Crossover', extra: 25 },
  { name: 'Large SUV / Truck', extra: 50 },
  { name: 'Three-Row SUV / Large Truck', extra: 75 },
];

export const FAQ_GROUPS = ['All', 'Service', 'Pricing', 'Booking', 'Care'] as const;

export const FAQS: { q: string; a: string; group: 'Service' | 'Pricing' | 'Booking' | 'Care' }[] = [
  { group: 'Service', q: 'How long does a detail take?', a: 'Exterior and interior packages start around 90 minutes. A full Luxe Signature is about 3.5 hours, Luxe Elite about 5 hours, and paint correction or ceramic coating can take a full day.' },
  { group: 'Service', q: 'Do you offer mobile detailing?', a: 'Yes. We come to you across North Carolina when mobile service is available. A mobile service fee may apply depending on location and service requirements.' },
  { group: 'Pricing', q: 'How much does detailing cost?', a: 'Exterior starts at $125, interior at $150, and a full vehicle at $175. Paint correction is $350. Ceramic coating is $650 / $950 / $1,250 for 1-, 3-, and 5-year tiers. Vehicle size, condition, and add-ons can change the final total.' },
  { group: 'Service', q: 'Do you work on luxury and exotic vehicles?', a: 'Yes. Our Luxe Collection is designed for premium, luxury, and specialty vehicles. Specialty vehicles receive a custom quote.' },
  { group: 'Care', q: 'Can you remove scratches?', a: 'Paint correction can improve many light-to-moderate paint imperfections. Deep scratches that have reached the underlying layers may require a different repair.' },
  { group: 'Care', q: 'How long does ceramic coating last?', a: 'Protection duration depends on the coating selected, preparation, maintenance, storage, and driving conditions. Ask about our 1-, 3-, and 5-year options.' },
  { group: 'Booking', q: 'How do I schedule?', a: 'Pick a preferred date and time on the Book tab. We confirm that window by email or at 330-990-3956 before a detailer is dispatched.' },
  { group: 'Service', q: 'What if my vehicle is extremely dirty?', a: 'No problem. We assess the vehicle before service. Excessive soil, heavy pet hair, biohazards, or unusually difficult conditions may require an additional charge.' },
];

export function money(value: number) {
  return `$${value.toLocaleString()}`;
}

export function calcSavings(lifetimeSpend: number): number {
  // Industry estimate: every $1 spent on detailing prevents ~$3-5 in long-term damage
  // Paint fading alone: $500-2000 in respray. Leather cracking: $1000-3000 replacement.
  // Resale value boost: well-maintained vehicles fetch 10-15% more at sale.
  return Math.round(lifetimeSpend * 3.8);
}


export const RECRUITING_STAGES = [
  ['applied', 'Applied'],
  ['review', 'Review'],
  ['first_interview_pending', '1st Round Interview Pending'],
  ['second_interview_pending', '2nd Round Interview Pending'],
  ['background_check', 'Pending Background Check'],
  ['job_offer_pending', 'Pending Job Offer'],
  ['offer_accepted', 'Offer Accepted'],
  ['scheduled_to_start', 'Scheduled to Start'],
  ['employed', 'Employed'],
  ['rejected', 'Rejected'],
  ['withdrawn', 'Withdrawn'],
  ['no_show', 'No Show'],
  ['archived', 'Archived'],
] as const;

export const DEFAULT_PAY_STRUCTURE = [
  { role: 'detailer', level: 1, label: 'Detailer - Level 1', payType: 'hourly', hourlyRate: 17, weeklyBase: 0, commissionRate: 0 },
  { role: 'detailer', level: 2, label: 'Detailer - Level 2', payType: 'hourly', hourlyRate: 18, weeklyBase: 0, commissionRate: 0 },
  { role: 'detailer', level: 3, label: 'Detailer - Level 3', payType: 'hourly', hourlyRate: 19, weeklyBase: 0, commissionRate: 0 },
  { role: 'manager', level: 1, label: 'Manager - Level 1', payType: 'hourly', hourlyRate: 22, weeklyBase: 0, commissionRate: 0 },
  { role: 'manager', level: 2, label: 'Manager - Level 2', payType: 'hourly', hourlyRate: 24, weeklyBase: 0, commissionRate: 0 },
  { role: 'manager', level: 3, label: 'Manager - Level 3', payType: 'hourly', hourlyRate: 26, weeklyBase: 0, commissionRate: 0 },
  { role: 'd2d_agent', level: 1, label: 'D2D Sales - Level 1', payType: 'base_commission', hourlyRate: 0, weeklyBase: 300, commissionRate: 10 },
  { role: 'd2d_agent', level: 2, label: 'D2D Sales - Level 2', payType: 'base_commission', hourlyRate: 0, weeklyBase: 350, commissionRate: 12.5 },
  { role: 'd2d_agent', level: 3, label: 'D2D Sales - Level 3', payType: 'base_commission', hourlyRate: 0, weeklyBase: 400, commissionRate: 15 },
] as const;
