import React, { useState, useEffect } from 'react';
import { useAuth } from '/src/context/AuthContext.jsx'; 
import animalService from '../../services/animal.service.js';

import { Dog, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const PropietarioDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-800">Panel del Propietario</h1>
      <p className="mt-4 text-xl text-gray-600">
        Hola, <span className="font-semibold text-gray-900">{user.nombre}</span>.
      </p>
      <p className="mt-2 text-gray-600">Bienvenido a tu espacio personal en Zoonosis.</p>
      
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        
        <Link to="/propietario/mis-mascotas" className="group block">
            <div className="h-full rounded-xl bg-white p-8 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg border-t-4 border-blue-500">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Dog className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">Mis Mascotas</h3>
                <p className="mt-2 text-gray-600">Ver historial médico, vacunas y generar código QR.</p>
            </div>
        </Link>

        <Link to="/propietario/mis-citas" className="group block">
            <div className="h-full rounded-xl bg-white p-8 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg border-t-4 border-purple-500">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600">Mis Citas</h3>
                <p className="mt-2 text-gray-600">Revisa tus próximas visitas al veterinario.</p>
            </div>
        </Link>

        <Link to="/propietario/mapa" className="group block">
            <div className="h-full rounded-xl bg-white p-8 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg border-t-4 border-red-500">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-red-600">Animales Perdidos</h3>
                <p className="mt-2 text-gray-600">Reporta una pérdida o ayuda a encontrar mascotas en el mapa.</p>
            </div>
        </Link>

      </div>
    </div>
  );
};
export default PropietarioDashboard;