import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Warehouse as WarehouseIcon, X, MapPin, Package, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { warehouseService, inventoryService } from '../services';

const EMPTY_FORM = { name: '', location: '' };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [detail, setDetail]         = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [whRes, invRes] = await Promise.all([warehouseService.getAll(), inventoryService.getAll()]);
      setWarehouses(whRes?.data  || (Array.isArray(whRes)  ? whRes  : []));
      setInventory(invRes?.data  || (Array.isArray(invRes) ? invRes : []));
    } catch (err) {
      console.error(err);
      setWarehouses([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const warehouseInventory = (whId) => inventory.filter(i => i.WarehouseID === whId);
  const warehouseTotalStock = (whId) => warehouseInventory(whId).reduce((s, i) => s + (i.Quantity || 0), 0);
  const warehouseLowStock  = (whId) => warehouseInventory(whId).filter(i => i.Quantity <= i.ReorderLevel).length;

  const totalStock = inventory.reduce((s, i) => s + (i.Quantity || 0), 0);
  const totalLow   = inventory.filter(i => i.Quantity <= i.ReorderLevel).length;

  const openAdd = () => { setEditing(null); setFormData(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const openEdit = (w) => { setEditing(w); setFormData({ name: w.WarehouseName || '', location: w.Location || '' }); setFormError(''); setShowModal(true); };
  const openDetail = (w) => { setDetail(w); setShowDetail(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim())     { setFormError('Warehouse name is required.'); return; }
    if (!formData.location.trim()) { setFormError('Location is required.');       return; }
    setSaving(true);
    try {
      if (editing) {
        await warehouseService.update(editing.WarehouseID, formData);
      } else {
        await warehouseService.create(formData);
      }
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (w) => {
    const inv = warehouseInventory(w.WarehouseID);
    if (inv.length > 0) {
      alert(`Cannot delete "${w.WarehouseName}" — it has ${inv.length} inventory record(s). Clear the inventory first.`);
      return;
    }
    if (!confirm(`Delete warehouse "${w.WarehouseName}"?`)) return;
    try {
      await warehouseService.delete(w.WarehouseID);
      await fetchAll();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = warehouses.filter(w =>
    w.WarehouseName?.toLowerCase().includes(search.toLowerCase()) ||
    w.Location?.toLowerCase().includes(search.toLowerCase())
  );

  // Utilization color
  const utilColor = (pct) => {
    if (pct >= 80) return 'bg-red-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Warehouses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Warehouse</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Warehouses',   value: warehouses.length, color: 'text-blue-600' },
          { label: 'Total Stock (units)', value: totalStock.toLocaleString(), color: 'text-green-600' },
          { label: 'Low Stock Alerts',   value: totalLow, color: totalLow > 0 ? 'text-red-600' : 'text-gray-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warehouse Grid Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(w => {
            const items = warehouseInventory(w.WarehouseID);
            const stock = warehouseTotalStock(w.WarehouseID);
            const low   = warehouseLowStock(w.WarehouseID);
            const maxStock = Math.max(totalStock, 1);
            const pct = Math.min(100, Math.round((stock / maxStock) * 100));
            return (
              <div key={w.WarehouseID} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">{w.WarehouseName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />{w.Location || 'No location set'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => openDetail(w)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors" title="View Inventory"><BarChart3 className="h-4 w-4" /></button>
                    <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(w)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{items.length}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stock.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Units</p>
                  </div>
                  <div className={`text-center rounded-lg p-2 ${low > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <p className={`text-lg font-bold ${low > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{low}</p>
                    <p className="text-xs text-gray-500">Low Stock</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Stock share</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${utilColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>All Warehouses</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search warehouses…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <WarehouseIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {search ? 'No warehouses match your search.' : 'No warehouses yet. Create your first one!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['ID', 'Warehouse Name', 'Location', 'Products', 'Total Stock', 'Low Stock', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-400 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => {
                    const items = warehouseInventory(w.WarehouseID);
                    const stock = warehouseTotalStock(w.WarehouseID);
                    const low   = warehouseLowStock(w.WarehouseID);
                    return (
                      <tr key={w.WarehouseID} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{w.WarehouseID}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{w.WarehouseName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {w.Location ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.Location}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                            <Package className="h-3 w-3" />{items.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{stock.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {low > 0
                            ? <span className="inline-flex items-center bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">{low} item{low !== 1 ? 's' : ''}</span>
                            : <span className="text-green-600 dark:text-green-400 text-xs">All good ✓</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" title="View Inventory" onClick={() => openDetail(w)}><BarChart3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(w)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Delete" onClick={() => handleDelete(w)}><Trash2 className="h-4 w-4" /></Button>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Warehouse' : 'Add New Warehouse'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-2 rounded-lg">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warehouse Name <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Main Warehouse A" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Lahore, Punjab" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update Warehouse' : 'Add Warehouse')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Detail Modal */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{detail.WarehouseName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{detail.Location || 'No location'}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Products',    value: warehouseInventory(detail.WarehouseID).length },
                  { label: 'Total Stock', value: warehouseTotalStock(detail.WarehouseID).toLocaleString() },
                  { label: 'Low Stock',   value: warehouseLowStock(detail.WarehouseID), alert: true },
                ].map(s => (
                  <div key={s.label} className={`text-center rounded-lg p-3 ${s.alert && s.value > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <p className={`text-xl font-bold ${s.alert && s.value > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Inventory
                </h3>
                {warehouseInventory(detail.WarehouseID).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No inventory records for this warehouse.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          {['Product', 'SKU', 'Qty', 'Reorder Level', 'Status'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400 text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseInventory(detail.WarehouseID).map(inv => {
                          const isLow = inv.Quantity <= inv.ReorderLevel;
                          return (
                            <tr key={inv.InventoryID} className="border-t border-gray-100 dark:border-gray-800">
                              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{inv.ProductName}</td>
                              <td className="px-3 py-2 font-mono text-xs text-gray-500">{inv.SKU}</td>
                              <td className={`px-3 py-2 font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{inv.Quantity}</td>
                              <td className="px-3 py-2 text-gray-500">{inv.ReorderLevel}</td>
                              <td className="px-3 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isLow ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                  {isLow ? 'Low Stock' : 'OK'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <Button className="flex-1" onClick={() => { setShowDetail(false); openEdit(detail); }}><Edit className="h-4 w-4 mr-2" />Edit Warehouse</Button>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
