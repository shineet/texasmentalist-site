// GET /api/reviewCount
// TEMP DIAGNOSTIC BUILD: reports whether the Google env vars are present and
// whether the live Places call succeeds (no secret values exposed). Revert to
// the clean version after checking.

import { reviewsData } from '../data/reviews.js';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE_ID = process.env.GOOGLE_PLACE_ID || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const diag = {
    keyPresent: !!API_KEY,
    placeIdPresent: !!PLACE_ID,
    googleStatus: 'skipped',
    googleCount: null,
    error: null
  };

  let count = null;
  if (API_KEY && PLACE_ID) {
    try {
      const resp = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
        headers: { 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'userRatingCount' }
      });
      diag.googleStatus = resp.status;
      const p = await resp.json();
      if (typeof p.userRatingCount === 'number') { count = p.userRatingCount; diag.googleCount = count; }
      else if (p.error) { diag.error = (p.error.status || '') + ': ' + (p.error.message || '').slice(0, 120); }
    } catch (e) {
      diag.googleStatus = 'fetch_failed';
      diag.error = String(e).slice(0, 120);
    }
  }

  res.status(200).json({ reviewCount: count == null ? reviewsData.reviewCount : count, _diag: diag });
}
