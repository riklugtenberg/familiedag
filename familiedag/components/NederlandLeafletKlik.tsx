'use client';

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NL_CENTER: [number, number] = [52.25, 5.35];

const NL_MAX_BOUNDS: LatLngBoundsExpression = [
  [50.55, 3.05],
  [53.85, 7.48],
];

/** Wegen/relief, geen plaatsnamen (CARTO + OSM). */
const TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
    '&copy; <a href="https://carto.com/attributions">CARTO</a>',
};

function MapClickHandler({
  onPlaats,
}: {
  onPlaats: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPlaats(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  marker: { lat: number; lng: number } | null;
  onPlaatsMarker: (pos: { lat: number; lng: number }) => void;
  /** Opnieuw mounten bij vraagwissel zodat de kaart netjes initialiseert. */
  mapKey: number;
};

export default function NederlandLeafletKlik({ marker, onPlaatsMarker, mapKey }: Props) {
  return (
    <div
      className="relative z-0 w-full min-h-[280px] h-[min(52vh,440px)] rounded-2xl overflow-hidden border-2 border-blue-200 bg-slate-100 [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:bg-white/90"
      style={{ touchAction: 'none' }}
    >
      <MapContainer
        key={mapKey}
        center={NL_CENTER}
        zoom={7}
        minZoom={6}
        maxZoom={13}
        maxBounds={NL_MAX_BOUNDS}
        maxBoundsViscosity={0.92}
        className="h-full w-full z-0"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution={TILE.attribution}
          url={TILE.url}
          subdomains="abcd"
        />
        <MapClickHandler
          onPlaats={(lat, lng) => onPlaatsMarker({ lat, lng })}
        />
        {marker ? (
          <CircleMarker
            center={[marker.lat, marker.lng]}
            radius={9}
            pathOptions={{
              color: '#991b1b',
              fillColor: '#dc2626',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
