import React, { useState } from 'react';
import {
  Globe2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ArrowUpRight,
  Layers,
  Radio,
  Zap,
  ShoppingBag,
  Building2,
  Store,
  Check,
} from 'lucide-react';
import { ProductListing, Order, SupportedLanguageCode } from '../types';
import { BuyerMarketplaceView } from './BuyerMarketplaceView';

interface MarketLinkageViewProps {
  products: ProductListing[];
  onSyncAll?: () => void;
  language: SupportedLanguageCode;
  onOrderPlaced?: (order: Order) => void;
}

export const MarketLinkageView: React.FC<MarketLinkageViewProps> = ({
  products,
  onSyncAll,
  language,
  onOrderPlaced,
}) => {
  const [ondcEnabled, setOndcEnabled] = useState(true);
  const [etsyEnabled, setEtsyEnabled] = useState(true);
  const [amazonEnabled, setAmazonEnabled] = useState(true);
  const [gemEnabled, setGemEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [showStorefront, setShowStorefront] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (onSyncAll) onSyncAll();
    }, 1200);
  };

  const publishedCount = products.filter((p) => p.status === 'published').length;

  // Buyer-facing national storefront in the buyer's own language
  if (showStorefront) {
    return (
      <BuyerMarketplaceView
        products={products}
        language={language}
        onOrderPlaced={(order) => {
          if (onOrderPlaced) onOrderPlaced(order);
        }}
        onBackToSeller={() => setShowStorefront(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white rounded-3xl p-6 sm:p-8 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/30 relative overflow-hidden">
        {/* Background decorative geometry */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-300 text-[#1b4332] shadow-xs">
                Active Protocol
              </span>
              <span className="text-xs text-emerald-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Network Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Market Linkage & ONDC Protocol Gateway
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl leading-relaxed">
              Automatically broadcast and sync your voice-catalogued handicrafts to ONDC Open Commerce,
              Etsy Global, Amazon Karigar, and Government e-Marketplace (GeM) with 0% predatory commission.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowStorefront(true)}
              className="flex items-center gap-2 bg-white/15 border border-white/30 text-white px-5 py-3 rounded-2xl font-extrabold text-sm shadow-lg hover:bg-white/25 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-200" />
              <span>Open Buyer Storefront</span>
            </button>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-white text-[#1b4332] px-5 py-3 rounded-2xl font-extrabold text-sm shadow-lg hover:bg-emerald-50 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 text-[#2d6a4f] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Broadcasting...' : 'Sync All Channels'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Status Strip */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
          <div>
            <p className="text-emerald-200/80 text-[11px] uppercase tracking-wider">Synced SKUs</p>
            <p className="text-xl font-bold mt-0.5">{publishedCount} Craft Items</p>
          </div>
          <div>
            <p className="text-emerald-200/80 text-[11px] uppercase tracking-wider">ONDC Node Status</p>
            <p className="text-xl font-bold mt-0.5 text-emerald-300">Live (v1.2.0)</p>
          </div>
          <div>
            <p className="text-emerald-200/80 text-[11px] uppercase tracking-wider">Last Sync</p>
            <p className="text-xl font-bold mt-0.5">{lastSyncTime}</p>
          </div>
          <div>
            <p className="text-emerald-200/80 text-[11px] uppercase tracking-wider">Direct Margin</p>
            <p className="text-xl font-bold mt-0.5 text-amber-300">82% - 88%</p>
          </div>
        </div>
      </div>

      {/* 4 Marketplace Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. ONDC (Open Network for Digital Commerce) */}
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff] transition-all hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#d8f3dc] border border-[#b7e4c7] flex items-center justify-center text-[#1b4332] shadow-inner">
                <Radio className="w-6 h-6 text-[#2d6a4f]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[#1b4332] text-base">ONDC Open Network</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#455A45]">National Open Digital Commerce Protocol</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ondcEnabled}
                onChange={(e) => setOndcEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d6a4f]"></div>
            </label>
          </div>

          <p className="text-xs text-[#2D422D] mt-4 leading-relaxed">
            Directly binds your products to buyer-side apps like Paytm, Mystore, Pincode, and Magicpin
            under Ministry of Commerce & Industry guidelines.
          </p>

          <div className="mt-4 pt-4 border-t border-white/60 flex items-center justify-between text-xs">
            <span className="text-[#455A45] font-medium">BAP Node ID: <code className="bg-white/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-[#1b4332]">karigar.ondc.in</code></span>
            <span className="flex items-center gap-1 text-[#2d6a4f] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto-sync enabled
            </span>
          </div>
        </div>

        {/* 2. Etsy Global Handicraft Network */}
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff] transition-all hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-800 shadow-inner">
                <Globe2 className="w-6 h-6 text-orange-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[#1b4332] text-base">Etsy Global Sync</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                    Export Ready
                  </span>
                </div>
                <p className="text-xs text-[#455A45]">US, Europe & UK Cross-border Buyers</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={etsyEnabled}
                onChange={(e) => setEtsyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          <p className="text-xs text-[#2D422D] mt-4 leading-relaxed">
            Auto-translates your Hindi/regional voice descriptions into English SEO stories and automatically converts ₹ prices into USD with international customs HSN codes.
          </p>

          <div className="mt-4 pt-4 border-t border-white/60 flex items-center justify-between text-xs">
            <span className="text-[#455A45] font-medium">Currency: <span className="font-bold text-[#1b4332]">INR ➔ USD ($)</span></span>
            <span className="flex items-center gap-1 text-orange-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> India Post Export Linked
            </span>
          </div>
        </div>

        {/* 3. Amazon Karigar Initiative */}
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff] transition-all hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shadow-inner">
                <Store className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[#1b4332] text-base">Amazon Karigar</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Verified Artisan
                  </span>
                </div>
                <p className="text-xs text-[#455A45]">Pan-India Handicraft Storefront</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={amazonEnabled}
                onChange={(e) => setAmazonEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <p className="text-xs text-[#2D422D] mt-4 leading-relaxed">
            Artisan storefront linked with preferential commission rates and subsidized delivery logistics across India.
          </p>

          <div className="mt-4 pt-4 border-t border-white/60 flex items-center justify-between text-xs">
            <span className="text-[#455A45] font-medium">Karigar Seller ID: <code className="bg-white/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-[#1b4332]">KRG-UP-8842</code></span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <Check className="w-3.5 h-3.5" /> Prime Eligible
            </span>
          </div>
        </div>

        {/* 4. GeM (Government e-Marketplace) */}
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff] transition-all hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 shadow-inner">
                <Building2 className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[#1b4332] text-base">GeM Portal</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                    Govt Procurement
                  </span>
                </div>
                <p className="text-xs text-[#455A45]">Public Sector & Ministry Gifting Orders</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gemEnabled}
                onChange={(e) => setGemEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <p className="text-xs text-[#2D422D] mt-4 leading-relaxed">
            Lists traditional crafts for bulk procurement by Indian government departments, embassies, and public enterprises.
          </p>

          <div className="mt-4 pt-4 border-t border-white/60 flex items-center justify-between text-xs">
            <span className="text-[#455A45] font-medium">Udyam Registration: <span className="font-bold text-[#1b4332]">Linked</span></span>
            <span className="text-[#455A45]">
              {gemEnabled ? 'Active for Bulk Orders' : 'Toggle to activate'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Broadcast Queue */}
      <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="font-extrabold text-[#1b4332] text-sm sm:text-base">
              Live Channel Sync Inventory
            </h3>
          </div>
          <span className="text-xs text-[#455A45] font-medium">
            {products.length} Products Monitored
          </span>
        </div>

        <div className="divide-y divide-white/70">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.studioPhotoUrl || product.rawPhotoUrl}
                  alt={product.title}
                  className="w-12 h-12 rounded-xl object-cover border border-white/80 shadow-xs flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#1b4332] truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[#455A45]">₹{product.retailPrice}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#d8f3dc] text-[#1b4332] rounded font-bold">
                      Stock: {product.stockQuantity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced ONDC & Etsy
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
