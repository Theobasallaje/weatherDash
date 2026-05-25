import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
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
  return (
    <div style={{ height: 300, width: '100%', marginTop: 24, borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer center={position || defaultPosition} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  )
}

export default MapSelector
