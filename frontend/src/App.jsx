import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Warehouses from './pages/Warehouses';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Returns from './pages/Returns';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="customers" element={<Customers />} />
        <Route path='payments' element={<Payments/>}/>
        <Route path='returns' element={<Returns/>}/>
      </Route>
    </Routes>
  );
}

export default App;
