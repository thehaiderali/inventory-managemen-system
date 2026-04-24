import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Truck, X, Phone, Mail, MapPin, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supplierService, productService } from '../services';

const EMPTY_FORM = { name: '', contactEmail: '', phone: '', address: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [detail, setDetail]       = useState(null);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [supRes, prodRes] = await Promise.all([supplierService.getAll(), productService.getAll()]);
      setSuppliers(supRes?.data || (Array.isArray(supRes) ? supRes : []));
      setProducts(prodRes?.data  || (Array.isArray(prodRes) ? prodRes : []));
    } catch (err) {
      console.error(err);
      setSuppliers([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const supplierProducts = (supId) => products.filter(p => p.SupplierID === supId);

  const openAdd = () => { setEditing(null); setFormData(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setFormData({ name: s.SupplierName || '', contactEmail: s.Email || '', phone: s.Phone || '', address: s.Address || '' });
    setFormError('');
    setShowModal(true);
  };
  const openDetail = (s) => { setDetail(s); setShowDetail(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim())         { setFormError('Supplier name is required.');   return; }
    if (!formData.contactEmail.trim()) { setFormError('Contact email is required.');   return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) { setFormError('Invalid email format.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await supplierService.update(editing.SupplierID, formData);
      } else {
        await supplierService.create(formData);
      }
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    const prods = supplierProducts(s.SupplierID);
    if (prods.length > 0) {
      alert(`Cannot delete "${s.SupplierName}" — it has ${prods.length} product(s) assigned.`);
      return;
    }
    if (!confirm(`Delete supplier "${s.SupplierName}"?`)) return;
    try {
      await supplierService.delete(s.SupplierID);
      await fetchAll();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = suppliers.filter(s =>
    s.SupplierName?.toLowerCase().includes(search.toLowerCase()) ||
    s.Email?.toLowerCase().includes(search.toLowerCase()) ||
    s.Phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{suppliers.length} registered supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Supplier</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Suppliers',    value: suppliers.length,                          color: 'text-blue-600' },
          { label: 'Active Products',    value: products.length,                           color: 'text-green-600' },
          { label: 'Avg Products/Sup',   value: suppliers.length ? Math.round(products.length / suppliers.length) : 0, color: 'text-purple-600' },
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
            <CardTitle>All Suppliers</CardTitle>
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
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {search ? 'No suppliers match your search.' : 'No suppliers yet. Add your first one!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['#', 'Supplier Name', 'Email', 'Phone', 'Address', 'Products', 'Registered', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-400 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const prodCount = supplierProducts(s.SupplierID).length;
                    return (
                      <tr key={s.SupplierID} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.SupplierName}</td>
                        <td className="px-4 py-3">
                          {s.Email
                            ? <a href={`mailto:${s.Email}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Mail className="h-3 w-3" />{s.Email}</a>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {s.Phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.Phone}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">
                          {s.Address ? <span className="flex items-center gap-1" title={s.Address}><MapPin className="h-3 w-3 shrink-0" />{s.Address}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                            <Package className="h-3 w-3" />{prodCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {s.CreatedAt ? new Date(s.CreatedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" title="View Products" onClick={() => openDetail(s)}><Package className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Delete" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4" /></Button>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-2 rounded-lg">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                <Input placeholder="Acme Corp" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email <span className="text-red-500">*</span></label>
                <Input type="email" placeholder="contact@supplier.com" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <Input placeholder="+92 300 1234567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <Input placeholder="456 Industrial Ave, City" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update Supplier' : 'Add Supplier')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Products Detail Modal */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{detail.SupplierName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Supplier Profile &amp; Products</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Mail,   label: 'Email',      value: detail.Email   },
                  { icon: Phone,  label: 'Phone',      value: detail.Phone   },
                  { icon: MapPin, label: 'Address',    value: detail.Address },
                  { icon: Truck,  label: 'Registered', value: detail.CreatedAt ? new Date(detail.CreatedAt).toLocaleDateString() : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <Icon className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                    <div><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="text-sm font-medium text-gray-900 dark:text-white">{value || '—'}</p></div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Products Supplied ({supplierProducts(detail.SupplierID).length})
                </h3>
                {supplierProducts(detail.SupplierID).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No products from this supplier yet.</div>
                ) : (
                  <div className="space-y-2">
                    {supplierProducts(detail.SupplierID).map(p => (
                      <div key={p.ProductID} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.ProductName}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.SKU}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(p.SellingPrice || 0).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Cost: ${parseFloat(p.CostPrice || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <Button className="flex-1" onClick={() => { setShowDetail(false); openEdit(detail); }}><Edit className="h-4 w-4 mr-2" />Edit Supplier</Button>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
