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
    const [mascotasPoints, setMascotasPoints] = useState([]);
    const [casosRaw, setCasosRaw] = useState([]);
    const [tiposDisponibles, setTiposDisponibles] = useState([]);
    const [filtroCaso, setFiltroCaso] = useState('todos');
    
    const gradienteMascotas = { 
        gradient: { 0.3: '#3b82f6', 0.6: '#1d4ed8', 1.0: '#1e3a8a' } 
    }; 

    const coloresPorTipo = {
        'Zoonosis': { 0.4: '#fdba74', 1.0: '#ea580c' },      
        'Perdido': { 0.4: '#fca5a5', 1.0: '#dc2626' },       
        'Encontrada': { 0.4: '#86efac', 1.0: '#16a34a'},     
        'default': { 0.4: '#a1a1aa', 1.0: '#52525b' }        
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
        return casosRaw.filter(c => c.tipo === tipo).map(c => [c.lat, c.lng, 1.0]); 
    };

    const f = filtroCaso.toLowerCase();
    const showZoonosis = f === 'todos' || f === 'solo_casos' || f.includes('zoonosis') || f.includes('mordedura');
    const showPerdido = f === 'todos' || f === 'solo_casos' || f.includes('perdid');
    const showEncontrada = f === 'todos' || f === 'solo_casos' || f.includes('encontrad');

    return (
        <div className="container mx-auto h-[calc(100vh-80px)] flex flex-col p-6 space-y-4">
            
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

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Layers className={`h-4 w-4 ${filtroCaso !== 'todos' && filtroCaso !== 'poblacion' ? 'text-orange-500' : 'text-blue-600'}`} />
                        </div>
                        <select
                            value={filtroCaso}
                            onChange={(e) => setFiltroCaso(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <option value="todos">🌍 Población + Todos los Casos</option>
                            <option value="poblacion">🐕 Solo Población</option>
                            <option value="solo_casos">⚠️ Solo Casos (Todos)</option>
                            
                            <optgroup label="Filtrar por Caso Específico">
                                {tiposDisponibles.map(tipo => {
                                    if(tipo.toLowerCase() === 'abandono') return null;
                                    return <option key={tipo} value={tipo}>Caso: {tipo}</option>
                                })}
                            </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative z-0">
                {loading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-lg font-bold text-gray-600">Analizando datos...</p>
                    </div>
                )}
                
                <MapContainer center={[-19.5894, -65.7541]} zoom={14} style={{ height: "100%", width: "100%" }}>
                    <MapFix /> 
                    
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {(filtroCaso === 'todos' || filtroCaso === 'poblacion') && mascotasPoints.length > 0 && (
                        <HeatmapLayer points={mascotasPoints} config={gradienteMascotas} />
                    )}

                    {tiposDisponibles.map(tipo => {
                        const t = tipo.toLowerCase();
                        if (t === 'abandono') return null;
                        if (filtroCaso !== 'todos' && filtroCaso !== 'solo_casos' && filtroCaso !== tipo) return null;

                        let gradiente = coloresPorTipo['default'];
                        if (t.includes('perdid')) gradiente = coloresPorTipo['Perdido'];
                        else if (t.includes('encontrad')) gradiente = coloresPorTipo['Encontrada'];
                        else if (t.includes('zoonosis') || t.includes('mordedura')) gradiente = coloresPorTipo['Zoonosis'];

                        return (
                            <HeatmapLayer 
                                key={tipo} 
                                points={getPuntosPorTipo(tipo)} 
                                config={{ gradient: gradiente }} 
                            />
                        );
                    })}

                </MapContainer>

                <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-100 w-64 animate-fade-in">
                    <h4 className="font-bold text-gray-800 text-xs uppercase mb-3 flex items-center">
                        <Info className="w-4 h-4 mr-1.5 text-blue-600"/> Guía de Colores
                    </h4>
                    
                    {(filtroCaso === 'todos' || filtroCaso === 'poblacion') && (
                        <div className={`mb-3 pb-3 ${filtroCaso === 'todos' ? 'border-b border-gray-200' : ''}`}>
                            <div className="flex items-center text-xs font-bold text-gray-700 mb-1.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 mr-2 shadow-sm border border-blue-800"></span>
                                Población de Mascotas
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-500 mt-1 pl-6"><span>Concentración Baja</span><span>Alta</span></div>
                            <div className="h-1.5 ml-6 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-900"></div>
                        </div>
                    )}

                    {filtroCaso !== 'poblacion' && (
                        <div className="space-y-3">
                            {showZoonosis && (
                                <div>
                                    <div className="flex items-center text-xs font-bold text-gray-700 mb-1.5">
                                        <span className="w-3.5 h-3.5 rounded-full bg-orange-500 mr-2 shadow-sm border border-orange-700"></span>
                                        Zoonosis / Mordedura
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500 pl-6 mb-1"><span>Aislado</span><span>Foco Crítico</span></div>
                                    <div className="h-1.5 ml-6 rounded-full bg-gradient-to-r from-orange-200 via-orange-500 to-orange-800"></div>
                                </div>
                            )}
                            
                            {showPerdido && (
                                <div>
                                    <div className="flex items-center text-xs font-bold text-gray-700 mb-1.5">
                                        <span className="w-3.5 h-3.5 rounded-full bg-red-600 mr-2 shadow-sm border border-red-800"></span>
                                        Mascota Perdida
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500 pl-6 mb-1"><span>Aislado</span><span>Foco Crítico</span></div>
                                    <div className="h-1.5 ml-6 rounded-full bg-gradient-to-r from-red-300 via-red-500 to-red-900"></div>
                                </div>
                            )}

                            {showEncontrada && (
                                <div>
                                    <div className="flex items-center text-xs font-bold text-gray-700 mb-1.5">
                                        <span className="w-3.5 h-3.5 rounded-full bg-green-500 mr-2 shadow-sm border border-green-700"></span>
                                        Mascota Encontrada
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500 pl-6 mb-1"><span>Aislado</span><span>Foco Crítico</span></div>
                                    <div className="h-1.5 ml-6 rounded-full bg-gradient-to-r from-green-200 via-green-500 to-green-800"></div>
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