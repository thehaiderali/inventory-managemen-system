import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Warehouse, 
  Tags, 
  Truck, 
  ArrowLeftRight, 
  UserCog, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '@/hooks/theme';
import { Button } from '@/components/ui/button';
import { authService } from '../services';

const navItems = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', name: 'Products', icon: Package },
  { path: '/orders', name: 'Orders', icon: ShoppingCart },
  { path: '/inventory', name: 'Inventory', icon: Warehouse },
  { path: '/customers', name: 'Customers', icon: Users },
  { path: '/categories', name: 'Categories', icon: Tags },
  { path: '/suppliers', name: 'Suppliers', icon: Truck },
  { path: '/warehouses', name: 'Warehouses', icon: Warehouse },
  { path: '/returns', name: 'Returns', icon: ArrowLeftRight },
  { path: '/users', name: 'Users', icon: UserCog },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        
        <div className="flex h-16 items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          {sidebarOpen && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              IMS Pro
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={sidebarOpen ? "ml-auto" : "mx-auto"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${!sidebarOpen && 'justify-center'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4 shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-3 ${!sidebarOpen && 'flex-col'}`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors ${!sidebarOpen && 'flex-col'}`}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}