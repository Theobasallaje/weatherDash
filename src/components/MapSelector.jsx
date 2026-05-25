
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

const defaultPosition = [32.9678306011581, -96.21942773116324]

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })
  return position === null ? null : <Marker position={position} />
}


const MapSelector = ({ position, setPosition }) => {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const mapRef = useRef();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search) return;
    setSearching(true);
    try {
      // Use Nominatim API for geocoding
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
        // Pan map if possible
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 12);
        }
      }
    } catch {
      // ignore errors
    }
    setSearching(false);
  };

  return (
    <div style={{ width: '100%', marginTop: 24 }}>
      <form onSubmit={handleSearch} style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search for a place or address..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
        />
        <button type="submit" disabled={searching} style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#00bcd4', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>
      <div style={{ height: 300, width: '100%', borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer
          center={position || defaultPosition}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
    </div>
  )
}

export default MapSelector
