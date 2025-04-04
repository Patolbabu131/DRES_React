import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from './components/context/ThemeContext';
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


const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/site", element: <Site /> },
      { path: "/user", element: <User /> },
      {path:"/supplier", element: <Supplier />},
      {path:"/unittype", element: <Unittype />},
      {path:"/material", element:<Material/>}
    ]
  } 
]);

function App() {
  const [count, setCount] = useState(0);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
