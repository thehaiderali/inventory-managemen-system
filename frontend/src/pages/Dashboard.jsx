import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { productService, orderService, customerService, inventoryService, paymentService } from '../services';

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    lowStock: 0,
    revenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

const fetchDashboardData = async () => {
    try {
      const [productsRes, ordersRes, customersRes, inventoryRes, paymentsRes] = await Promise.all([
        productService.getAll(),
        orderService.getAll(),
        customerService.getAll(),
        inventoryService.getAll(),
        paymentService.getAll()
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const customers = customersRes.data || [];
      const inventory = inventoryRes.data || [];
      const payments = paymentsRes.data || paymentsRes || [];
      const lowStockItems = inventory.filter(item => item.Quantity <= item.ReorderLevel);
      const pendingOrders = orders.filter(
        order => order.Status?.toLowerCase() === 'pending'
      );

      const totalRevenue = payments
        .filter(p => p.Status?.toLowerCase() === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0);

      setStats({
        products: products.length,
        orders: orders.length,
        customers: customers.length,
        lowStock: lowStockItems.length,
        revenue: totalRevenue,
        pendingOrders: pendingOrders.length
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Products', value: stats.products, icon: Package },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingCart },
    { title: 'Customers', value: stats.customers, icon: Users },
    { title: 'Low Stock Items', value: stats.lowStock, icon: AlertCircle },
    { title: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.OrderID} className="border-t border-border">
                      <td className="px-4 py-3">#{order.OrderID}</td>
                      <td className="px-4 py-3">{new Date(order.OrderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.Status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          order.Status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {order.Status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">${(order.TotalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
