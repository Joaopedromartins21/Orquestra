import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Driver } from '../types';
import { localDB } from '../lib/database';

interface DriverContextType {
  drivers: Driver[];
  getDriverById: (id: string) => Driver | undefined;
  getAvailableDrivers: () => Driver[];
  updateDriverAvailability: (driverId: string, available: boolean) => Promise<void>;
  isLoading: boolean;
}

const DriverContext = createContext<DriverContextType>({
  drivers: [],
  getDriverById: () => undefined,
  getAvailableDrivers: () => [],
  updateDriverAvailability: async () => {},
  isLoading: true,
});

export const useDrivers = () => useContext(DriverContext);

interface DriverProviderProps {
  children: ReactNode;
}

export const DriverProvider = ({ children }: DriverProviderProps) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const data = localDB.getAllDrivers();

      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDriverById = (id: string) => {
    return drivers.find(driver => driver.id === id);
  };

  const getAvailableDrivers = () => {
    return drivers.filter(driver => driver.available);
  };

  const updateDriverAvailability = async (driverId: string, available: boolean) => {
    try {
      setDrivers(prev =>
        prev.map(driver =>
          driver.id === driverId
            ? { ...driver, available }
            : driver
        )
      );
    } catch (error) {
      console.error('Error updating driver availability:', error);
      throw error;
    }
  };

  return (
    <DriverContext.Provider
      value={{
        drivers,
        getDriverById,
        getAvailableDrivers,
        updateDriverAvailability,
        isLoading,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};