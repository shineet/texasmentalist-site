// GET /api/reviews
// Serves the curated reviews list for the shine-reviews carousel. Byte-compatible
// with the old Wix Velo /_functions/reviews response so the carousel (and any
// other consumer) needs no changes. The Cloudflare Worker maps the old
// /_functions/reviews path to this endpoint. CORS is open because the carousel
// script runs on press.texasmentalist.com and fetches this cross-origin.

import { reviewsData } from '../data/reviews.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).json({
    configured: true,
    reviews: reviewsData.reviews,
    summary: {
      totalReviewCount: reviewsData.reviewCount,
      averageRating: reviewsData.averageRating,
      reviewsUrl: reviewsData.reviewsUrl
    }
  });
}
