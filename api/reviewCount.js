// GET /api/reviewCount
// Serves the site-wide review count. Byte-compatible with the old Wix Velo
// /_functions/reviewCount response ({"reviewCount":N}). Consumed by the reviews
// carousel AND the my-repertoire landing pages, so the Worker keeps the old
// /_functions/reviewCount URL pointing here. CORS open for cross-origin fetches.

import { reviewsData } from '../data/reviews.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).json({ reviewCount: reviewsData.reviewCount });
}
