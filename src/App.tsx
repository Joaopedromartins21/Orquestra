import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { ProductProvider } from './context/ProductContext';
import { DriverProvider } from './context/DriverContext';
import { OrderProvider } from './context/OrderContext';
import { PaymentProvider } from './context/PaymentContext';
import { CashProvider } from './context/CashContext';
import { CostProvider } from './context/CostContext';
import { VehicleProvider } from './context/VehicleContext';
import { AppRoutes } from './AppRoutes';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomerProvider>
          <ProductProvider>
            <DriverProvider>
              <OrderProvider>
                <PaymentProvider>
                  <CashProvider>
                    <CostProvider>
                      <VehicleProvider>
                        <AppRoutes />
                      </VehicleProvider>
                    </CostProvider>
                  </CashProvider>
                </PaymentProvider>
              </OrderProvider>
            </DriverProvider>
          </ProductProvider>
        </CustomerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;