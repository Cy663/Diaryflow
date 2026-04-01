const TYPE_TO_IMAGE: [string[], string][] = [
  [['school', 'university', 'education', 'library'], '/images/reading-corner.jpg'],
  [['restaurant', 'food', 'cafe', 'bakery', 'meal_delivery', 'meal_takeaway'], '/images/cafeteria.jpg'],
  [['park', 'playground', 'amusement_park', 'campground'], '/images/art-room.jpg'],
  [['transit_station', 'bus_station', 'train_station', 'subway_station', 'light_rail_station'], '/images/transit.jpg'],
  [['store', 'shopping_mall', 'supermarket'], '/images/mcdonalds.jpg'],
];

const DEFAULT_IMAGE = '/images/school-bus.jpg';

export function getFallbackImage(placeTypes: string[]): string {
  const joined = placeTypes.join(' ').toLowerCase();
  for (const [keywords, image] of TYPE_TO_IMAGE) {
    if (keywords.some((kw) => joined.includes(kw))) {
      return image;
    }
  }
  return DEFAULT_IMAGE;
}
