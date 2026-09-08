import React, { useState, useEffect } from 'react';
import {
  Mic,
  Plus,
  Sparkles,
  Store,
  Package,
  CheckCircle2,
  TrendingUp,
  Tag,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Layers,
  Search,
  Filter,
  Eye,
  Camera,
  Check,
  MinusCircle,
  PlusCircle,
  Globe2,
  Star,
  Zap,
} from 'lucide-react';
import {
  SupportedLanguageCode,
  ProductListing,
  Order,
  AnalyticsMetrics,
  ArtisanProfile,
} from './types';
import {
  SUPPORTED_LANGUAGES,
  STUDIO_UI_TRANSLATIONS,
  TRANSLATIONS,
} from './lib/languages';
import { SpeechService } from './lib/speech';
import {
  INITIAL_ARTISAN,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_ANALYTICS,
} from './lib/mockData';
import { DatabaseStore } from './lib/supabase';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { GeminiLiveVoiceModal } from './components/GeminiLiveVoiceModal';
import { MarketLinkageView } from './components/MarketLinkageView';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { ProductImageCapture } from './components/ProductImageCapture';
import { VoiceAuthGate, AuthSession } from './components/VoiceAuthGate';
import VoiceListingTrigger from './components/voice/VoiceListingTrigger';
import VoiceListingAssistant from './components/voice/VoiceListingAssistant';
import { buildAltText } from './services/seo/altText';
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
  Cell,
} from 'recharts';

export default function App() {
  const [language, setLanguage] = useState<SupportedLanguageCode>('en');
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('catalogue');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);

  // Step 0: Language Selection Gate — shown FIRST before auth, on initial load
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);

  // Step 1: Pure Voice-Driven Onboarding & Login (Pre-Dashboard Gate)
  // Must be completed before accessing main dashboard/storefront features
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  // App Data State (Synced from DatabaseStore / mockData)
  const [artisan, setArtisan] = useState<ArtisanProfile>(INITIAL_ARTISAN);
  const [products, setProducts] = useState<ProductListing[]>(() => {
    const saved = DatabaseStore.getProducts();
    return saved.length > 0 ? saved : INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = DatabaseStore.getOrders();
    return saved.length > 0 ? saved : INITIAL_ORDERS;
  });
  const [analytics, setAnalytics] = useState<AnalyticsMetrics>(() => {
    const saved = DatabaseStore.getAnalytics();
    return saved || INITIAL_ANALYTICS;
  });

  // Highlight newly voice-catalogued item
  const [newlyCataloguedId, setNewlyCataloguedId] = useState<string | null>(null);
  const [catalogueFilter, setCatalogueFilter] = useState<string>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'fulfilled' | 'canceled'>('all');
  const [showCameraStudio, setShowCameraStudio] = useState<boolean>(false);
  const [voiceListingOpen, setVoiceListingOpen] = useState<boolean>(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const studio = STUDIO_UI_TRANSLATIONS[language] || STUDIO_UI_TRANSLATIONS.en;
  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === 'en')!;

  // Handle successful voice authentication
  const handleVoiceAuthentication = (session: AuthSession) => {
    setAuthSession(session);
    setIsAuthenticated(true);
    if (session.identifier) {
      setArtisan((prev) => ({
        ...prev,
        name: session.identifier,
      }));
    }
  };

  // Handle when Voice Assistant completes cataloguing a new product
  const handleVoiceProductCreated = (newProduct: ProductListing) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    DatabaseStore.addProduct(newProduct);
    setNewlyCataloguedId(newProduct.id);
    setActiveTab('catalogue');

    // Update artisan listings count
    setArtisan((prev) => ({
      ...prev,
      activeListingsCount: prev.activeListingsCount + 1,
    }));

    // Scroll smoothly to top
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStatusChange = (orderId: string, newStatus: 'pending' | 'fulfilled' | 'canceled') => {
    const updated = DatabaseStore.updateOrderStatus(orderId, newStatus);
    setOrders(updated);
  };

  const handleStockChange = (productId: string, delta: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stockQuantity + delta);
    const updated = DatabaseStore.updateProduct(productId, {
      stockQuantity: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock < 5 ? 'low_stock' : 'published',
    });
    setProducts(updated);
  };

  // Filter products for catalogue tab
  const filteredProducts = products.filter((p) => {
    if (catalogueFilter === 'all') return true;
    if (catalogueFilter === 'terracotta') return p.title.toLowerCase().includes('terracotta') || p.craftTechnique.toLowerCase().includes('clay');
    if (catalogueFilter === 'silk') return p.title.toLowerCase().includes('silk') || p.materials.some(m => m.toLowerCase().includes('silk'));
    if (catalogueFilter === 'in_stock') return p.stockQuantity > 0;
    return true;
  });

  // Filter orders for orders tab
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  return (
    <div className="min-h-screen bg-[#F0F7F0] text-[#1b4332] flex flex-col font-sans selection:bg-[#C8E6C9]">
      {/* ------------------------------------------------------------- */}
      {/* GATE 0: Language Selection — runs FIRST on initial app load   */}
      {/* ------------------------------------------------------------- */}
      {!hasSelectedLanguage && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0d281e]/90 via-[#1b4332]/85 to-[#2d6a4f]/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <LanguageSelectorModal
              selectedLanguage={language}
              onSelectLanguage={setLanguage}
              onProceed={(chosen) => {
                setLanguage(chosen);
                setHasSelectedLanguage(true);
              }}
              isModal={false}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GATE 1: Voice-Only Auth — shown after language is selected     */}
      {/* Pure voice-driven flow: Role Selection -> Identity -> Handshake */}
      {/* ------------------------------------------------------------- */}
      {hasSelectedLanguage && !isAuthenticated && (
        <VoiceAuthGate
          language={language}
          onAuthenticated={handleVoiceAuthentication}
          isMuted={isMuted}
        />
      )}

      {/* 1. Sleek Glassmorphic Navbar & KarigarSetu Branding */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        isMuted={isMuted}
        onToggleMute={() => {
          if (!isMuted) {
            SpeechService.stopSpeaking();
          }
          setIsMuted(!isMuted);
        }}
        onLaunchVoiceAssistant={() => setIsVoiceModalOpen(true)}
        isVoiceActive={isVoiceModalOpen}
        ordersCount={orders.length}
        productsCount={products.length}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10 transition-all">
        {/* ======================================================== */}
        {/* TAB 1: CATALOGUE VIEW */}
        {/* ======================================================== */}
        {activeTab === 'catalogue' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white rounded-[32px] p-7 sm:p-10 lg:p-12 shadow-[14px_14px_30px_#d1dbd1,-14px_-14px_30px_#ffffff] border border-white/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-20 w-72 h-72 bg-teal-400/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-300 text-[#1b4332]">
                      Master Artisan Hub
                    </span>
                    <span className="text-xs sm:text-sm text-emerald-100 font-bold">
                      {artisan.name} {authSession ? `(${authSession.role})` : ''} • {artisan.village}, {artisan.state}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                    Artisan Product Catalogue &amp; Live ONDC Inventory
                  </h1>
                  <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed font-medium">
                    Speak naturally in your local language to list new handicrafts. Voice Activity Detection listens, extracts details, suggests fair pricing, and broadcasts across ONDC &amp; global marketplaces.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex items-center gap-3 bg-white hover:bg-emerald-50 text-[#1b4332] px-6 py-4 rounded-2xl font-black text-sm sm:text-base shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Mic className="w-4 h-4 animate-pulse" />
                    </div>
                    <span>Start Hands-Free Voice Listing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCameraStudio(!showCameraStudio)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-4 rounded-2xl font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-md transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{showCameraStudio ? 'Hide Camera Studio' : 'AI Photo Studio'}</span>
                  </button>
                </div>
              </div>

              {/* Metrics Strip */}
              <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Active Listings', value: `${products.length} Products`, color: 'text-white' },
                  { label: 'GI Tag Certified', value: 'Verified Authentic', color: 'text-emerald-300' },
                  { label: 'Direct Artisan Margin', value: '82% Net Profit', color: 'text-amber-300' },
                  { label: 'ONDC Node Status', value: '● Live Active', color: 'text-white' },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-emerald-200/80 text-[11px] uppercase tracking-wider font-semibold">{m.label}</p>
                    <p className={`text-lg sm:text-xl font-black mt-0.5 ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Camera Studio — only visible when toggled */}
            {showCameraStudio && (
              <div className="bg-[#F0F7F0]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff] animate-fadeIn">
                <h2 className="text-base font-extrabold text-[#1b4332] mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" /> AI-Powered Photo Studio
                </h2>
                <ProductImageCapture
                  language={language}
                  onImageSelected={(_imageUrl, _craftName) => { setUploadedPhoto(_imageUrl); setIsVoiceModalOpen(true); }}
                  rawImageUrl={null}
                  studioImageUrl={null}
                  lightingNotes={null}
                  isAiEnhancing={false}
                  onRetake={() => {}}
                />
              </div>
            )}

            {/* -------------------------------------------------- */}
            {/* PRODUCT CATALOGUE GRID */}
            {/* -------------------------------------------------- */}
            <div className="space-y-5">
              {/* Toolbar: title + filter pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1b4332] tracking-tight">My Product Listings</h2>
                  <p className="text-xs text-[#455A45] font-medium mt-0.5">{filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} shown — ONDC synced &amp; marketplace-ready</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#E1EBE1] p-1 rounded-2xl border border-white/60 shadow-inner overflow-x-auto">
                  {(['all', 'terracotta', 'silk', 'in_stock'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCatalogueFilter(f)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize cursor-pointer ${
                        catalogueFilter === f
                          ? 'bg-[#1b4332] text-white shadow-sm'
                          : 'text-[#455A45] hover:bg-white/40'
                      }`}
                    >
                      {f === 'all' ? `All (${products.length})` : f === 'in_stock' ? 'In Stock' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/80 flex items-center justify-center shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff]">
                    <Package className="w-9 h-9 text-[#40916c]" />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#1b4332] text-lg">No products found</p>
                    <p className="text-sm text-[#455A45] mt-1">Use the Voice Listing button above to add your first product!</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex items-center gap-2 bg-[#1b4332] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all hover:bg-[#2d6a4f] cursor-pointer active:scale-95"
                  >
                    <Mic className="w-4 h-4" /> Start Voice Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProducts.map((product) => {
                    const isNew = product.id === newlyCataloguedId;
                    return (
                      <div
                        key={product.id}
                        className={`group relative bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-[8px_8px_24px_#c8d6c8,-8px_-8px_24px_#ffffff] hover:-translate-y-0.5 ${
                          isNew
                            ? 'border-emerald-400 ring-2 ring-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.3),6px_6px_16px_#c8d6c8,-6px_-6px_16px_#ffffff]'
                            : 'border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff]'
                        }`}
                      >
                        {isNew && (
                          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm animate-pulse">
                            <Zap className="w-3 h-3" /> Just Listed!
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={product.studioPhotoUrl || product.rawPhotoUrl}
                            alt={buildAltText({
                              productName: product.title,
                              materials: product.materials,
                              craftCategory: product.artisanCraft,
                              technique: product.craftTechnique,
                              region: `${product.artisanVillage}, ${product.artisanState}`,
                              dimensions: product.dimensions,
                            })}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {/* Status Badge */}
                          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            product.status === 'published'
                              ? 'bg-emerald-500/90 text-white'
                              : product.status === 'low_stock'
                              ? 'bg-amber-500/90 text-white'
                              : 'bg-red-500/90 text-white'
                          }`}>
                            {product.status === 'published' ? '● Live' : product.status === 'low_stock' ? '⚠ Low Stock' : '✗ Out of Stock'}
                          </div>
                          {/* ONDC Sync Badge */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1b4332]/80 backdrop-blur-sm text-emerald-300 text-[9px] font-extrabold uppercase tracking-wider border border-emerald-400/30">
                            <Globe2 className="w-2.5 h-2.5" /> ONDC Synced
                          </div>
                          {/* Enhanced AI Badge */}
                          {product.imageEnhanced && (
                            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/80 backdrop-blur-sm text-white text-[9px] font-extrabold border border-purple-400/30">
                              <Sparkles className="w-2.5 h-2.5" /> AI Enhanced
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3">
                          {/* GI Tag */}
                          {product.giTagStatus && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              <Star className="w-2.5 h-2.5" /> {product.giTagStatus.split('(')[0].trim()}
                            </span>
                          )}

                          <h3 className="font-extrabold text-sm text-[#1b4332] leading-tight line-clamp-2">{product.title}</h3>
                          <p className="text-xs text-[#455A45] line-clamp-2 leading-relaxed">{product.description}</p>

                          {/* Craft Technique */}
                          <div className="flex items-center gap-1.5 text-[11px] text-[#2d6a4f] font-semibold">
                            <Tag className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{product.craftTechnique}</span>
                          </div>

                          {/* Pricing Row */}
                          <div className="flex items-end justify-between pt-1 border-t border-gray-100">
                            <div>
                              <p className="text-[10px] text-[#455A45] font-semibold uppercase tracking-wide">Your Price</p>
                              <p className="text-lg font-black text-[#1b4332]">₹{product.artisanPrice.toLocaleString()}</p>
                              <p className="text-[10px] text-emerald-600 font-bold">Retail: ₹{product.retailPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-[#455A45] font-semibold">Your Margin</p>
                              <p className="text-base font-black text-emerald-600">{product.estimatedMarginPercent}%</p>
                            </div>
                          </div>

                          {/* Stock & Actions Row */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStockChange(product.id, -1)}
                                disabled={product.stockQuantity === 0}
                                className="w-7 h-7 rounded-lg bg-[#E1EBE1] hover:bg-red-100 flex items-center justify-center text-[#1b4332] hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                title="Decrease stock"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black text-[#1b4332] min-w-8 text-center">
                                {product.stockQuantity} pcs
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStockChange(product.id, +1)}
                                className="w-7 h-7 rounded-lg bg-[#E1EBE1] hover:bg-emerald-100 flex items-center justify-center text-[#1b4332] hover:text-emerald-600 transition-colors cursor-pointer"
                                title="Increase stock"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#455A45]">
                                <Eye className="w-3 h-3" /> {product.views}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <ShoppingBag className="w-3 h-3" /> {product.ordersCount} orders
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORDERS VIEW */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#1b4332] tracking-tight">
                  Artisan Orders & Direct Payouts
                </h1>
                <p className="text-xs sm:text-sm text-[#455A45] mt-0.5">
                  Direct UPI bank deposits on fulfillment with 0% middleman deduction.
                </p>
              </div>

              {/* Order Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#E1EBE1] p-1 rounded-2xl border border-white/60 shadow-inner">
                {(['all', 'pending', 'fulfilled', 'canceled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
                      orderFilter === st
                        ? 'bg-[#1b4332] text-white shadow-xs'
                        : 'text-[#455A45] hover:bg-white/40'
                    }`}
                  >
                    {st} ({orders.filter((o) => (st === 'all' ? true : o.status === st)).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={order.productImageUrl}
                      alt={order.productTitle}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/80 shadow-xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-[#2d6a4f]">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            order.status === 'fulfilled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1b4332] truncate mt-0.5">
                        {order.productTitle}
                      </h4>
                      <p className="text-xs text-[#455A45]">
                        Buyer: {order.buyerName} • {order.buyerCity}, {order.buyerState}
                      </p>
                    </div>
                  </div>

                  {/* Financial Details & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-[#455A45] uppercase font-bold">Artisan Earnings</p>
                      <p className="text-lg font-black text-emerald-600">₹{order.artisanEarnings}</p>
                      <p className="text-[10px] text-[#455A45]">Total: ₹{order.amount}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'fulfilled')}
                          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                      {order.status === 'fulfilled' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Payout Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MARKET LINKAGE VIEW */}
        {/* ======================================================== */}
        {activeTab === 'market_linkage' && (
          <MarketLinkageView
            products={products}
            language={language}
            onOrderPlaced={(order) => {
              DatabaseStore.addOrder(order);
              setOrders((prev) => [order, ...prev]);
            }}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 4: SHOP ANALYTICS */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1b4332] tracking-tight">
                Shop Analytics & Revenue Insights
              </h1>
              <p className="text-xs sm:text-sm text-[#455A45] mt-0.5">
                Real-time performance across ONDC and Global Direct Handicraft Channels.
              </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white/85 p-6 rounded-3xl border border-white/80 shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff]">
                <p className="text-xs font-bold text-[#455A45] uppercase">Total Sales</p>
                <p className="text-2xl font-black text-[#1b4332] mt-1">₹{analytics.totalSales.toLocaleString()}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ +18% vs last month</p>
              </div>

              <div className="bg-white/85 p-6 rounded-3xl border border-white/80 shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff]">
                <p className="text-xs font-bold text-[#455A45] uppercase">Artisan Payouts</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">₹{analytics.artisanEarnings.toLocaleString()}</p>
                <p className="text-[11px] text-[#455A45] font-semibold mt-1">82% net profit ratio</p>
              </div>

              <div className="bg-white/85 p-6 rounded-3xl border border-white/80 shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff]">
                <p className="text-xs font-bold text-[#455A45] uppercase">Active Orders</p>
                <p className="text-2xl font-black text-[#1b4332] mt-1">{orders.length} Orders</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">4 pending delivery</p>
              </div>

              <div className="bg-white/85 p-6 rounded-3xl border border-white/80 shadow-[4px_4px_12px_#d1dbd1,-4px_-4px_12px_#ffffff]">
                <p className="text-xs font-bold text-[#455A45] uppercase">Craft Inventory</p>
                <p className="text-2xl font-black text-[#1b4332] mt-1">{products.length} Products</p>
                <p className="text-[11px] text-amber-600 font-bold mt-1">ONDC Protocol Ready</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/85 p-6 sm:p-7 rounded-3xl border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff]">
                <h3 className="font-extrabold text-sm sm:text-base text-[#1b4332] mb-4">
                  7-Day Sales Trajectory (₹)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenueTrends}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#455A45" fontSize={12} tickLine={false} />
                      <YAxis stroke="#455A45" fontSize={12} tickLine={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#salesGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/85 p-6 sm:p-7 rounded-3xl border border-white/80 shadow-[6px_6px_16px_#d1dbd1,-6px_-6px_16px_#ffffff]">
                <h3 className="font-extrabold text-sm sm:text-base text-[#1b4332] mb-4">
                  Category Revenue Distribution (₹)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.craftCategoryDistribution}>
                      <XAxis dataKey="category" stroke="#455A45" fontSize={11} tickLine={false} />
                      <YAxis stroke="#455A45" fontSize={12} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#2d6a4f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. CENTERPIECE: iOS Siri / Gemini Live Floating Bottom Modal */}
      <GeminiLiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onProductCreated={handleVoiceProductCreated}
        isMuted={isMuted}
        initialPhotoUrl={uploadedPhoto}
      />

      {/* 3.5 MODULE 2: Floating Voice Listing Assistant (post-auth, always on hand) */}
      {isAuthenticated && (
        <VoiceListingTrigger
          onClick={() => {
            setIsVoiceModalOpen(false);
            setVoiceListingOpen(true);
          }}
          isActive={voiceListingOpen}
          isInterviewInProgress={voiceListingOpen}
        />
      )}
      {isAuthenticated && (
        <VoiceListingAssistant
          open={voiceListingOpen}
          onClose={() => setVoiceListingOpen(false)}
          artisan={artisan}
          language={language}
          isMuted={isMuted}
          onProductCreated={handleVoiceProductCreated}
          onViewInStore={() => {
            setActiveTab('catalogue');
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 4. Language Selector Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-[#1b4332]/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <LanguageSelectorModal
              selectedLanguage={language}
              onSelectLanguage={(newLang) => {
                setLanguage(newLang);
              }}
              onProceed={(chosen) => {
                setLanguage(chosen);
                setShowLanguageModal(false);
              }}
              isModal={true}
              onClose={() => setShowLanguageModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
