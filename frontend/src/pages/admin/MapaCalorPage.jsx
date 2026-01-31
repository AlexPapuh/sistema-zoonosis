import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; 
import reporteService from '../../services/reporte.service';
import { Layers, AlertTriangle, Dog, Info, ArrowLeft, Map as MapIcon, Filter, ChevronDown } from 'lucide-react';

const MapFix = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        setTimeout(() => map.invalidateSize(), 400);
    }, [map]);
    return null;
};

// --- COMPONENTE HEATMAP ---
const HeatmapLayer = ({ points, config }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;
        let heatLayer = null;

        const timer = setTimeout(() => {
            if (map.getSize().y > 0) {
                heatLayer = L.heatLayer(points, {
                    radius: 25,
                    blur: 18,
                    maxZoom: 16,
                    gradient: config.gradient
                }).addTo(map);
            }
        }, 200); 

        return () => {
            clearTimeout(timer);
            if (heatLayer) map.removeLayer(heatLayer);
        };
    }, [points, map, config]);

    return null;
};

const MapaCalorPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Datos
    const [mascotasPoints, setMascotasPoints] = useState([]);
    const [casosRaw, setCasosRaw] = useState([]);
    const [tiposDisponibles, setTiposDisponibles] = useState([]);

    // Filtros
    const [verMascotas, setVerMascotas] = useState(true);
    const [filtroCaso, setFiltroCaso] = useState('todos');

    
    const gradienteMascotas = { 
        gradient: { 0.3: '#a5b4fc', 0.6: '#6366f1', 1.0: '#312e81' } 
    }; 

    const coloresPorTipo = {
        'Zoonosis': { 0.4: 'orange', 1.0: 'red' },       
        'Mordedura': { 0.4: 'orange', 1.0: 'red' },      
        'Perdido': { 0.4: '#fde047', 1.0: '#ca8a04' },   
        'Encontrada': { 0.4: '#86efac', 1.0: '#16a34a'}, 
        'Abandono': { 0.4: '#f472b6', 1.0: '#db2777' },  
        'default': { 0.4: '#fca5a5', 1.0: '#b91c1c' }    
    };

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const res = await reporteService.getMapaCalor();
                setMascotasPoints(res.heatMascotas);
                setCasosRaw(res.rawCasos);

                const unicos = [...new Set(res.rawCasos.map(c => c.tipo))];
                setTiposDisponibles(unicos);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const getPuntosPorTipo = (tipo) => {
        return casosRaw
            .filter(c => c.tipo === tipo)
            .map(c => [c.lat, c.lng, 1.0]); 
    };

    return (
        <div className="container mx-auto h-[calc(100vh-80px)] flex flex-col p-6 space-y-4">
            
            {/* --- ENCABEZADO --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/reportes')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <MapIcon className="mr-2 text-indigo-600" size={24} /> 
                            Mapa de Riesgo
                        </h1>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    
                    <button 
                        onClick={() => setVerMascotas(!verMascotas)}
                        className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                            verMascotas 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' 
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <Dog className="w-4 h-4 mr-2"/> 
                        {verMascotas ? 'Ocultar Población' : 'Ver Población'}
                    </button>

                    <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AlertTriangle className={`h-4 w-4 ${filtroCaso !== 'todos' ? 'text-orange-500' : 'text-gray-400'}`} />
                        </div>
                        <select
                            value={filtroCaso}
                            onChange={(e) => setFiltroCaso(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <option value="todos">Todos los Casos</option>
                            {tiposDisponibles.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MAPA --- */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative z-0">
                {loading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-lg font-bold text-gray-600">Analizando datos...</p>
                    </div>
                )}
                
                <MapContainer center={[-19.5894, -65.7541]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <MapFix /> 
                    
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* CAPA 1: MASCOTAS (VIOLETA/INDIGO) */}
                    {verMascotas && mascotasPoints.length > 0 && (
                        <HeatmapLayer points={mascotasPoints} config={gradienteMascotas} />
                    )}

                    {/* CAPAS DINÁMICAS DE CASOS */}
                    {tiposDisponibles.map(tipo => {
                        if (filtroCaso !== 'todos' && filtroCaso !== tipo) return null;

                        let gradiente = coloresPorTipo['default'];
                        if (tipo.includes('Perdido')) gradiente = coloresPorTipo['Perdido'];
                        else if (tipo.includes('Encontrada')) gradiente = coloresPorTipo['Encontrada'];
                        else if (tipo.includes('Abandono')) gradiente = coloresPorTipo['Abandono'];
                        else if (tipo.includes('Zoonosis') || tipo.includes('Mordedura')) gradiente = coloresPorTipo['Zoonosis'];

                        return (
                            <HeatmapLayer 
                                key={tipo} 
                                points={getPuntosPorTipo(tipo)} 
                                config={{ gradient: gradiente }} 
                            />
                        );
                    })}

                </MapContainer>

                {/* LEYENDA FLOTANTE */}
                <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-100 w-60">
                    <h4 className="font-bold text-gray-700 text-xs uppercase mb-3 flex items-center"><Filter className="w-3 h-3 mr-1"/> Intensidad</h4>
                    
                    {verMascotas && (
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Poca</span><span className="text-indigo-700 font-bold">Población</span><span>Mucha</span></div>
                            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-200 via-indigo-500 to-indigo-900"></div>
                        </div>
                    )}

                    {(filtroCaso === 'todos' || filtroCaso) && (
                        <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Aislado</span><span className="text-red-600 font-bold">Alertas</span><span>Foco</span></div>
                            <div className="h-2 rounded-full bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600"></div>
                            
                            {filtroCaso === 'todos' && (
                                <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-gray-500">
                                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>Peligro</span>
                                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>Perdidos</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapaCalorPage;