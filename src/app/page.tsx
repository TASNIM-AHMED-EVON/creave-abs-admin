'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Icons — a single consistent line-icon set (1.5px stroke), drawn locally so
// the project doesn't need an extra dependency.
// ---------------------------------------------------------------------------
const IconScan = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a1 1 0 011-1h2M4 17v2a1 1 0 001 1h2m12-14V5a1 1 0 00-1-1h-2m3 14v2a1 1 0 01-1 1h-2M7 9v6m3-6v6m4-6v6m3-6v6" />
  </svg>
);
const IconArchive = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 6.75v11.5a1 1 0 001 1h14.5a1 1 0 001-1V6.75M3.75 6.75L5.5 3.75h13l1.75 3M10 11h4" />
  </svg>
);
const IconReturn = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4 4-4m-4 4h10a5 5 0 015 5v1" />
  </svg>
);
const IconChart = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V10m6 9V5m6 14v-7m6 7H3" />
  </svg>
);
const IconSurvey = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconLogout = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 17.5l4-4m0 0l-4-4m4 4h-11m4 5.5v.5a2 2 0 01-2 2H6a2 2 0 01-2-2v-12a2 2 0 012-2h4.5a2 2 0 012 2v.5" />
  </svg>
);
const IconSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m1.7-5.3a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconPlus = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
  </svg>
);
const IconCrate = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-5.5M3 9.5L7 4h10l4 5.5M3 9.5h18M3 9.5L4 13h16l1-3.5" />
  </svg>
);
const IconClock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCard = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 8.5h18.5M4.5 5.5h15a1.75 1.75 0 011.75 1.75v9.5A1.75 1.75 0 0119.5 18.5h-15a1.75 1.75 0 01-1.75-1.75v-9.5A1.75 1.75 0 014.5 5.5zM6 14.5h2.5" />
  </svg>
);
const IconUndo = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);
const IconBag = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l1 12.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20.5L6 8zM8.5 8V6a3.5 3.5 0 117 0v2" />
  </svg>
);
const IconReceipt = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h12v17l-2.25-1.5L13.5 20.5l-2.25-1.5L9 20.5l-2.25-1.5L6 20.5v-17z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 11.5h6M9 15h4" />
  </svg>
);
const IconHome = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 11.5L12 4l8.5 7.5M5.5 10v9a1 1 0 001 1H10v-6h4v6h3.5a1 1 0 001-1v-9" />
  </svg>
);
const IconAlertTriangle = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5v4m0 3.5h.01M10.6 4.3L2.9 17.8a1.2 1.2 0 001.04 1.8h16.12a1.2 1.2 0 001.04-1.8L13.4 4.3a1.2 1.2 0 00-2.08 0z" />
  </svg>
);
const IconTrendingUp = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l6.5-6.5 4 4L21 6m0 0h-5.5M21 6v5.5" />
  </svg>
);
const IconPencil = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 013 3L7.5 18.5 3 20l1.5-4.5L16.5 3.5z" />
  </svg>
);
const IconDownload = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v11m0 0l-4-4m4 4l4-4M4.5 19.5h15" />
  </svg>
);
const IconChevronDown = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
  </svg>
);
const IconTag = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 3.5h-5L3 7v5l9.5 9.5a1.5 1.5 0 002 0L20 16a1.5 1.5 0 000-2L11.5 4.5" />
    <circle cx="7.5" cy="7.5" r="1.25" />
  </svg>
);
const IconRuler = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 15.5l5-5 11 11-5 5-11-11z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11.5l2 2M12.5 8.5l2 2M15.5 5.5l2 2" />
  </svg>
);
const IconLayers = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5l9 5-9 5-9-5 9-5zM3 13.5l9 5 9-5M3 18l9 5 9-5" />
  </svg>
);
const IconBookmark = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h12v17l-6-4-6 4v-17z" />
  </svg>
);
const IconClipboard = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.5h6a1 1 0 011 1V6h-8V4.5a1 1 0 011-1z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 5h10a1.5 1.5 0 011.5 1.5v13A1.5 1.5 0 0117 21H7a1.5 1.5 0 01-1.5-1.5v-13A1.5 1.5 0 017 5zM9 11h6m-6 4h6" />
  </svg>
);
const IconFileText = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7l4 4V20a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5V8h4M9 12.5h6m-6 4h6" />
  </svg>
);
const IconTruck = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5h11v10h-11zM13.5 10.5h4l3 3v3h-7z" />
    <circle cx="6.5" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);
const IconTrash = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7h15M9.5 7V5a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0114.5 5v2m-8 0l.75 12.25A1.5 1.5 0 008.74 20.5h6.52a1.5 1.5 0 001.49-1.25L17.5 7" />
  </svg>
);
const IconSettingsGear = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 13.5a7.6 7.6 0 000-3l2-1.5-2-3.5-2.4.6a7.7 7.7 0 00-2.6-1.5L14 2h-4l-.4 2.6a7.7 7.7 0 00-2.6 1.5l-2.4-.6-2 3.5 2 1.5a7.6 7.6 0 000 3l-2 1.5 2 3.5 2.4-.6a7.7 7.7 0 002.6 1.5L10 22h4l.4-2.6a7.7 7.7 0 002.6-1.5l2.4.6 2-3.5z" />
  </svg>
);
const IconCalendar = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 4.5h13a1 1 0 011 1V19a1 1 0 01-1 1h-13a1 1 0 01-1-1V5.5a1 1 0 011-1zM8 3v3M16 3v3M4.5 9.5h15" />
  </svg>
);
const IconList = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);
const IconUsers = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconUserPlus = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);
const IconBadge = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);
const IconWallet = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 014.5 6h13A1.5 1.5 0 0119 7.5v10A1.5 1.5 0 0117.5 19h-13A1.5 1.5 0 013 17.5v-10zM3 9.5h16.5M16 13.5h1.5" />
  </svg>
);

const NAV_GROUPS = [
  { kind: 'single', id: 'overview', tab: 'overview', label: 'Overview', icon: IconHome },
  {
    kind: 'group', id: 'sell', label: 'Sell', icon: IconScan,
    children: [
      { tab: 'sell-order', label: 'Sales Order' },
      { tab: 'sell-all', label: 'All Sales' },
      { tab: 'sell-add', label: 'Add Sale' },
      { tab: 'sell-list-pos', label: 'List POS' },
      { tab: 'pos', label: 'POS' },
      { tab: 'refund', label: 'List Sell Return' },
    ],
  },
  {
    kind: 'group', id: 'products', label: 'Products', icon: IconArchive,
    children: [
      { tab: 'products-list', label: 'List Products' },
      { tab: 'products-add', label: 'Add Product' },
      { tab: 'products-price', label: 'Update Price' },
      { tab: 'products-units', label: 'Units' },
      { tab: 'products-categories', label: 'Categories' },
      { tab: 'products-brands', label: 'Brands' },
    ],
  },
  {
    kind: 'group', id: 'purchases', label: 'Purchases', icon: IconTruck,
    children: [
      { tab: 'purchases-requisition', label: 'Purchase Requisition' },
      { tab: 'purchases-order', label: 'Purchase Order' },
      { tab: 'purchases-list', label: 'List Purchases' },
      { tab: 'purchases-add', label: 'Add Purchase' },
      { tab: 'purchases-return', label: 'List Purchase Return' },
    ],
  },
  { kind: 'single', id: 'daily-cost', tab: 'daily-cost', label: 'Daily Cost', icon: IconWallet },
  {
    kind: 'group', id: 'membership', label: 'Membership', icon: IconUsers,
    children: [
      { tab: 'membership-list', label: 'Members List' },
      { tab: 'membership-add', label: 'Add Member' },
      { tab: 'membership-settings', label: 'Membership Settings' },
    ],
  },
  {
    kind: 'group', id: 'settings', label: 'Settings', icon: IconSettingsGear,
    children: [
      { tab: 'settings-business', label: 'Business Settings' },
      { tab: 'settings-invoice', label: 'Invoice Settings' },
      { tab: 'settings-barcode', label: 'Barcode Settings' },
      { tab: 'settings-tax', label: 'Tax Rates' },
    ],
  },
  { kind: 'single', id: 'reports', tab: 'reports', label: 'Reports', icon: IconChart },
  { kind: 'single', id: 'survey', tab: 'survey', label: 'Daily Sales Survey', icon: IconSurvey },
] as const;

const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'upay', 'rocket', 'bank/card'] as const;

// Items at or below this remaining quantity surface as "Low Stock" on the
// Overview tab and in the inventory list.
const LOW_STOCK_THRESHOLD = 3;

// Used to seed the Category dropdown if the `categories` table is empty
// (e.g. before the SQL migration has been run, or freshly run with no rows).
const FALLBACK_CATEGORIES = ['Panjabi', 'Shirt', 'T-Shirt', 'Pant', '0-5 Years', 'Small Baby Dress', 'Medium Dress', 'Maximum Dress'];

// ---------------------------------------------------------------------------
// SurveyChart — mounts Chart.js onto a canvas after React renders it.
// Lives outside AdminDashboard so it re-mounts cleanly when its key changes.
// ---------------------------------------------------------------------------
declare global { interface Window { Chart: any } }

function SurveyChart({ canvasId, records, isDark }: {
  canvasId: string;
  records: { date: string; amount: number }[];
  isDark: boolean;
}) {
  useEffect(() => {
    if (records.length === 0) return;

    const loadAndInit = () => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (!canvas || !window.Chart) return;

      const labels = records.map(r => r.date.slice(5).replace('-', '/'));
      const amounts = records.map(r => r.amount);

      const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : '#e1e0d9';
      const tickColor  = isDark ? '#898781' : '#898781';
      const barColor   = isDark ? '#3987e5' : '#2a78d6';

      new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Daily sales (৳)',
            data: amounts,
            backgroundColor: barColor,
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: 'bottom',
            maxBarThickness: 52,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (ctx: any) => ctx[0].label,
                label: (ctx: any) => ' ৳' + Math.round(ctx.parsed.y).toLocaleString(),
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: tickColor,
                font: { size: 11 },
                callback: (v: number) => v >= 1000 ? Math.round(v / 1000) + 'k' : v,
              },
              grid: { color: gridColor },
              border: { display: false },
            },
            x: {
              ticks: {
                color: tickColor,
                font: { size: 11 },
                autoSkip: false,
                maxRotation: 0,
              },
              grid: { display: false },
              border: { display: false },
            },
          },
          animation: { duration: 400 },
        },
      });
    };

    if (window.Chart) {
      loadAndInit();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = loadAndInit;
      document.head.appendChild(script);
    }
  }, [canvasId, records, isDark]);

  return null;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // POS State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'rocket' | 'cash' | 'bank/card'>('cash');
  const [trxId, setTrxId] = useState('');
  const [posMessage, setPosMessage] = useState({ type: '', text: '' });
  const [discountAmount, setDiscountAmount] = useState('0');
  const [selectedTaxRateId, setSelectedTaxRateId] = useState<string>('');

  // Inventory State
  const [invBarcode, setInvBarcode] = useState('');
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('');
  const [invBrand, setInvBrand] = useState('');
  const [invUnit, setInvUnit] = useState('Piece');
  const [invPrice, setInvPrice] = useState('');
  const [invQuantity, setInvQuantity] = useState('1');
  const [invMessage, setInvMessage] = useState({ type: '', text: '' });
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Refund State
  const [refundBarcode, setRefundBarcode] = useState('');
  const [refundItemSales, setRefundItemSales] = useState<any[]>([]);
  const [refundMessage, setRefundMessage] = useState({ type: '', text: '' });

  // Reports State
  const [salesRecord, setSalesRecord] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueByMethod, setRevenueByMethod] = useState<Record<string, number>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Overview State
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayItemsSold, setTodayItemsSold] = useState(0);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Inventory: archive visibility + inline edit
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [editDraft, setEditDraft] = useState({ name: '', category: '', brand: '', unit: '', price: '', quantity: '' });

  // Products reference data: Categories / Units / Brands
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Update Price (focused quick-edit list)
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [priceDraftId, setPriceDraftId] = useState<any>(null);
  const [priceDraftValue, setPriceDraftValue] = useState('');

  // Purchase Requisition
  const [reqDescription, setReqDescription] = useState('');
  const [reqQuantity, setReqQuantity] = useState('1');
  const [reqSupplier, setReqSupplier] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [reqMessage, setReqMessage] = useState({ type: '', text: '' });

  // Purchase Order
  const [poSupplierName, setPoSupplierName] = useState('');
  const [poSupplierPhone, setPoSupplierPhone] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poLineItems, setPoLineItems] = useState<{ description: string; quantity: string; unitCost: string }[]>([
    { description: '', quantity: '1', unitCost: '' },
  ]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poMessage, setPoMessage] = useState({ type: '', text: '' });

  // Add Purchase (the action that actually moves stock)
  const [purchaseBarcode, setPurchaseBarcode] = useState('');
  const [purchaseMatch, setPurchaseMatch] = useState<any>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('1');
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('');
  const [purchaseSupplierName, setPurchaseSupplierName] = useState('');
  const [purchaseSupplierPhone, setPurchaseSupplierPhone] = useState('');
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState<'paid' | 'due' | 'partial'>('paid');
  const [purchaseMessage, setPurchaseMessage] = useState({ type: '', text: '' });
  const [purchasesList, setPurchasesList] = useState<any[]>([]);

  // List Purchase Return
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnMatch, setReturnMatch] = useState<any>(null);
  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnReason, setReturnReason] = useState('');
  const [returnSupplierName, setReturnSupplierName] = useState('');
  const [returnMessage, setReturnMessage] = useState({ type: '', text: '' });
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);

  // Sales Order (customer pre-orders, fulfilled later)
  const [soCustomerName, setSoCustomerName] = useState('');
  const [soCustomerPhone, setSoCustomerPhone] = useState('');
  const [soItemDescription, setSoItemDescription] = useState('');
  const [soQuantity, setSoQuantity] = useState('1');
  const [soUnitPrice, setSoUnitPrice] = useState('');
  const [soExpectedDate, setSoExpectedDate] = useState('');
  const [soNotes, setSoNotes] = useState('');
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [soMessage, setSoMessage] = useState({ type: '', text: '' });

  // All Sales (searchable read-only ledger, separate from the Reports view)
  const [allSalesSearchQuery, setAllSalesSearchQuery] = useState('');

  // Add Sale (search-based single-item quick sale, no scanner needed)
  const [addSaleSearchQuery, setAddSaleSearchQuery] = useState('');
  const [addSaleSelectedItem, setAddSaleSelectedItem] = useState<any>(null);
  const [addSalePaymentMethod, setAddSalePaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'rocket' | 'cash' | 'bank/card'>('cash');
  const [addSaleTrxId, setAddSaleTrxId] = useState('');
  const [addSaleMessage, setAddSaleMessage] = useState({ type: '', text: '' });

  // Settings — one shared row of business config
  const [businessSettings, setBusinessSettings] = useState({
    business_name: 'CRAVE ABS',
    address: 'Mymensingh, Bangladesh',
    phone: '',
    receipt_footer_line1: 'THANK YOU FOR SHOPPING!',
    receipt_footer_line2: 'No refunds without receipt.',
    barcode_prefix: 'CRV',
  });
  const [settingsSaved, setSettingsSaved] = useState<string>('');

  // Tax Rates (reference list — not yet applied automatically at checkout)
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');

  // --- Membership ---
  const [members, setMembers] = useState<any[]>([]);
  const [memberMobile, setMemberMobile] = useState('');
  const [memberMessage, setMemberMessage] = useState({ type: '', text: '' });
  const [memberSearch, setMemberSearch] = useState('');
  const [membershipSettings, setMembershipSettings] = useState({ discount_percent: 10 });
  const [membershipDiscountInput, setMembershipDiscountInput] = useState('10');
  const [membershipSettingsSaved, setMembershipSettingsSaved] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [memberNote, setMemberNote] = useState('');

  // --- Survey ---
  const [surveyRecords, setSurveyRecords] = useState<{date: string; amount: number}[]>([]);
  const [surveyDateInput, setSurveyDateInput] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  });
  const [surveyAmountInput, setSurveyAmountInput] = useState('');
  const [surveyMessage, setSurveyMessage] = useState({ type: '', text: '' });
  const [surveyChartKey, setSurveyChartKey] = useState(0);

  // --- Daily Cost ---
  const [dailyCosts, setDailyCosts] = useState<any[]>([]);
  const [dailyCostDate, setDailyCostDate] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  });
  const [dailyCostAmount, setDailyCostAmount] = useState('');
  const [dailyCostNote, setDailyCostNote] = useState('');
  const [dailyCostMessage, setDailyCostMessage] = useState({ type: '', text: '' });

  // --- INVENTORY MEMOIZED FETCH ---
  const fetchRecentInventory = useCallback(async () => {
    const { data } = await supabase
      .from('dresses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (data) setRecentInventory(data);
  }, []);

  // --- REPORTS MEMOIZED FETCH ---
  const fetchSalesData = useCallback(async () => {
    let query = supabase.from('sales').select(`*, dresses ( name, barcode )`).order('sold_at', { ascending: false });

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('sold_at', start.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('sold_at', end.toISOString());
    }

    const { data } = await query;
    if (data) {
      setSalesRecord(data);
      let total = 0;
      const methods: Record<string, number> = { cash: 0, bkash: 0, nagad: 0, upay: 0, rocket: 0, 'bank/card': 0 };

      data.forEach(sale => {
        if (sale.status === 'completed') {
          const amount = Number(sale.amount_paid);
          total += amount;

          // Decode Bank/Card bypass for reporting
          const displayMethod = sale.transaction_id === 'BANK/CARD-SALE' ? 'bank/card' : sale.payment_method;

          if (methods[displayMethod] !== undefined) methods[displayMethod] += amount;
        }
      });
      setTotalRevenue(total);
      setRevenueByMethod(methods);
    }
  }, [startDate, endDate]);

  // --- OVERVIEW MEMOIZED FETCH ---
  // Independent of the Reports date filters so the dashboard always shows
  // today's real numbers and an all-time leaderboard.
  const fetchOverviewData = useCallback(async () => {
    setOverviewLoading(true);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: todayData } = await supabase
      .from('sales')
      .select('amount_paid, status')
      .gte('sold_at', startOfDay.toISOString())
      .lte('sold_at', endOfDay.toISOString());

    if (todayData) {
      const completedToday = todayData.filter((s: any) => s.status === 'completed');
      setTodayRevenue(completedToday.reduce((sum: number, s: any) => sum + Number(s.amount_paid), 0));
      setTodayItemsSold(completedToday.length);
    }

    // Tally units sold per item across the most recent completed sales to
    // surface a top-sellers leaderboard without needing a SQL view.
    const { data: recentSales } = await supabase
      .from('sales')
      .select('dress_id, amount_paid, status, dresses ( name, barcode )')
      .eq('status', 'completed')
      .order('sold_at', { ascending: false })
      .limit(500);

    if (recentSales) {
      const tally: Record<string, { name: string; barcode: string; unitsSold: number; revenue: number }> = {};
      recentSales.forEach((sale: any) => {
        const key = String(sale.dress_id);
        if (!tally[key]) {
          tally[key] = {
            name: sale.dresses?.name ?? 'Unknown Item',
            barcode: sale.dresses?.barcode ?? '',
            unitsSold: 0,
            revenue: 0,
          };
        }
        tally[key].unitsSold += 1;
        tally[key].revenue += Number(sale.amount_paid);
      });
      const ranked = Object.values(tally).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
      setTopSellers(ranked);
    }

    setOverviewLoading(false);
  }, []);

  // --- PRODUCTS REFERENCE DATA ---
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (data) setCategories(data);
  }, []);

  const fetchUnits = useCallback(async () => {
    const { data } = await supabase.from('units').select('*').order('name', { ascending: true });
    if (data) setUnits(data);
  }, []);

  const fetchBrands = useCallback(async () => {
    const { data } = await supabase.from('brands').select('*').order('name', { ascending: true });
    if (data) setBrands(data);
  }, []);

  // --- PURCHASES DATA ---
  const fetchRequisitions = useCallback(async () => {
    const { data } = await supabase.from('purchase_requisitions').select('*').order('created_at', { ascending: false });
    if (data) setRequisitions(data);
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select(`*, purchase_order_items ( id, item_description, quantity_ordered, unit_cost )`)
      .order('created_at', { ascending: false });
    if (data) setPurchaseOrders(data);
  }, []);

  const fetchPurchasesList = useCallback(async () => {
    const { data } = await supabase.from('purchases').select('*').order('purchased_at', { ascending: false }).limit(500);
    if (data) setPurchasesList(data);
  }, []);

  const fetchPurchaseReturns = useCallback(async () => {
    const { data } = await supabase.from('purchase_returns').select('*').order('returned_at', { ascending: false }).limit(500);
    if (data) setPurchaseReturns(data);
  }, []);

  // --- SALES ORDERS ---
  const fetchSalesOrders = useCallback(async () => {
    const { data } = await supabase.from('sales_orders').select('*').order('created_at', { ascending: false });
    if (data) setSalesOrders(data);
  }, []);

  // --- SETTINGS ---
  const fetchBusinessSettings = useCallback(async () => {
    const { data } = await supabase.from('business_settings').select('*').eq('id', 1).single();
    if (data) setBusinessSettings(data);
  }, []);

  const fetchTaxRates = useCallback(async () => {
    const { data } = await supabase.from('tax_rates').select('*').order('name', { ascending: true });
    if (data) setTaxRates(data);
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('start_date', { ascending: false });
      if (!error && data) setMembers(data);
    } catch (_) {
      // table not yet created — stays empty
    }
  }, []);

  const fetchMembershipSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('membership_settings').select('*').eq('id', 1).single();
      if (!error && data) {
        setMembershipSettings(data);
        setMembershipDiscountInput(String(data.discount_percent));
      }
    } catch (_) {
      // table not yet created — use defaults
    }
  }, []);

  // Pulls last 10 unique days from the real sales table, summing amount_paid
  // per day so the survey chart reflects actual recorded transactions.
  const fetchSurveyData = useCallback(async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('sold_at, amount_paid, status')
      .eq('status', 'completed')
      .order('sold_at', { ascending: false })
      .limit(500);
    if (error || !data) return;

    const dayTotals: Record<string, number> = {};
    data.forEach((row: any) => {
      const day = row.sold_at.slice(0, 10);
      dayTotals[day] = (dayTotals[day] || 0) + Number(row.amount_paid);
    });

    const sorted = Object.keys(dayTotals)
      .sort()
      .slice(-10)
      .map(date => ({ date, amount: Math.round(dayTotals[date]) }));
    setSurveyRecords(sorted);
    setSurveyChartKey(k => k + 1);
  }, []);

  // --- DAILY COST ---
  const fetchDailyCosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_costs')
      .select('*')
      .order('cost_date', { ascending: false })
      .limit(200);
    if (!error && data) setDailyCosts(data);
  }, []);

  // --- MEMBERSHIP HANDLERS ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberMessage({ type: '', text: '' });
    const phone = memberPhone.trim();
    if (!phone) return;

    // Check for duplicate
    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existing) {
      setMemberMessage({ type: 'error', text: `${phone} is already a member.` });
      return;
    }

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const { error } = await supabase.from('memberships').insert([{
      phone,
      note: memberNote.trim() || null,
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'active',
    }]);

    if (error) {
      setMemberMessage({ type: 'error', text: 'Failed to add member. Please try again.' });
    } else {
      setMemberMessage({ type: 'success', text: `${phone} enrolled. Membership valid until ${expiryDate.toLocaleDateString('en-BD')}.` });
      setMemberPhone('');
      setMemberNote('');
      fetchMembers();
    }
  };

  const renewMember = async (member: any) => {
    const newExpiry = new Date(member.expiry_date);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const { error } = await supabase
      .from('memberships')
      .update({ expiry_date: newExpiry.toISOString(), status: 'active' })
      .eq('id', member.id);
    if (!error) fetchMembers();
  };

  const revokeMember = async (member: any) => {
    if (!window.confirm(`Revoke membership for ${member.phone}?`)) return;
    const { error } = await supabase
      .from('memberships')
      .update({ status: 'revoked' })
      .eq('id', member.id);
    if (!error) fetchMembers();
  };

  const saveMembershipSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = Math.min(Math.max(parseFloat(membershipDiscountInput) || 0, 0), 100);
    const { error } = await supabase
      .from('membership_settings')
      .update({ discount_percent: pct })
      .eq('id', 1);
    if (!error) {
      setMembershipSettings({ discount_percent: pct });
      setMembershipSettingsSaved(true);
      setTimeout(() => setMembershipSettingsSaved(false), 2500);
    } else {
      alert('Failed to save. Make sure migration_006 has been run.');
    }
  };

  // --- DARK MODE ---
  // Reads saved preference on first load, then toggles the `dark` class on
  // <html> so every CSS variable defined in globals.css flips at once —
  // no Tailwind `dark:` classes needed anywhere in the JSX.
  useEffect(() => {
    const saved = localStorage.getItem('crave_abs_theme');
    const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('crave_abs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('crave_abs_theme', 'light');
    }
  };

  // Business name/address are shown on the login screen too, before any
  // session exists, so fetch them unconditionally on first mount. (The RLS
  // policy on business_settings allows public SELECT for exactly this
  // reason — see migration_005.)
  useEffect(() => {
    fetchBusinessSettings();
  }, [fetchBusinessSettings]);

  const loadAuthenticatedData = useCallback(() => {
    fetchRecentInventory();
    fetchSalesData();
    fetchOverviewData();
    fetchCategories();
    fetchUnits();
    fetchBrands();
    fetchBusinessSettings();
    fetchTaxRates();
    fetchMembers();
    fetchMembershipSettings();
    fetchDailyCosts();
  }, [fetchRecentInventory, fetchSalesData, fetchOverviewData, fetchCategories, fetchUnits, fetchBrands, fetchBusinessSettings, fetchTaxRates, fetchMembers, fetchMembershipSettings, fetchDailyCosts]);

  // --- REAL SUPABASE AUTH SESSION HANDLING ---
  // Replaces the old localStorage timer: Supabase's own client keeps the
  // session (and its refresh token) in localStorage under its own keys and
  // refreshes it automatically, so there's nothing custom to manage here —
  // just ask it for the current session once, then listen for changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        loadAuthenticatedData();
      }
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        loadAuthenticatedData();
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth Submit Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginSubmitting(false);
    if (error) {
      setLoginError('Incorrect email or password.');
    }
    // On success, onAuthStateChange (above) fires SIGNED_IN and handles
    // setting isAuthenticated + loading data — nothing else to do here.
  };

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
  };

  // --- POS FUNCTIONS ---
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosMessage({ type: '', text: '' });
    if (!barcodeInput) return;

    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .eq('barcode', barcodeInput)
      .single();

    if (error || !data) {
      setPosMessage({ type: 'error', text: 'Dress not found! Check the barcode.' });
    } else {
      const existingCartItem = cart.find(item => item.id === data.id);
      const currentCartQty = existingCartItem ? existingCartItem.cartQty : 0;

      if (currentCartQty + 1 > data.quantity) {
         setPosMessage({ type: 'error', text: 'Not enough stock available for this item!' });
      } else {
         if (existingCartItem) {
           setCart(cart.map(item => item.id === data.id ? { ...item, cartQty: item.cartQty + 1 } : item));
         } else {
           setCart([...cart, { ...data, cartQty: 1 }]);
         }
      }
    }
    setBarcodeInput('');
  };

  const updateCartItemQuantity = (id: string, increment: boolean) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = increment ? item.cartQty + 1 : item.cartQty - 1;
        if (newQty <= 0) return item;
        if (newQty > item.quantity) {
          setPosMessage({ type: 'error', text: `Cannot exceed available physical stock (${item.quantity} available).` });
          return item;
        }
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((total, item) => total + item.price * item.cartQty, 0);
    const discount = Math.min(Math.max(parseFloat(discountAmount) || 0, 0), subtotal);
    const subtotalAfterDiscount = subtotal - discount;
    const activeTaxRate = taxRates.find((t: any) => String(t.id) === selectedTaxRateId);
    const taxTotal = activeTaxRate ? Math.round(subtotalAfterDiscount * (Number(activeTaxRate.rate_percent) / 100)) : 0;

    // Flatten the cart to one entry per physical unit (matches how each row
    // in `sales` represents a single sold piece), then spread the discount
    // and tax proportionally across those units so amount_paid always
    // reflects what was actually collected — which keeps every revenue
    // total elsewhere (Reports, Overview, All Sales) correct automatically,
    // since they all just sum amount_paid.
    const units: any[] = [];
    cart.forEach(item => {
      for (let i = 0; i < item.cartQty; i++) units.push(item);
    });

    let remainingDiscount = discount;
    let remainingTax = taxTotal;

    const dbPaymentMethod = paymentMethod === 'bank/card' ? 'cash' : paymentMethod;
    const dbTrxId = paymentMethod === 'bank/card'
      ? 'BANK/CARD-SALE'
      : (paymentMethod === 'cash' ? 'DIRECT-SALE' : trxId);

    const salesData = units.map((item, idx) => {
      const isLast = idx === units.length - 1;
      const rowDiscount = isLast ? remainingDiscount : (subtotal > 0 ? Math.round((item.price / subtotal) * discount) : 0);
      if (!isLast) remainingDiscount -= rowDiscount;
      const rowTax = isLast ? remainingTax : (subtotal > 0 ? Math.round((item.price / subtotal) * taxTotal) : 0);
      if (!isLast) remainingTax -= rowTax;

      return {
        dress_id: item.id,
        payment_method: dbPaymentMethod,
        transaction_id: dbTrxId,
        amount_paid: item.price - rowDiscount + rowTax,
        discount_amount: rowDiscount,
        tax_amount: rowTax,
        status: 'completed',
      };
    });

    const { error: saleError } = await supabase.from('sales').insert(salesData);

    if (saleError) {
      console.error(saleError);
      setPosMessage({ type: 'error', text: 'Checkout failed. Check console for details.' });
      return;
    }

    for (const item of cart) {
      const newQuantity = item.quantity - item.cartQty;
      await supabase
        .from('dresses')
        .update({
          quantity: newQuantity,
          status: newQuantity === 0 ? 'sold' : 'available'
        })
        .eq('id', item.id);
    }

    setPosMessage({ type: 'success', text: 'Sale recorded! Printing receipt...' });

    setTimeout(() => {
      window.print();
      setCart([]);
      setTrxId('');
      setDiscountAmount('0');
      setSelectedTaxRateId('');
      fetchRecentInventory();
      fetchSalesData();
      fetchOverviewData();
    }, 500);
  };

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.cartQty), 0);
  const cartDiscountValue = Math.min(Math.max(parseFloat(discountAmount) || 0, 0), cartSubtotal);
  const cartSubtotalAfterDiscount = cartSubtotal - cartDiscountValue;
  const cartActiveTaxRate = taxRates.find((t: any) => String(t.id) === selectedTaxRateId);
  const cartTaxValue = cartActiveTaxRate ? Math.round(cartSubtotalAfterDiscount * (Number(cartActiveTaxRate.rate_percent) / 100)) : 0;
  const cartTotal = cartSubtotalAfterDiscount + cartTaxValue;

  // --- INVENTORY ADD FUNCTIONS ---
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMessage({ type: '', text: '' });
    const qty = parseInt(invQuantity);
    const { error } = await supabase.from('dresses').insert([
      {
        barcode: invBarcode,
        name: invName,
        category: invCategory,
        brand: invBrand || null,
        unit: invUnit || 'Piece',
        price: parseFloat(invPrice),
        quantity: qty,
        status: qty > 0 ? 'available' : 'sold'
      }
    ]);
    if (error) {
      setInvMessage({ type: 'error', text: 'Failed to add item. Barcode might already exist.' });
    } else {
      setInvMessage({ type: 'success', text: `Successfully stocked ${qty} item(s)!` });
      setInvBarcode(''); setInvName(''); setInvCategory(''); setInvBrand('');
      setInvUnit('Piece'); setInvPrice(''); setInvQuantity('1');
      fetchRecentInventory();
    }
  };

  // --- INVENTORY EDIT / ARCHIVE FUNCTIONS ---
  // Barcode is left out of the editable fields since it's the lookup key
  // used at the POS counter and in refund search.
  const startEditInventory = (item: any) => {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      unit: item.unit || 'Piece',
      price: String(item.price),
      quantity: String(item.quantity),
    });
  };

  const cancelEditInventory = () => {
    setEditingId(null);
  };

  const saveEditInventory = async (id: any) => {
    const qty = parseInt(editDraft.quantity);
    const price = parseFloat(editDraft.price);
    const { error } = await supabase
      .from('dresses')
      .update({
        name: editDraft.name,
        category: editDraft.category,
        brand: editDraft.brand || null,
        unit: editDraft.unit || 'Piece',
        price,
        quantity: qty,
        status: qty > 0 ? 'available' : 'sold',
      })
      .eq('id', id);

    if (error) {
      alert('Failed to save changes. Please try again.');
    } else {
      setEditingId(null);
      fetchRecentInventory();
    }
  };

  // Archiving (rather than deleting) protects sales history: the sales
  // table references dress_id with ON DELETE CASCADE, so a hard delete
  // would silently wipe that item's transaction record from your reports.
  const archiveInventoryItem = async (item: any) => {
    if (!window.confirm(`Archive "${item.name}"? It will be hidden from the POS and active stock list, but its sales history stays intact. You can restore it anytime.`)) return;
    const { error } = await supabase
      .from('dresses')
      .update({ status: 'archived', quantity: 0 })
      .eq('id', item.id);
    if (error) {
      alert('Failed to archive item.');
    } else {
      fetchRecentInventory();
    }
  };

  const restoreInventoryItem = async (item: any) => {
    const { error } = await supabase
      .from('dresses')
      .update({ status: 'available' })
      .eq('id', item.id);
    if (error) {
      alert('Failed to restore item.');
    } else {
      fetchRecentInventory();
    }
  };

  // --- UPDATE PRICE (focused quick-edit) ---
  const saveQuickPrice = async (id: any) => {
    const newPrice = parseFloat(priceDraftValue);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Enter a valid price.');
      return;
    }
    const { error } = await supabase.from('dresses').update({ price: newPrice }).eq('id', id);
    if (error) {
      alert('Failed to update price.');
    } else {
      setPriceDraftId(null);
      setPriceDraftValue('');
      fetchRecentInventory();
    }
  };

  // --- CATEGORIES CRUD ---
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
    if (error) {
      alert('Failed to add category. It may already exist.');
    } else {
      setNewCategoryName('');
      fetchCategories();
    }
  };

  const deleteCategory = async (id: any, name: string) => {
    if (!window.confirm(`Remove "${name}" from your category list? Existing products keep their value — it just won't be offered as a dropdown option anymore.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories();
  };

  // --- UNITS CRUD ---
  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    const { error } = await supabase.from('units').insert([{ name: newUnitName.trim(), short_code: newUnitCode.trim() || null }]);
    if (error) {
      alert('Failed to add unit. It may already exist.');
    } else {
      setNewUnitName(''); setNewUnitCode('');
      fetchUnits();
    }
  };

  const deleteUnit = async (id: any) => {
    if (!window.confirm('Remove this unit?')) return;
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (!error) fetchUnits();
  };

  // --- BRANDS CRUD ---
  const addBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const { error } = await supabase.from('brands').insert([{ name: newBrandName.trim() }]);
    if (error) {
      alert('Failed to add brand. It may already exist.');
    } else {
      setNewBrandName('');
      fetchBrands();
    }
  };

  const deleteBrand = async (id: any) => {
    if (!window.confirm('Remove this brand?')) return;
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (!error) fetchBrands();
  };

  // --- PURCHASE REQUISITION ---
  const handleAddRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqMessage({ type: '', text: '' });
    const qty = parseInt(reqQuantity);
    const { error } = await supabase.from('purchase_requisitions').insert([{
      item_description: reqDescription,
      quantity_needed: qty,
      preferred_supplier: reqSupplier || null,
      notes: reqNotes || null,
      status: 'pending',
    }]);
    if (error) {
      setReqMessage({ type: 'error', text: 'Failed to save requisition.' });
    } else {
      setReqMessage({ type: 'success', text: 'Requisition logged.' });
      setReqDescription(''); setReqQuantity('1'); setReqSupplier(''); setReqNotes('');
      fetchRequisitions();
    }
  };

  const updateRequisitionStatus = async (id: any, status: string) => {
    const { error } = await supabase.from('purchase_requisitions').update({ status }).eq('id', id);
    if (!error) fetchRequisitions();
  };

  // --- PURCHASE ORDER (with dynamic line items) ---
  const addPoLineItem = () => {
    setPoLineItems([...poLineItems, { description: '', quantity: '1', unitCost: '' }]);
  };
  const removePoLineItem = (index: number) => {
    setPoLineItems(poLineItems.filter((_, i) => i !== index));
  };
  const updatePoLineItem = (index: number, field: 'description' | 'quantity' | 'unitCost', value: string) => {
    setPoLineItems(poLineItems.map((li, i) => (i === index ? { ...li, [field]: value } : li)));
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPoMessage({ type: '', text: '' });
    const validItems = poLineItems.filter(li => li.description.trim() && li.quantity && li.unitCost);
    if (!poSupplierName || validItems.length === 0) {
      setPoMessage({ type: 'error', text: 'Add a supplier and at least one line item.' });
      return;
    }

    const { data: order, error } = await supabase
      .from('purchase_orders')
      .insert([{
        supplier_name: poSupplierName,
        supplier_phone: poSupplierPhone || null,
        expected_date: poExpectedDate || null,
        notes: poNotes || null,
        status: 'ordered',
      }])
      .select()
      .single();

    if (error || !order) {
      setPoMessage({ type: 'error', text: 'Failed to create purchase order.' });
      return;
    }

    const itemsPayload = validItems.map(li => ({
      purchase_order_id: order.id,
      item_description: li.description,
      quantity_ordered: parseInt(li.quantity),
      unit_cost: parseFloat(li.unitCost),
    }));
    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsPayload);

    if (itemsError) {
      setPoMessage({ type: 'error', text: 'Order created, but line items failed to save.' });
    } else {
      setPoMessage({ type: 'success', text: 'Purchase order created.' });
      setPoSupplierName(''); setPoSupplierPhone(''); setPoExpectedDate(''); setPoNotes('');
      setPoLineItems([{ description: '', quantity: '1', unitCost: '' }]);
    }
    fetchPurchaseOrders();
  };

  const updatePurchaseOrderStatus = async (id: any, status: string) => {
    const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
    if (!error) fetchPurchaseOrders();
  };

  // --- ADD PURCHASE (goods received — the action that moves stock) ---
  const handlePurchaseBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseMessage({ type: '', text: '' });
    setPurchaseMatch(null);
    if (!purchaseBarcode) return;
    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', purchaseBarcode).single();
    if (error || !data) {
      setPurchaseMessage({ type: 'error', text: 'No product with that barcode. Add it under Products first.' });
    } else {
      setPurchaseMatch(data);
      setPurchaseUnitCost(String(data.price));
    }
  };

  const handleRecordPurchase = async () => {
    if (!purchaseMatch) return;
    setPurchaseMessage({ type: '', text: '' });
    const qty = parseInt(purchaseQuantity);
    const unitCost = parseFloat(purchaseUnitCost);
    if (!qty || qty <= 0 || isNaN(unitCost)) {
      setPurchaseMessage({ type: 'error', text: 'Enter a valid quantity and unit cost.' });
      return;
    }

    const { error: purchaseError } = await supabase.from('purchases').insert([{
      dress_id: purchaseMatch.id,
      item_name: purchaseMatch.name,
      barcode: purchaseMatch.barcode,
      quantity: qty,
      unit_cost: unitCost,
      total_cost: qty * unitCost,
      supplier_name: purchaseSupplierName || null,
      supplier_phone: purchaseSupplierPhone || null,
      payment_status: purchasePaymentStatus,
    }]);

    if (purchaseError) {
      setPurchaseMessage({ type: 'error', text: 'Failed to record purchase.' });
      return;
    }

    const newQuantity = purchaseMatch.quantity + qty;
    await supabase.from('dresses').update({ quantity: newQuantity, status: 'available' }).eq('id', purchaseMatch.id);

    setPurchaseMessage({ type: 'success', text: `Stock updated — ${purchaseMatch.name} now has ${newQuantity} on hand.` });
    setPurchaseBarcode(''); setPurchaseMatch(null); setPurchaseQuantity('1'); setPurchaseUnitCost('');
    setPurchaseSupplierName(''); setPurchaseSupplierPhone('');
    fetchRecentInventory();
    fetchPurchasesList();
  };

  // --- LIST PURCHASE RETURN (stock going back to supplier) ---
  const handleReturnBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnMessage({ type: '', text: '' });
    setReturnMatch(null);
    if (!returnBarcode) return;
    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', returnBarcode).single();
    if (error || !data) {
      setReturnMessage({ type: 'error', text: 'No product found with that barcode.' });
    } else {
      setReturnMatch(data);
    }
  };

  const handleRecordReturn = async () => {
    if (!returnMatch) return;
    setReturnMessage({ type: '', text: '' });
    const qty = parseInt(returnQuantity);
    if (!qty || qty <= 0) {
      setReturnMessage({ type: 'error', text: 'Enter a valid quantity.' });
      return;
    }
    if (qty > returnMatch.quantity) {
      setReturnMessage({ type: 'error', text: `Cannot return more than the ${returnMatch.quantity} currently in stock.` });
      return;
    }

    const { error: returnError } = await supabase.from('purchase_returns').insert([{
      dress_id: returnMatch.id,
      item_name: returnMatch.name,
      barcode: returnMatch.barcode,
      quantity: qty,
      unit_cost: returnMatch.price,
      reason: returnReason || null,
      supplier_name: returnSupplierName || null,
    }]);

    if (returnError) {
      setReturnMessage({ type: 'error', text: 'Failed to log return.' });
      return;
    }

    const newQuantity = returnMatch.quantity - qty;
    await supabase.from('dresses').update({ quantity: newQuantity, status: newQuantity === 0 ? 'sold' : 'available' }).eq('id', returnMatch.id);

    setReturnMessage({ type: 'success', text: 'Return logged and stock adjusted.' });
    setReturnBarcode(''); setReturnMatch(null); setReturnQuantity('1'); setReturnReason(''); setReturnSupplierName('');
    fetchRecentInventory();
    fetchPurchaseReturns();
  };

  // --- SALES ORDER (customer pre-order, fulfilled later — no stock effect) ---
  const handleAddSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSoMessage({ type: '', text: '' });
    const { error } = await supabase.from('sales_orders').insert([{
      customer_name: soCustomerName,
      customer_phone: soCustomerPhone || null,
      item_description: soItemDescription,
      quantity: parseInt(soQuantity),
      unit_price: soUnitPrice ? parseFloat(soUnitPrice) : null,
      expected_date: soExpectedDate || null,
      notes: soNotes || null,
      status: 'pending',
    }]);
    if (error) {
      setSoMessage({ type: 'error', text: 'Failed to save sales order.' });
    } else {
      setSoMessage({ type: 'success', text: 'Sales order logged.' });
      setSoCustomerName(''); setSoCustomerPhone(''); setSoItemDescription('');
      setSoQuantity('1'); setSoUnitPrice(''); setSoExpectedDate(''); setSoNotes('');
      fetchSalesOrders();
    }
  };

  const updateSalesOrderStatus = async (id: any, status: string) => {
    const { error } = await supabase.from('sales_orders').update({ status }).eq('id', id);
    if (!error) fetchSalesOrders();
  };

  // --- ADD SALE (search-based single-item quick sale — no barcode scanner needed) ---
  const selectAddSaleItem = (item: any) => {
    setAddSaleSelectedItem(item);
    setAddSaleSearchQuery('');
  };

  const handleCompleteAddSale = async () => {
    if (!addSaleSelectedItem) return;
    setAddSaleMessage({ type: '', text: '' });

    const dbPaymentMethod = addSalePaymentMethod === 'bank/card' ? 'cash' : addSalePaymentMethod;
    const dbTrxId = addSalePaymentMethod === 'bank/card'
      ? 'BANK/CARD-SALE'
      : (addSalePaymentMethod === 'cash' ? 'DIRECT-SALE' : addSaleTrxId);

    const { error: saleError } = await supabase.from('sales').insert([{
      dress_id: addSaleSelectedItem.id,
      payment_method: dbPaymentMethod,
      transaction_id: dbTrxId,
      amount_paid: addSaleSelectedItem.price,
      status: 'completed',
    }]);

    if (saleError) {
      setAddSaleMessage({ type: 'error', text: 'Sale failed. Please try again.' });
      return;
    }

    const newQuantity = addSaleSelectedItem.quantity - 1;
    await supabase.from('dresses').update({
      quantity: newQuantity,
      status: newQuantity === 0 ? 'sold' : 'available',
    }).eq('id', addSaleSelectedItem.id);

    setAddSaleMessage({ type: 'success', text: `Sale recorded for ${addSaleSelectedItem.name}.` });
    setAddSaleSelectedItem(null);
    setAddSaleTrxId('');
    fetchRecentInventory();
    fetchSalesData();
    fetchOverviewData();
  };

  // --- SETTINGS ---
  const saveBusinessSettings = async (updates: Partial<typeof businessSettings>, savedLabel: string) => {
    const merged = { ...businessSettings, ...updates };
    setBusinessSettings(merged);
    const { error } = await supabase.from('business_settings').update(updates).eq('id', 1);
    if (!error) {
      setSettingsSaved(savedLabel);
      setTimeout(() => setSettingsSaved(''), 2500);
    } else {
      alert('Failed to save settings. Make sure the business_settings table exists (run migration_003).');
    }
  };

  // --- TAX RATES CRUD (reference list — not yet applied automatically at checkout) ---
  const addTaxRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName.trim() || !newTaxRate) return;
    const { error } = await supabase.from('tax_rates').insert([{ name: newTaxName.trim(), rate_percent: parseFloat(newTaxRate) }]);
    if (error) {
      alert('Failed to add tax rate.');
    } else {
      setNewTaxName(''); setNewTaxRate('');
      fetchTaxRates();
    }
  };

  const deleteTaxRate = async (id: any) => {
    if (!window.confirm('Remove this tax rate?')) return;
    const { error } = await supabase.from('tax_rates').delete().eq('id', id);
    if (!error) fetchTaxRates();
  };

  // --- SURVEY HANDLERS ---
  // Manual entry: lets admin record a day's total that isn't yet in the
  // sales table (e.g. offline cash-only sales, or adjustments).
  const handleAddSurveyEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setSurveyMessage({ type: '', text: '' });
    const amount = parseFloat(surveyAmountInput);
    if (!surveyDateInput) { setSurveyMessage({ type: 'error', text: 'Pick a date.' }); return; }
    if (!amount || amount < 0) { setSurveyMessage({ type: 'error', text: 'Enter a valid amount.' }); return; }
    setSurveyRecords(prev => {
      const filtered = prev.filter(r => r.date !== surveyDateInput);
      const next = [...filtered, { date: surveyDateInput, amount: Math.round(amount) }]
        .sort((a, b) => a.date < b.date ? -1 : 1)
        .slice(-10);
      return next;
    });
    setSurveyMessage({ type: 'success', text: `Entry saved for ${surveyDateInput}.` });
    setSurveyAmountInput('');
    setSurveyChartKey(k => k + 1);
    // Advance date by 1 day for convenience
    const next = new Date(surveyDateInput);
    next.setDate(next.getDate() + 1);
    setSurveyDateInput(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`);
  };

  const handleDeleteSurveyEntry = (date: string) => {
    setSurveyRecords(prev => prev.filter(r => r.date !== date));
    setSurveyChartKey(k => k + 1);
  };

  // --- DAILY COST HANDLERS ---
  const handleAddDailyCost = async (e: React.FormEvent) => {
    e.preventDefault();
    setDailyCostMessage({ type: '', text: '' });
    const amount = parseFloat(dailyCostAmount);
    if (!dailyCostDate) { setDailyCostMessage({ type: 'error', text: 'Pick a date.' }); return; }
    if (!amount || amount <= 0) { setDailyCostMessage({ type: 'error', text: 'Enter a valid amount.' }); return; }
    if (!dailyCostNote.trim()) { setDailyCostMessage({ type: 'error', text: 'Add a short note — what was this cost for?' }); return; }

    const { error } = await supabase.from('daily_costs').insert([{
      cost_date: dailyCostDate,
      amount: Math.round(amount * 100) / 100,
      note: dailyCostNote.trim(),
    }]);

    if (error) {
      setDailyCostMessage({ type: 'error', text: 'Failed to save. Make sure migration_007 has been run.' });
      return;
    }

    setDailyCostMessage({ type: 'success', text: 'Cost recorded.' });
    setDailyCostAmount('');
    setDailyCostNote('');
    fetchDailyCosts();
  };

  const handleDeleteDailyCost = async (id: any) => {
    if (!window.confirm('Remove this cost entry?')) return;
    const { error } = await supabase.from('daily_costs').delete().eq('id', id);
    if (!error) fetchDailyCosts();
  };

  // --- REFUND FUNCTIONS ---
  const handleRefundSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundMessage({ type: '', text: '' });
    if (!refundBarcode) return;

    const { data, error } = await supabase
      .from('sales')
      .select(`*, dresses!inner ( id, name, barcode, quantity )`)
      .eq('dresses.barcode', refundBarcode)
      .eq('status', 'completed')
      .order('sold_at', { ascending: false });
    if (error || !data || data.length === 0) {
      setRefundMessage({ type: 'error', text: 'No active sales history found for this barcode.' });
      setRefundItemSales([]);
    } else {
      setRefundItemSales(data);
    }
  };

  const processRefund = async (sale: any) => {
    if (!window.confirm(`Are you sure you want to refund this purchase of ${sale.dresses.name}?`)) return;
    const { error: updateSaleError } = await supabase.from('sales').update({ status: 'refunded' }).eq('id', sale.id);
    if (updateSaleError) {
      setRefundMessage({ type: 'error', text: 'Failed to update sale status.' });
      return;
    }

    const restoredQuantity = sale.dresses.quantity + 1;
    await supabase.from('dresses').update({ quantity: restoredQuantity, status: 'available' }).eq('id', sale.dresses.id);
    setRefundMessage({ type: 'success', text: 'Refund successful! Stock levels updated.' });
    setRefundBarcode('');
    setRefundItemSales([]);
    fetchRecentInventory();
    fetchSalesData();
  };

  useEffect(() => {
    if (activeTab === 'reports' && isAuthenticated) fetchSalesData();
  }, [activeTab, fetchSalesData, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'overview' && isAuthenticated) fetchOverviewData();
  }, [activeTab, fetchOverviewData, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'purchases-requisition') fetchRequisitions();
    if (activeTab === 'purchases-order') fetchPurchaseOrders();
    if (activeTab === 'purchases-list') fetchPurchasesList();
    if (activeTab === 'purchases-return') fetchPurchaseReturns();
  }, [activeTab, isAuthenticated, fetchRequisitions, fetchPurchaseOrders, fetchPurchasesList, fetchPurchaseReturns]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'sell-order') fetchSalesOrders();
    if (activeTab === 'sell-all') fetchSalesData();
    if (activeTab === 'settings-tax') fetchTaxRates();
    if (activeTab === 'membership-list' || activeTab === 'membership-add') fetchMembers();
    if (activeTab === 'membership-settings') { fetchMembers(); fetchMembershipSettings(); }
    if (activeTab === 'survey') fetchSurveyData();
    if (activeTab === 'daily-cost') fetchDailyCosts();
  }, [activeTab, isAuthenticated, fetchSalesOrders, fetchSalesData, fetchTaxRates, fetchMembers, fetchMembershipSettings, fetchSurveyData, fetchDailyCosts]);

  const clearDateFilters = () => { setStartDate(''); setEndDate(''); };

  const filteredInventory = recentInventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(stockSearchQuery.toLowerCase());
    const matchesArchiveView = showArchived ? true : item.status !== 'archived';
    return matchesSearch && matchesArchiveView;
  });

  const priceSearchResults = recentInventory.filter(item =>
    item.status !== 'archived' &&
    (item.name.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(priceSearchQuery.toLowerCase()))
  );

  const addSaleResults = addSaleSearchQuery === '' ? [] : recentInventory.filter(item =>
    item.status !== 'archived' && item.quantity > 0 &&
    (item.name.toLowerCase().includes(addSaleSearchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(addSaleSearchQuery.toLowerCase()))
  );

  const allSalesFiltered = allSalesSearchQuery === '' ? salesRecord : salesRecord.filter(sale =>
    (sale.dresses?.name ?? '').toLowerCase().includes(allSalesSearchQuery.toLowerCase()) ||
    (sale.dresses?.barcode ?? '').toLowerCase().includes(allSalesSearchQuery.toLowerCase())
  );

  const activeStock = recentInventory.filter(item => item.status !== 'archived');
  const lowStockItems = activeStock
    .filter(item => item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity);
  const outOfStockItems = activeStock.filter(item => item.quantity === 0);

  const memberDaysLeft = (expiry: string) => {
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const filteredMembers = members.filter(m =>
    m.phone.includes(memberSearch) && (memberSearch === '' || true)
  );
  const expiringMembers = members.filter(m => {
    const days = memberDaysLeft(m.expiry_date);
    return m.status === 'active' && days >= 0 && days <= 30;
  });

  const exportLedgerCSV = () => {
    const headers = ['Date', 'Item', 'Barcode', 'Method', 'Status', 'Amount (BDT)'];
    const rows = salesRecord.map(sale => [
      new Date(sale.sold_at).toLocaleString('en-BD'),
      sale.dresses?.name ?? '',
      sale.dresses?.barcode ?? '',
      sale.transaction_id === 'BANK/CARD-SALE' ? 'bank/card' : sale.payment_method,
      sale.status,
      sale.amount_paid,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crave-abs-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Flat lookup across single items and group children for the page header
  // and for deciding which sidebar group should render expanded.
  const flatNav = NAV_GROUPS.flatMap((g: any) => (g.kind === 'group' ? g.children.map((c: any) => ({ tab: c.tab, label: c.label, group: g.label })) : [{ tab: g.tab, label: g.label, group: null }]));
  const activeNavEntry = flatNav.find(n => n.tab === activeTab);
  const activeLabel = activeNavEntry ? (activeNavEntry.group ? `${activeNavEntry.group} — ${activeNavEntry.label}` : activeNavEntry.label) : '';

  const goToTab = (tab: string, groupId: string | null = null) => {
    setActiveTab(tab);
    if (groupId) setExpandedGroup(groupId);
  };

  // Which group's children to show in the mobile sub-tab strip, based on
  // the currently active tab's prefix.
  const mobileSubGroupId =
    activeTab.startsWith('sell-') || activeTab === 'pos' || activeTab === 'refund' ? 'sell'
    : activeTab.startsWith('products-') ? 'products'
    : activeTab.startsWith('purchases-') ? 'purchases'
    : activeTab.startsWith('membership-') ? 'membership'
    : activeTab.startsWith('settings-') ? 'settings'
    : null;
  const mobileSubGroup: any = mobileSubGroupId ? NAV_GROUPS.find((g: any) => g.id === mobileSubGroupId) : null;

  // --- AUTH CHECK GATE ---
  // Avoids flashing the login screen while we ask Supabase whether a
  // session already exists (e.g. on a page refresh).
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="barcode-stripe h-6 w-28 opacity-50" />
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="login-bg flex min-h-screen items-center justify-center px-4">
        <style>{`
          .login-bg {
            background: #050505;
          }
          .glow-card-wrap {
            position: relative;
            width: 380px;
            max-width: 100%;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(0,243,255,0.15), 0 0 60px rgba(255,0,200,0.1);
          }
          .glow-card-wrap::before {
            content: '';
            position: absolute;
            width: 150%;
            height: 150%;
            top: -25%;
            left: -25%;
            background: conic-gradient(#00f3ff, #ff00c8, #00f3ff, #ff00c8, #00f3ff);
            animation: glow-spin 4s linear infinite;
            z-index: 0;
          }
          .glow-card-wrap::after {
            content: '';
            position: absolute;
            inset: 2.5px;
            background: #0f0f11;
            border-radius: 14px;
            z-index: 1;
          }
          @keyframes glow-spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .glow-card-inner {
            position: relative;
            z-index: 2;
            padding: 50px 44px 44px;
          }
          .glow-wordmark {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            color: #ffffff;
            text-align: center;
            margin-bottom: 4px;
          }
          .glow-wordmark span {
            color: #ff00c8;
            text-shadow: 0 0 12px #ff00c8;
          }
          .glow-subtitle {
            text-align: center;
            font-size: 10px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #00f3ff;
            text-shadow: 0 0 8px #00f3ff;
            margin-bottom: 36px;
            font-family: monospace;
          }
          .glow-divider {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.08);
            margin-bottom: 32px;
          }
          .glow-error {
            background: rgba(255,0,100,0.12);
            border: 1px solid rgba(255,0,100,0.3);
            color: #ff6b8a;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 16px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 20px;
          }
          .glow-label {
            display: block;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.4);
            margin-bottom: 8px;
            font-family: monospace;
          }
          .glow-input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1.5px solid rgba(255,255,255,0.2);
            color: #fff;
            font-size: 15px;
            padding: 8px 0;
            outline: none;
            transition: border-color 0.3s, box-shadow 0.3s;
            font-family: monospace;
            margin-bottom: 28px;
          }
          .glow-input:focus {
            border-bottom-color: #00f3ff;
            box-shadow: 0 4px 8px -4px #00f3ff;
          }
          .glow-input::placeholder { color: rgba(255,255,255,0.25); }
          .glow-btn {
            width: 100%;
            padding: 14px;
            background: transparent;
            color: #00f3ff;
            border: 1.5px solid #00f3ff;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.25s, box-shadow 0.25s, color 0.25s;
            margin-top: 4px;
          }
          .glow-btn:hover:not(:disabled) {
            background: #00f3ff;
            color: #050505;
            box-shadow: 0 0 24px #00f3ff, inset 0 0 12px rgba(0,243,255,0.3);
          }
          .glow-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }
          .glow-footer {
            text-align: center;
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.2);
            margin-top: 28px;
            font-family: monospace;
          }
        `}</style>

        <div className="glow-card-wrap">
          <div className="glow-card-inner">
            <div className="glow-wordmark">CRAVE <span>ABS</span></div>
            <div className="glow-subtitle">Admin Console</div>
            <hr className="glow-divider" />

            {loginError && (
              <div className="glow-error">{loginError}</div>
            )}

            <form onSubmit={handleLogin}>
              <label className="glow-label">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="glow-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
              />
              <label className="glow-label">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="glow-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={loginSubmitting}
                className="glow-btn"
              >
                {loginSubmitting ? 'Signing in…' : 'Access System'}
              </button>
            </form>

            <div className="glow-footer">{businessSettings.address}</div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-paper text-ink font-sans print:bg-white">

      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { margin: 1.6cm 1cm; }
        }
      `}</style>

      <div className="lg:flex">

        {/* ---- Sidebar (desktop) ---- */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-canvas border-r border-thread print:hidden" style={{ transition: 'background 0.25s', overflow: 'hidden', position: 'relative' }}>

          {/* ── Rain animation + Glow button styles ── */}
          <style>{`
            /* ---- RAIN ---- */
            .sb-rain {
              background: linear-gradient(to bottom, rgba(168,118,59,0) 0%, rgba(168,118,59,0.55) 100%);
              height: 48px;
              position: absolute;
              width: 1.5px;
              z-index: 0;
              pointer-events: none;
              border-radius: 1px;
            }
            @keyframes sb-fall-1  { from { top:-12%; opacity:0.45; } to { top:108%; opacity:0; } }
            @keyframes sb-fall-2  { from { top:-18%; opacity:0.35; } to { top:112%; opacity:0; } }
            @keyframes sb-fall-3  { from { top:-8%;  opacity:0.50; } to { top:104%; opacity:0; } }
            @keyframes sb-fall-4  { from { top:-20%; opacity:0.40; } to { top:115%; opacity:0; } }
            @keyframes sb-fall-5  { from { top:-15%; opacity:0.30; } to { top:110%; opacity:0; } }
            @keyframes sb-fall-6  { from { top:-10%; opacity:0.55; } to { top:106%; opacity:0; } }
            @keyframes sb-fall-7  { from { top:-22%; opacity:0.38; } to { top:116%; opacity:0; } }
            @keyframes sb-fall-8  { from { top:-6%;  opacity:0.45; } to { top:102%; opacity:0; } }
            @keyframes sb-fall-9  { from { top:-14%; opacity:0.42; } to { top:109%; opacity:0; } }
            @keyframes sb-fall-10 { from { top:-19%; opacity:0.33; } to { top:113%; opacity:0; } }
            @keyframes sb-fall-11 { from { top:-9%;  opacity:0.48; } to { top:105%; opacity:0; } }
            @keyframes sb-fall-12 { from { top:-16%; opacity:0.36; } to { top:111%; opacity:0; } }
            @keyframes sb-fall-13 { from { top:-11%; opacity:0.52; } to { top:107%; opacity:0; } }
            @keyframes sb-fall-14 { from { top:-24%; opacity:0.40; } to { top:118%; opacity:0; } }
            @keyframes sb-fall-15 { from { top:-7%;  opacity:0.44; } to { top:103%; opacity:0; } }
            @keyframes sb-fall-16 { from { top:-21%; opacity:0.37; } to { top:114%; opacity:0; } }
            @keyframes sb-fall-17 { from { top:-13%; opacity:0.46; } to { top:108%; opacity:0; } }
            @keyframes sb-fall-18 { from { top:-17%; opacity:0.32; } to { top:112%; opacity:0; } }
            .sb-rain:nth-child(1)  { left:4%;  animation:sb-fall-1  7s 0.0s infinite; }
            .sb-rain:nth-child(2)  { left:11%; animation:sb-fall-2  9s 1.5s infinite; }
            .sb-rain:nth-child(3)  { left:18%; animation:sb-fall-3  6s 0.8s infinite; }
            .sb-rain:nth-child(4)  { left:25%; animation:sb-fall-4  8s 2.2s infinite; }
            .sb-rain:nth-child(5)  { left:32%; animation:sb-fall-5  7s 0.4s infinite; }
            .sb-rain:nth-child(6)  { left:39%; animation:sb-fall-6  9s 3.1s infinite; }
            .sb-rain:nth-child(7)  { left:46%; animation:sb-fall-7  6s 1.0s infinite; }
            .sb-rain:nth-child(8)  { left:53%; animation:sb-fall-8  8s 0.2s infinite; }
            .sb-rain:nth-child(9)  { left:60%; animation:sb-fall-9  7s 2.8s infinite; }
            .sb-rain:nth-child(10) { left:67%; animation:sb-fall-10 9s 0.6s infinite; }
            .sb-rain:nth-child(11) { left:74%; animation:sb-fall-11 6s 1.8s infinite; }
            .sb-rain:nth-child(12) { left:81%; animation:sb-fall-12 8s 3.5s infinite; }
            .sb-rain:nth-child(13) { left:88%; animation:sb-fall-13 7s 0.9s infinite; }
            .sb-rain:nth-child(14) { left:7%;  animation:sb-fall-14 9s 4.2s infinite; }
            .sb-rain:nth-child(15) { left:22%; animation:sb-fall-15 6s 2.0s infinite; }
            .sb-rain:nth-child(16) { left:50%; animation:sb-fall-16 8s 1.3s infinite; }
            .sb-rain:nth-child(17) { left:70%; animation:sb-fall-17 7s 3.7s infinite; }
            .sb-rain:nth-child(18) { left:92%; animation:sb-fall-18 9s 0.5s infinite; }

            /* ---- BRAND GLOW ---- */
            @keyframes brand-glow {
              0%,100% { text-shadow: 0 0 6px rgba(168,118,59,0.6), 0 0 14px rgba(168,118,59,0.4), 0 0 28px rgba(168,118,59,0.2); }
              50%      { text-shadow: 0 0 10px rgba(196,154,74,0.9), 0 0 22px rgba(196,154,74,0.6), 0 0 40px rgba(196,154,74,0.35), 0 0 60px rgba(0,200,255,0.15); }
            }
            @keyframes bar-glow  { 0%,100% { box-shadow: 0 0 4px rgba(168,118,59,0.5), 0 0 10px rgba(168,118,59,0.3); opacity:0.75; } 50% { box-shadow: 0 0 8px rgba(196,154,74,1), 0 0 18px rgba(196,154,74,0.6), 0 0 30px rgba(0,200,255,0.2); opacity:1; } }
            @keyframes bar-dance { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.65); } }
            .brand-wordmark     { animation: brand-glow 2.4s ease-in-out infinite; }
            .brand-wordmark-abs { animation: brand-glow 2.4s ease-in-out infinite 0.3s; color: var(--color-brass); }
            .brand-bar          { animation: bar-glow 2.4s ease-in-out infinite, bar-dance 1.2s ease-in-out infinite; border-radius:2px; }
            .brand-bar:nth-child(1)  { animation-delay:0s,0s; }
            .brand-bar:nth-child(2)  { animation-delay:0.05s,0.1s; }
            .brand-bar:nth-child(3)  { animation-delay:0.1s,0.2s; }
            .brand-bar:nth-child(4)  { animation-delay:0.05s,0.05s; }
            .brand-bar:nth-child(5)  { animation-delay:0.15s,0.3s; }
            .brand-bar:nth-child(6)  { animation-delay:0.0s,0.15s; }
            .brand-bar:nth-child(7)  { animation-delay:0.1s,0.05s; }
            .brand-bar:nth-child(8)  { animation-delay:0.2s,0.25s; }
            .brand-bar:nth-child(9)  { animation-delay:0.05s,0.1s; }
            .brand-bar:nth-child(10) { animation-delay:0.15s,0.0s; }
            .brand-subtitle { animation: brand-glow 2.4s ease-in-out infinite 0.6s; color: var(--color-brass); opacity:0.8; }

            /* ---- NAV GLOW BUTTONS ---- */
            @keyframes nav-glow-pulse {
              0%,100% { box-shadow: 0 0 0px rgba(168,118,59,0); }
              50%      { box-shadow: 0 0 12px rgba(168,118,59,0.55), 0 0 24px rgba(168,118,59,0.25), inset 0 0 8px rgba(168,118,59,0.1); }
            }
            @keyframes nav-glow-active {
              0%,100% { box-shadow: 0 0 8px rgba(168,118,59,0.7), 0 0 20px rgba(168,118,59,0.4), inset 0 0 10px rgba(168,118,59,0.15); }
              50%      { box-shadow: 0 0 14px rgba(196,154,74,1), 0 0 32px rgba(196,154,74,0.5), 0 0 48px rgba(0,200,255,0.15), inset 0 0 14px rgba(196,154,74,0.2); }
            }
            /* inactive nav button — subtle glow on hover */
            .nav-btn {
              position: relative;
              z-index: 1;
              border: 1px solid transparent;
              transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
            }
            .nav-btn:hover {
              border-color: rgba(168,118,59,0.4);
              animation: nav-glow-pulse 1.8s ease-in-out infinite;
              color: var(--color-ink) !important;
              background: rgba(168,118,59,0.08) !important;
            }
            /* active single-item button — constant glow */
            .nav-btn-active {
              position: relative;
              z-index: 1;
              border: 1px solid rgba(168,118,59,0.6) !important;
              animation: nav-glow-active 2s ease-in-out infinite !important;
              background: var(--color-brass) !important;
              color: white !important;
            }
            /* active group header */
            .nav-btn-group-active {
              position: relative;
              z-index: 1;
              border: 1px solid rgba(168,118,59,0.35);
              animation: nav-glow-pulse 2s ease-in-out infinite;
            }
            /* active child item */
            .nav-child-active {
              color: var(--color-brass) !important;
              text-shadow: 0 0 8px rgba(168,118,59,0.7), 0 0 16px rgba(168,118,59,0.4);
              position: relative;
            }
            /* refund child active — oxblood glow */
            .nav-child-refund-active {
              color: var(--color-oxblood) !important;
              text-shadow: 0 0 8px rgba(224,92,92,0.7), 0 0 16px rgba(224,92,92,0.4);
            }

            /* logout glow */
            .logout-btn {
              border: 1px solid transparent;
              transition: all 0.25s;
            }
            .logout-btn:hover {
              border-color: rgba(224,92,92,0.5);
              box-shadow: 0 0 10px rgba(224,92,92,0.4), 0 0 20px rgba(224,92,92,0.2);
            }
          `}</style>

          {/* Rain drops — 18 strands positioned across the sidebar width */}
          {[...Array(18)].map((_, i) => (
            <span key={i} className="sb-rain" aria-hidden="true" />
          ))}

          {/* ── Brand header ── */}
          <div className="px-6 pt-7 pb-5 relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-end gap-[2.5px] h-7 shrink-0">
                {[3,5,2,6,3,4,6,2,5,3].map((h, i) => (
                  <div key={i} className="brand-bar w-[2.5px] bg-brass" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
              <div>
                <h1 className="font-display text-xl tracking-tight leading-none">
                  <span className="brand-wordmark text-ink">CRAVE </span>
                  <em className="brand-wordmark-abs not-italic">ABS</em>
                </h1>
                <p className="brand-subtitle text-[9px] font-mono uppercase tracking-[0.22em] mt-0.5">Admin Console</p>
              </div>
            </div>
          </div>

          {/* Glowing separator */}
          <div className="mx-5 h-px relative z-10" style={{ background: 'linear-gradient(to right, transparent, var(--color-brass), transparent)', opacity: 0.4, boxShadow: '0 0 8px rgba(168,118,59,0.5)' }} />

          {/* ── Navigation ── */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto relative z-10">
            {NAV_GROUPS.map((item: any) => {
              if (item.kind === 'single') {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.id}
                    onClick={() => goToTab(item.tab)}
                    className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                      isActive ? 'nav-btn-active' : 'text-muted'
                    }`}
                  >
                    <Icon className="w-[17px] h-[17px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              }

              const Icon = item.icon;
              const isGroupActive = item.children.some((c: any) => c.tab === activeTab);
              const isExpanded = expandedGroup === item.id || isGroupActive;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : item.id)}
                    className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                      isGroupActive ? 'nav-btn-group-active text-ink' : 'text-muted'
                    }`}
                  >
                    <Icon className="w-[17px] h-[17px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <IconChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 mb-1 ml-4 pl-4 border-l-2 border-thread/60 space-y-0.5" style={{ borderImage: 'linear-gradient(to bottom, rgba(168,118,59,0.5), rgba(168,118,59,0.1)) 1' }}>
                      {item.children.map((child: any) => {
                        const isChildActive = activeTab === child.tab;
                        const isRefund = child.tab === 'refund';
                        return (
                          <button
                            key={child.tab}
                            onClick={() => goToTab(child.tab, item.id)}
                            className={`anim-nav-child nav-btn w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-md text-[13px] font-semibold ${
                              isChildActive
                                ? isRefund ? 'nav-child-refund-active bg-oxblood-light/30' : 'nav-child-active bg-brass-light/20'
                                : 'text-muted'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                              isChildActive
                                ? isRefund ? 'bg-oxblood shadow-[0_0_6px_rgba(224,92,92,0.8)]' : 'bg-brass shadow-[0_0_6px_rgba(168,118,59,0.8)]'
                                : 'bg-transparent'
                            }`} />
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── Bottom utility strip ── */}
          <div className="px-4 pt-3 pb-5 space-y-1 border-t border-thread relative z-10">
            <button
              onClick={toggleTheme}
              className="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-muted"
            >
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 shrink-0 ${isDark ? 'bg-brass' : 'bg-thread-dark'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isDark ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              {isDark ? (
                <svg className="w-4 h-4 ml-auto text-brass shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="4.5" /><path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-auto text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="logout-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-oxblood"
            >
              <IconLogout className="w-[17px] h-[17px]" />
              Log Out
            </button>

            <p className="text-center text-[10px] font-mono text-muted/50 uppercase tracking-widest pt-2">
              CRAVE ABS v1.0
            </p>
          </div>
        </aside>

        {/* ---- Top bar (mobile / tablet) ---- */}
        <div className="lg:hidden sticky top-0 z-50 bg-canvas border-b border-thread print:hidden">
          <div className="flex items-center justify-between px-5 h-16">
            <h1 className="font-display text-xl text-ink tracking-tight">CRAVE <em className="not-italic text-brass">ABS</em></h1>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-thread text-muted hover:text-ink hover:border-thread-dark transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="4.5" />
                    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>
              <button onClick={handleLogout} className="text-[11px] font-bold uppercase tracking-wider text-oxblood">
                Log Out
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto px-2 pb-2 gap-1">
            {NAV_GROUPS.map((item: any) => {
              const Icon = item.icon;
              const isActive = item.kind === 'single' ? activeTab === item.tab : item.children.some((c: any) => c.tab === activeTab);
              return (
                <button
                  key={item.id}
                  onClick={() => (item.kind === 'single' ? goToTab(item.tab) : goToTab(item.children[0].tab, item.id))}
                  className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-ink bg-brass-light/50' : 'text-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {mobileSubGroup && (
            <div className="flex overflow-x-auto px-2 pb-2 gap-1 border-t border-thread pt-2">
              {mobileSubGroup.children.map((child: any) => (
                <button
                  key={child.tab}
                  onClick={() => setActiveTab(child.tab)}
                  className={`whitespace-nowrap px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                    activeTab === child.tab
                      ? child.tab === 'refund' ? 'text-oxblood bg-oxblood-light/40' : 'text-brass bg-brass-light/40'
                      : 'text-muted'
                  }`}
                >
                  {child.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Main content ---- */}
        <div className="lg:pl-64 flex-1 print:pl-0 relative">

          {/* ── Ambient falling dust & thread motes ── */}
          <style>{`
            /* Pinned to the viewport, but offset past the sidebar on desktop
               (lg:left-64) so it never overlaps the sidebar's own rain effect.
               On mobile the sidebar is hidden, so it spans full width there. */
            .dust-layer {
              position: fixed;
              top: 0; right: 0; bottom: 0; left: 0;
              z-index: 0;
              pointer-events: none;
              overflow: hidden;
            }
            @media (min-width: 1024px) {
              .dust-layer { left: 16rem; }
            }

            /* Round dust specks — slow drifting fall with gentle side-sway */
            .dust-mote {
              position: absolute;
              top: -5%;
              border-radius: 50%;
              background: radial-gradient(circle, var(--color-brass) 0%, transparent 75%);
              opacity: 0;
            }
            @keyframes dust-fall-a { 0% { transform: translate(0,0); opacity:0; } 8% { opacity:0.5; } 92% { opacity:0.5; } 100% { transform: translate(18px,112vh); opacity:0; } }
            @keyframes dust-fall-b { 0% { transform: translate(0,0); opacity:0; } 8% { opacity:0.4; } 92% { opacity:0.4; } 100% { transform: translate(-22px,112vh); opacity:0; } }
            @keyframes dust-fall-c { 0% { transform: translate(0,0); opacity:0; } 8% { opacity:0.55; } 92% { opacity:0.55; } 100% { transform: translate(12px,112vh); opacity:0; } }

            /* Thin fabric-thread snippets — fall with a lazy rotation,
               a nod to the .stitch motif used elsewhere in the design. */
            .dust-thread {
              position: absolute;
              top: -5%;
              width: 1px;
              background: linear-gradient(to bottom, transparent, var(--color-thread-dark) 40%, transparent);
              opacity: 0;
              transform-origin: center;
            }
            @keyframes thread-fall-a { 0% { transform: translateY(0) rotate(0deg); opacity:0; } 8% { opacity:0.45; } 92% { opacity:0.45; } 100% { transform: translateY(112vh) rotate(140deg); opacity:0; } }
            @keyframes thread-fall-b { 0% { transform: translateY(0) rotate(0deg); opacity:0; } 8% { opacity:0.35; } 92% { opacity:0.35; } 100% { transform: translateY(112vh) rotate(-160deg); opacity:0; } }

            .dust-mote:nth-of-type(1)  { left:3%;  width:5px; height:5px; animation: dust-fall-a 22s 0s   linear infinite; }
            .dust-mote:nth-of-type(2)  { left:9%;  width:3px; height:3px; animation: dust-fall-b 26s 3s   linear infinite; }
            .dust-mote:nth-of-type(3)  { left:16%; width:4px; height:4px; animation: dust-fall-c 19s 6s   linear infinite; }
            .dust-mote:nth-of-type(4)  { left:24%; width:6px; height:6px; animation: dust-fall-a 28s 1.5s linear infinite; }
            .dust-mote:nth-of-type(5)  { left:31%; width:3px; height:3px; animation: dust-fall-b 21s 8s   linear infinite; }
            .dust-mote:nth-of-type(6)  { left:39%; width:5px; height:5px; animation: dust-fall-c 25s 4s   linear infinite; }
            .dust-mote:nth-of-type(7)  { left:47%; width:4px; height:4px; animation: dust-fall-a 23s 10s  linear infinite; }
            .dust-mote:nth-of-type(8)  { left:55%; width:3px; height:3px; animation: dust-fall-b 27s 2s   linear infinite; }
            .dust-mote:nth-of-type(9)  { left:63%; width:6px; height:6px; animation: dust-fall-c 20s 7s   linear infinite; }
            .dust-mote:nth-of-type(10) { left:71%; width:4px; height:4px; animation: dust-fall-a 24s 5s   linear infinite; }
            .dust-mote:nth-of-type(11) { left:79%; width:3px; height:3px; animation: dust-fall-b 29s 11s  linear infinite; }
            .dust-mote:nth-of-type(12) { left:87%; width:5px; height:5px; animation: dust-fall-c 22s 9s   linear infinite; }
            .dust-mote:nth-of-type(13) { left:94%; width:4px; height:4px; animation: dust-fall-a 26s 13s  linear infinite; }
            .dust-mote:nth-of-type(14) { left:13%; width:3px; height:3px; animation: dust-fall-b 30s 15s  linear infinite; }
            .dust-mote:nth-of-type(15) { left:58%; width:5px; height:5px; animation: dust-fall-c 18s 12s  linear infinite; }

            .dust-thread:nth-of-type(16) { left:20%; height:22px; animation: thread-fall-a 17s 2s  linear infinite; }
            .dust-thread:nth-of-type(17) { left:44%; height:18px; animation: thread-fall-b 20s 9s  linear infinite; }
            .dust-thread:nth-of-type(18) { left:68%; height:24px; animation: thread-fall-a 16s 5s  linear infinite; }
            .dust-thread:nth-of-type(19) { left:84%; height:16px; animation: thread-fall-b 19s 14s linear infinite; }
            .dust-thread:nth-of-type(20) { left:36%; height:20px; animation: thread-fall-a 21s 7s  linear infinite; }

            @media (prefers-reduced-motion: reduce) {
              .dust-mote, .dust-thread { animation: none !important; opacity: 0 !important; }
            }
          `}</style>
          <div className="dust-layer print:hidden" aria-hidden="true">
            {[...Array(15)].map((_, i) => <span key={`mote-${i}`} className="dust-mote" />)}
            {[...Array(5)].map((_, i) => <span key={`thread-${i}`} className="dust-thread" />)}
          </div>

          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 pb-16 print:p-0 relative z-10">

            <div className="hidden lg:flex items-baseline justify-between mb-8 print:hidden">
              <h2 className="font-display text-2xl text-ink">{activeLabel}</h2>
              <p className="text-xs font-mono text-muted uppercase tracking-wider">
                {new Date().toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* key forces remount on tab switch → triggers .tab-enter animation */}
            <div key={activeTab} className="tab-enter">

            {/* TAB 0: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(() => {
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                    const todaysCostTotal = dailyCosts
                      .filter((c: any) => c.cost_date === todayStr)
                      .reduce((s: number, c: any) => s + Number(c.amount), 0);
                    const todayNet = todayRevenue - todaysCostTotal;
                    return (
                      <div className="anim-card bg-ink p-7 text-paper relative overflow-hidden card-lift">
                        <div className="barcode-stripe absolute top-0 right-0 h-full w-20 opacity-[0.06]" style={{ filter: 'invert(1)' }} />
                        <p className="text-xs font-bold uppercase tracking-wider text-thread mb-2">Today&rsquo;s Net</p>
                        <p className="font-mono text-3xl sm:text-4xl font-bold tracking-tight">৳{todayNet.toLocaleString()}</p>
                        {todaysCostTotal > 0 && (
                          <p className="text-[11px] text-thread/70 mt-2 font-mono">
                            ৳{todayRevenue.toLocaleString()} revenue − ৳{todaysCostTotal.toLocaleString()} cost
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <div className="bg-canvas p-7 border border-thread">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Items Sold Today</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-mono text-3xl sm:text-4xl font-bold text-ink">{todayItemsSold}</p>
                      <p className="text-sm font-bold text-muted">pieces</p>
                    </div>
                  </div>
                  <button
                    onClick={() => goToTab('products-list', 'products')}
                    className={`text-left p-7 border transition-colors ${lowStockItems.length > 0 ? 'bg-oxblood-light/50 border-oxblood/30 hover:bg-oxblood-light' : 'bg-canvas border-thread hover:border-thread-dark'}`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${lowStockItems.length > 0 ? 'text-oxblood' : 'text-muted'}`}>Low Stock Alerts</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`font-mono text-3xl sm:text-4xl font-bold ${lowStockItems.length > 0 ? 'text-oxblood' : 'text-ink'}`}>{lowStockItems.length}</p>
                      <p className="text-sm font-bold text-muted">{outOfStockItems.length} out of stock</p>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-canvas border border-thread">
                    <div className="flex items-center justify-between px-7 pt-6 pb-5">
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <IconAlertTriangle className="w-4 h-4 text-oxblood" />
                        Needs Restocking
                      </h3>
                      <button onClick={() => goToTab('products-list', 'products')} className="text-xs font-bold text-brass hover:text-brass-dark uppercase tracking-wide">Manage Stock</button>
                    </div>
                    <div className="stitch mx-7 mb-1" />
                    {lowStockItems.length === 0 ? (
                      <p className="px-7 py-8 text-sm text-muted text-center">All active items are comfortably stocked.</p>
                    ) : (
                      <div className="px-7 divide-y divide-thread">
                        {lowStockItems.slice(0, 6).map(item => (
                          <div key={item.id} className="py-3.5 flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted font-mono">{item.barcode}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wide bg-oxblood-light text-oxblood shrink-0">
                              {item.quantity} left
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pb-6" />
                  </div>

                  <div className="bg-canvas border border-thread">
                    <div className="px-7 pt-6 pb-5">
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <IconTrendingUp className="w-4 h-4 text-brass" />
                        Top Sellers (All Time)
                      </h3>
                    </div>
                    <div className="stitch mx-7 mb-1" />
                    {overviewLoading ? (
                      <p className="px-7 py-8 text-sm text-muted text-center">Loading…</p>
                    ) : topSellers.length === 0 ? (
                      <p className="px-7 py-8 text-sm text-muted text-center">No completed sales yet.</p>
                    ) : (
                      <div className="px-7 divide-y divide-thread">
                        {topSellers.map((item, i) => (
                          <div key={item.barcode + i} className="py-3.5 flex justify-between items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs font-bold text-thread-dark w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                              <div className="min-w-0">
                                <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted font-mono">{item.unitsSold} sold</p>
                              </div>
                            </div>
                            <p className="font-mono text-sm font-bold text-ink shrink-0">৳{item.revenue.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pb-6" />
                  </div>
                </div>

                <div className="bg-canvas border border-thread">
                  <div className="flex items-center justify-between px-7 pt-6 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconClock className="w-4 h-4 text-brass" />
                      Recent Activity
                    </h3>
                    <button onClick={() => setActiveTab('reports')} className="text-xs font-bold text-brass hover:text-brass-dark uppercase tracking-wide">Full Ledger</button>
                  </div>
                  <div className="stitch mx-7 mb-1" />
                  {salesRecord.length === 0 ? (
                    <p className="px-7 py-8 text-sm text-muted text-center">No transactions recorded yet.</p>
                  ) : (
                    <div className="px-7 divide-y divide-thread">
                      {salesRecord.slice(0, 6).map(sale => (
                        <div key={sale.id} className="py-3.5 flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <p className={`font-bold text-sm truncate ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{sale.dresses?.name}</p>
                            <p className="text-xs text-muted font-mono">{new Date(sale.sold_at).toLocaleString('en-BD')}</p>
                          </div>
                          <p className={`font-mono text-sm font-bold shrink-0 ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>৳{sale.amount_paid}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pb-6" />
                </div>
              </div>
            )}

            {/* TAB 1: POS TERMINAL */}
            {activeTab === 'pos' && (
              <div className="max-w-2xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7">
                    {posMessage.text && (
                      <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${posMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>
                        {posMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleBarcodeSubmit} className="mb-7 relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                        <IconScan className="h-5 w-5" />
                      </div>
                      <input
                        type="text" autoFocus
                        placeholder="Scan barcode to add to cart..."
                        className="w-full pl-12 pr-4 py-4 bg-paper border border-thread text-lg font-mono text-ink focus:bg-canvas focus:border-brass transition-colors outline-none placeholder-muted tracking-wider"
                        value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                      />
                    </form>
                  </div>

                  {cart.length === 0 ? (
                    <div className="px-7 pb-12 pt-2 text-center">
                      <IconBag className="w-9 h-9 mx-auto text-thread-dark mb-3" />
                      <p className="text-sm text-muted">Cart is empty — scan an item to begin a sale.</p>
                    </div>
                  ) : (
                    <div className="px-7 pb-7">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Current Sale</p>

                      <div className="border border-thread divide-y divide-dashed divide-thread-dark mb-6">
                        {cart.map((item) => (
                          <div key={item.id} className="anim-cart-item flex justify-between items-center gap-4 p-4 bg-paper-dim/40">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted mt-0.5 font-mono">৳{item.price} · {item.quantity} in stock</p>
                            </div>

                            <div className="flex items-center bg-canvas border border-thread">
                              <button type="button" onClick={() => updateCartItemQuantity(item.id, false)} className="w-7 h-8 text-ink font-bold hover:bg-paper-dim transition-colors">-</button>
                              <span className="px-3 font-mono font-bold text-sm text-ink">{item.cartQty}</span>
                              <button type="button" onClick={() => updateCartItemQuantity(item.id, true)} className="w-7 h-8 text-ink font-bold hover:bg-paper-dim transition-colors">+</button>
                            </div>

                            <p className="font-mono font-bold text-ink text-sm min-w-[64px] text-right">৳{item.price * item.cartQty}</p>

                            <button onClick={() => removeFromCart(item.id)} className="text-oxblood text-xs font-bold hover:underline shrink-0">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2.5 mb-6 pb-6 border-b border-thread">
                        <div className="flex justify-between items-center text-sm">
                          <p className="font-semibold text-muted">Subtotal</p>
                          <p className="font-mono font-semibold text-ink">৳{cartSubtotal}</p>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <label className="font-semibold text-muted text-sm shrink-0">Discount (৳)</label>
                          <input
                            type="number"
                            min="0"
                            max={cartSubtotal}
                            className="w-28 px-3 py-1.5 bg-brass-light/30 border border-brass/30 focus:border-brass focus:bg-canvas outline-none text-ink font-mono font-bold text-right transition-colors"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <label className="font-semibold text-muted text-sm shrink-0">Tax</label>
                          <select
                            value={selectedTaxRateId}
                            onChange={(e) => setSelectedTaxRateId(e.target.value)}
                            className="px-3 py-1.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink text-sm transition-colors cursor-pointer"
                          >
                            <option value="">No Tax</option>
                            {taxRates.map((t: any) => (
                              <option key={t.id} value={t.id}>{t.name} ({t.rate_percent}%)</option>
                            ))}
                          </select>
                        </div>
                        {cartTaxValue > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <p className="font-semibold text-muted">Tax Amount</p>
                            <p className="font-mono font-semibold text-ink">৳{cartTaxValue}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-baseline mb-6">
                        <p className="text-sm font-bold text-muted uppercase tracking-wider">Total Due</p>
                        <p className="font-mono text-3xl font-bold text-ink">৳{cartTotal}</p>
                      </div>

                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Payment Method</p>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            className={`py-2.5 text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                              paymentMethod === method
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-canvas text-ink border-thread hover:border-thread-dark'
                            }`}
                            onClick={() => setPaymentMethod(method as any)}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && (
                        <div className="mb-6">
                          <input type="text" placeholder="Mobile banking TrxID" className="w-full px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                        </div>
                      )}

                      <button onClick={handleCheckout} className="btn-shimmer btn-float w-full bg-moss text-white py-4 font-bold text-sm uppercase tracking-wider hover:bg-moss/90 transition-colors flex items-center justify-center gap-2">
                        <IconReceipt className="w-5 h-5" />
                        Complete Sale & Print
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRODUCTS: LIST PRODUCTS */}
            {activeTab === 'products-list' && (
               <div className="print:hidden">
                  <div className="bg-canvas border border-thread">
                    <div className="flex items-center justify-between px-7 pt-7 mb-5 gap-4">
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <IconCrate className="w-4 h-4 text-brass" />
                        Active Stock Database
                      </h3>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-muted text-xs font-mono font-bold hidden sm:inline">{recentInventory.length} ITEMS</span>
                        <button onClick={() => goToTab('products-add', 'products')} className="bg-ink text-paper px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5">
                          <IconPlus className="w-3.5 h-3.5" /> Add Product
                        </button>
                      </div>
                    </div>

                    <div className="relative px-7 mb-4">
                      <div className="absolute inset-y-0 left-7 pl-3 flex items-center pointer-events-none text-muted">
                        <IconSearch className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by title or barcode..."
                        className="w-full pl-10 pr-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                      />
                    </div>

                    <label className="flex items-center gap-2 px-7 mb-5 text-[11px] font-bold text-muted uppercase tracking-wide cursor-pointer select-none w-fit">
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="accent-brass w-3.5 h-3.5"
                      />
                      Show archived items
                    </label>

                    <div className="stitch mx-7 mb-1" />

                    <div className="px-7 py-2 divide-y divide-thread">
                      {filteredInventory.length === 0 ? (
                        <div className="text-center py-12 text-muted">
                          <IconArchive className="mx-auto h-9 w-9 mb-3 text-thread-dark" />
                          <p className="text-sm font-medium">No items found matching your search.</p>
                        </div>
                      ) : (
                        filteredInventory.map(item => {
                          const isEditing = editingId === item.id;
                          const isArchived = item.status === 'archived';
                          const isLow = !isArchived && item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD;
                          const categoryOptions = categories.length > 0 ? categories.map((c: any) => c.name) : FALLBACK_CATEGORIES;

                          return (
                            <div key={item.id} className={`py-4 ${isArchived ? 'opacity-50' : ''}`}>
                              {isEditing ? (
                                <div className="space-y-2.5 max-w-xl">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      value={editDraft.name}
                                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                                      placeholder="Item title"
                                      className="px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink transition-colors"
                                    />
                                    <select
                                      value={editDraft.category}
                                      onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                                      className="px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink transition-colors"
                                    >
                                      {categoryOptions.map((name: string) => (
                                        <option key={name} value={name}>{name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={editDraft.brand}
                                      onChange={(e) => setEditDraft({ ...editDraft, brand: e.target.value })}
                                      className="px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink transition-colors"
                                    >
                                      <option value="">No brand</option>
                                      {brands.map((b: any) => (
                                        <option key={b.id} value={b.name}>{b.name}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={editDraft.unit}
                                      onChange={(e) => setEditDraft({ ...editDraft, unit: e.target.value })}
                                      className="px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink transition-colors"
                                    >
                                      <option value="Piece">Piece</option>
                                      {units.filter((u: any) => u.name !== 'Piece').map((u: any) => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      value={editDraft.price}
                                      onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                                      placeholder="Price"
                                      className="px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink font-mono transition-colors"
                                    />
                                    <input
                                      type="number"
                                      value={editDraft.quantity}
                                      onChange={(e) => setEditDraft({ ...editDraft, quantity: e.target.value })}
                                      placeholder="Quantity"
                                      className="px-3 py-2 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-sm text-ink font-mono font-bold transition-colors"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-0.5">
                                    <button onClick={() => saveEditInventory(item.id)} className="flex-1 bg-ink text-paper text-[11px] font-bold uppercase tracking-wide py-2 hover:bg-brass-dark transition-colors">
                                      Save Changes
                                    </button>
                                    <button onClick={cancelEditInventory} className="flex-1 border border-thread text-ink text-[11px] font-bold uppercase tracking-wide py-2 hover:border-thread-dark transition-colors">
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                  <div className="min-w-0">
                                    <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className="text-xs text-muted font-mono">{item.barcode}</span>
                                      <span className="text-xs text-thread-dark">·</span>
                                      <span className="text-xs text-muted">{item.category}</span>
                                      {item.brand && (<><span className="text-xs text-thread-dark">·</span><span className="text-xs text-muted">{item.brand}</span></>)}
                                      <span className="text-xs text-thread-dark">·</span>
                                      <span className="text-xs text-muted">{item.unit || 'Piece'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                      <p className="font-mono font-bold text-ink text-sm">৳{item.price}</p>
                                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wide ${
                                        isArchived ? 'bg-paper-dim text-muted'
                                        : isLow || item.quantity === 0 ? 'bg-oxblood-light text-oxblood'
                                        : 'bg-moss-light text-moss'
                                      }`}>
                                        {isArchived ? 'archived' : `${item.quantity} in stock`}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      {isArchived ? (
                                        <button onClick={() => restoreInventoryItem(item)} title="Restore item" className="w-7 h-7 flex items-center justify-center border border-thread text-moss hover:border-moss transition-colors">
                                          <IconUndo className="w-3.5 h-3.5" />
                                        </button>
                                      ) : (
                                        <>
                                          <button onClick={() => startEditInventory(item)} title="Edit item" className="w-7 h-7 flex items-center justify-center border border-thread text-ink hover:border-brass hover:text-brass transition-colors">
                                            <IconPencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => archiveInventoryItem(item)} title="Archive item" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                                            <IconArchive className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="pb-7" />
                  </div>
               </div>
            )}

            {/* PRODUCTS: ADD PRODUCT */}
            {activeTab === 'products-add' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-6 text-ink flex items-center gap-2">
                    <IconPlus className="w-4 h-4 text-brass" />
                    Add Product
                  </h3>

                  {invMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${invMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{invMessage.text}</div>}

                  <form onSubmit={handleAddInventory} className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Barcode Tag</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Scan or type..." value={invBarcode} onChange={(e) => setInvBarcode(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Item Title</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="e.g., Premium Cotton Panjabi" value={invName} onChange={(e) => setInvName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Category</label>
                      <div className="relative">
                        <select required className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink appearance-none transition-colors cursor-pointer" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                          <option value="" disabled>Select a category...</option>
                          {(categories.length > 0 ? categories.map((c: any) => c.name) : FALLBACK_CATEGORIES).map((name: string) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                          <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                      {categories.length === 0 && (
                        <p className="text-xs text-muted mt-2">
                          Showing default categories. <button type="button" onClick={() => goToTab('products-categories', 'products')} className="text-brass font-bold hover:text-brass-dark">Manage your own list →</button>
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Brand</label>
                        <select className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink appearance-none transition-colors cursor-pointer" value={invBrand} onChange={(e) => setInvBrand(e.target.value)}>
                          <option value="">No brand</option>
                          {brands.map((b: any) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Unit</label>
                        <select className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink appearance-none transition-colors cursor-pointer" value={invUnit} onChange={(e) => setInvUnit(e.target.value)}>
                          <option value="Piece">Piece</option>
                          {units.filter((u: any) => u.name !== 'Piece').map((u: any) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Unit Price (৳)</label>
                        <input required type="number" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" placeholder="1500" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Bundle Qty</label>
                        <input required type="number" min="1" className="w-full px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" placeholder="Pieces" value={invQuantity} onChange={(e) => setInvQuantity(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="btn-shimmer w-full mt-2 bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                      Save to Database
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* PRODUCTS: UPDATE PRICE */}
            {activeTab === 'products-price' && (
              <div className="max-w-2xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconTag className="w-4 h-4 text-brass" />
                      Update Price
                    </h3>
                    <p className="text-sm text-muted mt-1">Search a product to adjust just its price, without opening the full editor.</p>
                  </div>
                  <div className="relative px-7 mb-5">
                    <div className="absolute inset-y-0 left-7 pl-3 flex items-center pointer-events-none text-muted">
                      <IconSearch className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by title or barcode..."
                      className="w-full pl-10 pr-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                      value={priceSearchQuery}
                      onChange={(e) => setPriceSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread max-h-[560px] overflow-y-auto">
                    {priceSearchQuery === '' ? (
                      <p className="text-center py-12 text-sm text-muted">Start typing to find a product.</p>
                    ) : priceSearchResults.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No matching products.</p>
                    ) : (
                      priceSearchResults.map(item => {
                        const isEditing = priceDraftId === item.id;
                        return (
                          <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted font-mono mt-0.5">{item.barcode}</p>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-muted text-sm">৳</span>
                                <input
                                  type="number"
                                  autoFocus
                                  value={priceDraftValue}
                                  onChange={(e) => setPriceDraftValue(e.target.value)}
                                  className="w-24 px-2 py-1.5 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-sm text-ink font-mono font-bold text-right transition-colors"
                                />
                                <button onClick={() => saveQuickPrice(item.id)} className="bg-ink text-paper px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-brass-dark transition-colors">Save</button>
                                <button onClick={() => { setPriceDraftId(null); setPriceDraftValue(''); }} className="border border-thread text-ink px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:border-thread-dark transition-colors">Cancel</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setPriceDraftId(item.id); setPriceDraftValue(String(item.price)); }}
                                className="flex items-center gap-2 font-mono font-bold text-ink text-base shrink-0 hover:text-brass transition-colors"
                              >
                                ৳{item.price}
                                <IconPencil className="w-3.5 h-3.5 text-muted" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* PRODUCTS: CATEGORIES */}
            {activeTab === 'products-categories' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconTag className="w-4 h-4 text-brass" />
                      Categories
                    </h3>
                    <p className="text-sm text-muted mt-1">Manage the category list offered when adding or editing a product.</p>
                  </div>
                  <form onSubmit={addCategory} className="px-7 mb-5 flex gap-2">
                    <input
                      type="text"
                      placeholder="New category name..."
                      className="flex-1 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="submit" className="bg-ink text-paper px-5 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {categories.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No categories yet — built-in defaults are used until you add your own.</p>
                    ) : (
                      categories.map((c: any) => (
                        <div key={c.id} className="py-3 flex items-center justify-between">
                          <span className="font-semibold text-ink text-sm">{c.name}</span>
                          <button onClick={() => deleteCategory(c.id, c.name)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* PRODUCTS: UNITS */}
            {activeTab === 'products-units' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconRuler className="w-4 h-4 text-brass" />
                      Units
                    </h3>
                    <p className="text-sm text-muted mt-1">Units of measurement offered on the product form (Piece, Set, Yard, etc).</p>
                  </div>
                  <form onSubmit={addUnit} className="px-7 mb-5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Unit name, e.g. Set"
                      className="flex-1 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Code, e.g. set"
                      className="w-28 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                      value={newUnitCode}
                      onChange={(e) => setNewUnitCode(e.target.value)}
                    />
                    <button type="submit" className="bg-ink text-paper px-5 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5 shrink-0">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {units.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No units yet.</p>
                    ) : (
                      units.map((u: any) => (
                        <div key={u.id} className="py-3 flex items-center justify-between">
                          <span className="font-semibold text-ink text-sm">{u.name}{u.short_code ? <span className="text-muted font-mono text-xs ml-2">({u.short_code})</span> : null}</span>
                          <button onClick={() => deleteUnit(u.id)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* PRODUCTS: BRANDS */}
            {activeTab === 'products-brands' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconBookmark className="w-4 h-4 text-brass" />
                      Brands
                    </h3>
                    <p className="text-sm text-muted mt-1">Brand list offered on the product form. Leave a product's brand blank if it doesn't apply.</p>
                  </div>
                  <form onSubmit={addBrand} className="px-7 mb-5 flex gap-2">
                    <input
                      type="text"
                      placeholder="New brand name..."
                      className="flex-1 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                    />
                    <button type="submit" className="bg-ink text-paper px-5 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {brands.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No brands yet.</p>
                    ) : (
                      brands.map((b: any) => (
                        <div key={b.id} className="py-3 flex items-center justify-between">
                          <span className="font-semibold text-ink text-sm">{b.name}</span>
                          <button onClick={() => deleteBrand(b.id)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* PURCHASES: REQUISITION */}
            {activeTab === 'purchases-requisition' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                <div className="lg:col-span-5">
                  <div className="bg-canvas p-7 border border-thread">
                    <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                      <IconClipboard className="w-4 h-4 text-brass" />
                      New Requisition
                    </h3>
                    <p className="text-sm text-muted mb-6">Log what you need to reorder before placing an actual order.</p>
                    {reqMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${reqMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{reqMessage.text}</div>}
                    <form onSubmit={handleAddRequisition} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Item Needed</label>
                        <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="e.g., Cotton Panjabi - Medium" value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Quantity Needed</label>
                          <input required type="number" min="1" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={reqQuantity} onChange={(e) => setReqQuantity(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Preferred Supplier</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="Optional" value={reqSupplier} onChange={(e) => setReqSupplier(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Notes</label>
                        <textarea rows={2} className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors resize-none" placeholder="Optional" value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="btn-shimmer w-full bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                        Log Requisition
                      </button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <div className="bg-canvas border border-thread h-full flex flex-col">
                    <div className="flex items-center justify-between px-7 pt-7 mb-5">
                      <h3 className="text-base font-bold text-ink">Requisition List</h3>
                      <span className="text-muted text-xs font-mono font-bold">{requisitions.length} LOGGED</span>
                    </div>
                    <div className="stitch mx-7 mb-1" />
                    <div className="px-7 py-2 divide-y divide-thread overflow-y-auto max-h-[560px]">
                      {requisitions.length === 0 ? (
                        <p className="text-center py-12 text-sm text-muted">No requisitions logged yet.</p>
                      ) : (
                        requisitions.map((r: any) => (
                          <div key={r.id} className="py-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{r.item_description}</p>
                              <p className="text-xs text-muted mt-0.5">
                                {r.quantity_needed} needed{r.preferred_supplier ? ` · ${r.preferred_supplier}` : ''}
                              </p>
                            </div>
                            <select
                              value={r.status}
                              onChange={(e) => updateRequisitionStatus(r.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-0 outline-none cursor-pointer shrink-0 ${
                                r.status === 'fulfilled' ? 'bg-moss-light text-moss'
                                : r.status === 'ordered' ? 'bg-brass-light text-brass-dark'
                                : 'bg-paper-dim text-muted'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="ordered">Ordered</option>
                              <option value="fulfilled">Fulfilled</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="pb-7" />
                  </div>
                </div>
              </div>
            )}

            {/* PURCHASES: PURCHASE ORDER */}
            {activeTab === 'purchases-order' && (
              <div className="space-y-6 print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconFileText className="w-4 h-4 text-brass" />
                    New Purchase Order
                  </h3>
                  <p className="text-sm text-muted mb-6">Place an order with a supplier. Stock updates later, once it's received under Add Purchase.</p>
                  {poMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${poMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{poMessage.text}</div>}
                  <form onSubmit={handleCreatePurchaseOrder} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Supplier Name</label>
                        <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" value={poSupplierName} onChange={(e) => setPoSupplierName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Supplier Phone</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Optional" value={poSupplierPhone} onChange={(e) => setPoSupplierPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Expected Date</label>
                        <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={poExpectedDate} onChange={(e) => setPoExpectedDate(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Line Items</label>
                      <div className="space-y-2">
                        {poLineItems.map((li, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Item description"
                              className="flex-1 px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink transition-colors"
                              value={li.description}
                              onChange={(e) => updatePoLineItem(i, 'description', e.target.value)}
                            />
                            <input
                              type="number"
                              placeholder="Qty"
                              className="w-20 px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink font-mono transition-colors"
                              value={li.quantity}
                              onChange={(e) => updatePoLineItem(i, 'quantity', e.target.value)}
                            />
                            <input
                              type="number"
                              placeholder="Unit Cost"
                              className="w-28 px-3 py-2 bg-paper border border-thread focus:border-brass outline-none text-sm text-ink font-mono transition-colors"
                              value={li.unitCost}
                              onChange={(e) => updatePoLineItem(i, 'unitCost', e.target.value)}
                            />
                            <button type="button" onClick={() => removePoLineItem(i)} disabled={poLineItems.length === 1} className="w-9 h-9 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addPoLineItem} className="mt-3 text-xs font-bold text-brass hover:text-brass-dark uppercase tracking-wide flex items-center gap-1.5">
                        <IconPlus className="w-3.5 h-3.5" /> Add Line Item
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Notes</label>
                      <textarea rows={2} className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors resize-none" placeholder="Optional" value={poNotes} onChange={(e) => setPoNotes(e.target.value)} />
                    </div>

                    <button type="submit" className="bg-ink text-paper px-7 py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                      Create Purchase Order
                    </button>
                  </form>
                </div>

                <div className="bg-canvas border border-thread">
                  <div className="flex items-center justify-between px-7 pt-7 mb-5">
                    <h3 className="text-base font-bold text-ink">Purchase Orders</h3>
                    <span className="text-muted text-xs font-mono font-bold">{purchaseOrders.length} ORDERS</span>
                  </div>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {purchaseOrders.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No purchase orders yet.</p>
                    ) : (
                      purchaseOrders.map((po: any) => (
                        <div key={po.id} className="py-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm">{po.supplier_name}</p>
                              <p className="text-xs text-muted font-mono mt-0.5">
                                {new Date(po.created_at).toLocaleDateString('en-BD')}{po.expected_date ? ` · expected ${new Date(po.expected_date).toLocaleDateString('en-BD')}` : ''}
                              </p>
                            </div>
                            <select
                              value={po.status}
                              onChange={(e) => updatePurchaseOrderStatus(po.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-0 outline-none cursor-pointer shrink-0 ${
                                po.status === 'received' ? 'bg-moss-light text-moss'
                                : po.status === 'cancelled' ? 'bg-oxblood-light text-oxblood'
                                : 'bg-brass-light text-brass-dark'
                              }`}
                            >
                              <option value="ordered">Ordered</option>
                              <option value="received">Received</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(po.purchase_order_items || []).map((it: any) => (
                              <span key={it.id} className="text-[11px] bg-paper-dim text-ink px-2 py-1 font-mono">
                                {it.item_description} ×{it.quantity_ordered} @৳{it.unit_cost}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* PURCHASES: LIST PURCHASES */}
            {activeTab === 'purchases-list' && (
              <div className="print:hidden">
                <div className="bg-canvas border border-thread overflow-hidden">
                  <div className="flex items-center justify-between p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Purchase History</h3>
                    <button onClick={() => goToTab('purchases-add', 'purchases')} className="bg-ink text-paper px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5">
                      <IconPlus className="w-3.5 h-3.5" /> Add Purchase
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread">
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Item</th>
                          <th className="p-4 font-bold">Supplier</th>
                          <th className="p-4 font-bold text-right">Qty</th>
                          <th className="p-4 font-bold text-right">Unit Cost</th>
                          <th className="p-4 font-bold text-right">Total</th>
                          <th className="p-4 font-bold">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {purchasesList.length === 0 && (
                          <tr><td colSpan={7} className="p-8 text-center text-muted font-medium">No purchases recorded yet.</td></tr>
                        )}
                        {purchasesList.map((p: any) => (
                          <tr key={p.id}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(p.purchased_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className="text-sm font-bold text-ink">{p.item_name}</p>
                              <span className="text-xs font-mono text-muted">{p.barcode}</span>
                            </td>
                            <td className="p-4 text-sm text-muted">{p.supplier_name || '—'}</td>
                            <td className="p-4 text-sm font-mono text-right text-ink">{p.quantity}</td>
                            <td className="p-4 text-sm font-mono text-right text-ink">৳{p.unit_cost}</td>
                            <td className="p-4 text-sm font-mono font-bold text-right text-ink">৳{p.total_cost}</td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${
                                p.payment_status === 'paid' ? 'bg-moss-light text-moss'
                                : p.payment_status === 'due' ? 'bg-oxblood-light text-oxblood'
                                : 'bg-brass-light text-brass-dark'
                              }`}>
                                {p.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PURCHASES: ADD PURCHASE (the action that moves stock) */}
            {activeTab === 'purchases-add' && (
              <div className="max-w-2xl print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconTruck className="w-4 h-4 text-brass" />
                    Add Purchase (Goods Received)
                  </h3>
                  <p className="text-sm text-muted mb-6">Recording a purchase here adds stock directly to that product's quantity.</p>

                  {purchaseMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${purchaseMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{purchaseMessage.text}</div>}

                  <form onSubmit={handlePurchaseBarcodeSearch} className="flex gap-2 mb-6">
                    <input type="text" placeholder="Scan or type product barcode..." className="flex-1 px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" value={purchaseBarcode} onChange={(e) => setPurchaseBarcode(e.target.value)} />
                    <button type="submit" className="bg-ink text-paper px-6 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">Find</button>
                  </form>

                  {purchaseMatch && (
                    <div className="space-y-5">
                      <div className="bg-paper-dim p-4 border border-thread flex items-center justify-between">
                        <div>
                          <p className="font-bold text-ink text-sm">{purchaseMatch.name}</p>
                          <p className="text-xs text-muted font-mono mt-0.5">{purchaseMatch.barcode} · currently {purchaseMatch.quantity} in stock</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Quantity Received</label>
                          <input type="number" min="1" className="w-full px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Unit Cost (৳)</label>
                          <input type="number" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={purchaseUnitCost} onChange={(e) => setPurchaseUnitCost(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Supplier Name</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="Optional" value={purchaseSupplierName} onChange={(e) => setPurchaseSupplierName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Supplier Phone</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Optional" value={purchaseSupplierPhone} onChange={(e) => setPurchaseSupplierPhone(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Payment Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['paid', 'due', 'partial'] as const).map((s) => (
                            <button key={s} type="button" onClick={() => setPurchasePaymentStatus(s)} className={`py-2.5 text-[11px] font-bold uppercase tracking-wider border transition-colors ${purchasePaymentStatus === s ? 'bg-ink text-paper border-ink' : 'bg-canvas text-ink border-thread hover:border-thread-dark'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={handleRecordPurchase} className="btn-shimmer w-full bg-moss text-white py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-moss/90 transition-colors">
                        Record Purchase & Update Stock
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PURCHASES: LIST PURCHASE RETURN */}
            {activeTab === 'purchases-return' && (
              <div className="space-y-6 print:hidden">
                <div className="bg-canvas p-7 border border-oxblood/20">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconUndo className="w-4 h-4 text-oxblood" />
                    Return to Supplier
                  </h3>
                  <p className="text-sm text-muted mb-6">Sending stock back to a supplier removes it from your active inventory.</p>

                  {returnMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${returnMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{returnMessage.text}</div>}

                  <form onSubmit={handleReturnBarcodeSearch} className="flex gap-2 mb-6">
                    <input type="text" placeholder="Scan or type product barcode..." className="flex-1 px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-oxblood outline-none text-ink font-mono transition-colors" value={returnBarcode} onChange={(e) => setReturnBarcode(e.target.value)} />
                    <button type="submit" className="bg-oxblood text-white px-6 font-bold text-sm uppercase tracking-wider hover:bg-oxblood/90 transition-colors">Find</button>
                  </form>

                  {returnMatch && (
                    <div className="space-y-5">
                      <div className="bg-paper-dim p-4 border border-thread flex items-center justify-between">
                        <div>
                          <p className="font-bold text-ink text-sm">{returnMatch.name}</p>
                          <p className="text-xs text-muted font-mono mt-0.5">{returnMatch.barcode} · currently {returnMatch.quantity} in stock</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Quantity to Return</label>
                          <input type="number" min="1" max={returnMatch.quantity} className="w-full px-4 py-2.5 bg-oxblood-light/40 border border-oxblood/30 focus:border-oxblood outline-none text-ink font-mono font-bold transition-colors" value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Supplier Name</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="Optional" value={returnSupplierName} onChange={(e) => setReturnSupplierName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Reason</label>
                        <textarea rows={2} className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors resize-none" placeholder="e.g., defective stitching, wrong size shipped" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
                      </div>
                      <button onClick={handleRecordReturn} className="w-full bg-oxblood text-white py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-oxblood/90 transition-colors">
                        Log Return & Adjust Stock
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-canvas border border-thread overflow-hidden">
                  <div className="p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Return History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread">
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Item</th>
                          <th className="p-4 font-bold">Supplier</th>
                          <th className="p-4 font-bold text-right">Qty</th>
                          <th className="p-4 font-bold">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {purchaseReturns.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-muted font-medium">No returns logged yet.</td></tr>
                        )}
                        {purchaseReturns.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(r.returned_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className="text-sm font-bold text-ink">{r.item_name}</p>
                              <span className="text-xs font-mono text-muted">{r.barcode}</span>
                            </td>
                            <td className="p-4 text-sm text-muted">{r.supplier_name || '—'}</td>
                            <td className="p-4 text-sm font-mono text-right text-ink">{r.quantity}</td>
                            <td className="p-4 text-sm text-muted">{r.reason || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SELL: SALES ORDER */}
            {activeTab === 'sell-order' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                <div className="lg:col-span-5">
                  <div className="bg-canvas p-7 border border-thread">
                    <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                      <IconCalendar className="w-4 h-4 text-brass" />
                      New Sales Order
                    </h3>
                    <p className="text-sm text-muted mb-6">Log a customer pre-order to fulfill later — no stock is deducted until you ring it up at the till.</p>
                    {soMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${soMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{soMessage.text}</div>}
                    <form onSubmit={handleAddSalesOrder} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Customer Name</label>
                          <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" value={soCustomerName} onChange={(e) => setSoCustomerName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Customer Phone</label>
                          <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Optional" value={soCustomerPhone} onChange={(e) => setSoCustomerPhone(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Item Wanted</label>
                        <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="e.g., Maroon Panjabi - Large" value={soItemDescription} onChange={(e) => setSoItemDescription(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Quantity</label>
                          <input required type="number" min="1" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={soQuantity} onChange={(e) => setSoQuantity(e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Agreed Price (৳)</label>
                          <input type="number" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Optional" value={soUnitPrice} onChange={(e) => setSoUnitPrice(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Needed By</label>
                        <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={soExpectedDate} onChange={(e) => setSoExpectedDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Notes</label>
                        <textarea rows={2} className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors resize-none" placeholder="Optional" value={soNotes} onChange={(e) => setSoNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="btn-shimmer w-full bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                        Log Sales Order
                      </button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <div className="bg-canvas border border-thread h-full flex flex-col">
                    <div className="flex items-center justify-between px-7 pt-7 mb-5">
                      <h3 className="text-base font-bold text-ink">Sales Orders</h3>
                      <span className="text-muted text-xs font-mono font-bold">{salesOrders.length} LOGGED</span>
                    </div>
                    <div className="stitch mx-7 mb-1" />
                    <div className="px-7 py-2 divide-y divide-thread overflow-y-auto max-h-[560px]">
                      {salesOrders.length === 0 ? (
                        <p className="text-center py-12 text-sm text-muted">No sales orders logged yet.</p>
                      ) : (
                        salesOrders.map((so: any) => (
                          <div key={so.id} className="py-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{so.item_description}</p>
                              <p className="text-xs text-muted mt-0.5">
                                {so.customer_name} · {so.quantity}x{so.unit_price ? ` · ৳${so.unit_price}` : ''}{so.expected_date ? ` · by ${new Date(so.expected_date).toLocaleDateString('en-BD')}` : ''}
                              </p>
                            </div>
                            <select
                              value={so.status}
                              onChange={(e) => updateSalesOrderStatus(so.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-0 outline-none cursor-pointer shrink-0 ${
                                so.status === 'fulfilled' ? 'bg-moss-light text-moss'
                                : so.status === 'cancelled' ? 'bg-oxblood-light text-oxblood'
                                : 'bg-brass-light text-brass-dark'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="fulfilled">Fulfilled</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="pb-7" />
                  </div>
                </div>
              </div>
            )}

            {/* SELL: ALL SALES */}
            {activeTab === 'sell-all' && (
              <div className="print:hidden">
                <div className="bg-canvas border border-thread overflow-hidden">
                  <div className="flex items-center justify-between p-7 pb-5 gap-4">
                    <h3 className="text-base font-bold text-ink">All Sales</h3>
                    <div className="relative w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                        <IconSearch className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search item or barcode..."
                        className="w-full pl-9 pr-3 py-2 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                        value={allSalesSearchQuery}
                        onChange={(e) => setAllSalesSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread">
                          <th className="p-4 font-bold">Date & Time</th>
                          <th className="p-4 font-bold">Item Details</th>
                          <th className="p-4 font-bold">Method</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {allSalesFiltered.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-muted font-medium">No matching sales.</td></tr>
                        )}
                        {allSalesFiltered.map((sale) => (
                          <tr key={sale.id} className={sale.status === 'refunded' ? 'opacity-50' : ''}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className={`text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{sale.dresses?.name}</p>
                              <span className="text-xs font-mono text-muted">{sale.dresses?.barcode}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-ink bg-paper-dim px-2 py-1">
                                {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${sale.status === 'refunded' ? 'bg-paper-dim text-muted' : 'bg-moss-light text-moss'}`}>
                                {sale.status}
                              </span>
                            </td>
                            <td className={`p-4 text-right text-sm font-mono font-bold whitespace-nowrap ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>
                              ৳{sale.amount_paid}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SELL: ADD SALE (search-based quick sale, no scanner needed) */}
            {activeTab === 'sell-add' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconBag className="w-4 h-4 text-brass" />
                    Add Sale
                  </h3>
                  <p className="text-sm text-muted mb-6">Find a product by name when there's no barcode to scan, then complete the sale directly.</p>

                  {addSaleMessage.text && <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${addSaleMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{addSaleMessage.text}</div>}

                  {!addSaleSelectedItem ? (
                    <>
                      <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                          <IconSearch className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search product by name..."
                          className="w-full pl-11 pr-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors"
                          value={addSaleSearchQuery}
                          onChange={(e) => setAddSaleSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="divide-y divide-thread max-h-[400px] overflow-y-auto">
                        {addSaleSearchQuery !== '' && addSaleResults.length === 0 && (
                          <p className="text-center py-8 text-sm text-muted">No in-stock items match that search.</p>
                        )}
                        {addSaleResults.map(item => (
                          <button key={item.id} onClick={() => selectAddSaleItem(item)} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-paper-dim transition-colors px-2">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted font-mono">{item.barcode} · {item.quantity} in stock</p>
                            </div>
                            <p className="font-mono font-bold text-ink text-sm shrink-0">৳{item.price}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div className="bg-paper-dim p-4 border border-thread flex items-center justify-between">
                        <div>
                          <p className="font-bold text-ink text-sm">{addSaleSelectedItem.name}</p>
                          <p className="text-xs text-muted font-mono mt-0.5">{addSaleSelectedItem.barcode} · ৳{addSaleSelectedItem.price}</p>
                        </div>
                        <button onClick={() => setAddSaleSelectedItem(null)} className="text-xs font-bold text-muted hover:text-ink uppercase tracking-wide">Change</button>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Payment Method</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {PAYMENT_METHODS.map((method) => (
                            <button
                              key={method}
                              className={`py-2.5 text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                                addSalePaymentMethod === method ? 'bg-ink text-paper border-ink' : 'bg-canvas text-ink border-thread hover:border-thread-dark'
                              }`}
                              onClick={() => setAddSalePaymentMethod(method as any)}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                        {(addSalePaymentMethod !== 'cash' && addSalePaymentMethod !== 'bank/card') && (
                          <input type="text" placeholder="Mobile banking TrxID" className="w-full px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors mb-4" value={addSaleTrxId} onChange={(e) => setAddSaleTrxId(e.target.value)} />
                        )}
                      </div>
                      <button onClick={handleCompleteAddSale} className="btn-shimmer w-full bg-moss text-white py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-moss/90 transition-colors">
                        Complete Sale
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SELL: LIST POS (recent terminal activity, compact view) */}
            {activeTab === 'sell-list-pos' && (
              <div className="print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="flex items-center justify-between px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Recent POS Activity</h3>
                    <button onClick={() => goToTab('pos', 'sell')} className="bg-ink text-paper px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5">
                      <IconScan className="w-3.5 h-3.5" /> Open POS
                    </button>
                  </div>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {salesRecord.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No sales recorded yet.</p>
                    ) : (
                      salesRecord.slice(0, 30).map(sale => (
                        <div key={sale.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`font-bold text-sm truncate ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{sale.dresses?.name}</p>
                            <p className="text-xs text-muted font-mono mt-0.5">{new Date(sale.sold_at).toLocaleString('en-BD')}</p>
                          </div>
                          <p className={`font-mono text-sm font-bold shrink-0 ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>৳{sale.amount_paid}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* TAB 3: REFUND */}
            {activeTab === 'refund' && (
              <div className="max-w-3xl print:hidden">
                <div className="bg-canvas p-8 border border-oxblood/25">
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-oxblood-light flex items-center justify-center mx-auto mb-4">
                      <IconUndo className="w-6 h-6 text-oxblood" />
                    </div>
                    <h3 className="text-xl font-display text-ink">Refund & Returns Center</h3>
                    <p className="text-muted mt-2 text-sm">Scan an item to pull up its completed sales history.</p>
                  </div>

                  {refundMessage.text && <div className={`px-4 py-3 mb-6 text-sm font-semibold border text-center ${refundMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{refundMessage.text}</div>}

                  <form onSubmit={handleRefundSearch} className="mb-9 max-w-xl mx-auto flex gap-2">
                    <input type="text" autoFocus placeholder="Scan barcode..." className="flex-1 px-5 py-3.5 bg-paper border border-thread focus:bg-canvas focus:border-oxblood outline-none text-ink font-mono transition-colors text-lg" value={refundBarcode} onChange={(e) => setRefundBarcode(e.target.value)} />
                    <button type="submit" className="bg-oxblood text-white px-7 font-bold text-sm uppercase tracking-wider hover:bg-oxblood/90 transition-colors">Search</button>
                  </form>

                  <div className="divide-y divide-dashed divide-thread-dark max-w-2xl mx-auto">
                    {refundItemSales.map((sale) => (
                      <div key={sale.id} className="py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-ink text-base">{sale.dresses.name}</h4>
                          <div className="flex flex-col gap-1 mt-2">
                            <p className="text-xs text-muted flex items-center gap-1.5">
                              <IconClock className="w-3.5 h-3.5" />
                              Sold: {new Date(sale.sold_at).toLocaleString('en-BD')}
                            </p>
                            <p className="text-xs text-muted flex items-center gap-1.5 font-mono">
                              <IconCard className="w-3.5 h-3.5" />
                              <span className="uppercase font-bold text-ink">
                                 {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                              {(sale.transaction_id !== 'CASH-SALE' && sale.transaction_id !== 'DIRECT-SALE' && sale.transaction_id !== 'BANK/CARD-SALE') && ` | Trx: ${sale.transaction_id}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                          <p className="font-mono text-lg font-bold text-ink">৳{sale.amount_paid}</p>
                          <button onClick={() => processRefund(sale)} className="bg-oxblood-light text-oxblood px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-oxblood hover:text-white transition-colors border border-oxblood/20 flex items-center gap-2">
                            <IconUndo className="w-3.5 h-3.5" />
                            Approve Refund
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-canvas border border-thread mt-6">
                  <div className="p-6 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Recent Returns</h3>
                  </div>
                  <div className="divide-y divide-thread px-7">
                    {salesRecord.filter(s => s.status === 'refunded').length === 0 ? (
                      <p className="text-center py-10 text-sm text-muted">No returns recorded yet.</p>
                    ) : (
                      salesRecord.filter(s => s.status === 'refunded').slice(0, 10).map(sale => (
                        <div key={sale.id} className="py-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-ink text-sm truncate">{sale.dresses?.name}</p>
                            <p className="text-xs text-muted font-mono mt-0.5">{new Date(sale.sold_at).toLocaleString('en-BD')}</p>
                          </div>
                          <p className="font-mono text-sm font-bold text-oxblood shrink-0">৳{sale.amount_paid}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-6" />
                </div>
              </div>
            )}

            {/* MEMBERSHIP: MEMBERS LIST */}
            {activeTab === 'membership-list' && (
              <div className="print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="flex items-center justify-between px-7 pt-7 pb-5 gap-4 flex-wrap">
                    <div>
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <IconUsers className="w-4 h-4 text-brass" />
                        All Members
                      </h3>
                      <p className="text-xs text-muted mt-1 font-mono">
                        {members.filter(m => m.status === 'active').length} active ·{' '}
                        {members.filter(m => {
                          if (m.status !== 'active') return false;
                          const days = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
                          return days >= 0 && days <= 30;
                        }).length} expiring within 30 days ·{' '}
                        Discount: <span className="text-brass font-bold">{membershipSettings.discount_percent}%</span>
                      </p>
                    </div>
                    <div className="relative w-60">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                        <IconSearch className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by phone..."
                        className="w-full pl-9 pr-3 py-2 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm font-mono"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread">
                          <th className="p-4 font-bold">Mobile Number</th>
                          <th className="p-4 font-bold">Note</th>
                          <th className="p-4 font-bold">Start Date</th>
                          <th className="p-4 font-bold">Expiry Date</th>
                          <th className="p-4 font-bold">Days Left</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {members.length === 0 && (
                          <tr><td colSpan={7} className="p-8 text-center text-muted">No members registered yet.</td></tr>
                        )}
                        {members
                          .filter(m => memberSearch === '' || m.phone.includes(memberSearch))
                          .map((m: any) => {
                            const daysLeft = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
                            const isExpired = daysLeft < 0;
                            const isExpiringSoon = !isExpired && daysLeft <= 30;
                            return (
                              <tr key={m.id} className={m.status === 'revoked' ? 'opacity-50' : ''}>
                                <td className="p-4 font-mono font-bold text-ink text-sm">{m.phone}</td>
                                <td className="p-4 text-sm text-muted">{m.note || '—'}</td>
                                <td className="p-4 text-sm text-muted font-mono whitespace-nowrap">{new Date(m.start_date).toLocaleDateString('en-BD')}</td>
                                <td className="p-4 text-sm text-muted font-mono whitespace-nowrap">{new Date(m.expiry_date).toLocaleDateString('en-BD')}</td>
                                <td className="p-4">
                                  {m.status === 'revoked' ? (
                                    <span className="text-[10px] font-bold text-muted">—</span>
                                  ) : isExpired ? (
                                    <span className="text-[10px] font-bold text-oxblood">Expired</span>
                                  ) : (
                                    <span className={`text-[10px] font-bold font-mono ${isExpiringSoon ? 'text-oxblood' : 'text-ink'}`}>{daysLeft}d</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${
                                    m.status === 'revoked' ? 'bg-paper-dim text-muted'
                                    : isExpired ? 'bg-oxblood-light text-oxblood'
                                    : isExpiringSoon ? 'bg-brass-light text-brass-dark'
                                    : 'bg-moss-light text-moss'
                                  }`}>
                                    {m.status === 'revoked' ? 'Revoked' : isExpired ? 'Expired' : isExpiringSoon ? 'Expiring' : 'Active'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    {m.status !== 'revoked' && (
                                      <>
                                        <button onClick={() => renewMember(m)} className="text-[11px] font-bold text-brass hover:text-brass-dark uppercase tracking-wide border border-brass/30 px-2.5 py-1 hover:bg-brass-light/50 transition-colors">
                                          Renew
                                        </button>
                                        <button onClick={() => revokeMember(m)} className="text-[11px] font-bold text-muted hover:text-oxblood uppercase tracking-wide border border-thread px-2.5 py-1 hover:border-oxblood transition-colors">
                                          Revoke
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {/* MEMBERSHIP: ADD MEMBER */}
            {activeTab === 'membership-add' && (
              <div className="max-w-lg print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconUserPlus className="w-4 h-4 text-brass" />
                    Enroll New Member
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Membership is registered by mobile number only. It starts today and expires after exactly 1 year.
                    Members get a <span className="font-bold text-brass">{membershipSettings.discount_percent}%</span> discount at checkout.
                  </p>

                  {memberMessage.text && (
                    <div className={`anim-alert px-4 py-3 mb-5 text-sm font-semibold border ${memberMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>
                      {memberMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleAddMember} className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        required
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-lg tracking-widest transition-colors"
                        value={memberPhone}
                        onChange={(e) => setMemberPhone(e.target.value)}
                        maxLength={15}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                        Note <span className="text-muted font-normal normal-case">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP customer, referred by..."
                        className="w-full px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors"
                        value={memberNote}
                        onChange={(e) => setMemberNote(e.target.value)}
                      />
                    </div>

                    {/* Date preview */}
                    <div className="bg-paper-dim p-4 border border-thread space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted font-semibold">Start date</span>
                        <span className="font-mono font-bold text-ink">{new Date().toLocaleDateString('en-BD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted font-semibold">Expiry date</span>
                        <span className="font-mono font-bold text-moss">{new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-BD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted font-semibold">Discount</span>
                        <span className="font-mono font-bold text-brass">{membershipSettings.discount_percent}%</span>
                      </div>
                    </div>

                    <button type="submit" className="btn-shimmer w-full bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                      Enroll Member
                    </button>
                  </form>

                  {/* Recent enrolments quick-view */}
                  {members.length > 0 && (
                    <div className="mt-8">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Recent Enrolments</p>
                      <div className="divide-y divide-thread">
                        {members.slice(0, 5).map((m: any) => (
                          <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                            <span className="font-mono font-bold text-ink text-sm">{m.phone}</span>
                            <span className="text-xs text-muted font-mono">expires {new Date(m.expiry_date).toLocaleDateString('en-BD')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MEMBERSHIP: SETTINGS */}
            {activeTab === 'membership-settings' && (
              <div className="max-w-xl print:hidden space-y-6">
                {/* Discount control */}
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconSettingsGear className="w-4 h-4 text-brass" />
                    Membership Discount
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Set the discount percentage all active members receive at checkout. You can change this at any time — it takes effect immediately.
                  </p>
                  <form onSubmit={saveMembershipSettings} className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Discount Percentage (%)</label>
                      <div className="flex items-center gap-5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-32 px-4 py-3 bg-brass-light/30 border border-brass/30 focus:border-brass outline-none text-ink font-mono text-xl font-bold text-center transition-colors"
                          value={membershipDiscountInput}
                          onChange={(e) => setMembershipDiscountInput(e.target.value)}
                        />
                        <div>
                          <p className="text-4xl font-mono font-bold text-brass">{membershipDiscountInput || '0'}%</p>
                          <p className="text-xs text-muted mt-1">off every purchase</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className={`px-7 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${membershipSettingsSaved ? 'bg-moss text-white' : 'bg-ink text-paper hover:bg-brass-dark'}`}
                    >
                      {membershipSettingsSaved ? '✓ Saved' : 'Save Discount'}
                    </button>
                  </form>
                </div>

                {/* Quick stats */}
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-5 text-ink">Membership Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Total Members',
                        value: members.length,
                        color: 'text-ink',
                      },
                      {
                        label: 'Active',
                        value: members.filter((m: any) =>
                          m.status === 'active' &&
                          Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000) >= 0
                        ).length,
                        color: 'text-moss',
                      },
                      {
                        label: 'Expiring (30d)',
                        value: members.filter((m: any) => {
                          if (m.status !== 'active') return false;
                          const d = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
                          return d >= 0 && d <= 30;
                        }).length,
                        color: 'text-brass',
                      },
                      {
                        label: 'Expired / Revoked',
                        value: members.filter((m: any) =>
                          m.status === 'revoked' ||
                          Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000) < 0
                        ).length,
                        color: 'text-oxblood',
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-paper-dim p-4 border border-thread text-center">
                        <p className={`font-mono text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1 leading-tight">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DAILY COST */}
            {activeTab === 'daily-cost' && (
              <div className="space-y-6 print:hidden">

                {/* Summary cards */}
                {(() => {
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                  const todaysCosts = dailyCosts.filter((c: any) => c.cost_date === todayStr);
                  const todaysTotal = todaysCosts.reduce((s: number, c: any) => s + Number(c.amount), 0);
                  const monthStr = todayStr.slice(0, 7);
                  const monthCosts = dailyCosts.filter((c: any) => c.cost_date.startsWith(monthStr));
                  const monthTotal = monthCosts.reduce((s: number, c: any) => s + Number(c.amount), 0);
                  const allTimeTotal = dailyCosts.reduce((s: number, c: any) => s + Number(c.amount), 0);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Today's cost</p>
                        <p className="font-mono text-2xl font-bold text-oxblood">৳{todaysTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted mt-1">{todaysCosts.length} entr{todaysCosts.length === 1 ? 'y' : 'ies'}</p>
                      </div>
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">This month</p>
                        <p className="font-mono text-2xl font-bold text-oxblood">৳{monthTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted mt-1">{monthCosts.length} entr{monthCosts.length === 1 ? 'y' : 'ies'}</p>
                      </div>
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">All time</p>
                        <p className="font-mono text-2xl font-bold text-ink">৳{allTimeTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted mt-1">{dailyCosts.length} total entries</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Add entry form */}
                <div className="bg-canvas border border-thread p-6">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconWallet className="w-4 h-4 text-oxblood" />
                    Add Daily Cost
                  </h3>
                  <p className="text-sm text-muted mb-5">
                    Small out-of-pocket spends — tea, rickshaw fare, a quick repair — that come out of the till.
                    Every entry here is subtracted from Gross Revenue to calculate Net Profit in Reports.
                  </p>

                  {dailyCostMessage.text && (
                    <div className={`anim-alert px-4 py-3 mb-4 text-sm font-semibold border ${dailyCostMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>
                      {dailyCostMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleAddDailyCost} className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Date</label>
                        <input
                          type="date"
                          className="px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors"
                          value={dailyCostDate}
                          onChange={e => setDailyCostDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Amount (৳)</label>
                        <input
                          type="number" min="0" step="1" placeholder="e.g. 10"
                          className="w-36 px-4 py-2.5 bg-oxblood-light/30 border border-oxblood/25 focus:border-oxblood outline-none text-ink font-mono font-bold transition-colors"
                          value={dailyCostAmount}
                          onChange={e => setDailyCostAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Note — what was this for?</label>
                      <input
                        type="text" placeholder="e.g. Tea for staff, rickshaw fare to bank"
                        className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors"
                        value={dailyCostNote}
                        onChange={e => setDailyCostNote(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-shimmer bg-oxblood text-white px-6 py-2.5 font-bold text-sm uppercase tracking-wider hover:bg-oxblood/90 transition-colors">
                      Record Cost
                    </button>
                  </form>
                </div>

                {/* Entry log */}
                <div className="bg-canvas border border-thread overflow-hidden">
                  <div className="px-6 py-4 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Recorded costs</h3>
                  </div>
                  {dailyCosts.length === 0 ? (
                    <p className="text-center py-12 text-sm text-muted">No costs logged yet.</p>
                  ) : (
                    <div className="divide-y divide-thread">
                      {dailyCosts.map((c: any) => (
                        <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-mono text-sm text-muted">{c.cost_date}</p>
                            <p className="text-sm text-ink mt-0.5 truncate">{c.note}</p>
                          </div>
                          <span className="font-mono font-bold text-oxblood shrink-0">৳{Number(c.amount).toLocaleString()}</span>
                          <button
                            onClick={() => handleDeleteDailyCost(c.id)}
                            className="text-[11px] font-bold text-muted hover:text-oxblood uppercase tracking-wide transition-colors shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6 print:hidden">
                <div className="bg-canvas p-5 border border-thread flex flex-wrap items-end gap-5">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Filter Start Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Filter End Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <button onClick={clearDateFilters} className="px-5 py-2.5 border border-thread text-ink hover:border-thread-dark font-bold text-xs uppercase tracking-wider transition-colors bg-canvas whitespace-nowrap">
                    Clear Filters
                  </button>
                  <button
                    onClick={exportLedgerCSV}
                    disabled={salesRecord.length === 0}
                    className="px-5 py-2.5 bg-ink text-paper hover:bg-brass-dark font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-ink p-8 text-paper relative overflow-hidden">
                    <div className="barcode-stripe absolute top-0 right-0 h-full w-24 opacity-[0.06]" style={{ filter: 'invert(1)' }} />
                    <p className="text-xs font-bold uppercase tracking-wider text-thread mb-2">Gross Revenue {startDate ? '(Filtered Period)' : '(All Time)'}</p>
                    <p className="font-mono text-4xl sm:text-5xl font-bold tracking-tight">৳{totalRevenue.toLocaleString()}</p>
                  </div>

                  {(() => {
                    // Daily costs within the same date window as the sales filter above,
                    // so "Net Profit" always reflects the same period the admin is viewing.
                    const filteredCosts = dailyCosts.filter((c: any) => {
                      if (startDate && c.cost_date < startDate) return false;
                      if (endDate && c.cost_date > endDate) return false;
                      return true;
                    });
                    const totalCosts = filteredCosts.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
                    const netProfit = totalRevenue - totalCosts;
                    return (
                      <>
                        <div className="anim-card bg-oxblood-light/40 border border-oxblood/20 p-8 flex flex-col justify-center card-lift">
                          <p className="text-xs font-bold uppercase tracking-wider text-oxblood mb-2">Daily Costs {startDate ? '(Filtered Period)' : '(All Time)'}</p>
                          <p className="font-mono text-4xl sm:text-5xl font-bold text-oxblood">৳{totalCosts.toLocaleString()}</p>
                          <p className="text-xs text-muted mt-2">{filteredCosts.length} entr{filteredCosts.length === 1 ? 'y' : 'ies'} logged</p>
                        </div>
                        <div className="anim-card bg-moss-light/50 border border-moss/20 p-8 flex flex-col justify-center card-lift">
                          <p className="text-xs font-bold uppercase tracking-wider text-moss mb-2">Net Profit {startDate ? '(Filtered Period)' : '(All Time)'}</p>
                          <p className={`font-mono text-4xl sm:text-5xl font-bold ${netProfit < 0 ? 'text-oxblood' : 'text-moss'}`}>৳{netProfit.toLocaleString()}</p>
                          <p className="text-xs text-muted mt-2">Revenue minus daily costs</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div className="bg-canvas p-8 border border-thread flex flex-col justify-center card-lift">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Total Successful Sales</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-mono text-4xl sm:text-5xl font-bold text-ink">{salesRecord.filter(s => s.status === 'completed').length}</p>
                      <p className="text-base font-bold text-muted">Items</p>
                    </div>
                  </div>
                </div>

                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-6 text-ink flex items-center gap-2">
                    <IconChart className="w-4 h-4 text-brass" />
                    Revenue by Payment Method
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {Object.entries(revenueByMethod).map(([method, amount]) => (
                      <div key={method} className="bg-paper-dim p-4 border border-thread text-center">
                        <p className="uppercase text-[10px] font-bold text-muted tracking-wider mb-1.5 whitespace-nowrap">{method}</p>
                        <p className="font-mono text-sm font-bold text-ink">৳{amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-canvas border border-thread overflow-hidden">
                  <div className="p-6 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Master Transaction Ledger</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread">
                          <th className="p-4 font-bold">Date & Time</th>
                          <th className="p-4 font-bold">Item Details</th>
                          <th className="p-4 font-bold">Method</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {salesRecord.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-muted font-medium">No transactions found for this period.</td></tr>
                        )}
                        {salesRecord.map((sale) => (
                          <tr key={sale.id} className={sale.status === 'refunded' ? 'opacity-50' : ''}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className={`text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{sale.dresses?.name}</p>
                              <span className="text-xs font-mono text-muted">{sale.dresses?.barcode}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-ink bg-paper-dim px-2 py-1">
                                {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${sale.status === 'refunded' ? 'bg-paper-dim text-muted' : 'bg-moss-light text-moss'}`}>
                                {sale.status}
                              </span>
                            </td>
                            <td className={`p-4 text-right text-sm font-mono font-bold whitespace-nowrap ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>
                              ৳{sale.amount_paid}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: BUSINESS SETTINGS */}
            {activeTab === 'settings-business' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconSettingsGear className="w-4 h-4 text-brass" />
                    Business Settings
                  </h3>
                  <p className="text-sm text-muted mb-6">Your shop's address and phone — shown on the login screen and printed on every receipt.</p>
                  {settingsSaved === 'business' && <div className="px-4 py-3 mb-5 text-sm font-semibold border bg-moss-light text-moss border-moss/20">Saved.</div>}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Business Name</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" value={businessSettings.business_name} onChange={(e) => setBusinessSettings({ ...businessSettings, business_name: e.target.value })} />
                      <p className="text-xs text-muted mt-1.5">Stored for your records — the sidebar wordmark stays "CRAVE ABS" by design.</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Address</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" value={businessSettings.address} onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Phone</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Optional — printed on receipts if set" value={businessSettings.phone} onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })} />
                    </div>
                    <button
                      onClick={() => saveBusinessSettings({ business_name: businessSettings.business_name, address: businessSettings.address, phone: businessSettings.phone }, 'business')}
                      className="btn-shimmer w-full bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: INVOICE SETTINGS */}
            {activeTab === 'settings-invoice' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconReceipt className="w-4 h-4 text-brass" />
                    Invoice Settings
                  </h3>
                  <p className="text-sm text-muted mb-6">The two footer lines printed at the bottom of every receipt.</p>
                  {settingsSaved === 'invoice' && <div className="px-4 py-3 mb-5 text-sm font-semibold border bg-moss-light text-moss border-moss/20">Saved.</div>}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Footer Line 1</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" value={businessSettings.receipt_footer_line1} onChange={(e) => setBusinessSettings({ ...businessSettings, receipt_footer_line1: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Footer Line 2</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" value={businessSettings.receipt_footer_line2} onChange={(e) => setBusinessSettings({ ...businessSettings, receipt_footer_line2: e.target.value })} />
                    </div>
                    <div className="bg-paper-dim border border-thread p-4">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Receipt Preview</p>
                      <p className="text-center text-xs font-bold font-mono text-ink">{businessSettings.receipt_footer_line1}</p>
                      <p className="text-center text-[10px] font-mono text-muted mt-1">{businessSettings.receipt_footer_line2}</p>
                    </div>
                    <button
                      onClick={() => saveBusinessSettings({ receipt_footer_line1: businessSettings.receipt_footer_line1, receipt_footer_line2: businessSettings.receipt_footer_line2 }, 'invoice')}
                      className="btn-shimmer w-full bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: BARCODE SETTINGS */}
            {activeTab === 'settings-barcode' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconScan className="w-4 h-4 text-brass" />
                    Barcode Settings
                  </h3>
                  <p className="text-sm text-muted mb-6">A short prefix for barcodes you write yourself on items without a manufacturer tag.</p>
                  {settingsSaved === 'barcode' && <div className="px-4 py-3 mb-5 text-sm font-semibold border bg-moss-light text-moss border-moss/20">Saved.</div>}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Barcode Prefix</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono uppercase transition-colors" maxLength={10} value={businessSettings.barcode_prefix} onChange={(e) => setBusinessSettings({ ...businessSettings, barcode_prefix: e.target.value.toUpperCase() })} />
                      <p className="text-xs text-muted mt-1.5">e.g. a tag reading <span className="font-mono font-bold text-ink">{businessSettings.barcode_prefix || 'CRV'}-0142</span> for the 142nd hand-tagged item.</p>
                    </div>
                    <button
                      onClick={() => saveBusinessSettings({ barcode_prefix: businessSettings.barcode_prefix }, 'barcode')}
                      className="btn-shimmer w-full bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: TAX RATES */}
            {activeTab === 'settings-tax' && (
              <div className="max-w-xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconFileText className="w-4 h-4 text-brass" />
                      Tax Rates
                    </h3>
                    <p className="text-sm text-muted mt-1">Rates defined here appear as a selectable Tax option on the POS screen, applied to the subtotal after any discount.</p>
                  </div>
                  <form onSubmit={addTaxRate} className="px-7 mb-5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Name, e.g. VAT"
                      className="flex-1 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                      value={newTaxName}
                      onChange={(e) => setNewTaxName(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="%"
                      step="0.01"
                      className="w-24 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors text-sm"
                      value={newTaxRate}
                      onChange={(e) => setNewTaxRate(e.target.value)}
                    />
                    <button type="submit" className="bg-ink text-paper px-5 text-[11px] font-bold uppercase tracking-wider hover:bg-brass-dark transition-colors flex items-center gap-1.5 shrink-0">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="stitch mx-7 mb-1" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {taxRates.length === 0 ? (
                      <p className="text-center py-12 text-sm text-muted">No tax rates yet.</p>
                    ) : (
                      taxRates.map((t: any) => (
                        <div key={t.id} className="py-3 flex items-center justify-between">
                          <span className="font-semibold text-ink text-sm">{t.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-ink text-sm">{t.rate_percent}%</span>
                            <button onClick={() => deleteTaxRate(t.id)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* TAB: DAILY SALES SURVEY */}
            {/* TAB: DAILY SALES SURVEY */}
            {activeTab === 'survey' && (
              <div className="space-y-6 print:hidden">

                {/* Stat cards */}
                {(() => {
                  const total = surveyRecords.reduce((s, r) => s + r.amount, 0);
                  const avg = surveyRecords.length ? Math.round(total / surveyRecords.length) : 0;
                  const amounts = surveyRecords.map(r => r.amount);
                  const best = amounts.length ? Math.max(...amounts) : 0;
                  const low  = amounts.length ? Math.min(...amounts) : 0;
                  const bestDay = surveyRecords.find(r => r.amount === best);
                  const lowDay  = surveyRecords.find(r => r.amount === low);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">10-day total</p>
                        <p className="font-mono text-2xl font-bold text-ink">৳{total.toLocaleString()}</p>
                      </div>
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Daily average</p>
                        <p className="font-mono text-2xl font-bold text-ink">{surveyRecords.length ? `৳${avg.toLocaleString()}` : '—'}</p>
                      </div>
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Best day</p>
                        <p className="font-mono text-2xl font-bold text-moss">{best > 0 ? `৳${best.toLocaleString()}` : '—'}</p>
                        <p className="text-xs text-muted mt-1 font-mono">{bestDay?.date ?? ''}</p>
                      </div>
                      <div className="bg-canvas border border-thread p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Lowest day</p>
                        <p className="font-mono text-2xl font-bold text-oxblood">{low > 0 ? `৳${low.toLocaleString()}` : '—'}</p>
                        <p className="text-xs text-muted mt-1 font-mono">{lowDay?.date ?? ''}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Chart.js bar chart */}
                <div className="bg-canvas border border-thread p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <IconSurvey className="w-4 h-4 text-brass" />
                      <h3 className="text-base font-bold text-ink">Daily sales — last 10 days</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={fetchSurveyData}
                        className="text-[11px] font-bold text-brass hover:text-brass-dark uppercase tracking-wide border border-brass/30 px-3 py-1.5 hover:bg-brass-light/40 transition-colors flex items-center gap-1.5"
                      >
                        ↻ Sync from real sales
                      </button>
                    </div>
                  </div>

                  {/* Chart.js renders here via the dangerouslySetInnerHTML trick —
                      we use a key-controlled div so React re-mounts the canvas
                      whenever surveyChartKey changes, letting Chart.js reinitialise. */}
                  <div key={surveyChartKey} style={{ position: 'relative', width: '100%', height: 300 }}>
                    <canvas id={`survey-chart-${surveyChartKey}`} />
                  </div>

                  {surveyRecords.length === 0 && (
                    <p className="text-center text-sm text-muted mt-4">
                      No data yet — click "Sync from real sales" or add a manual record below.
                    </p>
                  )}

                  {/* Inline script — executes after mount via dangerouslySetInnerHTML on
                      a wrapper won't work in React, so we use useEffect via a ref instead.
                      The chart init is handled by the SurveyChart component below. */}
                  <SurveyChart
                    key={`chart-${surveyChartKey}`}
                    canvasId={`survey-chart-${surveyChartKey}`}
                    records={surveyRecords}
                    isDark={isDark}
                  />

                  {surveyRecords.length > 0 && (
                    <p className="text-[11px] text-muted mt-4 font-mono text-right">
                      Taka (৳) · last {surveyRecords.length} recorded days
                    </p>
                  )}
                </div>

                {/* Manual entry form */}
                <div className="bg-canvas border border-thread p-6">
                  <h3 className="text-base font-bold mb-1 text-ink">Manual entry</h3>
                  <p className="text-sm text-muted mb-5">
                    Add or override a day's total — useful for cash-only sales not yet in the system.
                    "Sync from real sales" will replace manual entries with calculated figures from your actual transactions.
                  </p>
                  {surveyMessage.text && (
                    <div className={`anim-alert px-4 py-3 mb-4 text-sm font-semibold border ${surveyMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>
                      {surveyMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleAddSurveyEntry} className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Date</label>
                      <input
                        type="date"
                        className="px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors"
                        value={surveyDateInput}
                        onChange={e => setSurveyDateInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Total sales (৳)</label>
                      <input
                        type="number" min="0" step="1" placeholder="e.g. 18500"
                        className="w-44 px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors"
                        value={surveyAmountInput}
                        onChange={e => setSurveyAmountInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="bg-ink text-paper px-6 py-2.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                      Save Entry
                    </button>
                  </form>
                </div>

                {/* Entry log */}
                {surveyRecords.length > 0 && (
                  <div className="bg-canvas border border-thread overflow-hidden">
                    <div className="px-6 py-4 border-b border-thread">
                      <h3 className="text-base font-bold text-ink">Recorded entries</h3>
                    </div>
                    <div className="divide-y divide-thread">
                      {[...surveyRecords].reverse().map(r => (
                        <div key={r.date} className="px-6 py-4 flex items-center justify-between gap-4">
                          <span className="font-mono text-sm text-muted">{r.date}</span>
                          <span className="font-mono font-bold text-ink">৳{r.amount.toLocaleString()}</span>
                          <button
                            onClick={() => handleDeleteSurveyEntry(r.date)}
                            className="text-[11px] font-bold text-muted hover:text-oxblood uppercase tracking-wide transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            </div>{/* end tab-enter wrapper */}

          </div>
        </div>
      </div>

      {/* RECEIPT PRINT LAYOUT */}
      {cart.length > 0 && activeTab === 'pos' && (
        <div className="hidden print:block w-[80mm] text-black font-mono text-sm p-2 mx-auto">
          <div className="text-center font-bold text-xl mb-1 tracking-widest">CRAVE ABS</div>
          <div className="text-center text-xs mb-4 uppercase">{businessSettings.address}{businessSettings.phone ? ` · ${businessSettings.phone}` : ''}</div>
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between text-xs">
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>

          <div className="my-2">
            {cart.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="font-bold text-base leading-tight">{item.name}</div>
                <div className="text-xs text-gray-600 mt-1">CAT: {item.category}</div>
                <div className="flex justify-between font-bold mt-1">
                  <span>{item.cartQty}x Item</span>
                  <span>Tk {item.price * item.cartQty}</span>
                </div>
              </div>
            ))
            }
          </div>

          <div className="border-b border-dashed border-black my-2"></div>
          {(cartDiscountValue > 0 || cartTaxValue > 0) && (
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>Tk {cartSubtotal}</span>
            </div>
          )}
          {cartDiscountValue > 0 && (
            <div className="flex justify-between text-xs">
              <span>Discount:</span>
              <span>- Tk {cartDiscountValue}</span>
            </div>
          )}
          {cartTaxValue > 0 && (
            <div className="flex justify-between text-xs">
              <span>Tax{cartActiveTaxRate ? ` (${cartActiveTaxRate.name} ${cartActiveTaxRate.rate_percent}%)` : ''}:</span>
              <span>+ Tk {cartTaxValue}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg uppercase">
            <span>Total:</span>

            <span>Tk {cartTotal}</span>
          </div>
          <div className="text-xs mt-2 uppercase">Paid via: <span className="font-bold">{paymentMethod}</span></div>
          {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && <div className="text-xs font-mono mt-1">TrxID: {trxId}</div>}
          <div className="border-b border-dashed border-black my-2 mt-4"></div>
          <div className="text-center text-xs font-bold mt-2">{businessSettings.receipt_footer_line1}</div>
          <div className="text-center text-[10px] mt-1">{businessSettings.receipt_footer_line2}</div>
        </div>
      )}

    </div>
  );
}
