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
  };
});

/** All nine detail selves: Exterior, Interior, and Full vehicle × Essential / Signature / Elite. */
export const PACKAGES = DETAIL_PACKAGES;

export const DEFAULT_PACKAGE_ID = 'full-signature';

export const COATING_TIERS: { label: string; years: 1 | 3 | 5; price: number }[] = [
  { label: '1 YEAR', years: 1, price: 650 },
  { label: '3 YEAR', years: 3, price: 950 },
  { label: '5 YEAR', years: 5, price: 1250 },
];

export const MEMBERSHIPS = [
  {
    name: 'Luxe Monthly',
    price: 99,
    desc: 'Consistent upkeep for drivers who like their vehicle ready every month.',
    features: ['Monthly exterior wash', 'Wheel cleaning', 'Tire dressing', 'Interior maintenance', 'Glass cleaning'],
    savings: 'Protects up to $800/yr in minor paint degradation',
  },
  {
    name: 'Luxe Plus',
    price: 149,
    desc: 'A deeper maintenance rhythm with protection and priority scheduling.',
    features: ['Everything in Monthly', 'Interior deep clean every 3 months', 'Spray protection', 'Priority scheduling'],
    savings: 'Protects up to $1,500/yr in interior & exterior wear',
  },
  {
    name: 'Luxe VIP',
    price: 249,
    desc: 'Our highest-touch maintenance plan for vehicles that stay immaculate.',
    features: ['Monthly full maintenance detail', 'Interior protection', 'Exterior protection', 'Priority scheduling', 'Quarterly complimentary add-on'],
    savings: 'Protects up to $3,000/yr in total vehicle value',
  },
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

export const FAQS = [
  ['How long does a detail take?', 'Exterior and interior selves start around 90 minutes. A full Luxe Signature is about 3.5 hours, Luxe Elite about 5 hours, and paint correction or ceramic coating can take a full day.'],
  ['Do you offer mobile detailing?', 'Yes. We come to you in Raleigh, NC 27616 and nearby Wake County when mobile service is available. A mobile service fee may apply depending on location and service requirements.'],
  ['How much does detailing cost?', 'Exterior starts at $125, interior at $150, and a full vehicle at $175. Paint correction is $350. Ceramic coating is $650 / $950 / $1,250 for 1-, 3-, and 5-year tiers. Vehicle size, condition, and add-ons can change the final total.'],
  ['Do you work on luxury and exotic vehicles?', 'Yes. Our Luxe Collection is designed for premium, luxury, and specialty vehicles. Specialty vehicles receive a custom quote.'],
  ['Can you remove scratches?', 'Paint correction can improve many light-to-moderate paint imperfections. Deep scratches that have reached the underlying layers may require a different repair.'],
  ['How long does ceramic coating last?', 'Protection duration depends on the coating selected, preparation, maintenance, storage, and driving conditions. Ask about our 1-, 3-, and 5-year options.'],
  ['How do I schedule?', 'Pick a preferred date and time on the Book tab. We confirm that window by email or at 330-990-3956 before a detailer is dispatched.'],
  ['What if my vehicle is extremely dirty?', 'No problem. We assess the vehicle before service. Excessive soil, heavy pet hair, biohazards, or unusually difficult conditions may require an additional charge.'],
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
