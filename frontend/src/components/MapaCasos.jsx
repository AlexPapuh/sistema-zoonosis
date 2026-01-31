import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const getIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para capturar clics en el mapa
const LocationMarker = ({ onLocationSelected, isSelecting }) => {
    useMapEvents({
        click(e) {
            if (isSelecting) onLocationSelected(e.latlng);
        },
    });
    return null;
};

const MapaCasos = ({ casos = [], onMapClick, isSelectingMode, tempMarker }) => {
  const defaultCenter = [-19.5894, -65.7541]; // Potosí

  return (
    <MapContainer 
        center={defaultCenter} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }} 
        className={isSelectingMode ? "cursor-crosshair" : ""}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
      
      <LocationMarker onLocationSelected={onMapClick} isSelecting={isSelectingMode} />

      {tempMarker && <Marker position={tempMarker} icon={getIcon('gold')} />}

      {casos.map((caso) => {
          // Definir color según tipo
          let color = 'blue';
          if (caso.tipo === 'Mascota Perdida') color = 'red';
          if (caso.tipo === 'Mascota Encontrada') color = 'green';
          if (caso.tipo === 'Caso Zoonosis') color = 'orange';

          return (
            <Marker key={caso.id} position={[caso.latitud, caso.longitud]} icon={getIcon(color)}>
              <Popup>
                <div className="text-center w-40">
                    {caso.foto && <img src={caso.foto} alt="Evidencia" className="w-full h-24 object-cover rounded mb-2"/>}
                    <h3 className="font-bold text-sm mb-1">{caso.titulo}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase bg-${color === 'orange' ? 'orange-500' : color + '-600'}`}>
                        {caso.tipo}
                    </span>
                    
                    <p className="text-xs text-gray-600 mb-1">{caso.descripcion}</p>
                    <p className="text-[10px] text-gray-400">Reportado por: {caso.reportado_por}</p>
                </div>
              </Popup>
            </Marker>
          );
      })}
    </MapContainer>
  );
};

export default MapaCasos;