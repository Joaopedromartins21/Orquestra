import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PixPayment } from '../types';

interface PaymentContextType {
  generatePixQRCode: (orderId: string, amount: number) => PixPayment;
  completePayment: (orderId: string) => void;
  getPaymentByOrderId: (orderId: string) => PixPayment | undefined;
  payments: PixPayment[];
}

const PaymentContext = createContext<PaymentContextType>({
  generatePixQRCode: () => ({} as PixPayment),
  completePayment: () => {},
  getPaymentByOrderId: () => undefined,
  payments: [],
});

export const usePayments = () => useContext(PaymentContext);

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider = ({ children }: PaymentProviderProps) => {
  const [payments, setPayments] = useState<PixPayment[]>([]);

  // In a real app, this would generate a real PIX QR code
  // For demonstration, we're just creating a mock one
  const generatePixQRCode = (orderId: string, amount: number): PixPayment => {
    // Check if payment already exists
    const existingPayment = payments.find(p => p.orderId === orderId);
    if (existingPayment) {
      return existingPayment;
    }

    // Create a mock QR code data
    // In a real app, this would be generated by a payment provider
    const mockQRCodeData = `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426655440000520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5913Delivery App6008Sao Paulo62070503***63041234`;
    
    const newPayment: PixPayment = {
      orderId,
      amount,
      qrCodeData: mockQRCodeData,
      generatedAt: new Date().toISOString(),
      status: 'pending'
    };

    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  };

  const completePayment = (orderId: string) => {
    setPayments(prev => 
      prev.map(payment => 
        payment.orderId === orderId 
          ? { ...payment, status: 'completed' } 
          : payment
      )
    );
  };

  const getPaymentByOrderId = (orderId: string) => {
    return payments.find(payment => payment.orderId === orderId);
  };

  return (
    <PaymentContext.Provider
      value={{
        generatePixQRCode,
        completePayment,
        getPaymentByOrderId,
        payments,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};