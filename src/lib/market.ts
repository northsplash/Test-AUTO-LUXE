/** Public-site service area. Mobile detailing is statewide, not a single ZIP. */
export const MARKET = {
  region: 'North Carolina',
  label: 'North Carolina',
  phone: '330-990-3956',
  phoneTel: '3309903956',
  email: 'hello@northsplash.com',
  phonePlaceholder: '330-990-3956',
} as const;

export function phoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function looksFakePhone(value: string) {
  const digits = phoneDigits(value);
  if (digits.length < 10) return true;
  return /^(\d)\1+$/.test(digits);
}

export const HERO_COPY =
  'Mobile detailing all over North Carolina. Precision care, paint enhancement, ceramic protection, and concierge service at your driveway.';
