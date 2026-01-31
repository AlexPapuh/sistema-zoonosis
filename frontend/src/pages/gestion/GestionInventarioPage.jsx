import React, { useState, useEffect } from 'react';
import inventarioService from '../../services/inventario.service.js';
import { useAuth } from '../../context/AuthContext.jsx'; 
import { Archive, AlertTriangle, Package, Syringe, Plus, Edit, Trash2, X, Save, Calculator, Box, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importación correcta

const GestionInventarioPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Admin';

  const [productos, setProductos] = useState([]);
  const [stats, setStats] = useState({ total_productos: 0, stock_total_vacunas: 0, productos_bajo_stock: 0 });
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
      nombre: '', tipo: 'Insumo', 
      stock: 0, stock_minimo: 10, 
      lote: '', fecha_vencimiento: '', ubicacion: '', unidad: 'unidades',
      cantidad_envases: 0, 
      contenido_por_envase: 1 
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lista, estadisticas] = await Promise.all([
        inventarioService.getAllProductos(),
        inventarioService.getStats()
      ]);
      setProductos(lista);
      setStats(estadisticas);
    } catch (error) {
      console.error("Error cargando inventario", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generarReportePDF = () => {
    const doc = new jsPDF();
    const fechaHoy = new Date().toLocaleDateString();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE GENERAL DE INVENTARIO", 105, 10, null, null, "center");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("UNIDAD DE ZOONOSIS", 105, 16, null, null, "center");
    doc.text(`Fecha de emisión: ${fechaHoy}`, 105, 21, null, null, "center");

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Total de Productos: ${stats.total_productos}`, 14, 35);
    doc.text(`Stock Crítico (Alertas): ${stats.productos_bajo_stock}`, 14, 40);

    const tableData = productos.map(prod => {
        const estadoVenc = getVencimientoStatus(prod.fecha_vencimiento);
        let alertas = "";
        if (prod.stock <= prod.stock_minimo) alertas += " STOCK BAJO ";
        if (estadoVenc.text === 'VENCIDO') alertas += " VENCIDO ";
        if (estadoVenc.text === 'Por vencer') alertas += " POR VENCER ";

        return [
            prod.nombre, prod.tipo, `${Number(prod.stock).toFixed(2)} ${prod.unidad}`,
            prod.lote || '-', prod.fecha_vencimiento ? new Date(prod.fecha_vencimiento).toLocaleDateString() : '-',
            prod.ubicacion || '-', alertas || 'OK'
        ];
    });

    autoTable(doc, {
        startY: 50,
        head: [['Producto', 'Tipo', 'Stock', 'Lote', 'Vencimiento', 'Ubicación', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8, cellPadding: 2 },
        didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 6) {
                const texto = data.cell.raw;
                if (texto.includes('STOCK BAJO') || texto.includes('VENCIDO')) {
                    data.cell.styles.textColor = [220, 53, 69];
                    data.cell.styles.fontStyle = 'bold';
                } else if (texto.includes('POR VENCER')) {
                     data.cell.styles.textColor = [255, 140, 0];
                } else {
                    data.cell.styles.textColor = [40, 167, 69];
                }
            }
        }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
    }
    doc.save(`Inventario_Zoonosis_${fechaHoy.replace(/\//g, '-')}.pdf`);
  };

  const getVencimientoStatus = (fecha) => {
      if (!fecha) return { color: 'text-gray-400', text: 'No aplica' };
      const hoy = new Date();
      const venc = new Date(fecha);
      const diffTime = venc - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { color: 'text-red-600 font-bold bg-red-100 px-2 rounded', text: 'VENCIDO' };
      if (diffDays < 30) return { color: 'text-orange-600 font-bold bg-orange-100 px-2 rounded', text: 'Por vencer' };
      return { color: 'text-green-600', text: 'Vigente' };
  };

  useEffect(() => {
      const unidadesDivisibles = ['ml', 'mg', 'kg', 'lt']; 
      
      if (unidadesDivisibles.includes(form.unidad)) {
          const total = parseFloat(form.cantidad_envases || 0) * parseFloat(form.contenido_por_envase || 0);
          setForm(prev => ({ ...prev, stock: total }));
      }
  }, [form.cantidad_envases, form.contenido_por_envase, form.unidad]);

  const handleOpenCreate = () => {
      setIsEditing(false);
      setForm({ 
          nombre: '', tipo: 'Insumo', stock: 0, stock_minimo: 10, lote: '', 
          fecha_vencimiento: '', ubicacion: '', unidad: 'unidades',
          cantidad_envases: 0, contenido_por_envase: 1
      });
      setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
      setIsEditing(true);
      setEditingId(prod.id);
      
      const contenido = prod.contenido_por_envase || 1;
      const envases = contenido > 0 ? prod.stock / contenido : 0;

      setForm({
          nombre: prod.nombre,
          tipo: prod.tipo,
          stock: prod.stock,
          stock_minimo: prod.stock_minimo,
          lote: prod.lote || '',
          fecha_vencimiento: prod.fecha_vencimiento ? prod.fecha_vencimiento.split('T')[0] : '',
          ubicacion: prod.ubicacion || '',
          unidad: prod.unidad || 'unidades',
          cantidad_envases: envases, 
          contenido_por_envase: contenido 
      });
      setShowModal(true);
  };

  const handleDelete = async (id) => {
      const result = await Swal.fire({
          title: '¿Eliminar producto?',
          text: "No se puede deshacer.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminar'
      });

      if (result.isConfirmed) {
          try {
              await inventarioService.deleteProducto(id);
              Swal.fire('Eliminado', 'Producto eliminado.', 'success');
              fetchData();
          } catch (error) {
              Swal.fire('Error', 'No se pudo eliminar.', 'error');
          }
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          if (isEditing) {
              await inventarioService.updateProducto(editingId, form);
              Swal.fire('Actualizado', 'Inventario actualizado.', 'success');
          } else {
              await inventarioService.createProducto(form);
              Swal.fire('Creado', 'Producto agregado.', 'success');
          }
          setShowModal(false);
          fetchData();
      } catch (error) {
          Swal.fire('Error', 'No se pudo guardar.', 'error');
      }
  };

  const handleInputChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
  };

  const esDivisible = ['ml', 'mg', 'kg', 'lt'].includes(form.unidad);

  if (loading) return <div className="text-center p-10">Cargando inventario...</div>;

  return (
    <div className="container mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-bold text-gray-800">Inventario de Suministros</h1>
            <p className="text-gray-600">Control de stock, vacunas y medicamentos</p>
        </div>
        
        {isAdmin && (
            <div className="flex gap-2">
                <button onClick={generarReportePDF} className="flex items-center rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white shadow-md hover:bg-gray-800 transition-colors">
                    <Printer className="mr-2 h-5 w-5" /> Imprimir Reporte
                </button>
                <button onClick={handleOpenCreate} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors">
                    <Plus className="mr-2 h-5 w-5" /> Agregar Producto
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border-l-4 border-blue-500">
            <div><p className="text-gray-500 text-sm font-medium uppercase">Total Productos</p><p className="text-3xl font-bold text-gray-800">{stats.total_productos}</p></div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Package className="h-8 w-8" /></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border-l-4 border-green-500">
            <div><p className="text-gray-500 text-sm font-medium uppercase">Stock Vacunas</p><p className="text-3xl font-bold text-gray-800">{Number(stats.stock_total_vacunas).toFixed(0)}</p></div>
            <div className="p-3 rounded-full bg-green-100 text-green-600"><Syringe className="h-8 w-8" /></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border-l-4 border-orange-500">
            <div><p className="text-gray-500 text-sm font-medium uppercase">Bajo Stock</p><p className="text-3xl font-bold text-gray-800">{stats.productos_bajo_stock}</p></div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600"><AlertTriangle className="h-8 w-8" /></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase text-xs leading-normal">
                        <th className="py-3 px-6">Producto</th>
                        <th className="py-3 px-6">Tipo</th>
                        <th className="py-3 px-6 text-center">Stock Disponible</th>
                        <th className="py-3 px-6">Lote</th>
                        <th className="py-3 px-6">Vencimiento</th>
                        <th className="py-3 px-6">Ubicación</th>
                        {isAdmin && <th className="py-3 px-6 text-center">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                    {productos.map((prod) => {
                        const esBajo = prod.stock < prod.stock_minimo;
                        const statusVenc = getVencimientoStatus(prod.fecha_vencimiento);
                        const esDivisible = ['ml', 'mg', 'lt', 'kg'].includes(prod.unidad?.toLowerCase());
                        const tieneEnvaseDefinido = prod.contenido_por_envase > 1;
                        const frascosAprox = tieneEnvaseDefinido ? (prod.stock / prod.contenido_por_envase).toFixed(1) : 0;

                        return (
                            <tr key={prod.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6 font-medium text-gray-900">{prod.nombre}</td>
                                <td className="py-3 px-6">
                                    <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                                        prod.tipo === 'Vacuna' ? 'bg-blue-100 text-blue-800' : 
                                        prod.tipo === 'Medicamento' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {prod.tipo}
                                    </span>
                                </td>
                                
                                <td className="py-3 px-6 text-center">
                                    {esDivisible && tieneEnvaseDefinido ? (
                                        <div className="flex flex-col items-center">
                                            <span className={`font-bold text-lg ${esBajo ? 'text-red-600' : 'text-gray-800'}`}>
                                                 {frascosAprox} <span className="text-sm font-normal text-gray-500">Envases</span>
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1">
                                                Total: {Number(prod.stock).toFixed(2)} {prod.unidad}
                                                <span className="block text-[10px] text-gray-400">
                                                    (de {prod.contenido_por_envase} {prod.unidad} c/u)
                                                </span>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <span className={`font-bold text-lg ${esBajo ? 'text-red-600' : 'text-gray-800'}`}>
                                                {Number(prod.stock).toFixed(esDivisible ? 2 : 0)} 
                                                <span className="text-sm font-normal text-gray-500 ml-1">{prod.unidad}</span>
                                            </span>
                                        </div>
                                    )}
                                    {esBajo && <div className="text-xs text-red-500 font-bold mt-1 animate-pulse">⚠️ Stock Bajo</div>}
                                </td>

                                <td className="py-3 px-6 font-mono text-xs">{prod.lote || '-'}</td>
                                <td className="py-3 px-6">
                                    <div className="flex flex-col">
                                        <span>{prod.fecha_vencimiento ? new Date(prod.fecha_vencimiento).toLocaleDateString() : '-'}</span>
                                        <span className={`text-[10px] uppercase ${statusVenc.color}`}>{statusVenc.text}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-6 text-gray-500">{prod.ubicacion || 'Sin asignar'}</td>
                                
                                {isAdmin && (
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex item-center justify-center space-x-2">
                                            <button onClick={() => handleOpenEdit(prod)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                                <Edit className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => handleDelete(prod.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input type="text" name="nombre" required className="w-full border rounded-lg p-2.5" value={form.nombre} onChange={handleInputChange} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select name="tipo" className="w-full border rounded-lg p-2.5 bg-white" value={form.tipo} onChange={handleInputChange}>
                                <option>Insumo</option>
                                <option>Medicamento</option>
                                <option>Vacuna</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Consumo</label>
                            <select name="unidad" className="w-full border rounded-lg p-2.5 bg-white" value={form.unidad} onChange={handleInputChange}>
                                <option value="unidades">Unidades / Pza</option>
                                <option value="ml">Mililitros (ml)</option>
                                <option value="mg">Miligramos (mg)</option>
                                <option value="lt">Litros (lt)</option>
                                <option value="kg">Kilogramos (kg)</option>
                                <option value="kits">Kits</option>
                                <option value="cajas">Cajas</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-3 flex items-center text-sm"><Calculator className="w-4 h-4 mr-2"/> Cálculo de Stock Inicial</h3>
                        
                        {esDivisible ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Cant. Frascos/Envases/Bolsas</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        name="cantidad_envases" 
                                        className="w-full border border-blue-300 rounded-lg p-2 text-center" 
                                        placeholder=""
                                        value={form.cantidad_envases || ''} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Contenido por Envase ({form.unidad})</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="0.1"
                                        name="contenido_por_envase" 
                                        className="w-full border border-blue-300 rounded-lg p-2 text-center" 
                                        placeholder=""
                                        value={form.contenido_por_envase} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                                <div className="col-span-2 text-center bg-white p-2 rounded border border-gray-200">
                                    <span className="text-gray-500 text-xs uppercase font-bold">Total a Registrar:</span>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {Number(form.stock).toFixed(2)} <span className="text-sm font-normal text-gray-500">{form.unidad}</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Total ({form.unidad})</label>
                                <input 
                                    type="number" 
                                    name="stock" 
                                    required 
                                    min="0"
                                    className="w-full border rounded-lg p-2.5 text-lg font-bold text-gray-800" 
                                    value={form.stock} 
                                    onChange={(e) => setForm({...form, stock: e.target.value})} 
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo (Alerta)</label>
                            <input type="number" name="stock_minimo" required className="w-full border rounded-lg p-2.5" value={form.stock_minimo} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                            <input type="text" name="lote" className="w-full border rounded-lg p-2.5" value={form.lote} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
                            <input 
                                type="date" 
                                name="fecha_vencimiento" 
                                className="w-full border rounded-lg p-2.5" 
                                value={form.fecha_vencimiento} 
                                onChange={handleInputChange} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                            <input type="text" name="ubicacion" className="w-full border rounded-lg p-2.5" placeholder="" value={form.ubicacion} onChange={handleInputChange} />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg mt-2 flex justify-center items-center">
                        <Save className="w-5 h-5 mr-2" /> Guardar Producto
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default GestionInventarioPage;