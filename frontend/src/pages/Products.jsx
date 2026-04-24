import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productService, categoryService, supplierService } from '../services';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    categoryId: '',
    supplierId: '',
    costPrice: '',
    sellingPrice: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const productsRes = await productService.getAll();
      const categoriesRes = await categoryService.getAll();
      const suppliersRes = await supplierService.getAll();
      
      setProducts(productsRes?.data || (Array.isArray(productsRes) ? productsRes : []));
      setCategories(categoriesRes?.data || (Array.isArray(categoriesRes) ? categoriesRes : []));
      setSuppliers(suppliersRes?.data || (Array.isArray(suppliersRes) ? suppliersRes : []));
    } catch (error) {
      console.error('Failed to fetch:', error);
      setProducts([]);
      setCategories([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      alert('Product Name is required');
      return;
    }
    if (!formData.sku.trim()) {
      alert('SKU is required');
      return;
    }
    if (!formData.categoryId) {
      alert('Category is required');
      return;
    }
    if (!formData.supplierId) {
      alert('Supplier is required');
      return;
    }
    
    try {
      const productData = {
        name: formData.productName,
        sku: formData.sku,
        categoryId: parseInt(formData.categoryId),
        supplierId: parseInt(formData.supplierId),
        costPrice: parseFloat(formData.costPrice),
        price: parseFloat(formData.sellingPrice)
      };
      
      console.log('Sending product data:', productData);
      
      if (editingProduct) {
        await productService.update(editingProduct.ProductID, productData);
        alert('Product updated successfully!');
      } else {
        await productService.create(productData);
        alert('Product created successfully!');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ 
        productName: '', 
        sku: '', 
        categoryId: '', 
        supplierId: '', 
        costPrice: '', 
        sellingPrice: '' 
      });
      
      await fetchData();
      navigate('/products');
      
    } catch (error) {
      console.error('Save failed:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      try {
        await productService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete product');
      }
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(p => 
    p.ProductName?.toLowerCase().includes(search.toLowerCase()) ||
    p.SKU?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your product inventory</p>
        </div>
        <Button onClick={() => { 
          setEditingProduct(null); 
          setFormData({ productName: '', sku: '', categoryId: '', supplierId: '', costPrice: '', sellingPrice: '' }); 
          setShowModal(true); 
        }}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Products</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name or SKU..." 
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
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Product Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Selling</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.ProductID} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono text-xs">{product.SKU}</td>
                      <td className="px-4 py-3 font-medium">{product.ProductName}</td>
                      <td className="px-4 py-3">{product.CategoryName || '-'}</td>
                      <td className="px-4 py-3">{product.SupplierName || '-'}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(product.CostPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(product.SellingPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => { 
                            setEditingProduct(product); 
                            setFormData({ 
                              productName: product.ProductName, 
                              sku: product.SKU, 
                              categoryId: product.CategoryID || '', 
                              supplierId: product.SupplierID || '', 
                              costPrice: product.CostPrice, 
                              sellingPrice: product.SellingPrice 
                            }); 
                            setShowModal(true); 
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500" 
                          onClick={() => handleDelete(product.ProductID)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                placeholder="Product Name" 
                value={formData.productName} 
                onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                required 
              />
              <Input 
                placeholder="SKU" 
                value={formData.sku} 
                onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                required 
              />
              <select 
                className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" 
                value={formData.categoryId} 
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                required
              >
                <option value="" className="dark:bg-gray-800 dark:text-gray-100">Select Category</option>
                {categories.map(c => (
                  <option key={c.CategoryID} value={c.CategoryID} className="dark:bg-gray-800 dark:text-gray-100">
                    {c.CategoryName}
                  </option>
                ))}
              </select>
              
              <select 
                className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" 
                value={formData.supplierId} 
                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                required
              >
                <option value="" className="dark:bg-gray-800 dark:text-gray-100">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.SupplierID} value={s.SupplierID} className="dark:bg-gray-800 dark:text-gray-100">
                    {s.SupplierName}
                  </option>
                ))}
                </select>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Cost Price" 
                value={formData.costPrice} 
                onChange={(e) => setFormData({...formData, costPrice: e.target.value})} 
                required 
              />
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Selling Price" 
                value={formData.sellingPrice} 
                onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} 
                required 
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}