import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router';
import App from './App';
import CheckoutPage from './pages/CheckoutPage';
import ZKCheckout from './pages/ZKCheckout';
import LogisticsDashboard from './pages/LogisticsDashboard';
import DeliveryManagement from './pages/DeliveryManagement';
import OracleInterface from './pages/OracleInterface';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/zk-checkout',
    element: <ZKCheckout />,
  },
  {
    path: '/logistics',
    element: <LogisticsDashboard />,
  },
  {
    path: '/logistics/delivery',
    element: <DeliveryManagement />,
  },
  {
    path: '/logistics/oracle',
    element: <OracleInterface />,
  },
]);

function Router() {
  return (
    <NuqsAdapter router={router}>
      <RouterProvider router={router} />
    </NuqsAdapter>
  );
}

export default Router;
