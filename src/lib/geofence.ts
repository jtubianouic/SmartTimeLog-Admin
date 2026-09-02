export const HQ_GEOFENCE_RADIUS_METERS = 100;

type Coordinate = {
  lat: number;
  long: number;
};

export function distanceInMeters(from: Coordinate, to: Coordinate) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.long - from.long);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine)));
}