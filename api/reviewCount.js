// GET /api/reviewCount
// Serves the site-wide review count ({"reviewCount":N}). Pulls LIVE from the
// Google Places API (userRatingCount, the cheap "Essentials" field) when
// GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are set; falls back to the curated
// count in data/reviews.js otherwise. Consumed by the carousel AND the
// my-repertoire landing pages, so the Worker keeps the old /_functions/reviewCount
// URL pointing here. Heavily cached. CORS open for cross-origin fetches.

import { reviewsData } from '../data/reviews.js';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJVcsOoDYD5kAR8S8GlpH3jnk';

async function fetchCount() {
  if (!API_KEY || !PLACE_ID) return null;
  const resp = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'userRatingCount'
    }
  });
  if (!resp.ok) return null;
  const p = await resp.json();
  return typeof p.userRatingCount === 'number' ? p.userRatingCount : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400');

  let count = null;
  try { count = await fetchCount(); } catch { count = null; }

  res.status(200).json({ reviewCount: count == null ? reviewsData.reviewCount : count });
}
