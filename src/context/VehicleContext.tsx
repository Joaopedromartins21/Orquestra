import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localDB } from '../lib/database';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const VehicleContext = createContext<VehicleContextType>({
  vehicles: [],
  addVehicle: async () => {},
  updateVehicle: async () => {},
  deleteVehicle: async () => {},
  isLoading: true,
  error: null,
});

export const useVehicles = () => useContext(VehicleContext);

interface VehicleProviderProps {
  children: ReactNode;
}

export const VehicleProvider = ({ children }: VehicleProviderProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setError(null);
      const data = localDB.getAllVehicles();

      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      localDB.createVehicle(vehicleData);

      fetchVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>) => {
    try {
      setError(null);
      localDB.updateVehicle(id, vehicleData);

      fetchVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      setError(null);
      localDB.deleteVehicle(id);

      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        isLoading,
        error,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};