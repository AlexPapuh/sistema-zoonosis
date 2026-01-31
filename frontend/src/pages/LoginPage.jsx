import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  ShieldCheck, Mail, Lock, LogIn, ArrowLeft, AlertCircle, 
  KeyRound, Send, Eye, EyeOff, CheckCircle 
} from 'lucide-react';

const LoginPage = () => {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      Swal.fire({
        icon: 'success',
        title: 'Código enviado',
        text: 'Revisa tu bandeja de entrada (y spam)',
        confirmButtonColor: '#2563eb'
      });
      setView('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    
    if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden. Por favor verifícalas.');
        return;
    }
    if (newPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    

    setLoading(true);
    try {
      await authService.resetPassword(email, code, newPassword);
      Swal.fire({
        icon: 'success',
        title: 'Contraseña Actualizada',
        text: 'Ya puedes iniciar sesión con tu nueva contraseña',
        confirmButtonColor: '#2563eb'
      });
      
      
      setView('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/50 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <button 
          onClick={() => {
             if (view === 'login') navigate('/');
             else {
                 setView('login');
                 setError(''); 
             }
          }}
          className="inline-flex items-center text-gray-400 hover:text-blue-600 mb-6 transition-colors text-xs font-bold uppercase tracking-wide group"
        >
           <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
           {view === 'login' ? 'Volver al Inicio' : 'Volver al Login'}
        </button>

        <div className="text-center mb-8">
           <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4 shadow-sm">
              <ShieldCheck className="w-10 h-10" />
           </div>
           <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
             {view === 'login' ? 'Iniciar Sesión' : 'Recuperar Cuenta'}
           </h1>
           <p className="text-gray-500 mt-2 text-sm">
             {view === 'login' ? 'Accede al Sistema de Zoonosis' : 'Sigue los pasos para restablecer'}
           </p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Correo Electrónico
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <Mail className="text-gray-400 w-5 h-5 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contraseña
                  </label>
              </div>
              
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <Lock className="text-gray-400 w-5 h-5 mr-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-medium"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-blue-600">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
              <div className="text-right mt-2">
                <button type="button" onClick={() => setView('forgot')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                <>
                  Ingresar <LogIn className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleRequestCode} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <p className="text-sm text-gray-600 text-center px-4">
               Ingresa tu correo electrónico y te enviaremos un código de verificación.
             </p>
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Correo Electrónico
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <Mail className="text-gray-400 w-5 h-5 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-medium"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] flex justify-center items-center"
            >
               {loading ? 'Enviando...' : <>Enviar Código <Send className="w-4 h-4 ml-2"/></>}
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg text-center border border-blue-100 mb-2">
                Código enviado a <b>{email}</b>
             </div>
             
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Código de Verificación
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <KeyRound className="text-gray-400 w-5 h-5 mr-3" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-mono text-lg tracking-widest text-center"
                  required
                />
              </div>
            </div>

            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Nueva Contraseña
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                <Lock className="text-gray-400 w-5 h-5 mr-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-medium"
                  required
                  placeholder="Mínimo 6 caracteres"
                />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-blue-600">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Confirmar Contraseña
              </label>
              <div className={`flex items-center bg-gray-50 border rounded-xl px-4 py-3 focus-within:ring-2 transition-all shadow-sm 
                    ${confirmPassword && newPassword !== confirmPassword 
                        ? 'border-red-300 focus-within:ring-red-500 bg-red-50' 
                        : 'border-gray-200 focus-within:ring-blue-500 focus-within:bg-white'}`
              }>
                <CheckCircle className={`w-5 h-5 mr-3 ${confirmPassword && newPassword === confirmPassword ? 'text-green-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-gray-700 font-medium"
                  required
                  placeholder="Repite la contraseña"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-1 font-medium">Las contraseñas no coinciden</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] flex justify-center items-center"
            >
               {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}

        {view === 'login' && (
           <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">¿Aún no tienes cuenta?</p>
              <Link 
                to="/register" 
                className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors text-sm"
              >
                Crear Cuenta Nueva
              </Link>
           </div>
        )}

      </div>
    </div>
  );
};

export default LoginPage;