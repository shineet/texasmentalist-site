// Single source of truth for the reviews carousel + the site-wide review count.
// Replaces the old Wix Velo /_functions/reviews and /_functions/reviewCount
// backends. To update the count as new Google reviews come in, bump
// `reviewCount` below (also update the homepage JSON-LD reviewCount to match).
// The `reviews` array is the curated set the carousel rotates through.

export const reviewsData = {
  reviewCount: 176,
  averageRating: 5,
  reviewsUrl: "https://g.page/r/CfEvBpaR9455EAI/review",
  reviews: [
    {
      quote: "Shine delivered a truly brilliant performance for the KMG event in Houston. Managing a crowd of 500+ attendees is no small feat, yet Shine commanded the room with ease. What stood out most was how perfectly he tailored the segments… He doesn't just perform; he creates an engaging experience that people will talk about long after the show ends.",
      name: "Abdul K.",
      rating: 5,
      eventContext: "Corporate Event • Houston",
      photo: null,
      relativeDate: null
    },
    {
      quote: "Thank you for bringing the WOW factor to our recent corporate dinner party! The teams loved having your energy on site and were floored by the magic/mentalist acts throughout the night! Would 10/10 recommend!",
      name: "Tionna V.",
      rating: 5,
      eventContext: "Corporate Dinner Party",
      photo: null,
      relativeDate: null
    },
    {
      quote: "Shine was phenomenal! He completely blew us away! Thank you for helping us kick off our school year in such an inspiring and motivational way!! Highly recommend Shine for staff events and retreats!!",
      name: "Dedrah G.",
      rating: 5,
      eventContext: "Staff Event",
      photo: null,
      relativeDate: null
    },
    {
      quote: "Shine was amazing. He had my friends shrieking and chanting and in utter disbelief. No one could stop talking about it for the rest of the party. Some of the best money I ever spent.",
      name: "Jordyn R.",
      rating: 5,
      eventContext: null,
      photo: null,
      relativeDate: null
    },
    {
      quote: "Shine's show was absolutely incredible. Our staff had so much fun!!!",
      name: "Gabriella C.",
      rating: 5,
      eventContext: "Staff Event",
      photo: null,
      relativeDate: null
    }
  ]
};
