// TEMP endpoint: uses the server-side GOOGLE_PLACES_API_KEY to text-search for
// the business and return candidate Place IDs (id/name/address/rating/count) so
// the correct ChIJ... can be pinned. No secret is returned. DELETE after use.

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!API_KEY) return res.status(200).json({ error: 'GOOGLE_PLACES_API_KEY not set on this project' });
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'
      },
      body: JSON.stringify({ textQuery: 'Shine, The Mentalist Austin Texas' })
    });
    const status = resp.status;
    const data = await resp.json();
    return res.status(200).json({ status, data });
  } catch (e) {
    return res.status(200).json({ error: String(e).slice(0, 200) });
  }
}
