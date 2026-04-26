// Payments.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, X, DollarSign, CreditCard, Calendar, Receipt, FileText, AlertCircle, CheckCircle, Clock, Ban, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { paymentService, orderService } from '../services';

const EMPTY_FORM = { orderId: '', amount: '', method: 'cash' };

// Status badge component
const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: Clock },
    completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: AlertCircle },
    refunded: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', icon: RefreshCw },
    cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: Ban },
  };
  const style = styles[status?.toLowerCase()] || styles.completed;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="h-3 w-3" />
      {status || 'completed'}
    </span>
  );
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPayments, setOrderPayments] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const ordersRes = await orderService.getAll({ limit: 100 });
      const ordersList = ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : []);
      setOrders(ordersList);
      
      // Fetch payments for all orders
      const paymentsMap = {};
      for (const order of ordersList) {
        const orderId = order.OrderID || order.id;
        try {
          const res = await paymentService.getByOrder(orderId);
          // Handle different response formats
          let paymentsList = [];
          if (res?.data) {
            paymentsList = Array.isArray(res.data) ? res.data : [];
          } else if (Array.isArray(res)) {
            paymentsList = res;
          } else if (res?.payments) {
            paymentsList = res.payments;
          }
          paymentsMap[orderId] = paymentsList;
        } catch (err) {
          console.error(`Failed to fetch payments for order ${orderId}:`, err);
          paymentsMap[orderId] = [];
        }
      }
      setOrderPayments(paymentsMap);
      
      // Flatten all payments for display
      const allPayments = Object.values(paymentsMap).flat();
      setPayments(allPayments);
    } catch (err) {
      console.error(err);
      setOrders([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getOrderTotal = (orderId) => {
    const order = orders.find(o => (o.OrderID || o.id) == orderId);
    return order?.TotalAmount || order?.total || 0;
  };

  const getOrderPayments = (orderId) => {
    return orderPayments[orderId] || [];
  };

  const getTotalPaid = (orderId) => {
    return getOrderPayments(orderId).reduce((sum, p) => sum + (p.Amount || p.amount || 0), 0);
  };

  const getRemainingBalance = (orderId) => {
    return Math.max(0, getOrderTotal(orderId) - getTotalPaid(orderId));
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setSelectedOrderId(null);
    setOrderTotal(0);
    setShowModal(true);
  };

  const openAddForOrder = (order) => {
    const orderId = order.OrderID || order.id;
    const total = order.TotalAmount || order.total || 0;
    const paid = getTotalPaid(orderId);
    
    setEditing(null);
    setFormData({ 
      orderId: orderId, 
      amount: (total - paid).toFixed(2), 
      method: 'cash'
    });
    setSelectedOrderId(orderId);
    setOrderTotal(total);
    setFormError('');
    setShowModal(true);
  };

  const handleOrderSelect = async (orderId) => {
    setFormData({ ...formData, orderId });
    setSelectedOrderId(orderId);
    const total = getOrderTotal(orderId);
    setOrderTotal(total);
    const paid = getTotalPaid(orderId);
    const remaining = total - paid;
    setFormData(prev => ({ ...prev, amount: remaining > 0 ? remaining.toFixed(2) : '0' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.orderId) { 
      setFormError('Please select an order.'); 
      return; 
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { 
      setFormError('Amount must be greater than 0.'); 
      return; 
    }
    if (!formData.method) { 
      setFormError('Payment method is required.'); 
      return; 
    }

    const amount = parseFloat(formData.amount);
    const remaining = getRemainingBalance(formData.orderId);
    
    if (amount > remaining + 0.01) {
      setFormError(`Amount ($${amount.toFixed(2)}) exceeds remaining balance ($${remaining.toFixed(2)}).`);
      return;
    }

    setSaving(true);
    try {
      const paymentData = {
        orderId: parseInt(formData.orderId),
        amount: parseFloat(formData.amount),
        method: formData.method
      };

      await paymentService.create(paymentData);
      
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      console.error('Save error:', err);
      setFormError(err.response?.data?.message || 'Failed to save payment.');
    } finally { 
      setSaving(false); 
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMethodIcon = (method) => {
    const icons = {
      cash: { icon: DollarSign, color: 'text-green-600' },
      card: { icon: CreditCard, color: 'text-blue-600' },
      bank_transfer: { icon: Receipt, color: 'text-purple-600' },
      online: { icon: CreditCard, color: 'text-indigo-600' },
      cheque: { icon: FileText, color: 'text-orange-600' },
    };
    const match = icons[method?.toLowerCase()] || icons.cash;
    const Icon = match.icon;
    return <Icon className={`h-3.5 w-3.5 ${match.color}`} />;
  };

  const filtered = payments.filter(p => {
    const orderId = p.OrderID || p.orderId;
    return `#${orderId}`.toLowerCase().includes(search.toLowerCase()) ||
           (p.PaymentMethod || p.method || '').toLowerCase().includes(search.toLowerCase());
  });

  const totalCollected = payments.reduce((sum, p) => sum + (p.Amount || p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {payments.length} payment{payments.length !== 1 ? 's' : ''} • Total collected: ${totalCollected.toFixed(2)}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Payments', value: payments.length, color: 'text-blue-600', icon: DollarSign },
          { label: 'Total Collected', value: `$${totalCollected.toFixed(2)}`, color: 'text-green-600', icon: CreditCard },
          { label: 'Pending Orders', value: orders.filter(o => {
            const orderId = o.OrderID || o.id;
            return getRemainingBalance(orderId) > 0;
          }).length, color: 'text-yellow-600', icon: Clock },
          { label: 'Avg Payment', value: `$${payments.length ? (totalCollected / payments.length).toFixed(2) : '0'}`, color: 'text-purple-600', icon: Receipt },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 opacity-30 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders needing payment */}
      {(() => {
        const pendingOrders = orders.filter(o => {
          const orderId = o.OrderID || o.id;
          return getRemainingBalance(orderId) > 0;
        });
        
        if (pendingOrders.length === 0) return null;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders Awaiting Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {pendingOrders.slice(0, 5).map(order => {
                  const orderId = order.OrderID || order.id;
                  const remaining = getRemainingBalance(orderId);
                  return (
                    <button
                      key={orderId}
                      onClick={() => openAddForOrder(order)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                    >
                      <span className="font-medium">Order #{orderId}</span>
                      <span className="text-yellow-700 dark:text-yellow-400">${remaining.toFixed(2)} due</span>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
                {pendingOrders.length > 5 && (
                  <span className="text-sm text-gray-500 self-center">
                    +{pendingOrders.length - 5} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>Payment History</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by order # or method…" 
                className="pl-9" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {search ? 'No payments match your search.' : 'No payments recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['ID', 'Order #', 'Amount', 'Method', 'Date'].map(h => (
                      <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-400 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment, idx) => {
                    const paymentId = payment.PaymentID || payment.id || idx;
                    const orderId = payment.OrderID || payment.orderId;
                    const amount = payment.Amount || payment.amount;
                    const method = payment.PaymentMethod || payment.method;
                    const date = payment.PaymentDate || payment.CreatedAt || payment.createdAt;
                    
                    return (
                      <tr key={paymentId} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{paymentId}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          #{orderId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ${parseFloat(amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            {getMethodIcon(method)}
                            <span className="capitalize">{method?.replace('_', ' ') || '—'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 opacity-50" />
                            {formatDate(date)}
                          </div>
                        </td>
                       </tr>
                    );
                  })}
                </tbody>
               </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Record Payment
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              {/* Order Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring dark:bg-gray-800 dark:border-gray-700"
                  value={formData.orderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                >
                  <option value="">Select an order...</option>
                  {orders.map(order => {
                    const orderId = order.OrderID || order.id;
                    const total = order.TotalAmount || order.total || 0;
                    const remaining = getRemainingBalance(orderId);
                    return (
                      <option key={orderId} value={orderId}>
                        Order #{orderId} - ${total.toFixed(2)} (Due: ${remaining.toFixed(2)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Order Summary */}
              {selectedOrderId && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Order Total:</span>
                    <span className="font-semibold">${orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Already Paid:</span>
                    <span className="text-green-600 dark:text-green-400">
                      ${getTotalPaid(selectedOrderId).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Remaining:</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                      ${getRemainingBalance(selectedOrderId).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="pl-7"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring dark:bg-gray-800 dark:border-gray-700"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Saving…' : 'Record Payment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}