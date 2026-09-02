"use client";

import { useEffect } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { Coordinates } from "@/lib/validations/location";

const markerIcon = L.divIcon({
  className: "smart-map-marker",
  html: "<span></span>",
  iconAnchor: [11, 22],
  iconSize: [22, 22],
});

const savedMarkerIcon = L.divIcon({
  className: "smart-map-marker saved-hq-marker",
  html: "<span></span>",
  iconAnchor: [11, 22],
  iconSize: [22, 22],
});

export type HeadquartersMarker = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

function MapInteraction({ onChange }: { onChange: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapPosition({
  coordinates,
  headquarters,
  selectedId,
}: {
  coordinates: Coordinates;
  headquarters: HeadquartersMarker[];
  selectedId?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId && headquarters.length > 0) {
      const points = [
        ...headquarters.map((hq) => L.latLng(hq.lat, hq.lng)),
        L.latLng(coordinates.lat, coordinates.lng),
      ];
      map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 16 });
      return;
    }
    map.panTo([coordinates.lat, coordinates.lng]);
  }, [coordinates.lat, coordinates.lng, headquarters, map, selectedId]);

  return null;
}

export default function InteractiveMap({
  coordinates,
  onChange,
  readOnly = false,
  headquarters = [],
  geofence,
  selectedId,
  selectedName,
}: {
  coordinates: Coordinates;
  onChange: (coordinates: Coordinates) => void;
  readOnly?: boolean;
  headquarters?: HeadquartersMarker[];
  geofence?: Coordinates & { radiusMeters: number };
  selectedId?: number;
  selectedName?: string;
}) {
  return (
    <MapContainer center={[coordinates.lat, coordinates.lng]} className="h-full w-full" scrollWheelZoom zoom={16}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!readOnly ? <MapInteraction onChange={onChange} /> : null}
      <MapPosition coordinates={coordinates} headquarters={headquarters} selectedId={selectedId} />
      {geofence ? (
        <Circle
          center={[geofence.lat, geofence.lng]}
          pathOptions={{ color: "#3de1c1", fillColor: "#3de1c1", fillOpacity: 0.12, weight: 2 }}
          radius={geofence.radiusMeters}
        />
      ) : null}
      {headquarters
        .filter((headquartersMarker) => headquartersMarker.id !== selectedId)
        .map((headquartersMarker) => (
          <Marker
            icon={savedMarkerIcon}
            key={headquartersMarker.id}
            position={[headquartersMarker.lat, headquartersMarker.lng]}
          >
            <Tooltip direction="top" offset={[0, -20]} permanent>
              {headquartersMarker.name}
            </Tooltip>
          </Marker>
        ))}
      <Marker
        draggable={!readOnly}
        eventHandlers={{
          dragend(event) {
            const position = event.target.getLatLng();
            onChange({ lat: position.lat, lng: position.lng });
          },
        }}
        icon={markerIcon}
        position={[coordinates.lat, coordinates.lng]}
      >
        {selectedName ? <Tooltip direction="top" offset={[0, -20]} permanent>{selectedName}</Tooltip> : null}
      </Marker>
    </MapContainer>
  );
}