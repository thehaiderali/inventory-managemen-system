import { useEffect, useState } from 'react';
import { Eye, Package, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orderService } from '../services';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

   const fetchOrders = async () => {
  try {
    const response = await orderService.getAll();
    console.log('Orders API response:', response);
    
    let ordersArray = [];
    if (response && typeof response === 'object') {
      if (Array.isArray(response)) {
        ordersArray = response;
      } else if (response.data && Array.isArray(response.data)) {
        ordersArray = response.data;
      } else if (response.recordset && Array.isArray(response.recordset)) {
        ordersArray = response.recordset;
      }
    }
    
    // Debug: Check if orders have items when you click on them
    console.log('Orders loaded:', ordersArray);
    setOrders(ordersArray);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'Confirmed': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'Shipped': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'Delivered': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'Returned': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.OrderID?.toString().includes(search) ||
    order.CustomerName?.toLowerCase().includes(search.toLowerCase())
  );

  const viewOrder = async (order) => {
  // Fetch the full order details with items
  try {
    const fullOrder = await orderService.getById(order.OrderID);
    console.log('Full order details:', fullOrder);
    console.log('Order items:', fullOrder.items);
    setSelectedOrder(fullOrder);
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    setSelectedOrder(order); // Fallback to basic order data
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Orders</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by Order ID or Customer..." 
                className="pl-9" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.OrderID} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono">#{order.OrderID}</td>
                      <td className="px-4 py-3">{order.CustomerName || 'Guest'}</td>
                      <td className="px-4 py-3">{new Date(order.OrderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.Status}
                          onChange={(e) => updateStatus(order.OrderID, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(order.Status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${(order.TotalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order #{selectedOrder.OrderID}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>✕</Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.CustomerName || 'Guest'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.OrderDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(selectedOrder.Status)}`}>
                    {selectedOrder.Status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg">${(selectedOrder.TotalAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Quantity</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{item.ProductName}</td>
                        <td className="px-3 py-2 text-right">{item.Quantity}</td>
                        <td className="px-3 py-2 text-right">${item.UnitPrice?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${(item.Quantity * item.UnitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}