import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from './components/context/ThemeContext';
import { AuthProvider } from './components/context/AuthContext';
import './App.css';
import Dashboard from './components/Dashboard';
import Layout from './components/includes/Layout';
import Login from './components/AuthComponent/Login';
import Site from './components/SiteComponent/ListSite';
import User from './components/UserComponent/ListUser';
import Supplier from './components/SupplierComponent/ListSupplier';
import ProtectedRoute from './components/context/ProtectedRoute';
import Unittype from './components/UnitsComponent/ListUnits';
import Material from './components/MaterialComponent/ListMaterials';
import MaterialTransferForm from './components/TransactionComponent/MaterialTransferForm';
import Unauthorized from './components/AuthComponent/Unauthorized';
import ListRequest from './components/RequestComponent/ListRequest';
import AddMaterialRequest from './components/RequestComponent/AddMaterialRequest';
import TransactionHistoryDashboard from './components/TransactionComponent/TransactionHistoryDashboard';
import ListStock from './components/StockComponent/ListStock';
import IssueMaterialForm from './components/TransactionComponent/IssueMaterialForm';
import IssueMaterialToSiteForm from './components/TransactionComponent/IssueMaterialToSiteForm';
import ListConsumption from './components/ConsumptionComponent/ListConsumption';
import CreateConsumptionForm from './components/ConsumptionComponent/CreateConsumptionForm';

// Define route access by role
const ROLES = {
  ADMIN: 'admin',
  SITE_MANAGER: 'sitemanager',
  SITE_ENGINEER: 'siteengineer'
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { 
        path: "/dashboard", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.SITE_MANAGER]}>
            <TransactionHistoryDashboard  />
          </ProtectedRoute>
        )
      },
      { 
        path: "/site", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER]}>
            <Site />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/user", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER]}>
            <User />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/supplier", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Supplier />
          </ProtectedRoute>
        )
      },
      { 
        path: "/unittype", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER]}>
            <Unittype />
          </ProtectedRoute>
        )
      },
      { 
        path: "/material", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER]}>
            <Material />
          </ProtectedRoute>
        )
      },
      { 
        path: "/materialtransfer", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_ENGINEER]}>
            <MaterialTransferForm />
          </ProtectedRoute>
        )
      },
      
      { 
        path: "/listrequest", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER]}>
            <ListRequest />
          </ProtectedRoute>
        )
      },
      { 
        path: "/AddMaterialRequest", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SITE_ENGINEER,ROLES.SITE_MANAGER]}>
            <AddMaterialRequest />
          </ProtectedRoute>
        )
      },
      { 
        path: "/IssueMaterialForm/:requestId", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SITE_MANAGER]}>
            <IssueMaterialForm />
          </ProtectedRoute>
        )
      },
      { 
        path: "/IssueMaterialForm/", 
        element: (
          <ProtectedRoute allowedRoles={[ ROLES.SITE_MANAGER]}>
            <IssueMaterialForm />
          </ProtectedRoute>
        )
      },
      { 
        path: "/IssueMaterialToSiteForm/", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <IssueMaterialToSiteForm />
          </ProtectedRoute>
        )
      },
      { 
        path: "/IssueMaterialToSiteForm/:requestId", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <IssueMaterialToSiteForm />
          </ProtectedRoute>
        )
      },
      { 
        path: "/stock", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER]}>
            <ListStock />
          </ProtectedRoute>
        )
      },
      { 
        path: "/consumption", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER]}>
            <ListConsumption />
          </ProtectedRoute>
        )
      },
      { 
        path: "/template", 
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.SITE_ENGINEER]}>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      { 
        path: "/consumptionform", 
        element: (
          <ProtectedRoute allowedRoles={[ ROLES.SITE_ENGINEER]}>
            <CreateConsumptionForm />
          </ProtectedRoute>
        )
      },
    ]
  }
]);

function App() {
  const [count, setCount] = useState(0);

  return (
    <ThemeProvider>
      <AuthProvider>
        
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;