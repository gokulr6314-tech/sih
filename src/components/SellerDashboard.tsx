import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  IndianRupee,
  Layers,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Database,
  BarChart3,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Code2,
  Copy,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ArtisanProfile,
  ProductListing,
  Order,
  AnalyticsMetrics,
  SupportedLanguageCode
} from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { DatabaseStore, SUPABASE_SQL_SCHEMA, isSupabaseConfigured } from '../lib/supabase';

interface SellerDashboardProps {
  artisan: ArtisanProfile;
  products: ProductListing[];
  orders: Order[];
  analytics: AnalyticsMetrics;
  language: SupportedLanguageCode;
  onNewListingClick: () => void;
  onUpdateProducts: (products: ProductListing[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onViewStorefront: () => void;
}

const PIE_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  artisan,
  products,
  orders,
  analytics,
  language,
  onNewListingClick,
  onUpdateProducts,
  onUpdateOrders,
  onViewStorefront,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'inventory' | 'database'>('metrics');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'fulfilled' | 'canceled'>('all');
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedDbTable, setSelectedDbTable] = useState<'products' | 'orders' | 'artisans'>('products');

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const handleStatusChange = (orderId: string, newStatus: 'pending' | 'fulfilled' | 'canceled') => {
    const updated = DatabaseStore.updateOrderStatus(orderId, newStatus);
    onUpdateOrders(updated);
  };

  const handleStockChange = (productId: string, delta: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stockQuantity + delta);
    const updated = DatabaseStore.updateProduct(productId, {
      stockQuantity: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock < 5 ? 'low_stock' : 'published',
    });
    onUpdateProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('क्या आप इस उत्पाद को हटाना चाहते हैं? (Delete product)')) {
      const updated = DatabaseStore.deleteProduct(productId);
      onUpdateProducts(updated);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Artisan Profile & Welcome Banner */}
      <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 sm:p-7 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={artisan.avatarUrl}
              alt={artisan.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff]"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#2D422D]">
                  {artisan.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#C8E6C9] text-[#2E7D32] text-[10px] font-bold uppercase tracking-wide">
                  सत्यापित कारीगर (Verified)
                </span>
              </div>
              <p className="text-xs text-[#455A45] mt-0.5">
                {artisan.craftType} • {artisan.village}, {artisan.state} ({artisan.experienceYears} वर्ष अनुभव)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onNewListingClick}
              className="bg-[#81C784] hover:bg-[#4CAF50] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-[6px_6px_14px_#c8d6c8,-6px_-6px_14px_#ffffff] border border-white/50 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewProductBtn}</span>
            </button>

            <button
              type="button"
              onClick={onViewStorefront}
              className="bg-white/80 hover:bg-white text-[#2D422D] px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-[#4CAF50]" />
              <span>खरीदार दृश्य (Storefront)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'metrics'
              ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
              : 'bg-white/70 hover:bg-white text-[#2D422D] shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff] border border-white/80'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.analyticsOverview}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
              : 'bg-white/70 hover:bg-white text-[#2D422D] shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff] border border-white/80'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t.orderManagement} ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'inventory'
              ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
              : 'bg-white/70 hover:bg-white text-[#2D422D] shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff] border border-white/80'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t.inventoryStock} ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'database'
              ? 'bg-[#81C784] text-white shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/60'
              : 'bg-white/70 hover:bg-white text-[#2D422D] shadow-[3px_3px_8px_#d1dbd1,-3px_-3px_8px_#ffffff] border border-white/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>डेटाबेस देखें (Supabase DB)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: METRICS & DATA VISUALIZATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[28px] p-5 shadow-[8px_8px_18px_#d1dbd1,-8px_-8px_18px_#ffffff] border border-white/60">
              <div className="flex items-center justify-between text-[#4CAF50] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t.totalSales}</span>
                <IndianRupee className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-[#2D422D]">
                ₹{analytics.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#455A45] font-semibold mt-1">
                सक्रिय ऑर्डर: {analytics.activeOrders}
              </div>
            </div>

            <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[28px] p-5 shadow-[8px_8px_18px_#d1dbd1,-8px_-8px_18px_#ffffff] border border-white/60">
              <div className="flex items-center justify-between text-[#4CAF50] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t.artisanEarnings}</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-[#2E7D32]">
                ₹{analytics.artisanEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#4CAF50] font-bold mt-1">
                100% शून्य-कमीशन आय
              </div>
            </div>

            <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[28px] p-5 shadow-[8px_8px_18px_#d1dbd1,-8px_-8px_18px_#ffffff] border border-white/60">
              <div className="flex items-center justify-between text-[#4CAF50] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t.activeOrders}</span>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-[#2D422D]">
                {orders.filter((o) => o.status === 'pending').length}
              </div>
              <div className="text-[11px] text-[#455A45] font-semibold mt-1">
                कुल ऑर्डर: {orders.length}
              </div>
            </div>

            <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[28px] p-5 shadow-[8px_8px_18px_#d1dbd1,-8px_-8px_18px_#ffffff] border border-white/60">
              <div className="flex items-center justify-between text-[#4CAF50] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t.inventoryStock}</span>
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-[#2D422D]">
                {analytics.totalInventoryItems} इकाइयाँ
              </div>
              <div className="text-[11px] text-[#455A45] font-semibold mt-1">
                {products.length} सूचीबद्ध उत्पाद
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trends Chart */}
            <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 lg:col-span-2 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#2D422D]">
                    दैनिक बिक्री रुझान (Weekly Sales Trend)
                  </h3>
                  <p className="text-xs text-[#455A45]">
                    हस्तशिल्प की राष्ट्रीय बाजार में बिक्री
                  </p>
                </div>
                <span className="text-xs font-bold text-[#2E7D32] bg-[#C8E6C9] px-2.5 py-1 rounded-xl">
                  7 Days View
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueTrends}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#81C784" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#81C784" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#455A45" fontSize={11} tickLine={false} />
                    <YAxis stroke="#455A45" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`₹${value}`, 'बिक्री (Sales)']}
                      contentStyle={{
                        backgroundColor: '#F0F7F0',
                        borderRadius: '16px',
                        borderColor: '#C8E6C9',
                        color: '#2D422D',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '4px 4px 12px #d1dbd1',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#4CAF50"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Craft Category Breakdown */}
            <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60">
              <h3 className="text-base font-bold text-[#2D422D] mb-1">
                शिल्प श्रेणी वितरण (Craft Categories)
              </h3>
              <p className="text-xs text-[#455A45] mb-3">
                विविध पारंपरिक विधाओं से आय
              </p>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.craftCategoryDistribution}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={40}
                      paddingAngle={4}
                    >
                      {analytics.craftCategoryDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₹${value}`, 'राजस्व']}
                      contentStyle={{
                        backgroundColor: '#F0F7F0',
                        borderRadius: '12px',
                        borderColor: '#C8E6C9',
                        fontSize: '11px',
                        color: '#2D422D',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-white/60">
                {analytics.craftCategoryDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-[#2D422D] font-medium truncate">{item.category}</span>
                    </div>
                    <span className="font-bold text-[#2E7D32]">₹{item.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ORDER MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/60">
            <div>
              <h3 className="text-lg font-bold text-[#2D422D]">
                {t.orderManagement}
              </h3>
              <p className="text-xs text-[#455A45]">
                ग्राहकों के ऑर्डर ट्रैक करें और स्थिति अपडेट करें
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(['all', 'pending', 'fulfilled', 'canceled'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setOrderFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    orderFilter === filterKey
                      ? 'bg-[#81C784] text-white shadow-sm'
                      : 'bg-white/70 text-[#455A45] hover:bg-white'
                  }`}
                >
                  {filterKey} ({orders.filter((o) => filterKey === 'all' || o.status === filterKey).length})
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/80 backdrop-blur-sm rounded-[24px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={order.productImageUrl}
                    alt={order.productTitle}
                    className="w-14 h-14 object-cover rounded-2xl shadow-sm flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#2E7D32] bg-[#C8E6C9] px-2 py-0.5 rounded-lg">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-[#455A45]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#2D422D] truncate mt-0.5">
                      {order.productTitle}
                    </div>
                    <div className="text-xs text-[#455A45] truncate">
                      खरीदार: {order.buyerName} ({order.buyerCity}) • {order.paymentMethod}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-bold text-[#2D422D]">
                      ₹{order.amount}
                    </div>
                    <div className="text-[11px] text-[#2E7D32] font-bold">
                      कारीगर आय: ₹{order.artisanEarnings}
                    </div>
                  </div>

                  {/* Status Dropdown / Action */}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(
                        order.id,
                        e.target.value as 'pending' | 'fulfilled' | 'canceled'
                      )
                    }
                    className={`text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer shadow-sm ${
                      order.status === 'fulfilled'
                        ? 'bg-[#C8E6C9] text-[#2E7D32] border-[#81C784]'
                        : order.status === 'pending'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-red-100 text-red-900 border-red-300'
                    }`}
                  >
                    <option value="pending">लंबित (Pending)</option>
                    <option value="fulfilled">सफल (Fulfilled)</option>
                    <option value="canceled">रद्द (Canceled)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: INVENTORY CONTROL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'inventory' && (
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <div>
              <h3 className="text-lg font-bold text-[#2D422D]">
                {t.inventoryStock}
              </h3>
              <p className="text-xs text-[#455A45]">
                स्टॉक प्रबंधित करें, कम स्टॉक चेतावनियाँ देखें और त्वरित अपडेट करें
              </p>
            </div>
            <button
              type="button"
              onClick={onNewListingClick}
              className="bg-[#81C784] hover:bg-[#4CAF50] text-white px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-[4px_4px_10px_#c8d6c8,-4px_-4px_10px_#ffffff] border border-white/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>नया उत्पाद</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white/80 backdrop-blur-sm rounded-[24px] p-4 flex gap-3.5 items-start justify-between shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff] border border-white/80"
              >
                <img
                  src={p.studioPhotoUrl || p.rawPhotoUrl}
                  alt={p.title}
                  className="w-20 h-20 rounded-2xl object-cover shadow-sm flex-shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        p.stockQuantity <= 0
                          ? 'bg-red-100 text-red-800'
                          : p.stockQuantity < 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#C8E6C9] text-[#2E7D32]'
                      }`}
                    >
                      {p.stockQuantity <= 0 ? 'Out of Stock' : p.stockQuantity < 5 ? 'कम स्टॉक (Low)' : 'In Stock'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-[#2D422D] truncate mt-1">
                    {p.title}
                  </h4>
                  <div className="text-xs text-[#455A45] font-semibold">
                    खुदरा दर: ₹{p.retailPrice} • कारीगर दर: ₹{p.artisanPrice}
                  </div>

                  {/* Quick stock stepper */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/60">
                    <span className="text-xs font-bold text-[#2D422D]">
                      स्टॉक: <span className="text-[#2E7D32] font-bold text-sm">{p.stockQuantity}</span>
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleStockChange(p.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-sm text-[#2D422D] flex items-center justify-center font-bold text-xs hover:bg-[#C8E6C9]"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockChange(p.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-sm text-[#2D422D] flex items-center justify-center font-bold text-xs hover:bg-[#C8E6C9]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SUPABASE DATABASE LIVE INSPECTOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'database' && (
        <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-[32px] p-6 shadow-[12px_12px_24px_#d1dbd1,-12px_-12px_24px_#ffffff] border border-white/60 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/60">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#4CAF50]" />
                <h3 className="text-lg font-bold text-[#2D422D]">
                  Supabase Database View (End-to-End Data Visibility)
                </h3>
              </div>
              <p className="text-xs text-[#455A45] mt-0.5">
                एआई और वॉयस द्वारा संग्रहीत सभी डेटा तालिकाओं को लाइव देखें
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                  isSupabaseConfigured
                    ? 'bg-[#C8E6C9] text-[#2E7D32]'
                    : 'bg-[#C8E6C9]/60 text-[#2E7D32]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-ping" />
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local + Supabase Mirror Active'}
              </span>
            </div>
          </div>

          {/* Table Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDbTable('products')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDbTable === 'products'
                  ? 'bg-[#81C784] text-white shadow-sm'
                  : 'bg-white/70 text-[#2D422D] hover:bg-white'
              }`}
            >
              तालिका: products ({products.length} rows)
            </button>

            <button
              type="button"
              onClick={() => setSelectedDbTable('orders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDbTable === 'orders'
                  ? 'bg-[#81C784] text-white shadow-sm'
                  : 'bg-white/70 text-[#2D422D] hover:bg-white'
              }`}
            >
              तालिका: orders ({orders.length} rows)
            </button>

            <button
              type="button"
              onClick={() => setSelectedDbTable('artisans')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDbTable === 'artisans'
                  ? 'bg-[#81C784] text-white shadow-sm'
                  : 'bg-white/70 text-[#2D422D] hover:bg-white'
              }`}
            >
              तालिका: artisans (1 row)
            </button>
          </div>

          {/* Raw JSON / Table Viewer */}
          <div className="bg-[#E1EBE1] border border-white/60 rounded-[24px] p-4 shadow-[inset_4px_4px_8px_#d1dbd1,inset_-4px_-4px_8px_#ffffff] max-h-96 overflow-y-auto font-mono text-xs text-[#2D422D]">
            {selectedDbTable === 'products' && (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(products, null, 2)}
              </pre>
            )}
            {selectedDbTable === 'orders' && (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(orders, null, 2)}
              </pre>
            )}
            {selectedDbTable === 'artisans' && (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(artisan, null, 2)}
              </pre>
            )}
          </div>

          {/* SQL Schema Copier for Supabase Setup */}
          <div className="p-4 rounded-[24px] bg-white/70 backdrop-blur-sm border border-white/80 shadow-[4px_4px_10px_#d1dbd1,-4px_-4px_10px_#ffffff]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D422D]">
                <Code2 className="w-4 h-4 text-[#4CAF50]" />
                <span>Supabase SQL Schema DDL (One-Click Setup)</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="bg-white hover:bg-[#F0F7F0] px-3 py-1 text-xs font-bold text-[#2D422D] rounded-xl flex items-center gap-1 shadow-sm border border-white/80"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-[#4CAF50]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#455A45] mb-2">
              Copy this SQL script into your Supabase Dashboard &gt; SQL Editor to instantly provision all tables, columns, indexes, and Row-Level Security policies.
            </p>
            <pre className="text-[10px] p-3 rounded-xl bg-[#E1EBE1] border border-white/60 max-h-32 overflow-y-auto font-mono text-[#2D422D] shadow-inner">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
