import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Tags, X, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoryService, productService } from '../services';

const EMPTY_FORM = { categoryName: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([categoryService.getAll(), productService.getAll()]);
      setCategories(catRes?.data || (Array.isArray(catRes) ? catRes : []));
      setProducts(prodRes?.data || (Array.isArray(prodRes) ? prodRes : []));
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const productCount = (catId) => products.filter(p => p.CategoryID === catId).length;

  const openAdd = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setFormData({ categoryName: cat.CategoryName || '', description: cat.Description || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.categoryName.trim()) { setFormError('Category name is required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoryService.update(editing.CategoryID, formData);
      } else {
        await categoryService.create(formData);
      }
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (cat) => {
    const count = productCount(cat.CategoryID);
    if (count > 0) {
      alert(`Cannot delete "${cat.CategoryName}" — it has ${count} product(s) assigned to it.`);
      return;
    }
    if (!confirm(`Delete category "${cat.CategoryName}"?`)) return;
    try {
      await categoryService.delete(cat.CategoryID);
      await fetchAll();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = categories.filter(c =>
    c.CategoryName?.toLowerCase().includes(search.toLowerCase()) ||
    c.Description?.toLowerCase().includes(search.toLowerCase())
  );

  // Color palette cycling for category cards
  const palette = [
    'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300',
    'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Categories', value: categories.length, color: 'text-blue-600' },
          { label: 'Total Products',   value: products.length,    color: 'text-green-600' },
          { label: 'Avg Products/Cat', value: categories.length ? Math.round(products.length / categories.length) : 0, color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + View */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>All Categories</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search categories…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {search ? 'No categories match your search.' : 'No categories yet. Create your first one!'}
            </div>
          ) : (
            <>
              {/* Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filtered.map((cat, i) => {
                  const count = productCount(cat.CategoryID);
                  const colorClass = palette[i % palette.length];
                  return (
                    <div key={cat.CategoryID} className={`border rounded-xl p-4 ${colorClass} relative group transition-all hover:shadow-md`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{cat.CategoryName}</h3>
                          <p className="text-xs mt-1 opacity-70 line-clamp-2">{cat.Description || 'No description'}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                          <button onClick={() => openEdit(cat)} className="p-1 rounded hover:bg-white/30 transition-colors" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(cat)} className="p-1 rounded hover:bg-white/30 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Package className="h-3.5 w-3.5 opacity-60" />
                        <span className="text-xs font-medium opacity-80">{count} product{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table View */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Table View</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        {['ID', 'Category Name', 'Description', 'Products', 'Actions'].map(h => (
                          <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-400 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((cat) => (
                        <tr key={cat.CategoryID} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{cat.CategoryID}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.CategoryName}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{cat.Description || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                              <Package className="h-3 w-3" />{productCount(cat.CategoryID)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(cat)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-4 py-2 rounded-lg">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Electronics" value={formData.categoryName} onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional description…"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update Category' : 'Add Category')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
