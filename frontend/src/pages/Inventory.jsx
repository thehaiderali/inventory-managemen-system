import { useEffect, useState } from 'react';
import { AlertCircle, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventoryService } from '../services';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);

  useEffect(() => {
    fetchInventory();
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
    } catch (error) {
      console.error('Adjustment failed:', error);
      alert('Failed to adjust inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  const lowStockItems = inventory.filter(i => i.Quantity <= i.ReorderLevel);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track stock levels across warehouses</p>
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
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Low Stock</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">In Stock</span>
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
            <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
            <p className="text-sm text-gray-600 mb-4">{selectedItem.ProductName} - {selectedItem.WarehouseName}</p>
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
    </div>
  );
}