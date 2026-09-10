'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import { gooeyToast } from 'goey-toast'

interface Asset {
  id: string
  sku: string
  item_name: string
  quantity: number
  condition: 'good' | 'fair' | 'damaged'
  last_checked_by: string | null
  created_at: string
  updated_at: string
  last_checked_user?: {
    full_name: string
  }
}

interface TeamMember {
  id: string
  full_name: string
}

export default function InventoryClient() {
  const supabase = createClient()
  const { isOffline, addToQueue } = useAppStore()
  const [isPending, startTransition] = useTransition()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  // Drawer / Form State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10)
  const [error, setError] = useState<string | null>(null)

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: uProfile } = await supabase
        .from('users')
        .select('*, roles(*)')
        .eq('auth_id', user.id)
        .single()

      if (uProfile) {
        setCurrentUser(uProfile)

        // Fetch team list
        const { data: usersList } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('company_id', uProfile.company_id)
        if (usersList) setTeam(usersList as TeamMember[])

        // Fetch assets
        const { data: assetsList } = await supabase
          .from('inventory_assets')
          .select('*, last_checked_user:users!last_checked_by(full_name)')
          .eq('company_id', uProfile.company_id)
          .order('sku', { ascending: true })

        if (assetsList) setAssets(assetsList as any[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Deferred so the synchronous setLoading(true) inside the fetcher does
    // not fire as a synchronous setState within this effect.
    queueMicrotask(() => fetchInventoryData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create Asset Action
  const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const sku = (formData.get('sku') as string)?.toUpperCase().trim()
    const itemName = formData.get('itemName') as string
    const quantity = parseInt(formData.get('quantity') as string) || 0
    const condition = formData.get('condition') as Asset['condition']

    if (!sku || !itemName) {
      setError('SKU and Item Name are required.')
      return
    }

    // Check SKU locally first to prevent client duplicate
    if (assets.some((a) => a.sku === sku)) {
      setError('This SKU is already registered in the inventory.')
      return
    }

    const payload = {
      company_id: currentUser.company_id,
      sku,
      item_name: itemName,
      quantity,
      condition,
      last_checked_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    startTransition(async () => {
      try {
        if (isOffline) {
          addToQueue({ type: 'create_asset', payload })
          gooeyToast.info('Item added to offline sync queue!')
        } else {
          const { error } = await supabase.from('inventory_assets').insert(payload)
          if (error) throw error
        }

        setIsAddOpen(false)
        fetchInventoryData()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  // Edit Asset Action
  const handleEditAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedAsset) return
    setError(null)

    const formData = new FormData(e.currentTarget)
    const quantity = parseInt(formData.get('quantity') as string) || 0
    const condition = formData.get('condition') as Asset['condition']

    const payload = {
      id: selectedAsset.id,
      quantity,
      condition,
      last_checked_by: currentUser.id,
    }

    // Optimistic update
    setAssets((prev) =>
      prev.map((a) => (a.id === selectedAsset.id ? { ...a, quantity, condition } : a))
    )

    try {
      if (isOffline) {
        addToQueue({ type: 'update_asset', payload })
      } else {
        const { error } = await supabase
          .from('inventory_assets')
          .update({
            quantity,
            condition,
            last_checked_by: currentUser.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAsset.id)
        if (error) throw error
      }

      setSelectedAsset(null)
      fetchInventoryData()
    } catch (err: any) {
      gooeyToast.error(`Failed to update item: ${err.message}`)
      fetchInventoryData() // revert
    }
  }

  // Bulk Quantity Update Action
  const handleBulkUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const skuPrefix = (formData.get('skuPrefix') as string)?.toUpperCase().trim()
    const adjustment = parseInt(formData.get('adjustment') as string) || 0

    if (!skuPrefix) {
      setError('Please enter the SKU prefix.')
      return
    }

    startTransition(async () => {
      try {
        const matchedAssets = assets.filter((a) => a.sku.startsWith(skuPrefix))

        if (matchedAssets.length === 0) {
          setError('No items matched the specified SKU prefix.')
          return
        }

        for (const asset of matchedAssets) {
          const newQty = Math.max(0, asset.quantity + adjustment)
          const payload = {
            id: asset.id,
            quantity: newQty,
            condition: asset.condition,
            last_checked_by: currentUser.id,
          }

          if (isOffline) {
            addToQueue({ type: 'update_asset', payload })
          } else {
            await supabase
              .from('inventory_assets')
              .update({
                quantity: newQty,
                last_checked_by: currentUser.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', asset.id)
          }
        }

        if (isOffline) gooeyToast.info('Bulk update queued offline!')
        setIsBulkOpen(false)
        fetchInventoryData()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const isAllowedToModify = currentUser?.roles?.is_admin || currentUser?.roles?.name === 'Manager'

  if (loading && assets.length === 0) {
    return <SkeletonLoader type="table" />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">Inventory Stock</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">HIGH-PRECISION SKU STOCK LEDGER</p>
        </div>
        {isAllowedToModify && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="px-4 py-2 bg-surface hover:bg-surface-hover text-gray-700 border border-border font-mono uppercase text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Bulk Adjustment
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-mono uppercase text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* Threshold Config */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono text-gray-600">
        <div className="flex items-center gap-3">
          <span>Low Stock Warning Threshold:</span>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 bg-surface border border-border rounded-md text-foreground text-center focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Condition & Stock Distribution Summary */}
      <div className="bg-white border border-border p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono uppercase text-gray-500 font-bold">Asset Condition & Inventory Summary</span>
          <span className="text-[11px] font-mono text-gray-500">
            Total Items: {assets.length}
          </span>
        </div>
        
        {/* Continuous Multi-color Bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full flex overflow-hidden">
          <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${(assets.filter(a => ['good', 'baik', 'Baik'].includes(a.condition)).length / (assets.length || 1)) * 100}%` }} />
          <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(assets.filter(a => ['fair', 'cukup', 'Cukup'].includes(a.condition)).length / (assets.length || 1)) * 100}%` }} />
          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(assets.filter(a => ['damaged', 'rusak', 'Rusak'].includes(a.condition)).length / (assets.length || 1)) * 100}%` }} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] font-mono mt-3 text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500" /> Good ({assets.filter(a => ['good', 'baik', 'Baik', 'Good'].includes(a.condition)).length})</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Fair ({assets.filter(a => ['fair', 'cukup', 'Cukup', 'Fair'].includes(a.condition)).length})</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> Damaged ({assets.filter(a => ['damaged', 'rusak', 'Rusak', 'Damaged'].includes(a.condition)).length})</div>
        </div>
      </div>

      {/* High Density Table */}
      <div className="bg-white p-6 border border-border rounded-md shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-mono text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-right">Stock Qty</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Last Auditor</th>
                <th className="py-2.5 px-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-border">
              {assets.map((asset) => {
                const isLowStock = asset.quantity <= lowStockThreshold
                return (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      isLowStock ? 'bg-amber-50/70 border-l-2 border-l-amber-500/50' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-primary font-medium tracking-tight">
                      {asset.sku}
                    </td>
                    <td className="py-3 px-3 font-sans text-gray-700 font-semibold">{asset.item_name}</td>
                    <td className="py-3 px-3 font-mono text-right text-gray-700 font-bold">
                      {asset.quantity}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] uppercase border ${
                          asset.condition === 'good'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : asset.condition === 'fair'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-400">
                      @{asset.last_checked_user?.full_name || 'System'}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500 text-xs">
                      {new Date(asset.updated_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs">
                    NO PRODUCT SKU REGISTERED IN INVENTORY
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Sheet Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase font-sans">Add New Product Item</h3>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">SKU INVENTORY REGISTRATION</p>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-gray-500 hover:text-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  [Close]
                </button>
              </div>

              <form id="add-asset-form" onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Product SKU</label>
                  <input
                    name="sku"
                    type="text"
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs font-mono focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                    placeholder="E.g., LAP-MBP16-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Item Name</label>
                  <input
                    name="itemName"
                    type="text"
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-sans"
                    placeholder="E.g., Macbook Pro 16 Inch M3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Initial Quantity</label>
                    <input
                      name="quantity"
                      type="number"
                      min="0"
                      required
                      disabled={isPending}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-mono"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Condition</label>
                    <select
                      name="condition"
                      required
                      disabled={isPending}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                    >
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-mono rounded-md">
                    {error}
                  </div>
                )}
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-4">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-1/2 py-2.5 bg-surface hover:bg-surface-hover text-gray-700 font-mono text-xs uppercase rounded-md border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-asset-form"
                disabled={isPending}
                className="w-1/2 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
              >
                {isPending ? 'Registering...' : 'Register Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Sheet Drawer */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase font-sans">Bulk Stock Adjustment</h3>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">BULK QUANTITY ADJUSTMENT</p>
                </div>
                <button
                  onClick={() => setIsBulkOpen(false)}
                  className="text-gray-500 hover:text-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  [Close]
                </button>
              </div>

              <form id="bulk-update-form" onSubmit={handleBulkUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">SKU Prefix</label>
                  <input
                    name="skuPrefix"
                    type="text"
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs font-mono uppercase focus:outline-none focus:border-primary disabled:opacity-50 text-foreground"
                    placeholder="E.g., LAP-MBP (To match all laptops)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Adjustment Value</label>
                  <input
                    name="adjustment"
                    type="number"
                    required
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary disabled:opacity-50 text-foreground font-mono"
                    placeholder="E.g., 50 or -20"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-mono rounded-md">
                    {error}
                  </div>
                )}
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-4">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="w-1/2 py-2.5 bg-surface hover:bg-surface-hover text-gray-700 font-mono text-xs uppercase rounded-md border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bulk-update-form"
                disabled={isPending}
                className="w-1/2 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
              >
                {isPending ? 'Processing...' : 'Apply Bulk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Detail Asset Sheet Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase font-sans">{selectedAsset.item_name}</h3>
                  <p className="text-xs font-mono text-primary tracking-widest mt-0.5">{selectedAsset.sku}</p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-500 hover:text-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  [Close]
                </button>
              </div>

              {isAllowedToModify ? (
                <form id="edit-asset-form" onSubmit={handleEditAsset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Active Stock Quantity</label>
                    <input
                      name="quantity"
                      type="number"
                      min="0"
                      defaultValue={selectedAsset.quantity}
                      required
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Kondisi</label>
                    <select
                      name="condition"
                      defaultValue={selectedAsset.condition}
                      required
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs focus:outline-none focus:border-primary text-foreground"
                    >
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-border space-y-2 text-xs font-mono text-gray-400">
                    <p>CREATED AT: {new Date(selectedAsset.created_at).toLocaleString()}</p>
                    <p>UPDATED AT: {new Date(selectedAsset.updated_at).toLocaleString()}</p>
                    <p>LAST AUDITOR: @{selectedAsset.last_checked_user?.full_name || 'System'}</p>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Stock Qty</span>
                      <p className="text-sm font-bold text-foreground font-mono mt-1">{selectedAsset.quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-gray-500 uppercase">Condition</span>
                      <p className="text-xs font-semibold text-foreground mt-1 uppercase">{selectedAsset.condition}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border space-y-2 text-xs font-mono text-gray-500">
                    <p>Last Updated: {new Date(selectedAsset.updated_at).toLocaleString()}</p>
                    <p>Auditor: @{selectedAsset.last_checked_user?.full_name || 'System'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border flex gap-4">
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="w-full py-2 bg-surface hover:bg-surface-hover text-gray-700 font-mono text-xs uppercase rounded-md border border-border transition-colors cursor-pointer"
              >
                Back
              </button>
              {isAllowedToModify && (
                <button
                  type="submit"
                  form="edit-asset-form"
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase rounded-md transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
