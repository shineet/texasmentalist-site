// TEMP endpoint: tests Place Details for the computed Place ID and returns
// name/rating/count so we can confirm the right listing. No secret returned.
// DELETE after use.

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE_ID = 'ChIJVcsOoDYD5kAR8S8GlpH3jnk';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!API_KEY) return res.status(200).json({ error: 'GOOGLE_PLACES_API_KEY not set' });
  try {
    const resp = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount'
      }
    });
    const status = resp.status;
    const data = await resp.json();
    return res.status(200).json({ status, placeIdTried: PLACE_ID, data });
  } catch (e) {
    return res.status(200).json({ error: String(e).slice(0, 200) });
  }
}
