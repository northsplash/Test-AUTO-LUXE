const MAILBOX = 'https://formsubmit.co/ajax/Admin@northsplash.com';

type MailFields = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  city: string;
  start_when: string;
  availability: string;
  notes: string;
};

function headers() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    Origin: 'https://www.northsplash.com',
    Referer: 'https://www.northsplash.com/apply',
  };
}

export async function deliverApplicationByEmail(fields: MailFields) {
  const res = await fetch(MAILBOX, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      _subject: `North Splash job application: ${fields.full_name} (${fields.role})`,
      _template: 'table',
      _captcha: 'false',
      _replyto: fields.email,
      name: fields.full_name,
      email: fields.email,
      phone: fields.phone,
      role: fields.role,
      city: fields.city,
      start_when: fields.start_when,
      availability: fields.availability,
      message: fields.notes,
    }),
  });
  const text = await res.text();
  const blob = text.toLowerCase();
  if (!res.ok) return false;
  return /activation|actived|activated|success":"true"|success":true|thank/.test(blob) || blob.includes('"success"');
}
