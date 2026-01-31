import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Heart, Stethoscope, Search, MapPin, Phone, 
  CalendarCheck, ChevronDown, ChevronUp, 
  CreditCard, BookOpen, PawPrint, AlertTriangle, Info, Megaphone,
  Syringe, Dog, Cat, Activity, Pill
} from 'lucide-react';

import horarioService from '../services/horario.service';
import publicService from '../services/public.service';

import imagenPortada from '../assets/portada.png';
import imgMision1 from '../assets/mision1.png'; 
import imgMision2 from '../assets/mision2.png'; 

const iconMap = {
    'Heart': Heart,
    'Stethoscope': Stethoscope,
    'Search': Search,
    'CreditCard': CreditCard,
    'BookOpen': BookOpen,
    'Phone': Phone,
    'ShieldCheck': ShieldCheck,
    'PawPrint': PawPrint,
    'Syringe': Syringe,
    'Dog': Dog,
    'Cat': Cat,
    'Activity': Activity,
    'Pill': Pill,
    'Megaphone': Megaphone,
    'AlertTriangle': AlertTriangle,
    'Info': Info
};

const colorMap = {
    'red': { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    'blue': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'purple': { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    'green': { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    'yellow': { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    'indigo': { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'orange': { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    'gray': { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' }
};

const WelcomePage = () => {
  const [openSection, setOpenSection] = useState(null);
  
  const [horario, setHorario] = useState({
      diasTexto: "Cargando...",
      manana: "...",
      tarde: "..."
  });

  const [servicios, setServicios] = useState([]);

  const toggleSection = (index) => setOpenSection(openSection === index ? null : index);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
      const fetchHorario = async () => {
          try {
              const data = await horarioService.getHorarioPublico();
              if (data) {
                  let textoDias = "Lunes a Viernes"; 
                  if (data.dias_atencion) {
                      const dias = data.dias_atencion.split(',').map(Number).sort((a,b)=>a-b);
                      const esLunesAViernes = JSON.stringify(dias) === JSON.stringify([1,2,3,4,5]);
                      const esLunesASabado = JSON.stringify(dias) === JSON.stringify([1,2,3,4,5,6]);
                      
                      if (esLunesAViernes) textoDias = "Lunes a Viernes";
                      else if (esLunesASabado) textoDias = "Lunes a Sábado";
                      else {
                          const mapDias = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
                          const nombres = dias.map(d => mapDias[d]);
                          if (nombres.length > 1) {
                              const ultimo = nombres.pop();
                              textoDias = nombres.join(', ') + ' y ' + ultimo;
                          } else {
                              textoDias = nombres[0];
                          }
                      }
                  }
                  const fmt = (time) => time ? time.slice(0, 5) : '--:--';
                  setHorario({
                      diasTexto: textoDias,
                      manana: `${fmt(data.apertura_manana)} - ${fmt(data.cierre_manana)}`,
                      tarde: `${fmt(data.apertura_tarde)} - ${fmt(data.cierre_tarde)}`
                  });
              }
          } catch (error) {
              console.error("Error horario", error);
              setHorario({ diasTexto: "Consultar en oficina", manana: "08:00 - 12:00", tarde: "14:00 - 18:00" });
          }
      };

      const fetchServicios = async () => {
          try {
              const data = await publicService.getServicios();
              setServicios(data);
          } catch (error) {
              console.error("Error cargando servicios", error);
          }
      };

      fetchHorario();
      fetchServicios();
  }, []);

  const requisitos = [
    { titulo: "Requisitos para Esterilización", icono: <Stethoscope className="w-5 h-5 text-blue-500" />, contenido: ["Mascota entre 6 meses y 5 años.", "Ayuno sólido de 12 horas.", "Carnet de vacuna antirrábica vigente.", "Traer 2 frazadas polares.", "Hemograma (> 3 años)."] },
    { titulo: "Requisitos para Adopción", icono: <PawPrint className="w-5 h-5 text-purple-500" />, contenido: ["Fotocopia de Cédula de Identidad.", "Fotocopia de factura de luz o agua.", "Croquis del domicilio.", "Firma de acta de compromiso.", "Disponibilidad de espacio."] }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans scroll-smooth">
      
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 leading-none">ZOONOSIS</h1>
                <p className="text-xs text-blue-600 font-bold tracking-widest uppercase">Potosí</p>
              </div>
            </div>

         
            <div className="hidden md:flex items-center gap-5 text-sm font-bold text-gray-500 uppercase tracking-wide">
                <Link to="/campanas-publicas" className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    <Megaphone className="w-4 h-4"/> Campañas
                </Link>
                <Link to="/reportes-publicos" className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <AlertTriangle className="w-4 h-4"/> Reportes
                </Link>
                <button onClick={() => scrollToSection('servicios')} className="hover:text-blue-600 transition-colors">Servicios</button>
                <button onClick={() => scrollToSection('requisitos')} className="hover:text-blue-600 transition-colors">Trámites</button>
                <button onClick={() => scrollToSection('horarios')} className="hover:text-blue-600 transition-colors">Horarios</button>
                <button onClick={() => scrollToSection('ubicacion')} className="hover:text-blue-600 transition-colors">Ubicación</button>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors hidden sm:block">Ingresar</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">Crear Cuenta</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold mb-4">
              <span className="mr-2">🇧🇴</span> Gobierno Autónomo Municipal de Potosí
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Bienestar animal,<br />
              <span className="text-blue-400">salud para todos.</span>
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              La Unidad de Zoonosis trabaja en el control de enfermedades, esterilizaciones y el registro digital para una tenencia responsable en la Villa Imperial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/campanas-publicas" className="px-6 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center">
                <Megaphone className="mr-2 w-5 h-5"/> Ver Campañas
              </Link>
              <Link to="/reportes-publicos" className="px-6 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors text-center flex items-center justify-center">
                <AlertTriangle className="mr-2 w-5 h-5"/> Reportar Caso
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center relative">
             <div className="relative w-full max-w-lg aspect-video md:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
                <img src={imagenPortada} alt="Centro Zoonosis" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"/>
             </div>
          </div>
        </div>
      </div>

      <div id="nosotros" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2 relative">
                    <div className="grid grid-cols-2 gap-4">
                        <img src={imgMision1} className="rounded-2xl shadow-lg w-full h-64 object-cover transform translate-y-8" alt="Veterinaria"/>
                        <img src={imgMision2} className="rounded-2xl shadow-lg w-full h-64 object-cover" alt="Perro feliz"/>
                    </div>
                    <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                </div>
                <div className="w-full md:w-1/2">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="text-blue-600 w-5 h-5"/>
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Nuestra Misión</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">Comprometidos con la Salud Pública de Potosí</h2>
                    <div className="w-20 h-1.5 bg-red-500 rounded-full mb-8"></div>
                    <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                        <p>El Centro Municipal de Zoonosis es la entidad encargada de precautelar la salud de la población potosina mediante la vigilancia, prevención y control de enfermedades.</p>
                        <p>Nuestras instalaciones están equipadas para brindar atención veterinaria primaria, realizar campañas de esterilización y promover la adopción responsable.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div id="servicios" className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Nuestros Servicios</h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">Atención integral del Centro Municipal de Zoonosis.</p>
          </div>
          
          {servicios.length === 0 ? (
              <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Cargando servicios disponibles...</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicios.map((servicio, idx) => {
                  const IconComponent = iconMap[servicio.icono] || Info; // Fallback a 'Info' si no existe
                  const styles = colorMap[servicio.color] || colorMap['blue']; // Fallback a 'blue'

                  return (
                    <div key={servicio.id || idx} className={`p-6 rounded-2xl bg-white border ${styles.border} hover:shadow-xl hover:-translate-y-1 transition-all group`}>
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${styles.bg} ${styles.text} group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6"/>
                      </div>
                      <h3 className="font-bold text-gray-800 text-xl mb-3">{servicio.titulo}</h3>
                      <p className="text-gray-600 leading-relaxed">{servicio.descripcion}</p>
                    </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>

      <div id="requisitos" className="py-20 bg-white border-t border-gray-200">
         <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-extrabold text-gray-800">Guía de Trámites</h2>
               <p className="text-gray-600 mt-2">¿Qué necesitas para acceder a nuestros servicios?</p>
            </div>
            <div className="space-y-4">
              {requisitos.map((req, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <button onClick={() => toggleSection(index)} className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">{req.icono}</div>
                      <span className="font-bold text-gray-800 text-lg">{req.titulo}</span>
                    </div>
                    {openSection === index ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                  </button>
                  {openSection === index && (
                    <div className="p-5 pt-0 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2">
                       <ul className="space-y-2 mt-4">
                          {req.contenido.map((item, i) => (
                             <li key={i} className="flex items-start text-gray-600 text-sm"><span className="mr-2 text-blue-500 font-bold">•</span> {item}</li>
                          ))}
                       </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
         </div>
      </div>

      <div id="horarios" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
            <div className="bg-blue-700 rounded-3xl overflow-hidden shadow-2xl border-4 border-blue-700">
                <div className="bg-blue-800 py-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider flex justify-center items-center gap-4 uppercase">
                        <PawPrint className="w-10 h-10 opacity-80" /> HORARIOS DE ATENCIÓN <PawPrint className="w-10 h-10 opacity-80" />
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 text-white bg-blue-600">
                    <div className="p-10 text-center md:border-r-4 border-blue-400/30 flex flex-col justify-center items-center bg-blue-600 relative overflow-hidden">
                        <PawPrint className="absolute top-4 left-4 w-24 h-24 text-blue-500/20 rotate-12"/>
                        <h3 className="text-2xl font-bold mb-4 uppercase tracking-widest opacity-90 relative z-10">Días</h3>
                        <p className="text-4xl md:text-5xl font-extrabold leading-tight relative z-10 animate-in fade-in">
                            {horario.diasTexto}
                        </p>
                    </div>

                    <div className="p-10 text-center flex flex-col justify-center items-center bg-blue-600 relative overflow-hidden">
                        <PawPrint className="absolute bottom-4 right-4 w-24 h-24 text-blue-500/20 -rotate-12"/>
                        <h3 className="text-2xl font-bold mb-6 uppercase tracking-widest opacity-90 relative z-10">Horas</h3>
                        <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <div className="inline-block bg-blue-800/50 px-4 py-1 rounded-full text-sm font-bold uppercase mb-2 tracking-wider">Mañanas</div>
                                <p className="text-4xl md:text-5xl font-extrabold tracking-tight">{horario.manana}</p>
                            </div>
                            <div>
                                <div className="inline-block bg-blue-800/50 px-4 py-1 rounded-full text-sm font-bold uppercase mb-2 tracking-wider">Tardes</div>
                                <p className="text-4xl md:text-5xl font-extrabold tracking-tight">{horario.tarde}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div id="ubicacion" className="bg-slate-900 text-white py-16">
         <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] group">
               <div className="bg-blue-500/20 p-4 rounded-2xl mb-4 group-hover:bg-blue-500/30 transition-colors"><MapPin className="w-10 h-10 text-blue-400" /></div>
               <h4 className="font-bold text-2xl mb-3">Ubicación</h4>
               <p className="text-gray-300 text-lg mb-6 leading-relaxed">Avenida Highland Players,<br/>casi esquina Av. Las Banderas<br/>Potosí, Bolivia</p>
               <a href="https://www.google.com/maps/search/?api=1&query=-19.572597104290494,-65.75241429748819" target="_blank" rel="noreferrer" className="text-sm bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl transition-colors flex items-center font-bold shadow-lg shadow-blue-500/20">Ver en Google Maps <MapPin className="w-4 h-4 ml-2"/></a>
            </div>
            <div className="flex flex-col items-center md:items-start p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] group">
               <div className="bg-red-500/20 p-4 rounded-2xl mb-4 group-hover:bg-red-500/30 transition-colors"><Phone className="w-10 h-10 text-red-400" /></div>
               <h4 className="font-bold text-2xl mb-3">Contacto</h4>
               <p className="text-gray-300 mb-2">Central Telefónica:</p>
               <h4 className="font-bold text-2xl mb-3">2 6229922</h4>
               <div className="mt-6 flex items-center bg-red-500/20 px-4 py-2 rounded-full text-red-300 text-sm font-bold"><AlertTriangle className="w-4 h-4 mr-2"/> Emergencias las 24 horas</div>
            </div>
         </div>
      </div>

      <footer className="bg-slate-950 text-gray-500 py-8 border-t border-gray-800 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4"><p className="mb-2">© {new Date().getFullYear()} Unidad de Zoonosis - Gobierno Autónomo Municipal de Potosí.</p></div>
      </footer>
    </div>
  );
};

export default WelcomePage;