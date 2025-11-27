import { useOffline } from '../contexts/OfflineContext';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { useState } from 'react';

export default function OfflineIndicator() {
  const { isOnline, isSyncing, storageInfo, triggerSync } = useOffline();
  const [showDetails, setShowDetails] = useState(false);

  if (isOnline && storageInfo.pendingOrders === 0 && storageInfo.syncQueueSize === 0) {
    return null; // Don't show indicator when online and no pending data
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Main indicator */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg font-semibold transition-all ${
            isOnline 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              <span>Syncing...</span>
            </>
          ) : isOnline ? (
            <>
              <Wifi size={20} />
              <span>Online</span>
              {storageInfo.pendingOrders > 0 && (
                <span className="bg-white text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                  {storageInfo.pendingOrders}
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff size={20} />
              <span>Offline Mode</span>
            </>
          )}
        </button>

        {/* Details panel */}
        {showDetails && (
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Database size={18} />
                Offline Storage
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Pending Orders</span>
                <span className="font-semibold text-orange-600">
                  {storageInfo.pendingOrders}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Cached Products</span>
                <span className="font-semibold text-blue-600">
                  {storageInfo.cachedProducts}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Cached Customers</span>
                <span className="font-semibold text-purple-600">
                  {storageInfo.cachedCustomers}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Sync Queue</span>
                <span className="font-semibold text-gray-700">
                  {storageInfo.syncQueueSize}
                </span>
              </div>
            </div>

            {isOnline && storageInfo.pendingOrders > 0 && (
              <button
                onClick={() => {
                  triggerSync();
                  setShowDetails(false);
                }}
                disabled={isSyncing}
                className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}

            {!isOnline && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-800">
                  You're working offline. All changes are saved locally and will sync automatically when you're back online.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
