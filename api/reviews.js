// GET /api/reviews
// Serves the reviews list for the shine-reviews carousel. Pulls LIVE from the
// Google Places API when GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are set, mapped
// to the exact JSON shape the old Wix Velo /_functions/reviews returned. Falls
// back to the curated set in data/reviews.js when the key is missing or Google
// is unreachable, so the carousel never breaks. Heavily cached so Google is hit
// only a few times a day. CORS open (carousel fetches cross-origin from press).

import { reviewsData } from '../data/reviews.js';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE_ID = process.env.GOOGLE_PLACE_ID || '';

async function fetchGoogle() {
  if (!API_KEY || !PLACE_ID) return null;
  const resp = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=en`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount,reviews'
    }
  });
  if (!resp.ok) return null;
  const p = await resp.json();
  const reviews = (p.reviews || []).slice(0, 5).map(r => ({
    quote: (r.text && r.text.text) || (r.originalText && r.originalText.text) || '',
    name: (r.authorAttribution && r.authorAttribution.displayName) || 'Google reviewer',
    rating: r.rating || 5,
    eventContext: null,
    photo: (r.authorAttribution && r.authorAttribution.photoUri) || null,
    relativeDate: r.relativePublishTimeDescription || null
  })).filter(r => r.quote);
  if (!reviews.length) return null;
  return {
    reviews,
    reviewCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : reviewsData.reviewCount,
    averageRating: typeof p.rating === 'number' ? p.rating : reviewsData.averageRating
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400');

  let live = null;
  try { live = await fetchGoogle(); } catch { live = null; }
  const src = live || reviewsData;

  res.status(200).json({
    configured: true,
    reviews: src.reviews,
    summary: {
      totalReviewCount: src.reviewCount,
      averageRating: src.averageRating,
      reviewsUrl: reviewsData.reviewsUrl
    }
  });
}
