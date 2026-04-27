import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
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
  X,
  CreditCard
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
  { path: '/payments', name: 'Payments', icon: CreditCard },
  { path: '/returns', name: 'Returns', icon: ArrowLeftRight },
  { path: '/users', name: 'Users', icon: UserCog },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Current user:', user);
  console.log('User role:', user.role);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-card border-r border-border flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        
        <div className="flex h-16 items-center justify-between px-3 border-b border-border shrink-0">
          {sidebarOpen && (
            <span className="text-xl font-bold text-primary">
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
                    ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                } ${!sidebarOpen && 'justify-center'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-accent transition-colors mb-3 ${!sidebarOpen && 'flex-col'}`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors ${!sidebarOpen && 'flex-col'}`}
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