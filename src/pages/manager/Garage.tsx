import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useVehicles } from '../../context/VehicleContext';
import { Car, Plus, Wrench, AlertTriangle, Check, Trash2, Edit } from 'lucide-react';

const Garage: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, isLoading, error } = useVehicles();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    status: 'active' as const,
    last_maintenance: '',
    next_maintenance: '',
    notes: ''
  });

  const handleSubmit = async () => {
    try {
      if (showEditModal) {
        await updateVehicle(showEditModal, formData);
        setShowEditModal(null);
      } else {
        await addVehicle(formData);
        setShowAddModal(false);
      }
      
      setFormData({
        plate: '',
        model: '',
        brand: '',
        year: new Date().getFullYear(),
        status: 'active',
        last_maintenance: '',
        next_maintenance: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEdit = (vehicle: any) => {
    setFormData({
      plate: vehicle.plate,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
      status: vehicle.status,
      last_maintenance: vehicle.last_maintenance || '',
      next_maintenance: vehicle.next_maintenance || '',
      notes: vehicle.notes || ''
    });
    setShowEditModal(vehicle.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVehicle(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check size={16} />;
      case 'maintenance':
        return <Wrench size={16} />;
      case 'inactive':
        return <AlertTriangle size={16} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Layout title="Garagem">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Garagem">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Garagem">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Frota de Veículos</h1>
            <p className="text-gray-600 mt-1">
              Total de veículos: {vehicles.length}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
          >
            <Plus size={18} className="mr-2" />
            Novo Veículo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Car size={24} className="text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                    <p className="text-sm text-gray-500">Placa: {vehicle.plate}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {getStatusIcon(vehicle.status)}
                  <span className="ml-1">
                    {vehicle.status === 'active' ? 'Ativo' :
                     vehicle.status === 'maintenance' ? 'Em Manutenção' :
                     'Inativo'}
                  </span>
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ano:</span> {vehicle.year}
                </p>
                {vehicle.last_maintenance && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Última Manutenção:</span>{' '}
                    {new Date(vehicle.last_maintenance).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {vehicle.next_maintenance && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Próxima Manutenção:</span>{' '}
                    {new Date(vehicle.next_maintenance).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {vehicle.notes && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Observações:</span> {vehicle.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(vehicle.id)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showEditModal ? 'Editar Veículo' : 'Adicionar Novo Veículo'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ABC-1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Ativo</option>
                    <option value="maintenance">Em Manutenção</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Última Manutenção
                  </label>
                  <input
                    type="date"
                    value={formData.last_maintenance}
                    onChange={(e) => setFormData({ ...formData, last_maintenance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próxima Manutenção
                  </label>
                  <input
                    type="date"
                    value={formData.next_maintenance}
                    onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(null);
                  setFormData({
                    plate: '',
                    model: '',
                    brand: '',
                    year: new Date().getFullYear(),
                    status: 'active',
                    last_maintenance: '',
                    next_maintenance: '',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showEditModal ? 'Salvar Alterações' : 'Adicionar Veículo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Garage;