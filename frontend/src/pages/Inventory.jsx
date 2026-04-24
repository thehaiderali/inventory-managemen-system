import { useEffect, useState } from 'react';
import { AlertCircle, Package, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventoryService, productService, warehouseService } from '../services';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transferData, setTransferData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: 0
  });
  const [addStockData, setAddStockData] = useState({
    productId: '',
    warehouseId: '',
    quantity: 0
  });

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryService.getAll();
      console.log('Inventory API response:', response);
      
      let inventoryArray = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          inventoryArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          inventoryArray = response.data;
        } else if (response.recordset && Array.isArray(response.recordset)) {
          inventoryArray = response.recordset;
        }
      }
      
      setInventory(inventoryArray);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      const productsArray = response?.data || (Array.isArray(response) ? response : []);
      setProducts(productsArray);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getAll();
      const warehousesArray = response?.data || (Array.isArray(response) ? response : []);
      setWarehouses(warehousesArray);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const handleAdjust = async () => {
    try {
      await inventoryService.adjust({
        productId: selectedItem.ProductID,
        warehouseId: selectedItem.WarehouseID,
        quantity: adjustQty,
        type: 'ADJUSTMENT'
      });
      setShowAdjust(false);
      setAdjustQty(0);
      fetchInventory();
      alert('Stock adjusted successfully!');
    } catch (error) {
      console.error('Adjustment failed:', error);
      alert('Failed to adjust inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTransfer = async () => {
    try {
      await inventoryService.adjust({
        productId: transferData.productId,
        warehouseId: transferData.fromWarehouseId,
        quantity: -transferData.quantity,
        type: 'TRANSFER'
      });
      
      await inventoryService.adjust({
        productId: transferData.productId,
        warehouseId: transferData.toWarehouseId,
        quantity: transferData.quantity,
        type: 'TRANSFER'
      });
      
      setShowTransfer(false);
      setTransferData({ fromWarehouseId: '', toWarehouseId: '', productId: '', quantity: 0 });
      fetchInventory();
      alert('Stock transferred successfully!');
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Failed to transfer stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddStock = async () => {
    try {
      await inventoryService.adjust({
        productId: addStockData.productId,
        warehouseId: addStockData.warehouseId,
        quantity: addStockData.quantity,
        type: 'Purchase'
      });
      
      setShowAddStock(false);
      setAddStockData({ productId: '', warehouseId: '', quantity: 0 });
      fetchInventory();
      alert('Stock added successfully!');
    } catch (error) {
      console.error('Add stock failed:', error);
      alert('Failed to add stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const lowStockItems = inventory.filter(i => i.Quantity <= i.ReorderLevel);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track stock levels across warehouses</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddStock(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Stock
          </Button>
          <Button variant="outline" onClick={() => setShowTransfer(true)}>
            Transfer Stock
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-400">
              {lowStockItems.length} items are below reorder level
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No inventory items found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Reorder Level</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.InventoryID} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="px-4 py-3 font-medium">{item.ProductName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.SKU}</td>
                      <td className="px-4 py-3">{item.WarehouseName}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.Quantity}</td>
                      <td className="px-4 py-3 text-right">{item.ReorderLevel}</td>
                      <td className="px-4 py-3 text-center">
                        {item.Quantity <= item.ReorderLevel ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Low Stock</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">In Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedItem(item); setShowAdjust(true); }}>
                          Adjust
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

      {showAdjust && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Adjust Stock</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAdjust(false)}>✕</Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedItem.ProductName} - {selectedItem.WarehouseName}</p>
            <p className="text-sm mb-2">Current Quantity: <strong>{selectedItem.Quantity}</strong></p>
            <Input
              type="number"
              placeholder="Enter adjustment quantity (positive or negative)"
              value={adjustQty}
              onChange={(e) => setAdjustQty(parseInt(e.target.value))}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleAdjust} className="flex-1">Apply</Button>
              <Button variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transfer Stock</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTransfer(false)}>✕</Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={transferData.productId}
                  onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
                >
                  <option value="" className="dark:bg-gray-800">Select Product</option>
                  {products.map(p => (
                    <option key={p.ProductID} value={p.ProductID} className="dark:bg-gray-800">
                      {p.ProductName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">From Warehouse</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={transferData.fromWarehouseId}
                  onChange={(e) => setTransferData({ ...transferData, fromWarehouseId: e.target.value })}
                >
                  <option value="" className="dark:bg-gray-800">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.WarehouseID} value={w.WarehouseID} className="dark:bg-gray-800">
                      {w.WarehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">To Warehouse</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={transferData.toWarehouseId}
                  onChange={(e) => setTransferData({ ...transferData, toWarehouseId: e.target.value })}
                >
                  <option value="" className="dark:bg-gray-800">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.WarehouseID} value={w.WarehouseID} className="dark:bg-gray-800">
                      {w.WarehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleTransfer} className="flex-1">Transfer</Button>
                <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Stock</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddStock(false)}>✕</Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={addStockData.productId}
                  onChange={(e) => setAddStockData({ ...addStockData, productId: e.target.value })}
                >
                  <option value="" className="dark:bg-gray-800">Select Product</option>
                  {products.map(p => (
                    <option key={p.ProductID} value={p.ProductID} className="dark:bg-gray-800">
                      {p.ProductName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Warehouse</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={addStockData.warehouseId}
                  onChange={(e) => setAddStockData({ ...addStockData, warehouseId: e.target.value })}
                >
                  <option value="" className="dark:bg-gray-800">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.WarehouseID} value={w.WarehouseID} className="dark:bg-gray-800">
                      {w.WarehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Quantity to Add</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={addStockData.quantity}
                  onChange={(e) => setAddStockData({ ...addStockData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddStock} className="flex-1">Add Stock</Button>
                <Button variant="outline" onClick={() => setShowAddStock(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}