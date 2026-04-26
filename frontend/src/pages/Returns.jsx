import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, X, AlertCircle, CheckCircle, Package,
  RefreshCw, DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { returnService, orderService } from '../services';

const EMPTY_FORM = {
  orderId: '',
  productId: '',
  quantity: '',
  reason: '',
  refundAmount: '',
};

const REASON_OPTIONS = [
  'Defective / Damaged',
  'Wrong item received',
  'Item not as described',
  'Changed mind',
  'Duplicate order',
  'Late delivery',
  'Other',
];

// ── Status Badge ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: AlertCircle },
    approved:  { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-800 dark:text-green-300',  icon: CheckCircle },
    rejected:  { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-800 dark:text-red-300',      icon: X },
    completed: { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-800 dark:text-blue-300',    icon: RefreshCw },
  };
  const style = map[status?.toLowerCase()] || map.pending;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="h-3 w-3" />
      {status || 'Pending'}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────
export default function Returns() {
  const [returns, setReturns]           = useState([]);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [orderItems, setOrderItems]     = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // ── Fetch all ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [returnsRes, ordersRes] = await Promise.all([
        returnService.getAll(),
        orderService.getAll({ limit: 100 }),
      ]);

      // services.js already does .then(res => res.data)
      // so returnsRes = { page, limit, total, data: [...] }
      const returnsList = Array.isArray(returnsRes?.data) ? returnsRes.data.filter(Boolean) : [];
      const ordersList  = Array.isArray(ordersRes?.data)  ? ordersRes.data.filter(Boolean)  : [];

      setReturns(returnsList);
      setOrders(ordersList);
    } catch (err) {
      console.error('fetchAll error:', err);
      setReturns([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Order change → load its items ────────────────────
  const handleOrderChange = async (orderId) => {
    setFormData(prev => ({ ...prev, orderId, productId: '', quantity: '', refundAmount: '' }));
    setOrderItems([]);
    if (!orderId) return;

    setItemsLoading(true);
    try {
      const res = await orderService.getById(orderId);
      // Handle all possible response shapes from getById
      const items =
        res?.items            ||
        res?.OrderItems       ||
        res?.data?.items      ||
        res?.data?.OrderItems ||
        [];
      setOrderItems(Array.isArray(items) ? items.filter(Boolean) : []);
    } catch (err) {
      console.error('Failed to load order items:', err);
      setOrderItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  // ── Product select → auto-fill refund ────────────────
  const handleProductSelect = (productId) => {
    const item = orderItems.find(
      i => String(i.ProductID || i.productId) === String(productId)
    );
    const unitPrice = item?.UnitPrice || item?.Price || item?.price || 0;
    const qty = formData.quantity ? parseInt(formData.quantity) : 1;
    setFormData(prev => ({
      ...prev,
      productId,
      quantity: String(qty),
      refundAmount: (unitPrice * qty).toFixed(2),
    }));
  };

  // ── Quantity change → recalculate refund ─────────────
  const handleQuantityChange = (val) => {
    const qty = parseInt(val) || 0;
    const item = orderItems.find(
      i => String(i.ProductID || i.productId) === String(formData.productId)
    );
    const unitPrice = item?.UnitPrice || item?.Price || item?.price || 0;
    setFormData(prev => ({
      ...prev,
      quantity: val,
      refundAmount: unitPrice > 0 ? (unitPrice * qty).toFixed(2) : prev.refundAmount,
    }));
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.orderId)                                      { setFormError('Please select an order.');          return; }
    if (!formData.productId)                                    { setFormError('Please select a product.');         return; }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) { setFormError('Quantity must be greater than 0.'); return; }
    if (!formData.reason)                                       { setFormError('Please provide a reason.');         return; }

    setSaving(true);
    try {
      const payload = {
        orderId:      parseInt(formData.orderId),
        productId:    parseInt(formData.productId),
        quantity:     parseInt(formData.quantity),
        reason:       formData.reason,
        refundAmount: parseFloat(formData.refundAmount) || 0,
      };

      // returnService.create() does .then(res => res.data)
      // so `response` is the raw backend object: { ReturnID, OrderID, ProductID, ... }
      const response = await returnService.create(payload);

      // Normalize to a consistent display shape
      // (handles both PascalCase from DB and camelCase fallbacks)
      const selectedItem = orderItems.find(
        i => String(i.ProductID || i.productId) === String(payload.productId)
      );
      const newReturn = {
        ReturnID:     response?.ReturnID     || response?.id           || Date.now(),
        OrderID:      response?.OrderID      || payload.orderId,
        ProductID:    response?.ProductID    || payload.productId,
        ProductName:  response?.ProductName  || selectedItem?.ProductName || selectedItem?.name || `Product #${payload.productId}`,
        Quantity:     response?.Quantity     || payload.quantity,
        Reason:       response?.Reason       || payload.reason,
        RefundAmount: response?.RefundAmount || payload.refundAmount,
        Status:       response?.Status       || 'pending',
        ReturnDate:   response?.ReturnDate   || response?.CreatedAt    || new Date().toISOString(),
      };

      // ✅ Optimistic prepend — no re-fetch, no race condition
      setReturns(prev => [newReturn, ...prev]);
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setOrderItems([]);

    } catch (err) {
      console.error('Create return error:', err);
      setFormError(err.response?.data?.message || 'Failed to create return.');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setOrderItems([]);
    setShowModal(true);
  };

  // ── Derived ───────────────────────────────────────────
  const filtered = returns.filter(r => {
    const term = search.toLowerCase();
    return (
      String(r.ReturnID  || r.id      || '').includes(term) ||
      String(r.OrderID   || r.orderId || '').includes(term) ||
      (r.ProductName     || '').toLowerCase().includes(term) ||
      (r.Reason          || r.reason  || '').toLowerCase().includes(term)
    );
  });

  const totalRefunded  = returns.reduce((s, r) => s + parseFloat(r.RefundAmount || r.refundAmount || 0), 0);
  const pendingCount   = returns.filter(r => (r.Status || r.status || 'pending').toLowerCase() === 'pending').length;
  const completedCount = returns.filter(r => (r.Status || r.status || '').toLowerCase() === 'completed').length;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Returns</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {returns.length} return{returns.length !== 1 ? 's' : ''} • Total refunded: ${totalRefunded.toFixed(2)}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New Return
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Returns',  value: returns.length,                color: 'text-blue-600',   icon: RefreshCw   },
          { label: 'Total Refunded', value: `$${totalRefunded.toFixed(2)}`, color: 'text-green-600',  icon: DollarSign  },
          { label: 'Pending',        value: pendingCount,                   color: 'text-yellow-600', icon: AlertCircle },
          { label: 'Completed',      value: completedCount,                 color: 'text-purple-600', icon: CheckCircle },
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

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>Return History</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order, product, reason…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
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
              <RefreshCw className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {search ? 'No returns match your search.' : 'No returns recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['Return ID', 'Order #', 'Product', 'Qty', 'Reason', 'Refund', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ret, idx) => {
                    const returnId    = ret.ReturnID    || ret.id        || idx;
                    const orderId     = ret.OrderID     || ret.orderId;
                    const productName = ret.ProductName || ret.productName || `Product #${ret.ProductID || ret.productId || '?'}`;
                    const qty         = ret.Quantity    || ret.quantity  || 0;
                    const reason      = ret.Reason      || ret.reason    || '—';
                    const refund      = parseFloat(ret.RefundAmount || ret.refundAmount || 0);
                    const status      = ret.Status      || ret.status    || 'pending';
                    const date        = ret.ReturnDate  || ret.CreatedAt || ret.createdAt;

                    return (
                      <tr
                        key={`${returnId}-${idx}`}
                        className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{returnId}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">#{orderId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{productName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                            {qty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[160px] truncate" title={reason}>
                          {reason}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">
                          ${refund.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(date)}
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Return</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-gray-800 dark:border-gray-700"
                  value={formData.orderId}
                  onChange={e => handleOrderChange(e.target.value)}
                >
                  <option value="">Select an order…</option>
                  {orders.map(order => {
                    const oid = order.OrderID || order.id;
                    return (
                      <option key={oid} value={oid}>
                        Order #{oid} — ${(order.TotalAmount || order.total || 0).toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Product — shown after order selected */}
              {formData.orderId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  {itemsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                      Loading items…
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-xs text-red-400 py-1">No items found for this order.</p>
                  ) : (
                    <select
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-gray-800 dark:border-gray-700"
                      value={formData.productId}
                      onChange={e => handleProductSelect(e.target.value)}
                    >
                      <option value="">Select a product…</option>
                      {orderItems.map(item => {
                        const pid  = item.ProductID  || item.productId;
                        const name = item.ProductName || item.name || `Product #${pid}`;
                        const qty  = item.Quantity    || item.quantity;
                        return (
                          <option key={pid} value={pid}>
                            {name} (qty: {qty})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={e => handleQuantityChange(e.target.value)}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-gray-800 dark:border-gray-700"
                  value={formData.reason}
                  onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                >
                  <option value="">Select a reason…</option>
                  {REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refund Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7"
                    placeholder="0.00"
                    value={formData.refundAmount}
                    onChange={e => setFormData(prev => ({ ...prev, refundAmount: e.target.value }))}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-calculated from unit price × qty. Adjust if needed.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Submitting…' : 'Submit Return'}
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