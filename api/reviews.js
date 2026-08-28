// GET /api/reviews
// Serves the reviews list for the shine-reviews carousel, in the exact JSON
// shape the old Wix Velo /_functions/reviews returned.
//
// DECISION (Shine): the review TEXT stays MANUAL/curated (data/reviews.js) --
// the Google Business Profile is a service-area business, so the public Places
// API won't reliably hand over review snippets. But the COUNT is pulled LIVE
// from Google (userRatingCount, the cheap "Essentials" field) so it self-updates
// instead of being hand-maintained. Falls back to the curated count when the
// key is missing or Google errors. Heavily cached; CORS open (press fetches it).

import { reviewsData } from '../data/reviews.js';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE_ID = process.env.GOOGLE_PLACE_ID || '';

// Live rating + count only (no reviews field -> stays on the cheap SKU).
async function fetchStats() {
  if (!API_KEY || !PLACE_ID) return null;
  const resp = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount'
    }
  });
  if (!resp.ok) return null;
  const p = await resp.json();
  return {
    count: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    rating: typeof p.rating === 'number' ? p.rating : null
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400');

  let stats = null;
  try { stats = await fetchStats(); } catch { stats = null; }

  res.status(200).json({
    configured: true,
    reviews: reviewsData.reviews,                         // manual / curated text
    summary: {
      totalReviewCount: (stats && stats.count != null) ? stats.count : reviewsData.reviewCount,
      averageRating: (stats && stats.rating != null) ? stats.rating : reviewsData.averageRating,
      reviewsUrl: reviewsData.reviewsUrl
    }
  });
}
