import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Home, CheckCircle, Syringe } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const iconVet = L.divIcon({
  className: 'bg-transparent border-none',
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8">
       <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
       <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -10]
});

const iconFijo = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const getIconoCasa = (atendido) => {
    const color = atendido ? '#10B981' : '#F97316'; 
    
    const svgString = renderToStaticMarkup(
        <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '50%', 
            padding: '5px', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: `2px solid ${color}`,
            width: '32px',
            height: '32px'
        }}>
            <Home size={18} color={color} fill={color} />
        </div>
    );

    return L.divIcon({
        className: 'custom-icon-home border-none bg-transparent',
        html: svgString,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34]
    });
};

const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(map.getContainer());
        return () => resizeObserver.disconnect();
    }, [map]);
    return null;
};

const ChangeMapView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

const MapaCampana = ({ centro, puntos, ruta = [], onAtenderDomicilio }) => {
  return (
    <MapContainer center={centro} zoom={15} style={{ height: '100%', width: '100%' }}>
      <MapFix />
      <ChangeMapView center={centro} />
      
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {ruta && ruta.length > 1 && (
          <Polyline 
              positions={ruta} 
              color="#9333ea" 
              weight={6} 
              opacity={0.7} 
              dashArray="10, 10" 
          />
      )}

      {puntos.map((punto) => {
        let iconoAUsar;
        if (punto.tipo === 'veterinario') iconoAUsar = iconVet;
        else if (punto.tipo === 'fijo') iconoAUsar = iconFijo;
        else iconoAUsar = getIconoCasa(punto.atendido);

        return (
          <Marker 
            key={punto.id} 
            position={[punto.lat, punto.lng]} 
            icon={iconoAUsar}
          >
            <Popup>
              <div className="text-center w-48 p-1">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{punto.titulo}</h3>
                <p className="text-xs text-gray-600 mb-2">{punto.descripcion}</p>
                
                {punto.tipo === 'domicilio' && (
                    <div className="mt-2 border-t pt-2">
                        {punto.atendido ? (
                            <div className="text-green-600 font-bold text-xs flex items-center justify-center gap-1">
                                <CheckCircle size={14}/> ¡Ya Atendido!
                            </div>
                        ) : (
                            punto.editable ? (
                                <button 
                                    onClick={() => onAtenderDomicilio && onAtenderDomicilio(punto)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Syringe className="w-3 h-3"/> Atender Domicilio
                                </button>
                            ) : (
                                <span className="text-xs text-orange-500 font-medium italic">
                                    Campaña no iniciada
                                </span>
                            )
                        )}
                    </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapaCampana;