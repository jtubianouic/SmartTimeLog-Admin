"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Coordinates } from "@/lib/validations/location";

const markerIcon = L.divIcon({
  className: "smart-map-marker",
  html: "<span></span>",
  iconAnchor: [11, 22],
  iconSize: [22, 22],
});

function MapInteraction({ onChange }: { onChange: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapPosition({ coordinates }: { coordinates: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.panTo([coordinates.lat, coordinates.lng]);
  }, [coordinates.lat, coordinates.lng, map]);

  return null;
}

export default function InteractiveMap({
  coordinates,
  onChange,
}: {
  coordinates: Coordinates;
  onChange: (coordinates: Coordinates) => void;
}) {
  return (
    <MapContainer center={[coordinates.lat, coordinates.lng]} className="h-full w-full" scrollWheelZoom zoom={16}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInteraction onChange={onChange} />
      <MapPosition coordinates={coordinates} />
      <Marker
        draggable
        eventHandlers={{
          dragend(event) {
            const position = event.target.getLatLng();
            onChange({ lat: position.lat, lng: position.lng });
          },
        }}
        icon={markerIcon}
        position={[coordinates.lat, coordinates.lng]}
      />
    </MapContainer>
  );
}