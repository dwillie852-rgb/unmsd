'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom UN Blue dot icon to avoid default image issues in Next.js
const unIcon = new L.DivIcon({
  className: 'un-marker',
  html: `<div style="background-color: #005bbb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const missions = [
  { id: 1, name: 'MINUSCA', location: 'Bangui, Central African Republic', coords: [4.3947, 18.5582], type: 'Level II Hospital' },
  { id: 2, name: 'MONUSCO', location: 'Goma, DRC', coords: [-1.6585, 29.2205], type: 'Level III Hospital' },
  { id: 3, name: 'UNMISS', location: 'Juba, South Sudan', coords: [4.8594, 31.5713], type: 'Level II+ Hospital' },
  { id: 4, name: 'UNIFIL', location: 'Naqoura, Lebanon', coords: [33.1183, 35.1400], type: 'Level I Clinic' },
  { id: 5, name: 'Logistics Hub', location: 'Entebbe, Uganda', coords: [0.0512, 32.4637], type: 'Global Supply Center' },
  { id: 6, name: 'Logistics Hub', location: 'Brindisi, Italy', coords: [40.6327, 17.9418], type: 'Global Supply Center' }
];

export default function OperationsMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ height: '500px', backgroundColor: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map Interface...</div>;

  return (
    <div style={{ height: '500px', width: '100%', border: '1px solid #ccc' }}>
      <MapContainer center={[10, 20]} zoom={3} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {missions.map(mission => (
          <Marker key={mission.id} position={mission.coords} icon={unIcon}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <strong style={{ color: '#005bbb', display: 'block', fontSize: '1rem', marginBottom: '4px' }}>{mission.name}</strong>
                <div>Location: {mission.location}</div>
                <div>Facility: {mission.type}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
