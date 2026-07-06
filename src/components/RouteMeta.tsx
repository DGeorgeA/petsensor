import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteMeta — keeps <title>, meta description, and canonical in sync with the
 * current SPA route so each page is independently indexable and shares cleanly.
 * Google renders client-side JS, so these per-route updates are picked up.
 */

const SITE = 'https://sensemypet.com';
const DEFAULT_DESC =
  'Privacy-first, on-device AI that screens your dog or cat for stress and anxiety from their sounds and body language. Nothing is uploaded.';

interface Meta { title: string; description: string; }

const ROUTES: Record<string, Meta> = {
  '/': {
    title: 'Sense My Pet — AI Stress & Anxiety Screening for Dogs & Cats',
    description: DEFAULT_DESC,
  },
  '/dog-whisperer': {
    title: 'Dog Stress & Anxiety Screening — Sense My Pet',
    description:
      "Is your dog anxious? Screen your dog's stress and anxiety from their bark, whine and body language with on-device AI. Get a clear Stress Signal Index — private, nothing uploaded.",
  },
  '/cat-whisperer': {
    title: 'Cat Stress & Anxiety Screening — Sense My Pet',
    description:
      "Is your cat stressed? Cats hide discomfort — screen your cat's meows, growls and body language with private on-device AI and get a cautious Stress Signal Index.",
  },
  '/anxiety-tracker': {
    title: "Your Pet's Wellbeing History — Sense My Pet",
    description:
      "Track your dog or cat's stress and anxiety screenings over time and spot changes from their baseline. Stored privately on your device.",
  },
  '/vet-plus': {
    title: 'Find a Vet — Vet+ — Sense My Pet',
    description:
      'Share your pet behavioural screening summaries with a veterinarian and prepare for a more informed consultation with Vet+.',
  },
  '/vet-onboarding': {
    title: 'Join Vet+ — For Veterinary Professionals — Sense My Pet',
    description:
      'Veterinarians: list your practice on Vet+, receive owner-shared behavioural screening summaries, and connect with proactive pet parents.',
  },
  '/wellness-studio': {
    title: 'Pet Wellness Studio — Sense My Pet',
    description: 'Book grooming and wellness services for your dog or cat.',
  },
};

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setProp(prop: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

export default function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = ROUTES[pathname] ?? ROUTES['/'];
    document.title = m.title;
    setMeta('description', m.description);
    setProp('og:title', m.title);
    setProp('og:description', m.description);
    setProp('og:url', SITE + pathname);
    setMeta('twitter:title', m.title);
    setMeta('twitter:description', m.description);
    setCanonical(SITE + (pathname === '/' ? '/' : pathname));
  }, [pathname]);
  return null;
}
