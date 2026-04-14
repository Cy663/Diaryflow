import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with bundlers
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  radiusM: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({
  lat,
  lng,
  radiusM,
  onLocationChange,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat !== undefined && lng !== undefined ? [lat, lng] : null,
  );

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handleClick = useCallback(
    (clickLat: number, clickLng: number) => {
      setPosition([clickLat, clickLng]);
      onLocationChange(clickLat, clickLng);
    },
    [onLocationChange],
  );

  const center: [number, number] = position || [49.2253, -123.0449]; // Default: Killarney

  return (
    <div className="h-[200px] rounded-lg overflow-hidden border border-secondary-200">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={handleClick} />
        {position && (
          <>
            <Marker position={position} icon={markerIcon} />
            <Circle
              center={position}
              radius={radiusM}
              pathOptions={{
                color: '#F59E0B',
                fillColor: '#FDE68A',
                fillOpacity: 0.25,
                weight: 2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
