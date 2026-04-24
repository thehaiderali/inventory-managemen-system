import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Eye, Phone, Mail, MapPin, ShoppingCart, X, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customerService, orderService } from '../services';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [showDetail, setShowDetail]     = useState(false);
  const [editingCustomer, setEditing]   = useState(null);
  const [detailCustomer, setDetail]     = useState(null);
  const [customerOrders, setCustOrders] = useState([]);
  const [ordersLoading, setOrdLoading]  = useState(false);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState('');
  const [saving, setSaving]             = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll();
      setCustomers(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setFormData({ name: c.CustomerName || '', email: c.Email || '', phone: c.Phone || '', address: c.Address || '' });
    setFormError('');
    setShowModal(true);
  };

  const openDetail = async (c) => {
    setDetail(c);
    setShowDetail(true);
    setOrdLoading(true);
    try {
      const res = await orderService.getAll({ customerId: c.CustomerID });
      setCustOrders(res?.data || []);
    } catch { setCustOrders([]); }
    finally { setOrdLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim())  { setFormError('Customer name is required.');  return; }
    if (!formData.email.trim()) { setFormError('Email address is required.');   return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setFormError('Invalid email format.'); return; }
    setSaving(true);
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.CustomerID, formData);
      } else {
        await customerService.create(formData);
      }
      setShowModal(false);
      await fetchCustomers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete customer "${c.CustomerName}"? This cannot be undone.`)) return;
    try {
      await customerService.delete(c.CustomerID);
      await fetchCustomers();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = customers.filter(c =>
    c.CustomerName?.toLowerCase().includes(search.toLowerCase()) ||
    c.Email?.toLowerCase().includes(search.toLowerCase()) ||
    c.Phone?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => ({
    Pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Shipped:   'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    Returned:  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, color: 'text-blue-600' },
          { label: 'With Email',      value: customers.filter(c => c.Email).length,   color: 'text-green-600' },
          { label: 'With Phone',      value: customers.filter(c => c.Phone).length,   color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>All Customers</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search name, email, phone…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {search ? 'No customers match your search.' : 'No customers yet. Add your first one!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['#', 'Name', 'Email', 'Phone', 'Address', 'Joined', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-400 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.CustomerID} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.CustomerName}</td>
                      <td className="px-4 py-3">
                        {c.Email
                          ? <a href={`mailto:${c.Email}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Mail className="h-3 w-3" />{c.Email}</a>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {c.Phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.Phone}</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">
                        {c.Address ? <span className="flex items-center gap-1" title={c.Address}><MapPin className="h-3 w-3 shrink-0" />{c.Address}</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {c.CreatedAt ? new Date(c.CreatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" title="View Orders" onClick={() => openDetail(c)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Delete" onClick={() => handleDelete(c)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-2 rounded-lg">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                <Input placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address <span className="text-red-500">*</span></label>
                <Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <Input placeholder="+92 300 1234567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <Input placeholder="123 Main St, City" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : (editingCustomer ? 'Update Customer' : 'Add Customer')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{detailCustomer.CustomerName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer Profile &amp; Order History</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Mail,   label: 'Email',   value: detailCustomer.Email },
                  { icon: Phone,  label: 'Phone',   value: detailCustomer.Phone },
                  { icon: MapPin, label: 'Address', value: detailCustomer.Address },
                  { icon: User,   label: 'Member Since', value: detailCustomer.CreatedAt ? new Date(detailCustomer.CreatedAt).toLocaleDateString() : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <Icon className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                    <div><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="text-sm font-medium text-gray-900 dark:text-white">{value || '—'}</p></div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Order History
                  {!ordersLoading && <span className="text-gray-400 font-normal">({customerOrders.length})</span>}
                </h3>
                {ordersLoading ? (
                  <div className="text-center py-6 text-gray-400">Loading…</div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No orders placed yet.</div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(o => (
                      <div key={o.OrderID} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div><p className="text-sm font-medium text-gray-900 dark:text-white">Order #{o.OrderID}</p><p className="text-xs text-gray-500">{new Date(o.OrderDate).toLocaleDateString()}</p></div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.Status)}`}>{o.Status}</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(o.TotalAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${customerOrders.reduce((s, o) => s + parseFloat(o.TotalAmount || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <Button className="flex-1" onClick={() => { setShowDetail(false); openEdit(detailCustomer); }}><Edit className="h-4 w-4 mr-2" />Edit Customer</Button>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
