import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { PageLoader } from './components/index.js';
import DashboardLayout from './layouts/DashboardLayout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Discover from './pages/Discover.jsx';
import ItemDetails from './pages/ItemDetails.jsx';
import MyBorrowings from './pages/MyBorrowings.jsx';
import MyLending from './pages/MyLending.jsx';
import Requests from './pages/Requests.jsx';
import NotificationsPage from './pages/Notifications.jsx';
import Reputation from './pages/Reputation.jsx';
import Settings from './pages/Settings.jsx';
import ItemForm from './pages/ItemForm.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';
import HandoverVerify from './pages/HandoverVerify.jsx';

function Protected({ children }) {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children || <Outlet />;
}

function Guest({ children }) {
  const { user, initialized } = useAuth();
  if (!initialized) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route path="/verify/:token" element={<HandoverVerify />} />
      <Route path="/handover/:token" element={<HandoverVerify />} />

      <Route
        path="/"
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="discover" element={<Discover />} />
        <Route path="items/:id" element={<ItemDetails />} />
        <Route path="items/new" element={<ItemForm />} />
        <Route path="items/:id/edit" element={<ItemForm />} />
        <Route path="borrowings" element={<MyBorrowings />} />
        <Route path="lending" element={<MyLending />} />
        <Route path="requests" element={<Requests />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reputation" element={<Reputation />} />
        <Route path="settings" element={<Settings />} />

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}