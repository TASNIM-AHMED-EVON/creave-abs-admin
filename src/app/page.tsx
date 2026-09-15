'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import JsBarcode from 'jsbarcode';
import { hasPermission, canReachTab, actingStaffRole, type AccountRole } from '@/lib/permissions';
import { useStaffSession } from '@/lib/staffSession';
import { useNotify } from '@/lib/notify';
import { logAudit } from '@/lib/audit';
import StaffPanel from '@/components/StaffPanel';
import PromotionsPanel, { evaluateBestPromotion } from '@/components/PromotionsPanel';
import ExchangePanel from '@/components/ExchangePanel';
import LayawayPanel from '@/components/LayawayPanel';
import CustomersPanel from '@/components/CustomersPanel';
import WriteOffsPanel from '@/components/WriteOffsPanel';
import { pointsEarnedFor, LOYALTY_REDEEM_VALUE } from '@/lib/loyalty';

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
const IconPrinter = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3.75A.75.75 0 016.75 3h10.5a.75.75 0 01.75.75V9M6 18H4.5A1.5 1.5 0 013 16.5v-5A1.5 1.5 0 014.5 10h15a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H18m-12 0v3.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75V18m-12 0h12" />
  </svg>
);
const IconCalculator = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <rect x="4.5" y="2.75" width="15" height="18.5" rx="2" />
    <path strokeLinecap="round" d="M7.5 6.5h9M7.75 11h.01M12 11h.01M16.25 11h.01M7.75 14.5h.01M12 14.5h.01M16.25 14.5v3.25M7.75 18h.01M12 18h.01" />
  </svg>
);
const IconImage = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 16l-5.5-5.5a1.5 1.5 0 00-2.12 0L4 19" />
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

// ---------------------------------------------------------------------------
// Real, scannable barcode via jsbarcode. Auto-detects the standard from the
// value's shape so a manufacturer's own EAN-13/UPC-A barcode (already
// printed on many wholesale/imported clothing tags) renders correctly
// instead of being forced into CODE128:
//   - 13 digits            → EAN-13 (the international retail standard)
//   - 12 digits            → UPC-A  (the North American equivalent)
//   - anything else        → CODE128 (our own generated 8–12 digit codes,
//                            or any manufacturer code that isn't EAN/UPC
//                            shaped — CODE128 has no fixed-length rule)
// EAN-13/UPC-A both end in a checksum digit; if the value's checksum is
// invalid (e.g. a barcode that just happens to be 13 digits but isn't a
// real EAN-13), jsbarcode throws — we catch that and fall back to CODE128
// so the code still renders as *something* scannable rather than blank.
// ---------------------------------------------------------------------------
// Any account without app_metadata.role set is still treated as 'admin',
// preserving the original single-admin login behavior. Anything set to one
// of the five known values is passed through; anything else (typo, stale
// value) also falls back to 'admin' rather than silently locking someone out.
const KNOWN_ACCOUNT_ROLES: AccountRole[] = ['admin', 'manager', 'cashier', 'inventory_clerk', 'salesman'];
function deriveAccountRole(rawRole: unknown): AccountRole {
  return KNOWN_ACCOUNT_ROLES.includes(rawRole as AccountRole) ? (rawRole as AccountRole) : 'admin';
}

function detectBarcodeFormat(value: string): 'EAN13' | 'UPC' | 'CODE128' {
  const digitsOnly = /^\d+$/.test(value);
  if (digitsOnly && value.length === 13) return 'EAN13';
  if (digitsOnly && value.length === 12) return 'UPC';
  return 'CODE128';
}

function BarcodeSVG({ value, height = 55, barWidth = 2, fontSize = 14 }: {
  value: string; height?: number; barWidth?: number; fontSize?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!value) { ref.current.innerHTML = ''; return; }
    const primaryFormat = detectBarcodeFormat(value);
    try {
      JsBarcode(ref.current, value, {
        format: primaryFormat,
        displayValue: true,
        height,
        width: barWidth,
        fontSize,
        fontOptions: 'bold',
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      // Right length for EAN-13/UPC-A but a bad checksum — fall back to
      // CODE128, which accepts any digit string.
      if (primaryFormat !== 'CODE128') {
        try {
          JsBarcode(ref.current, value, {
            format: 'CODE128',
            displayValue: true,
            height,
            width: barWidth,
            fontSize,
            fontOptions: 'bold',
            margin: 8,
            background: '#ffffff',
            lineColor: '#000000',
          });
          return;
        } catch {
          // fall through to blank
        }
      }
      ref.current.innerHTML = '';
    }
  }, [value, height, barWidth, fontSize]);
  return <svg ref={ref} />;
}

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
      { tab: 'exchange', label: 'Exchange' },
      { tab: 'layaway', label: 'Layaway' },
      { tab: 'promotions', label: 'Promotions' },
      { tab: 'gift-cards', label: 'Gift Cards' },
    ],
  },
  {
    kind: 'group', id: 'products', label: 'Products', icon: IconArchive,
    children: [
      { tab: 'products-list', label: 'List Products' },
      { tab: 'products-add', label: 'Add Product' },
      { tab: 'products-labels', label: 'Print Labels' },
      { tab: 'products-price', label: 'Update Price' },
      { tab: 'products-reorder', label: 'Reorder Suggestions' },
      { tab: 'products-locations', label: 'Locations & Transfers' },
      { tab: 'products-writeoffs', label: 'Write-Offs' },
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
      { tab: 'purchases-suppliers', label: 'Suppliers' },
    ],
  },
  { kind: 'single', id: 'daily-cost', tab: 'daily-cost', label: 'Daily Cost', icon: IconWallet },
  {
    kind: 'group', id: 'customers', label: 'Customers', icon: IconUsers,
    children: [
      { tab: 'customers', label: 'Customers & Loyalty' },
    ],
  },
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
      { tab: 'settings-currency', label: 'Currency & Exchange Rates' },
    ],
  },
  {
    kind: 'group', id: 'staff', label: 'Staff', icon: IconBadge,
    children: [
      { tab: 'staff-clock', label: 'Clock In / Out' },
      { tab: 'staff-manage', label: 'Manage Staff' },
      { tab: 'staff-commission', label: 'Commission Report' },
      { tab: 'staff-accounts', label: 'Account Logins' },
      { tab: 'audit-log', label: 'Audit Log' },
    ],
  },
  { kind: 'single', id: 'reports', tab: 'reports', label: 'Reports', icon: IconChart },
  { kind: 'single', id: 'survey', tab: 'survey', label: 'Daily Sales Survey', icon: IconSurvey },
] as const;

// ---------------------------------------------------------------------------
// Global header toolbar — shown above every page (see the header block right
// after the tab-switch key in the main render). This is where quick-access
// buttons live, separate from the sidebar. To add another one later, just
// add an entry here — nothing else needs to change. Each entry needs:
//   id       — unique key
//   label    — button text
//   icon     — one of the Icon* components defined above
//   tab      — the tab it should jump to (goToTab's first argument)
//   group    — the parent group id to expand in the sidebar, or null for a
//              top-level single tab (goToTab's second argument)
//   variant  — 'primary' | 'ghost' — controls button styling
// A button is automatically hidden for a role that can't reach its tab (see
// visibleHeaderActions below), so a salesman never sees a shortcut to a page
// they don't have access to.
const HEADER_ACTIONS: { id: string; label: string; icon: any; tab: string; group: string | null; variant: 'primary' | 'ghost' }[] = [
  { id: 'pos', label: 'POS', icon: IconScan, tab: 'pos', group: 'sell', variant: 'primary' },
  // { id: 'add-sale', label: 'Add Sale', icon: IconPlus, tab: 'sell-add', group: 'sell', variant: 'ghost' },
];

const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'upay', 'rocket', 'bank/card'] as const;

// One brand-ish color per payment method so the picker reads at a glance
// instead of every option looking identical. Selected = solid fill; unselected
// = tinted background + colored border/text, so the color shows either way.
const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: '#3a9d6f',      // green — universal "cash" color
  bkash: '#e2136e',     // bKash brand pink
  nagad: '#f6921e',     // Nagad brand orange
  upay: '#00a99d',      // Upay brand teal
  rocket: '#8c3494',    // Rocket brand purple
  'bank/card': '#2563eb', // blue — card/bank
};

// A small, repeatable color palette for anything that renders a dynamic
// list of pill/chip buttons (product categories, tags, etc.) where the
// labels aren't known ahead of time. Same label always gets the same
// color within a session, so the UI doesn't jitter on re-render.
const CHIP_COLOR_PALETTE = ['#2563eb', '#e2136e', '#0ea5a3', '#f6921e', '#8c3494', '#3a9d6f', '#d94f4f', '#0891b2'];
const categoryPillColor = (label: string): string => {
  if (label === 'All') return '#a8763b'; // brass — keeps "All" visually anchored as the default
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return CHIP_COLOR_PALETTE[hash % CHIP_COLOR_PALETTE.length];
};

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
  const [userRole, setUserRole] = useState<AccountRole | null>(null);
  const { currentStaff, requestManagerApproval } = useStaffSession();
  const { toast, confirm } = useNotify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  // Forgot-password flow — swaps the login form for an email-only form that
  // sends a Supabase recovery link (a real emailed confirmation link, not
  // just an in-app reset) to /reset-password.
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // POS State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'rocket' | 'cash' | 'bank/card'>('cash');
  const [trxId, setTrxId] = useState('');
  const [posMessage, setPosMessage] = useState({ type: '', text: '' });
  const [discountAmount, setDiscountAmount] = useState('0');
  const [selectedTaxRateId, setSelectedTaxRateId] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ promotion: any; discountAmount: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [customerLookup, setCustomerLookup] = useState('');
  const [posCustomer, setPosCustomer] = useState<any>(null);
  const [customerMessage, setCustomerMessage] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  // Live search-as-you-type results for the customer lookup below (name OR
  // phone, partial match) — replaces the old exact-phone-only lookup, which
  // silently found nothing on the smallest formatting mismatch and made the
  // whole feature feel broken/missing.
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');

  // POS — Product browser (right-hand grid): category filter, free-text
  // search, and which product tile (if any) has its variant picker open.
  // Kept separate from barcodeInput/stockSearchQuery since this filters a
  // different list (the visual grid) than the scan box or the Inventory tab.
  const [posBrowseCategory, setPosBrowseCategory] = useState<string>('All');
  const [posBrowseQuery, setPosBrowseQuery] = useState('');
  const [posExpandedGroupKey, setPosExpandedGroupKey] = useState<string | null>(null);

  // POS — Currency (the sale is always recorded in the base currency
  // internally; this only controls what's displayed/printed and what a
  // foreign-currency payment line is converted from).
  const [posCurrencyCode, setPosCurrencyCode] = useState<string>('');

  // POS — Split Payment. Off by default (single-method checkout, unchanged
  // from before); toggling this on swaps the single payment-method picker
  // for a list of payment lines that must sum to the total before checkout
  // is allowed. Each line can optionally be a gift card / store credit code.
  const [splitPaymentMode, setSplitPaymentMode] = useState(false);
  const [cartPayments, setCartPayments] = useState<{ method: string; amount: string; trxId: string; giftCardCode: string }[]>([]);
  const [splitPaymentDraft, setSplitPaymentDraft] = useState({ method: 'cash', amount: '', trxId: '', giftCardCode: '' });
  const [splitPaymentMessage, setSplitPaymentMessage] = useState({ type: '', text: '' });

  // --- CURRENCY & EXCHANGE RATES ---
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, { rate: number; fetchedAt: string }>>({});
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [currencyMessage, setCurrencyMessage] = useState({ type: '', text: '' });
  const [ratesRefreshing, setRatesRefreshing] = useState(false);

  // --- GIFT CARDS / STORE CREDIT ---
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [giftCardSearchQuery, setGiftCardSearchQuery] = useState('');
  const [giftCardSellAmount, setGiftCardSellAmount] = useState('');
  const [giftCardSellPhone, setGiftCardSellPhone] = useState('');
  const [giftCardMessage, setGiftCardMessage] = useState({ type: '', text: '' });
  const [giftCardLookupCode, setGiftCardLookupCode] = useState('');
  const [giftCardLookupResult, setGiftCardLookupResult] = useState<any>(null);
  const [giftCardLookupMessage, setGiftCardLookupMessage] = useState({ type: '', text: '' });

  // Inventory State
  // A product can have multiple variants (size/color combos) sharing one
  // name/category/brand/photo, but each with its own barcode, price, and
  // stock count — variants of the same product share a groupId.
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('');
  const [invBrand, setInvBrand] = useState('');
  const [invUnit, setInvUnit] = useState('Piece');
  const [invTaxRateId, setInvTaxRateId] = useState('');
  const [invVariants, setInvVariants] = useState<{ barcode: string; size: string; color: string; price: string; quantity: string; reorderPoint: string; generating: boolean }[]>([
    { barcode: '', size: '', color: '', price: '', quantity: '1', reorderPoint: '', generating: false }
  ]);
  // Size/Color Matrix — a faster way to populate invVariants above: type
  // sizes and colors once, generate the full grid of combinations, tick off
  // the ones this product actually comes in, then push them all into
  // invVariants at once instead of adding rows one by one.
  const [matrixSizesInput, setMatrixSizesInput] = useState('');
  const [matrixColorsInput, setMatrixColorsInput] = useState('');
  const [matrixPrice, setMatrixPrice] = useState('');
  const [matrixQty, setMatrixQty] = useState('1');
  const [matrixCombos, setMatrixCombos] = useState<{ size: string; color: string }[]>([]);
  const [matrixSelected, setMatrixSelected] = useState<Record<string, boolean>>({});
  const [invImageFile, setInvImageFile] = useState<File | null>(null);
  const [invImagePreview, setInvImagePreview] = useState('');
  const [invImageUploading, setInvImageUploading] = useState(false);
  const [invMessage, setInvMessage] = useState({ type: '', text: '' });
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const STOCK_PAGE_SIZE = 20;
  const [photoUploadingId, setPhotoUploadingId] = useState<any>(null);

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
  const [reportsPage, setReportsPage] = useState(1);
  const REPORTS_PAGE_SIZE = 10;

  // Overview State
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayItemsSold, setTodayItemsSold] = useState(0);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Inventory: archive visibility + inline edit
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [editDraft, setEditDraft] = useState({ name: '', category: '', brand: '', unit: '', size: '', color: '', price: '', quantity: '', reorder_point: '', tax_rate_id: '' });

  // List Products table (flat, one row per barcode — see the redesign
  // below). openRowMenuId tracks which row's "Actions ▾" dropdown is open;
  // viewingItem/historyItem drive the two read-only modals that dropdown
  // opens; selectedRowIds backs the checkbox column.
  const [openRowMenuId, setOpenRowMenuId] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<any>>(new Set());

  // Products reference data: Categories / Units / Brands
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Reorder Suggestions — units sold per dress_id over the lookback window,
  // used to estimate sales velocity and days-until-stockout.
  const [reorderVelocity, setReorderVelocity] = useState<Record<string, number>>({});
  const [reorderLoading, setReorderLoading] = useState(false);
  const REORDER_LOOKBACK_DAYS = 30;

  // Locations & Stock Transfer
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [locationStock, setLocationStock] = useState<any[]>([]);

  // Which physical shop this terminal is currently "acting as" for checkout
  // (tags every sale, and decrements that shop's location_stock). Persisted
  // per-browser so a terminal that's always in the same shop doesn't need
  // reselecting on every reload. Defaults to the logged-in staff member's
  // home location (see migration_013) once one is known, otherwise the
  // first location in the list.
  const [activeLocationId, setActiveLocationId] = useState<string>('');
  // Separate from the above: which location's numbers Overview/Reports show.
  // '' means "all locations combined."
  const [reportLocationId, setReportLocationId] = useState<string>('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [locationMessage, setLocationMessage] = useState({ type: '', text: '' });
  const [transferBarcode, setTransferBarcode] = useState('');
  const [transferMatch, setTransferMatch] = useState<any>(null);
  const [transferFromLocationId, setTransferFromLocationId] = useState<string>('');
  const [transferToLocationId, setTransferToLocationId] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState('1');
  const [transferMessage, setTransferMessage] = useState({ type: '', text: '' });
  const [stockTransfers, setStockTransfers] = useState<any[]>([]);

  // Update Price (focused quick-edit list)
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [priceDraftId, setPriceDraftId] = useState<any>(null);
  const [priceDraftValue, setPriceDraftValue] = useState('');

  // Print Labels (search a product, queue it with a quantity, print the batch)
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [labelQueue, setLabelQueue] = useState<{ id: any; barcode: string; name: string; category: string; brand: string; variant: string; price: number; qty: number; taxLabel: string; total: number }[]>([]);
  const [labelQtyDraft, setLabelQtyDraft] = useState<Record<string, string>>({});

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

  // Suppliers (standalone contact book — name/place/phone plus a free-text
  // note on what they supply, written by the owner in their own words)
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPlace, setSupplierPlace] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierProductDetails, setSupplierProductDetails] = useState('');
  const [supplierMessage, setSupplierMessage] = useState({ type: '', text: '' });
  const [editingSupplierId, setEditingSupplierId] = useState<any>(null);
  const [editSupplierDraft, setEditSupplierDraft] = useState({ name: '', place: '', phone: '', product_details: '' });

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
  const [allSalesPage, setAllSalesPage] = useState(1);
  const ALL_SALES_PAGE_SIZE = 20;

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
    logo_url: '',
  });
  const [settingsSaved, setSettingsSaved] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);

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
    let query = supabase.from('sales').select(`*, dresses ( name, barcode, category, size, color )`).order('sold_at', { ascending: false });

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
    if (reportLocationId) query = query.eq('location_id', reportLocationId);

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
  }, [startDate, endDate, reportLocationId]);

  // --- OVERVIEW MEMOIZED FETCH ---
  // Independent of the Reports date filters so the dashboard always shows
  // today's real numbers and an all-time leaderboard.
  const fetchOverviewData = useCallback(async () => {
    setOverviewLoading(true);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let todayQuery = supabase
      .from('sales')
      .select('amount_paid, status')
      .gte('sold_at', startOfDay.toISOString())
      .lte('sold_at', endOfDay.toISOString());
    if (reportLocationId) todayQuery = todayQuery.eq('location_id', reportLocationId);
    const { data: todayData } = await todayQuery;

    if (todayData) {
      const completedToday = todayData.filter((s: any) => s.status === 'completed');
      setTodayRevenue(completedToday.reduce((sum: number, s: any) => sum + Number(s.amount_paid), 0));
      setTodayItemsSold(completedToday.length);
    }

    // Tally units sold per item across the most recent completed sales to
    // surface a top-sellers leaderboard without needing a SQL view.
    let recentQuery = supabase
      .from('sales')
      .select('dress_id, amount_paid, status, dresses ( name, barcode, size, color )')
      .eq('status', 'completed')
      .order('sold_at', { ascending: false })
      .limit(500);
    if (reportLocationId) recentQuery = recentQuery.eq('location_id', reportLocationId);
    const { data: recentSales } = await recentQuery;

    if (recentSales) {
      const tally: Record<string, { name: string; barcode: string; size: string; color: string; unitsSold: number; revenue: number }> = {};
      recentSales.forEach((sale: any) => {
        const key = String(sale.dress_id);
        if (!tally[key]) {
          tally[key] = {
            name: sale.dresses?.name ?? 'Unknown Item',
            barcode: sale.dresses?.barcode ?? '',
            size: sale.dresses?.size ?? '',
            color: sale.dresses?.color ?? '',
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
  }, [reportLocationId]);

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

  // --- REORDER SUGGESTIONS: SALES VELOCITY ---
  // Tallies completed sales per dress_id over the lookback window. Each row
  // in `sales` already represents exactly one physical unit sold (see how
  // checkout flattens the cart), so counting rows per dress_id IS units sold.
  const fetchReorderVelocity = useCallback(async () => {
    setReorderLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - REORDER_LOOKBACK_DAYS);
    const { data, error } = await supabase
      .from('sales')
      .select('dress_id, status, sold_at')
      .eq('status', 'completed')
      .gte('sold_at', since.toISOString());
    if (!error && data) {
      const tally: Record<string, number> = {};
      data.forEach((row: any) => {
        const key = String(row.dress_id);
        tally[key] = (tally[key] || 0) + 1;
      });
      setReorderVelocity(tally);
    }
    setReorderLoading(false);
  }, []);

  // --- LOCATIONS & STOCK TRANSFER ---
  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('locations').select('*').order('name', { ascending: true });
      if (!error && data) setLocations(data);
    } catch (_) {
      // table not yet created — stays empty until migration_009 is run
    }
    // Set regardless of success/failure/empty-result — this just marks
    // "we've asked at least once," so the stale-location cleanup effect
    // can tell a real zero-locations state apart from not-loaded-yet.
    setLocationsLoaded(true);
  }, []);

  const fetchLocationStock = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('location_stock')
        .select(`*, locations ( id, name ), dresses ( id, name, barcode, size, color )`)
        .order('updated_at', { ascending: false });
      if (!error && data) setLocationStock(data);
    } catch (_) {
      // table not yet created
    }
  }, []);

  const fetchStockTransfers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stock_transfers')
        .select(`*, dresses ( name, barcode ), from_location:from_location_id ( name ), to_location:to_location_id ( name )`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) setStockTransfers(data);
    } catch (_) {
      // table not yet created
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (data) setSuppliers(data);
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

  // --- CURRENCY FETCH ---
  const fetchCurrencies = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('currencies').select('*').order('is_base', { ascending: false });
      if (!error && data) {
        setCurrencies(data);
        const base = data.find((c: any) => c.is_base);
        if (base && !posCurrencyCode) setPosCurrencyCode(base.code);
      }
    } catch (_) {
      // table not yet created — stays empty until migration_008 is run
    }
  }, [posCurrencyCode]);

  // Pulls the most recent rate per currency (exchange_rates keeps history,
  // so this is just "latest row per currency_code").
  const fetchExchangeRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(500);
      if (!error && data) {
        const latest: Record<string, { rate: number; fetchedAt: string }> = {};
        for (const row of data) {
          if (!latest[row.currency_code]) {
            latest[row.currency_code] = { rate: Number(row.rate_to_base), fetchedAt: row.fetched_at };
          }
        }
        setExchangeRates(latest);
      }
    } catch (_) {
      // table not yet created
    }
  }, []);

  // --- GIFT CARDS FETCH ---
  const fetchGiftCards = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false }).limit(500);
      if (!error && data) setGiftCards(data);
    } catch (_) {
      // table not yet created
    }
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
    if (!(await confirm({ message: `Revoke membership for ${member.phone}?`, danger: true }))) return;
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
      toast.error('Failed to save. Make sure migration_006 has been run.');
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

  // --- ACTIVE SELLING LOCATION ---
  // Reads a saved terminal location on first load (a shop's till is almost
  // always physically the same shop every day). Once `locations` loads from
  // the server, fills in a sensible default if nothing was saved yet:
  // the logged-in staff member's home location, or just the first location.
  useEffect(() => {
    const saved = localStorage.getItem('crave_abs_active_location');
    if (saved) setActiveLocationId(saved);
  }, []);

  useEffect(() => {
    if (activeLocationId || locations.length === 0) return;
    const fallback = (currentStaff as any)?.location_id
      ? String((currentStaff as any).location_id)
      : String(locations[0].id);
    setActiveLocationId(fallback);
  }, [locations, currentStaff, activeLocationId]);

  // If the location this terminal was set to (or the one Reports/Overview
  // was filtered to) gets deleted — including deleting every location
  // there is — fall back to "no location" / "All Locations" instead of
  // silently keeping a dangling id. Without this, checkout would try to
  // insert a sale referencing a location_id that no longer exists and the
  // whole sale would fail with a foreign-key error at the worst possible
  // moment (mid-checkout).
  useEffect(() => {
    if (!locationsLoaded) return; // don't act until we know the real list, not just the initial []
    if (activeLocationId && !locations.some((l: any) => String(l.id) === activeLocationId)) {
      setActiveLocationId('');
      localStorage.removeItem('crave_abs_active_location');
    }
    if (reportLocationId && !locations.some((l: any) => String(l.id) === reportLocationId)) {
      setReportLocationId('');
    }
  }, [locations, locationsLoaded, activeLocationId, reportLocationId]);

  const changeActiveLocation = (id: string) => {
    setActiveLocationId(id);
    localStorage.setItem('crave_abs_active_location', id);
  };

  // --- PRINT MODE ---
  // Both the receipt block and the label-sheet block live in the DOM at all
  // times (see the two blocks at the bottom of this file); a body class set
  // right before window.print() decides which one the @media print rule
  // actually shows, so printing one never also renders a blank page for the
  // other. The class is cleared once the print dialog closes.
  //
  // The @page size is injected as its own <style> tag rather than declared
  // as a named CSS page (e.g. "@page labels {}" + "page: labels;") because
  // named pages force a page-break wherever the page context switches away
  // from the default unnamed page — which produced a blank first page every
  // time, even with the content itself correctly hidden. A single unnamed
  // @page, resized right before each print, has no such transition to break on.
  const PRINT_PAGE_STYLE_ID = 'dynamic-print-page-size';
  useEffect(() => {
    const clearPrintMode = () => {
      document.body.classList.remove('printing-receipt', 'printing-labels');
      document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
    };
    window.addEventListener('afterprint', clearPrintMode);
    return () => window.removeEventListener('afterprint', clearPrintMode);
  }, []);
  const triggerPrint = (mode: 'receipt' | 'labels') => {
    document.body.classList.add(mode === 'receipt' ? 'printing-receipt' : 'printing-labels');
    document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
    const pageStyle = document.createElement('style');
    pageStyle.id = PRINT_PAGE_STYLE_ID;
    pageStyle.textContent = mode === 'receipt'
      ? '@media print { @page { size: 80mm auto; margin: 6mm 8mm; } }'
      : '@media print { @page { size: A4; margin: 10mm; } }';
    document.head.appendChild(pageStyle);
    window.print();
  };

  // --- CALCULATOR ---
  // A quick-access popup, not a page — available from the header on every
  // tab and to both roles (admin and salesman), since it's a plain utility
  // with no data of its own to restrict.
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcOperand, setCalcOperand] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<'+' | '-' | '×' | '÷' | null>(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);

  const calcCompute = (a: number, b: number, op: '+' | '-' | '×' | '÷'): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
    }
  };

  const calcInputDigit = (digit: string) => {
    if (calcDisplay === 'Error' || calcWaitingForOperand) {
      setCalcDisplay(digit);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const calcInputDecimal = () => {
    if (calcDisplay === 'Error' || calcWaitingForOperand) {
      setCalcDisplay('0.');
      setCalcWaitingForOperand(false);
      return;
    }
    if (!calcDisplay.includes('.')) setCalcDisplay(calcDisplay + '.');
  };

  const calcClear = () => {
    setCalcDisplay('0');
    setCalcOperand(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(false);
  };

  const calcBackspace = () => {
    if (calcDisplay === 'Error' || calcWaitingForOperand) return;
    setCalcDisplay(calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : '0');
  };

  const calcToggleSign = () => {
    if (calcDisplay === 'Error') return;
    setCalcDisplay(String(parseFloat(calcDisplay) * -1));
  };

  const calcPercent = () => {
    if (calcDisplay === 'Error') return;
    setCalcDisplay(String(parseFloat(calcDisplay) / 100));
  };

  const calcInputOperator = (nextOp: '+' | '-' | '×' | '÷') => {
    if (calcDisplay === 'Error') return;
    const inputValue = parseFloat(calcDisplay);
    if (calcOperand === null) {
      setCalcOperand(inputValue);
    } else if (calcOperator && !calcWaitingForOperand) {
      const result = calcCompute(calcOperand, inputValue, calcOperator);
      setCalcDisplay(Number.isFinite(result) ? String(result) : 'Error');
      setCalcOperand(Number.isFinite(result) ? result : null);
    }
    setCalcWaitingForOperand(true);
    setCalcOperator(nextOp);
  };

  const calcEquals = () => {
    if (calcDisplay === 'Error' || calcOperator === null || calcOperand === null) return;
    const inputValue = parseFloat(calcDisplay);
    const result = calcCompute(calcOperand, inputValue, calcOperator);
    setCalcDisplay(Number.isFinite(result) ? String(result) : 'Error');
    setCalcOperand(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(true);
  };

  // Close on Escape, and reset to a fresh calculation each time it's reopened.
  useEffect(() => {
    if (!showCalculator) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCalculator(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCalculator]);

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
    fetchSuppliers();
    fetchBusinessSettings();
    fetchTaxRates();
    fetchMembers();
    fetchMembershipSettings();
    fetchDailyCosts();
    fetchCurrencies();
    fetchExchangeRates();
    fetchGiftCards();
    fetchReorderVelocity();
    fetchLocations();
    fetchLocationStock();
    fetchStockTransfers();
  }, [fetchRecentInventory, fetchSalesData, fetchOverviewData, fetchCategories, fetchUnits, fetchBrands, fetchSuppliers, fetchBusinessSettings, fetchTaxRates, fetchMembers, fetchMembershipSettings, fetchDailyCosts, fetchCurrencies, fetchExchangeRates, fetchGiftCards, fetchReorderVelocity, fetchLocations, fetchLocationStock, fetchStockTransfers]);

  // --- REAL SUPABASE AUTH SESSION HANDLING ---
  // Replaces the old localStorage timer: Supabase's own client keeps the
  // session (and its refresh token) in localStorage under its own keys and
  // refreshes it automatically, so there's nothing custom to manage here —
  // just ask it for the current session once, then listen for changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        // Role lives in app_metadata (NOT user_metadata) because only the
        // Admin API / SQL editor can write app_metadata — a signed-in user
        // can never call supabase.auth.updateUser() to grant themselves
        // 'admin'. Any account without a role set is treated as admin, so
        // the existing single-admin login keeps working unchanged.
        const role = deriveAccountRole(session.user.app_metadata?.role);
        setUserRole(role);
        loadAuthenticatedData();
      }
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        const role = deriveAccountRole(session.user.app_metadata?.role);
        setUserRole(role);
        loadAuthenticatedData();
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserRole(null);
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

  // Sends a real emailed confirmation link (via Supabase Auth's own
  // recovery-email system — Gmail, or whatever inbox the account uses)
  // rather than resetting anything directly here. The person has to click
  // that link — which proves they control the inbox — before they land on
  // /reset-password and can actually set a new password. This is the
  // self-service counterpart to the admin-only "Reset Password" button in
  // Account Logins: that one is for an admin resetting someone else's
  // password directly; this one is for someone resetting their own without
  // needing an admin at all.
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSubmitting(false);
    if (error) {
      setForgotError('Something went wrong sending that email. Try again in a moment.');
    } else {
      // Deliberately the same message whether or not that email actually
      // has an account — confirming which emails are registered would let
      // someone probe for valid staff logins.
      setForgotSent(true);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
  };

  // --- POS FUNCTIONS ---
  // Shared by barcode scan AND clicking a tile in the product grid — both
  // paths land here so stock-limit checks and cart merging only live once.
  // Returns true/false so callers (e.g. the variant picker) can react.
  const addItemToCart = (data: any): boolean => {
    setPosMessage({ type: '', text: '' });
    const existingCartItem = cart.find(item => item.id === data.id);
    const currentCartQty = existingCartItem ? existingCartItem.cartQty : 0;

    if (currentCartQty + 1 > data.quantity) {
      setPosMessage({ type: 'error', text: `Not enough stock available for "${variantLabel(data)}"!` });
      return false;
    }
    if (existingCartItem) {
      setCart(cart.map(item => item.id === data.id ? { ...item, cartQty: item.cartQty + 1 } : item));
    } else {
      setCart([...cart, { ...data, cartQty: 1 }]);
    }
    return true;
  };

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
      addItemToCart(data);
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
    if (splitPaymentMode && splitRemaining > 0) {
      setPosMessage({ type: 'error', text: `Payment lines still ৳${splitRemaining} short of the total.` });
      return;
    }

    const subtotal = cart.reduce((total, item) => total + item.price * item.cartQty, 0);
    const discount = Math.min(Math.max(parseFloat(discountAmount) || 0, 0), subtotal);
    const promoDiscount = appliedPromo ? Math.min(appliedPromo.discountAmount, subtotal - discount) : 0;
    const redeemValue = posCustomer ? Math.min(Math.max(parseInt(redeemPoints) || 0, 0), maxRedeemablePoints) * LOYALTY_REDEEM_VALUE : 0;
    const redeemPointsUsed = LOYALTY_REDEEM_VALUE > 0 ? Math.round(redeemValue / LOYALTY_REDEEM_VALUE) : 0;
    const combinedDiscount = discount + promoDiscount + redeemValue;
    const subtotalAfterDiscount = subtotal - combinedDiscount;
    const activeTaxRate = taxRates.find((t: any) => String(t.id) === selectedTaxRateId);
    const taxTotal = activeTaxRate ? Math.round(subtotalAfterDiscount * (Number(activeTaxRate.rate_percent) / 100)) : 0;

    // Any manual discount on a role without apply_discount needs a
    // manager/admin PIN before the sale is recorded. (Membership discounts
    // and tax are unaffected — this only covers the free-form Discount
    // field in the cart.)
    let discountApprover: { id: string; full_name: string } | null = null;
    if (discount > 0 && !hasPermission(actingStaffRole(currentStaff), 'apply_discount')) {
      discountApprover = await requestManagerApproval(`Applying a ৳${discount} discount`);
      if (!discountApprover) {
        setPosMessage({ type: 'error', text: 'Discount cancelled — manager approval was required.' });
        return;
      }
    }

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
    let remainingPromoDiscount = promoDiscount;
    let remainingRedeem = redeemValue;
    let remainingTax = taxTotal;

    const dbPaymentMethod = splitPaymentMode ? 'split' : (paymentMethod === 'bank/card' ? 'cash' : paymentMethod);
    const dbTrxId = splitPaymentMode
      ? 'SPLIT-SALE'
      : (paymentMethod === 'bank/card' ? 'BANK/CARD-SALE' : (paymentMethod === 'cash' ? 'DIRECT-SALE' : trxId));

    const salesData = units.map((item, idx) => {
      const isLast = idx === units.length - 1;
      const rowDiscount = isLast ? remainingDiscount : (subtotal > 0 ? Math.round((item.price / subtotal) * discount) : 0);
      if (!isLast) remainingDiscount -= rowDiscount;
      const rowPromoDiscount = isLast ? remainingPromoDiscount : (subtotal > 0 ? Math.round((item.price / subtotal) * promoDiscount) : 0);
      if (!isLast) remainingPromoDiscount -= rowPromoDiscount;
      const rowRedeem = isLast ? remainingRedeem : (subtotal > 0 ? Math.round((item.price / subtotal) * redeemValue) : 0);
      if (!isLast) remainingRedeem -= rowRedeem;
      const rowTax = isLast ? remainingTax : (subtotal > 0 ? Math.round((item.price / subtotal) * taxTotal) : 0);
      if (!isLast) remainingTax -= rowTax;

      return {
        dress_id: item.id,
        payment_method: dbPaymentMethod,
        transaction_id: dbTrxId,
        amount_paid: item.price - rowDiscount - rowPromoDiscount - rowRedeem + rowTax,
        discount_amount: rowDiscount,
        promo_discount_amount: rowPromoDiscount,
        promotion_id: promoDiscount > 0 ? appliedPromo?.promotion.id ?? null : null,
        tax_amount: rowTax,
        status: 'completed',
        staff_id: currentStaff?.id ?? null,
        customer_id: posCustomer?.id ?? null,
        location_id: activeLocationId || null,
      };
    });

    const { data: insertedSales, error: saleError } = await supabase.from('sales').insert(salesData).select();

    if (saleError || !insertedSales) {
      console.error(saleError);
      setPosMessage({ type: 'error', text: 'Checkout failed. Check console for details.' });
      return;
    }

    // Record the actual payment breakdown into `payments` — one row per
    // tender, all linked to the first sale row from this checkout (sales
    // itself stays one-row-per-unit for stock/reporting; `payments` is the
    // audit trail of HOW it was paid, which matters once a sale can be
    // split across several methods). Gift-card lines also debit that
    // card's balance right here.
    const anchorSaleId = insertedSales[0]?.id;
    if (anchorSaleId && splitPaymentMode) {
      const paymentRows = cartPayments.map(p => ({
        sale_id: anchorSaleId,
        method: p.method,
        amount: parseFloat(p.amount) || 0,
        currency_code: posCurrencyCode || null,
        transaction_id: p.method === 'gift_card' ? p.giftCardCode.trim().toUpperCase() : (p.trxId || null),
      }));
      await supabase.from('payments').insert(paymentRows);

      for (const p of cartPayments) {
        if (p.method === 'gift_card' && p.giftCardCode) {
          const code = p.giftCardCode.trim().toUpperCase();
          const { data: gc } = await supabase.from('gift_cards').select('*').eq('code', code).maybeSingle();
          if (gc) {
            const newBalance = Number(gc.current_balance) - (parseFloat(p.amount) || 0);
            await supabase.from('gift_cards').update({ current_balance: newBalance, status: newBalance <= 0 ? 'redeemed' : 'active' }).eq('id', gc.id);
            await supabase.from('gift_card_transactions').insert([{ gift_card_id: gc.id, sale_id: anchorSaleId, type: 'redeem', amount: -(parseFloat(p.amount) || 0) }]);
          }
        }
      }
    } else if (anchorSaleId) {
      // Single-method checkout — still logged to `payments` so both modes
      // leave the same kind of audit trail.
      await supabase.from('payments').insert([{
        sale_id: anchorSaleId,
        method: paymentMethod,
        amount: cartTotal,
        currency_code: posCurrencyCode || null,
        transaction_id: dbTrxId,
      }]);
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

      // Keep the per-location breakdown in sync too — only if this exact
      // product has actually been assigned to the active location before
      // (via Stock Transfer). If it hasn't, there's no location_stock row
      // to decrement yet; the business-wide total above still moves either
      // way, this just skips updating a per-shop number that was never set.
      if (activeLocationId) {
        const { data: locRow } = await supabase
          .from('location_stock')
          .select('id, quantity')
          .eq('dress_id', item.id)
          .eq('location_id', activeLocationId)
          .maybeSingle();
        if (locRow) {
          const newLocQty = Math.max(0, Number(locRow.quantity) - item.cartQty);
          await supabase.from('location_stock').update({ quantity: newLocQty, updated_at: new Date().toISOString() }).eq('id', locRow.id);
        }
      }
    }

    if (discount > 0 && discountApprover) {
      logAudit({
        action: 'discount_override',
        entityType: 'sale',
        entityId: anchorSaleId,
        after: { discount, subtotal },
        reason: `Discount of ৳${discount} on a ৳${subtotal} sale`,
        actor: currentStaff,
        actorAccountRole: userRole,
        approvedBy: discountApprover,
      });
    }

    // Best-effort usage counter — never blocks the sale if it fails.
    if (promoDiscount > 0 && appliedPromo) {
      supabase.from('promotions').update({ times_used: appliedPromo.promotion.times_used + 1 }).eq('id', appliedPromo.promotion.id);
    }

    // Loyalty: redeem what was spent, earn on the final amount actually
    // paid (after every discount, so points aren't earned on money that
    // was never collected). Both best-effort — never blocks the sale.
    if (posCustomer) {
      const finalTotal = subtotalAfterDiscount + taxTotal;
      const pointsEarned = pointsEarnedFor(finalTotal);
      const netPoints = posCustomer.loyalty_points - redeemPointsUsed + pointsEarned;
      supabase.from('customers').update({
        loyalty_points: netPoints,
        total_spent: Number(posCustomer.total_spent) + finalTotal,
        visit_count: posCustomer.visit_count + 1,
      }).eq('id', posCustomer.id).then();
      const loyaltyRows: any[] = [];
      if (redeemPointsUsed > 0) {
        loyaltyRows.push({ customer_id: posCustomer.id, type: 'redeem', points: -redeemPointsUsed, related_sale_id: anchorSaleId, staff_id: currentStaff?.id ?? null });
      }
      if (pointsEarned > 0) {
        loyaltyRows.push({ customer_id: posCustomer.id, type: 'earn', points: pointsEarned, related_sale_id: anchorSaleId, staff_id: currentStaff?.id ?? null });
      }
      if (loyaltyRows.length > 0) supabase.from('loyalty_transactions').insert(loyaltyRows);
    }

    setPosMessage({ type: 'success', text: 'Sale recorded! Printing receipt...' });

    setTimeout(() => {
      triggerPrint('receipt');
      setCart([]);
      setTrxId('');
      setDiscountAmount('0');
      setSelectedTaxRateId('');
      setPromoCode('');
      setAppliedPromo(null);
      setPromoMessage('');
      setPosCustomer(null);
      setCustomerLookup('');
      setCustomerMessage('');
      setRedeemPoints('');
      setCartPayments([]);
      setSplitPaymentDraft({ method: 'cash', amount: '', trxId: '', giftCardCode: '' });
      fetchRecentInventory();
      fetchSalesData();
      fetchOverviewData();
      fetchGiftCards();
    }, 500);
  };

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.cartQty), 0);
  const cartDiscountValue = Math.min(Math.max(parseFloat(discountAmount) || 0, 0), cartSubtotal);
  const cartPromoValue = appliedPromo ? Math.min(appliedPromo.discountAmount, cartSubtotal - cartDiscountValue) : 0;
  const maxRedeemablePoints = posCustomer ? Math.min(posCustomer.loyalty_points, Math.floor((cartSubtotal - cartDiscountValue - cartPromoValue) / LOYALTY_REDEEM_VALUE)) : 0;
  const cartRedeemValue = Math.min(Math.max(parseInt(redeemPoints) || 0, 0), maxRedeemablePoints) * LOYALTY_REDEEM_VALUE;
  const cartSubtotalAfterDiscount = cartSubtotal - cartDiscountValue - cartPromoValue - cartRedeemValue;
  const cartActiveTaxRate = taxRates.find((t: any) => String(t.id) === selectedTaxRateId);
  const cartTaxValue = cartActiveTaxRate ? Math.round(cartSubtotalAfterDiscount * (Number(cartActiveTaxRate.rate_percent) / 100)) : 0;
  const cartTotal = cartSubtotalAfterDiscount + cartTaxValue;

  // Auto-detect tiered/bulk/BOGO/seasonal promotions (no code needed) any
  // time the cart changes. A typed coupon code is evaluated separately by
  // applyPromoCode() below and takes priority while a code is entered.
  useEffect(() => {
    if (promoCode.trim()) return; // a typed code is handled by applyPromoCode instead
    if (cart.length === 0) { setAppliedPromo(null); return; }
    let cancelled = false;
    evaluateBestPromotion(cart, '').then(result => { if (!cancelled) setAppliedPromo(result); });
    return () => { cancelled = true; };
  }, [cart, promoCode]);

  const applyPromoCode = async () => {
    setPromoMessage('');
    if (!promoCode.trim()) { setAppliedPromo(null); return; }
    const result = await evaluateBestPromotion(cart, promoCode);
    if (!result) {
      setPromoMessage('That code doesn\'t apply to this cart.');
      setAppliedPromo(null);
    } else {
      setAppliedPromo(result);
      setPromoMessage(`Applied: ${result.promotion.name}`);
    }
  };

  const lookupPosCustomer = async () => {
    setCustomerMessage('');
    const q = customerLookup.trim();
    if (!q) { setCustomerSearchResults([]); return; }
    // Partial match on name OR phone — the old version required the phone
    // to match exactly, so a leading zero, a space, or searching by name
    // instead of phone all silently returned nothing. This is what made
    // the customer-lookup step feel like it wasn't there at all.
    const { data } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(6);
    setCustomerSearchResults(data || []);
    if (!data || data.length === 0) {
      setCustomerMessage('No match — add them below, or continue without a customer.');
    }
  };
  // Search as you type (debounced), same pattern as the Customers tab.
  useEffect(() => {
    if (posCustomer) return; // already picked one — no need to keep searching
    const t = setTimeout(() => { if (customerLookup.trim()) lookupPosCustomer(); else setCustomerSearchResults([]); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerLookup]);

  const quickAddPosCustomer = async () => {
    if (!quickAddName.trim()) return;
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name: quickAddName.trim(), phone: quickAddPhone.trim() || null }])
      .select()
      .single();
    if (error) { setCustomerMessage("Couldn't add customer — try the Customers tab instead."); return; }
    setPosCustomer(data);
    setCustomerSearchResults([]);
    setShowQuickAddCustomer(false);
    setQuickAddName('');
    setQuickAddPhone('');
    setCustomerMessage('');
  };

  // Split-payment running total — lines must add up to cartTotal (in base
  // currency; a gift-card or cash line is always entered/stored in base
  // currency even if the customer is viewing the total in a foreign one).
  const splitPaidSoFar = cartPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const splitRemaining = Math.max(0, Math.round((cartTotal - splitPaidSoFar) * 100) / 100);

  const addSplitPaymentLine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSplitPaymentMessage({ type: '', text: '' });
    const amt = parseFloat(splitPaymentDraft.amount);
    if (!amt || amt <= 0) {
      setSplitPaymentMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    if (amt > splitRemaining + 0.01) {
      setSplitPaymentMessage({ type: 'error', text: `That's more than the ৳${splitRemaining} still due.` });
      return;
    }
    if (splitPaymentDraft.method === 'gift_card') {
      const code = splitPaymentDraft.giftCardCode.trim().toUpperCase();
      if (!code) { setSplitPaymentMessage({ type: 'error', text: 'Enter the gift card code.' }); return; }
      const { data: gc } = await supabase.from('gift_cards').select('*').eq('code', code).maybeSingle();
      if (!gc || gc.status !== 'active') {
        setSplitPaymentMessage({ type: 'error', text: 'Gift card not found, or not active.' });
        return;
      }
      if (Number(gc.current_balance) < amt) {
        setSplitPaymentMessage({ type: 'error', text: `That card only has ৳${gc.current_balance} left.` });
        return;
      }
    }
    setCartPayments(prev => [...prev, { ...splitPaymentDraft, amount: String(amt) }]);
    setSplitPaymentDraft({ method: 'cash', amount: '', trxId: '', giftCardCode: '' });
  };
  const removeSplitPaymentLine = (index: number) => {
    setCartPayments(prev => prev.filter((_, i) => i !== index));
  };

  // --- INVENTORY ADD FUNCTIONS ---
  // Random 8–12 digit barcode, checked against the live table so it can never
  // collide with an existing product (owner never has to make one up by hand).
  // Takes a variant row index since each variant needs its own unique code.
  const generateUniqueBarcodeForVariant = async (index: number) => {
    setInvVariants(prev => prev.map((v, i) => (i === index ? { ...v, generating: true } : v)));
    setInvMessage({ type: '', text: '' });
    try {
      for (let attempt = 0; attempt < 20; attempt++) {
        const length = 8 + Math.floor(Math.random() * 5); // 8..12 digits
        let code = '';
        for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10).toString();
        const { data, error } = await supabase.from('dresses').select('barcode').eq('barcode', code).maybeSingle();
        if (!error && !data) {
          setInvVariants(prev => prev.map((v, i) => (i === index ? { ...v, barcode: code } : v)));
          return;
        }
      }
      setInvMessage({ type: 'error', text: 'Could not find a free code after several tries — please click Generate again.' });
    } finally {
      setInvVariants(prev => prev.map((v, i) => (i === index ? { ...v, generating: false } : v)));
    }
  };

  const addVariantRow = () => {
    setInvVariants(prev => [...prev, { barcode: '', size: '', color: '', price: prev[prev.length - 1]?.price || '', quantity: '1', reorderPoint: prev[prev.length - 1]?.reorderPoint || '', generating: false }]);
  };
  const removeVariantRow = (index: number) => {
    setInvVariants(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };
  const updateVariantField = (index: number, field: 'barcode' | 'size' | 'color' | 'price' | 'quantity' | 'reorderPoint', value: string) => {
    setInvVariants(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  // --- SIZE/COLOR MATRIX ---
  // Builds every (size × color) combination from the two comma-separated
  // inputs and shows them as a tickable grid — standard clothing-retail
  // pattern (e.g. a t-shirt in S/M/L/XL × Red/Blue/Black = 12 combinations)
  // instead of typing each variant row by hand.
  const generateMatrixGrid = () => {
    const sizes = matrixSizesInput.split(',').map(s => s.trim()).filter(Boolean);
    const colors = matrixColorsInput.split(',').map(c => c.trim()).filter(Boolean);
    if (sizes.length === 0) {
      setInvMessage({ type: 'error', text: 'Enter at least one size to build the matrix (colors are optional).' });
      return;
    }
    const combos: { size: string; color: string }[] = [];
    const colorList = colors.length > 0 ? colors : [''];
    for (const size of sizes) {
      for (const color of colorList) {
        combos.push({ size, color });
      }
    }
    setMatrixCombos(combos);
    const selected: Record<string, boolean> = {};
    combos.forEach(c => { selected[`${c.size}|${c.color}`] = true; });
    setMatrixSelected(selected);
  };

  const toggleMatrixCell = (size: string, color: string) => {
    const key = `${size}|${color}`;
    setMatrixSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Pushes every ticked combination into invVariants (replacing the single
  // still-blank default row, if that's all there is, rather than leaving
  // an empty row alongside the generated ones).
  const applyMatrixToVariants = () => {
    const selectedCombos = matrixCombos.filter(c => matrixSelected[`${c.size}|${c.color}`]);
    if (selectedCombos.length === 0) {
      setInvMessage({ type: 'error', text: 'Tick at least one combination in the matrix first.' });
      return;
    }
    const newRows = selectedCombos.map(c => ({
      barcode: '', size: c.size, color: c.color,
      price: matrixPrice, quantity: matrixQty || '1', reorderPoint: '', generating: false,
    }));
    setInvVariants(prev => {
      const isSingleBlankRow = prev.length === 1 && !prev[0].barcode && !prev[0].size && !prev[0].color;
      return isSingleBlankRow ? newRows : [...prev, ...newRows];
    });
    setMatrixCombos([]);
    setMatrixSelected({});
    setInvMessage({ type: 'success', text: `Added ${newRows.length} variant row(s) from the matrix — scroll down to fill in barcodes.` });
  };

  // Runs the existing per-row barcode generator across every variant row
  // that doesn't have one yet, sequentially (each checks uniqueness against
  // the live table, so they must run one at a time, not in parallel).
  const [generatingAllBarcodes, setGeneratingAllBarcodes] = useState(false);
  const generateAllMissingBarcodes = async () => {
    setGeneratingAllBarcodes(true);
    for (let i = 0; i < invVariants.length; i++) {
      if (!invVariants[i].barcode.trim()) {
        await generateUniqueBarcodeForVariant(i);
      }
    }
    setGeneratingAllBarcodes(false);
  };

  // Resizes + re-encodes an image in the browser before it ever reaches
  // Supabase Storage. A raw phone-camera photo is routinely 3-8MB; capped
  // at 1000px on the longest side and re-encoded as JPEG at 82% quality,
  // the same photo typically lands around 150-300KB — roughly a 20x
  // reduction — with no visible quality loss at the sizes this app
  // actually displays images (label thumbnails, product cards). This is
  // what makes the difference between a product catalog's photos fitting
  // in ~1GB vs needing 20+GB of Storage.
  // { imageOrientation: 'from-image' } makes sure a photo taken in
  // portrait on a phone doesn't come out sideways — createImageBitmap
  // ignores EXIF rotation by default otherwise.
  // Falls back to the original file untouched if anything about this
  // fails (old-browser edge case, non-image file, decode error, or the
  // "compressed" result somehow isn't actually smaller) — compression is
  // a nice-to-have, never a reason an upload should fail.
  const compressImageFile = async (file: File, maxDimension = 1000, quality = 0.82): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as any);
      let { width, height } = bitmap;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob || blob.size >= file.size) return file;

      const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], newName, { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  // Uploads to the "product-images" Storage bucket and returns the public
  // URL to store on the row. Path is prefixed with the barcode so re-running
  // this for the same product overwrites cleanly rather than piling up.
  const uploadProductImage = async (file: File, barcode: string): Promise<string | null> => {
    const compressed = await compressImageFile(file);
    const ext = compressed.name.split('.').pop() || 'jpg';
    const path = `${barcode}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, compressed, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) return null;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleInvImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvImageFile(file);
    setInvImagePreview(URL.createObjectURL(file));
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMessage({ type: '', text: '' });

    for (const v of invVariants) {
      if (!v.barcode.trim() || !v.price.trim()) {
        setInvMessage({ type: 'error', text: 'Every variant needs a barcode and a price.' });
        return;
      }
    }
    const barcodesInForm = invVariants.map(v => v.barcode.trim());
    if (new Set(barcodesInForm).size !== barcodesInForm.length) {
      setInvMessage({ type: 'error', text: 'Two variants have the same barcode — each one needs its own.' });
      return;
    }

    let imageUrl: string | null = null;
    if (invImageFile) {
      setInvImageUploading(true);
      imageUrl = await uploadProductImage(invImageFile, invVariants[0].barcode.trim());
      setInvImageUploading(false);
      if (!imageUrl) {
        setInvMessage({ type: 'error', text: 'Photo upload failed. Make sure the "product-images" storage bucket exists (see setup note), then try again.' });
        return;
      }
    }

    // Variants of the same product share this id so List Products can group
    // them back into one card even though each is its own database row.
    const groupId = crypto.randomUUID();
    const rows = invVariants.map(v => {
      const qty = parseInt(v.quantity) || 0;
      return {
        barcode: v.barcode.trim(),
        name: invName,
        category: invCategory,
        brand: invBrand || null,
        unit: invUnit || 'Piece',
        size: v.size.trim() || null,
        color: v.color.trim() || null,
        group_id: groupId,
        price: parseFloat(v.price),
        quantity: qty,
        reorder_point: v.reorderPoint.trim() ? parseInt(v.reorderPoint) : null,
        status: qty > 0 ? 'available' : 'sold',
        image_url: imageUrl,
        tax_rate_id: invTaxRateId || null,
      };
    });

    const { error } = await supabase.from('dresses').insert(rows);
    if (error) {
      setInvMessage({ type: 'error', text: 'Failed to add item. A barcode might already exist, or the size/color/group_id/reorder_point columns may be missing (see setup note).' });
    } else {
      const totalQty = rows.reduce((sum, r) => sum + r.quantity, 0);
      setInvMessage({ type: 'success', text: `Successfully stocked ${rows.length} variant(s), ${totalQty} item(s) total!` });
      setInvName(''); setInvCategory(''); setInvBrand(''); setInvUnit('Piece'); setInvTaxRateId('');
      setInvVariants([{ barcode: '', size: '', color: '', price: '', quantity: '1', reorderPoint: '', generating: false }]);
      setMatrixSizesInput(''); setMatrixColorsInput(''); setMatrixPrice(''); setMatrixQty('1');
      setMatrixCombos([]); setMatrixSelected({});
      setInvImageFile(null); setInvImagePreview('');
      fetchRecentInventory();
    }
  };

  // Replaces the photo on an existing product directly from the List
  // Products row — no need to open a separate edit form just for this.
  const handleReplacePhoto = async (item: any, file: File) => {
    if (!hasPermission(userRole, 'edit_inventory')) return;
    setPhotoUploadingId(item.id);
    const imageUrl = await uploadProductImage(file, item.barcode);
    if (!imageUrl) {
      toast.error('Photo upload failed. Make sure the "product-images" storage bucket exists (see setup note).');
      setPhotoUploadingId(null);
      return;
    }
    const { error } = await supabase.from('dresses').update({ image_url: imageUrl }).eq('id', item.id);
    setPhotoUploadingId(null);
    if (error) {
      toast.error('Failed to save the new photo. Please try again.');
    } else {
      fetchRecentInventory();
    }
  };

  // Business logo — uploaded once here instead of being a static file
  // shipped with the code, so it can be changed without a redeploy. Reuses
  // the same "product-images" Storage bucket as product photos (no need
  // for a second bucket/policy just for one image), under a "branding/"
  // path so it's easy to spot in the bucket. Saved straight to
  // business_settings.logo_url on upload — no separate Save click, same
  // as replacing a product photo.
  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    const compressed = await compressImageFile(file);
    const ext = compressed.name.split('.').pop() || 'png';
    const path = `branding/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, compressed, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) {
      toast.error('Logo upload failed. Make sure the "product-images" storage bucket exists.');
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    const { error } = await supabase.from('business_settings').update({ logo_url: data.publicUrl }).eq('id', 1);
    setLogoUploading(false);
    if (error) {
      toast.error('Uploaded, but failed to save it to Business Settings. Try again.');
    } else {
      setBusinessSettings((prev) => ({ ...prev, logo_url: data.publicUrl }));
      toast.success('Logo updated — it\'ll now print on labels and receipts.');
    }
  };

  // Short "Size / Color" tag for a variant, used anywhere a product name is
  // shown (POS, cart, receipts, ledgers, labels) so the specific variant is
  // never ambiguous once a product has more than one.
  const variantTag = (item: any): string => {
    const parts = [item?.size, item?.color].filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : '';
  };
  const variantLabel = (item: any): string => {
    const tag = variantTag(item);
    return tag ? `${item.name} (${tag})` : (item?.name ?? '');
  };

  // Per-item reorder point when the admin set one on that variant,
  // otherwise the shop-wide default (LOW_STOCK_THRESHOLD) — this is what
  // "low stock" means everywhere in the app now, instead of one fixed
  // number for every product regardless of how fast it actually sells.
  const effectiveReorderPoint = (item: any): number =>
    item?.reorder_point != null && item.reorder_point !== '' ? Number(item.reorder_point) : LOW_STOCK_THRESHOLD;

  // --- PRINT LABELS ---
  const addToLabelQueue = (item: any) => {
    const rate = taxRates.find((t: any) => t.id === item.tax_rate_id);
    // Rounded to match how money is shown everywhere else in the app (no
    // decimals) — a label showing ৳2512.5 would look like a typo next to
    // every other whole-taka price on it.
    const total = rate ? Math.round(item.price * (1 + rate.rate_percent / 100)) : item.price;
    setLabelQueue(prev => {
      if (prev.some(l => l.id === item.id)) return prev;
      return [...prev, { id: item.id, barcode: item.barcode, name: item.name, category: item.category || '', brand: item.brand || '', variant: variantTag(item), price: item.price, qty: 1, taxLabel: rate ? `${rate.name} ${rate.rate_percent}%` : '', total }];
    });
    setLabelQtyDraft(prev => ({ ...prev, [item.id]: '1' }));
    setLabelSearchQuery('');
  };
  const setLabelQueueQty = (id: any, qtyStr: string) => {
    setLabelQtyDraft(prev => ({ ...prev, [id]: qtyStr }));
    const qty = Math.max(1, parseInt(qtyStr) || 1);
    setLabelQueue(prev => prev.map(l => (l.id === id ? { ...l, qty } : l)));
  };
  const removeFromLabelQueue = (id: any) => setLabelQueue(prev => prev.filter(l => l.id !== id));
  const clearLabelQueue = () => { setLabelQueue([]); setLabelQtyDraft({}); };
  const totalLabelCount = labelQueue.reduce((sum, l) => sum + l.qty, 0);

  // --- INVENTORY EDIT / ARCHIVE FUNCTIONS ---
  // Salesman accounts get read-only access to List Products: they can see
  // stock, but never edit details, change the photo, or archive/restore an
  // item. Every mutating function below re-checks the role itself (not just
  // hiding the triggering button) so there's no path — current or future —
  // that lets a salesman session slip through and write to a product.
  // Barcode is left out of the editable fields since it's the lookup key
  // used at the POS counter and in refund search.
  const startEditInventory = (item: any) => {
    if (!hasPermission(userRole, 'edit_inventory')) return;
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      unit: item.unit || 'Piece',
      size: item.size || '',
      color: item.color || '',
      price: String(item.price),
      quantity: String(item.quantity),
      reorder_point: item.reorder_point != null ? String(item.reorder_point) : '',
      tax_rate_id: item.tax_rate_id || '',
    });
  };

  const cancelEditInventory = () => {
    setEditingId(null);
  };

  const saveEditInventory = async (id: any) => {
    if (!hasPermission(userRole, 'edit_inventory')) return;
    const before = recentInventory.find((it: any) => it.id === id) || null;
    const qty = parseInt(editDraft.quantity);
    const price = parseFloat(editDraft.price);
    const afterPayload = {
      name: editDraft.name,
      category: editDraft.category,
      brand: editDraft.brand || null,
      unit: editDraft.unit || 'Piece',
      size: editDraft.size.trim() || null,
      color: editDraft.color.trim() || null,
      price,
      quantity: qty,
      reorder_point: editDraft.reorder_point.trim() ? parseInt(editDraft.reorder_point) : null,
      status: qty > 0 ? 'available' : 'sold',
      tax_rate_id: editDraft.tax_rate_id || null,
    };
    const { error } = await supabase.from('dresses').update(afterPayload).eq('id', id);

    if (error) {
      toast.error('Failed to save changes. Please try again.');
    } else {
      setEditingId(null);
      fetchRecentInventory();
      logAudit({
        action: 'edit',
        entityType: 'dress',
        entityId: id,
        before,
        after: afterPayload,
        actor: currentStaff,
        actorAccountRole: userRole,
      });
    }
  };

  // Archiving (rather than deleting) protects sales history: the sales
  // table references dress_id with ON DELETE CASCADE, so a hard delete
  // would silently wipe that item's transaction record from your reports.
  // Anyone who can edit inventory can void directly; anyone else can still
  // trigger it, but needs a manager/admin PIN to actually go through — same
  // "approve or cancel" pattern as a refund below.
  const archiveInventoryItem = async (item: any) => {
    if (!(await confirm({ message: `Archive (void) "${item.name}"? It will be hidden from the POS and active stock list, but its sales history stays intact. You can restore it anytime.`, danger: true }))) return;

    let approver: { id: string; full_name: string } | null = null;
    if (!hasPermission(actingStaffRole(currentStaff), 'void_action')) {
      approver = await requestManagerApproval(`Voiding "${item.name}"`);
      if (!approver) return; // cancelled or PIN rejected
    }

    const { error } = await supabase
      .from('dresses')
      .update({ status: 'archived', quantity: 0 })
      .eq('id', item.id);
    if (error) {
      toast.error('Failed to archive item.');
    } else {
      fetchRecentInventory();
      logAudit({
        action: 'void',
        entityType: 'dress',
        entityId: item.id,
        before: { status: item.status, quantity: item.quantity },
        after: { status: 'archived', quantity: 0 },
        actor: currentStaff,
        actorAccountRole: userRole,
        approvedBy: approver,
      });
    }
  };

  const restoreInventoryItem = async (item: any) => {
    if (!hasPermission(userRole, 'edit_inventory')) return;
    const { error } = await supabase
      .from('dresses')
      .update({ status: 'available' })
      .eq('id', item.id);
    if (error) {
      toast.error('Failed to restore item.');
    } else {
      fetchRecentInventory();
    }
  };

  // "Product Stock History" — every completed/refunded sale row that
  // touched this exact barcode, newest first. Reuses the same `sales`
  // table the Reports/Refunds tabs already query, just filtered to one
  // dress_id instead of a date range.
  const openStockHistory = async (item: any) => {
    setHistoryItem(item);
    setHistoryLoading(true);
    setHistoryRows([]);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('dress_id', item.id)
      .order('sold_at', { ascending: false })
      .limit(100);
    if (!error && data) setHistoryRows(data);
    setHistoryLoading(false);
  };

  // --- UPDATE PRICE (focused quick-edit) ---
  const saveQuickPrice = async (id: any) => {
    const newPrice = parseFloat(priceDraftValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Enter a valid price.');
      return;
    }
    const before = priceSearchResults.find((it: any) => it.id === id) || null;
    const { error } = await supabase.from('dresses').update({ price: newPrice }).eq('id', id);
    if (error) {
      toast.error('Failed to update price.');
    } else {
      setPriceDraftId(null);
      setPriceDraftValue('');
      fetchRecentInventory();
      logAudit({
        action: 'edit',
        entityType: 'dress',
        entityId: id,
        before: before ? { price: before.price } : null,
        after: { price: newPrice },
        actor: currentStaff,
        actorAccountRole: userRole,
      });
    }
  };

  // --- CATEGORIES CRUD ---
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
    if (error) {
      toast.error('Failed to add category. It may already exist.');
    } else {
      setNewCategoryName('');
      fetchCategories();
    }
  };

  const deleteCategory = async (id: any, name: string) => {
    if (!(await confirm({ message: `Remove "${name}" from your category list? Existing products keep their value — it just won't be offered as a dropdown option anymore.`, danger: true }))) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories();
  };

  // --- UNITS CRUD ---
  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    const { error } = await supabase.from('units').insert([{ name: newUnitName.trim(), short_code: newUnitCode.trim() || null }]);
    if (error) {
      toast.error('Failed to add unit. It may already exist.');
    } else {
      setNewUnitName(''); setNewUnitCode('');
      fetchUnits();
    }
  };

  const deleteUnit = async (id: any) => {
    if (!(await confirm({ message: 'Remove this unit?', danger: true }))) return;
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (!error) fetchUnits();
  };

  // --- BRANDS CRUD ---
  const addBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const { error } = await supabase.from('brands').insert([{ name: newBrandName.trim() }]);
    if (error) {
      toast.error('Failed to add brand. It may already exist.');
    } else {
      setNewBrandName('');
      fetchBrands();
    }
  };

  const deleteBrand = async (id: any) => {
    if (!(await confirm({ message: 'Remove this brand?', danger: true }))) return;
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (!error) fetchBrands();
  };

  // --- LOCATIONS CRUD ---
  const addLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationMessage({ type: '', text: '' });
    if (!newLocationName.trim()) return;
    const { error } = await supabase.from('locations').insert([{ name: newLocationName.trim(), address: newLocationAddress.trim() || null }]);
    if (error) {
      setLocationMessage({ type: 'error', text: 'Failed to add location. It may already exist, or migration_009 hasn\'t been run yet.' });
    } else {
      setNewLocationName(''); setNewLocationAddress('');
      fetchLocations();
    }
  };

  const deleteLocation = async (id: any, name: string) => {
    if (!(await confirm({ message: `Remove "${name}"? Its stock-transfer history stays, but it won't be selectable for new transfers.`, danger: true }))) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      // Most likely cause: this location is still the destination of a
      // stock transfer (that one reference is intentionally left blocking
      // — see migration_014). Surfacing it beats silently doing nothing.
      toast.error(`Couldn't remove "${name}": ${error.message}`);
      return;
    }
    fetchLocations();
  };

  // --- STOCK TRANSFER ---
  // Finds the product by barcode (same pattern as Add Purchase / Refund
  // search) so the transfer screen works with a scanner, not just typing.
  const handleTransferBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMessage({ type: '', text: '' });
    setTransferMatch(null);
    if (!transferBarcode) return;
    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', transferBarcode).single();
    if (error || !data) {
      setTransferMessage({ type: 'error', text: 'No product with that barcode.' });
    } else {
      setTransferMatch(data);
    }
  };

  // Moves stock between two locations. `dresses.quantity` (the number the
  // POS actually sells from) is NOT touched by a transfer — it stays the
  // shop-wide total. This only moves the breakdown of WHERE that stock
  // physically sits, tracked in `location_stock`, with every move logged
  // to `stock_transfers` for an audit trail.
  const handleRecordTransfer = async () => {
    setTransferMessage({ type: '', text: '' });
    if (!transferMatch) { setTransferMessage({ type: 'error', text: 'Search for a product first.' }); return; }
    if (!transferToLocationId) { setTransferMessage({ type: 'error', text: 'Pick a destination location.' }); return; }
    if (transferFromLocationId === transferToLocationId) { setTransferMessage({ type: 'error', text: 'Source and destination must be different.' }); return; }
    const qty = parseInt(transferQuantity);
    if (!qty || qty <= 0) { setTransferMessage({ type: 'error', text: 'Enter a valid quantity.' }); return; }

    // "From" is optional: leaving it blank means this is the FIRST time this
    // product's stock is being assigned to a location (e.g. right after
    // adding it, or backfilling an existing product) — there's nothing to
    // deduct from, it's simply being recorded as arriving at `to`.
    const isInitialAssignment = !transferFromLocationId;

    let sourceRow: any = null;
    if (!isInitialAssignment) {
      const { data } = await supabase
        .from('location_stock')
        .select('*')
        .eq('dress_id', transferMatch.id)
        .eq('location_id', transferFromLocationId)
        .maybeSingle();
      sourceRow = data;

      const sourceQty = sourceRow ? Number(sourceRow.quantity) : 0;
      if (qty > sourceQty) {
        setTransferMessage({ type: 'error', text: `Only ${sourceQty} recorded at the source location — can't transfer ${qty}. If this is the first time you're assigning this product to a location, leave "From" set to "Initial stock" instead.` });
        return;
      }

      // Decrement source
      if (sourceRow) {
        await supabase.from('location_stock').update({ quantity: sourceQty - qty, updated_at: new Date().toISOString() }).eq('id', sourceRow.id);
      }
    }

    // Increment (or create) destination
    const { data: destRow } = await supabase
      .from('location_stock')
      .select('*')
      .eq('dress_id', transferMatch.id)
      .eq('location_id', transferToLocationId)
      .maybeSingle();
    if (destRow) {
      await supabase.from('location_stock').update({ quantity: Number(destRow.quantity) + qty, updated_at: new Date().toISOString() }).eq('id', destRow.id);
    } else {
      await supabase.from('location_stock').insert([{ dress_id: transferMatch.id, location_id: transferToLocationId, quantity: qty }]);
    }

    await supabase.from('stock_transfers').insert([{
      dress_id: transferMatch.id,
      from_location_id: isInitialAssignment ? null : transferFromLocationId,
      to_location_id: transferToLocationId,
      quantity: qty,
    }]);

    setTransferMessage({ type: 'success', text: `Moved ${qty} unit(s) of ${transferMatch.name}.` });
    setTransferBarcode(''); setTransferMatch(null); setTransferQuantity('1');
    fetchLocationStock();
    fetchStockTransfers();
  };

  // --- SUPPLIERS CRUD ---
  const addSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierMessage({ type: '', text: '' });
    if (!supplierName.trim() || !supplierPhone.trim()) {
      setSupplierMessage({ type: 'error', text: 'Name and phone number are required.' });
      return;
    }
    const { error } = await supabase.from('suppliers').insert([{
      name: supplierName.trim(),
      place: supplierPlace.trim() || null,
      phone: supplierPhone.trim(),
      product_details: supplierProductDetails.trim() || null,
    }]);
    if (error) {
      setSupplierMessage({ type: 'error', text: 'Failed to save. Make sure the suppliers table has been created (see setup note).' });
    } else {
      setSupplierMessage({ type: 'success', text: 'Supplier saved.' });
      setSupplierName(''); setSupplierPlace(''); setSupplierPhone(''); setSupplierProductDetails('');
      fetchSuppliers();
    }
  };

  const startEditSupplier = (s: any) => {
    setEditingSupplierId(s.id);
    setEditSupplierDraft({
      name: s.name,
      place: s.place || '',
      phone: s.phone,
      product_details: s.product_details || '',
    });
  };

  const cancelEditSupplier = () => setEditingSupplierId(null);

  const saveEditSupplier = async (id: any) => {
    if (!editSupplierDraft.name.trim() || !editSupplierDraft.phone.trim()) {
      toast.error('Name and phone number are required.');
      return;
    }
    const { error } = await supabase.from('suppliers').update({
      name: editSupplierDraft.name.trim(),
      place: editSupplierDraft.place.trim() || null,
      phone: editSupplierDraft.phone.trim(),
      product_details: editSupplierDraft.product_details.trim() || null,
    }).eq('id', id);
    if (error) {
      toast.error('Failed to save changes. Please try again.');
    } else {
      setEditingSupplierId(null);
      fetchSuppliers();
    }
  };

  const deleteSupplier = async (id: any, name: string) => {
    if (!(await confirm({ message: `Remove supplier "${name}"? This can't be undone.`, danger: true }))) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) fetchSuppliers();
  };

  const filteredSuppliers = supplierSearchQuery === '' ? suppliers : suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    (s.phone || '').toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    (s.place || '').toLowerCase().includes(supplierSearchQuery.toLowerCase())
  );

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
    let approver: { id: string; full_name: string } | null = null;
    if (status === 'cancelled' && !hasPermission(actingStaffRole(currentStaff), 'void_action')) {
      approver = await requestManagerApproval('Cancelling this purchase order');
      if (!approver) return;
    }
    const before = purchaseOrders.find((po: any) => po.id === id) || null;
    const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
    if (!error) {
      fetchPurchaseOrders();
      if (status === 'cancelled') {
        logAudit({
          action: 'void',
          entityType: 'purchase_order',
          entityId: id,
          before: before ? { status: before.status } : null,
          after: { status },
          actor: currentStaff,
          actorAccountRole: userRole,
          approvedBy: approver,
        });
      }
    }
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

    logAudit({
      action: 'void',
      entityType: 'dress',
      entityId: returnMatch.id,
      before: { quantity: returnMatch.quantity },
      after: { quantity: newQuantity, returned_to_supplier: qty },
      reason: returnReason || undefined,
      actor: currentStaff,
      actorAccountRole: userRole,
    });

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
    let approver: { id: string; full_name: string } | null = null;
    if (status === 'cancelled' && !hasPermission(actingStaffRole(currentStaff), 'void_action')) {
      approver = await requestManagerApproval('Cancelling this sales order');
      if (!approver) return;
    }
    const before = salesOrders.find((so: any) => so.id === id) || null;
    const { error } = await supabase.from('sales_orders').update({ status }).eq('id', id);
    if (!error) {
      fetchSalesOrders();
      if (status === 'cancelled') {
        logAudit({
          action: 'void',
          entityType: 'sales_order',
          entityId: id,
          before: before ? { status: before.status } : null,
          after: { status },
          actor: currentStaff,
          actorAccountRole: userRole,
          approvedBy: approver,
        });
      }
    }
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

    setAddSaleMessage({ type: 'success', text: `Sale recorded for ${variantLabel(addSaleSelectedItem)}.` });
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
      toast.error('Failed to save settings. Make sure the business_settings table exists (run migration_003).');
    }
  };

  // --- TAX RATES CRUD (reference list — not yet applied automatically at checkout) ---
  const addTaxRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName.trim() || !newTaxRate) return;
    const { error } = await supabase.from('tax_rates').insert([{ name: newTaxName.trim(), rate_percent: parseFloat(newTaxRate) }]);
    if (error) {
      toast.error('Failed to add tax rate.');
    } else {
      setNewTaxName(''); setNewTaxRate('');
      fetchTaxRates();
    }
  };

  const deleteTaxRate = async (id: any) => {
    if (!(await confirm({ message: 'Remove this tax rate?', danger: true }))) return;
    const { error } = await supabase.from('tax_rates').delete().eq('id', id);
    if (!error) fetchTaxRates();
  };

  // --- CURRENCY HANDLERS ---
  const addCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrencyMessage({ type: '', text: '' });
    const code = newCurrencyCode.trim().toUpperCase();
    if (!code || !newCurrencySymbol.trim()) {
      setCurrencyMessage({ type: 'error', text: 'Enter a currency code (e.g. USD) and a symbol.' });
      return;
    }
    const { error } = await supabase.from('currencies').insert([{ code, symbol: newCurrencySymbol.trim(), is_base: false }]);
    if (error) {
      setCurrencyMessage({ type: 'error', text: 'Failed to add currency. It may already exist, or migration_008 hasn\'t been run yet.' });
    } else {
      setNewCurrencyCode(''); setNewCurrencySymbol('');
      setCurrencyMessage({ type: 'success', text: `${code} added. Click "Refresh Rates" to fetch its exchange rate.` });
      fetchCurrencies();
    }
  };

  const deleteCurrency = async (id: any, code: string) => {
    if (!(await confirm({ message: `Remove ${code}? It won't be offered at checkout anymore.`, danger: true }))) return;
    const { error } = await supabase.from('currencies').delete().eq('id', id);
    if (!error) fetchCurrencies();
  };

  // Calls our own /api/exchange-rates route (server-side — keeps the
  // currencyapi.com key out of the browser) with the shop's base currency,
  // then stores a fresh rate row per currency we track. currencyapi.com
  // returns "1 base = X target"; we store the inverse ("1 target = X base")
  // since that's what a payment-line conversion needs (foreign amount ×
  // rate_to_base = base-currency amount).
  const refreshExchangeRates = async () => {
    setRatesRefreshing(true);
    setCurrencyMessage({ type: '', text: '' });
    const base = currencies.find((c: any) => c.is_base)?.code || 'BDT';
    try {
      const res = await fetch(`/api/exchange-rates?base=${base}`);
      const json = await res.json();
      if (!res.ok) {
        setCurrencyMessage({ type: 'error', text: json.error || 'Failed to fetch rates.' });
        return;
      }
      const rows = currencies
        .filter((c: any) => !c.is_base)
        .map((c: any) => {
          const perBase = json.data?.[c.code]?.value;
          if (!perBase) return null;
          return { currency_code: c.code, rate_to_base: 1 / perBase };
        })
        .filter(Boolean);
      if (rows.length === 0) {
        setCurrencyMessage({ type: 'error', text: 'No matching currencies found in the API response.' });
        return;
      }
      const { error } = await supabase.from('exchange_rates').insert(rows as any[]);
      if (error) {
        setCurrencyMessage({ type: 'error', text: 'Fetched rates but failed to save them.' });
      } else {
        setCurrencyMessage({ type: 'success', text: `Rates updated for ${rows.length} currenc${rows.length === 1 ? 'y' : 'ies'}.` });
        fetchExchangeRates();
      }
    } catch (_) {
      setCurrencyMessage({ type: 'error', text: 'Could not reach the exchange rate service.' });
    } finally {
      setRatesRefreshing(false);
    }
  };

  // Converts an amount in the base currency (BDT) into `code`, using the
  // latest stored rate. Falls back to the raw amount if the rate is missing
  // (e.g. base currency itself, or rates never fetched).
  const convertFromBase = (amountInBase: number, code: string): number => {
    if (!code) return amountInBase;
    const currency = currencies.find((c: any) => c.code === code);
    if (currency?.is_base) return amountInBase;
    const rate = exchangeRates[code]?.rate;
    if (!rate) return amountInBase;
    return amountInBase / rate;
  };
  const currencySymbol = (code: string): string => currencies.find((c: any) => c.code === code)?.symbol || '৳';

  // --- GIFT CARD HANDLERS ---
  const generateGiftCardCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    let code = 'GC-';
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const sellGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setGiftCardMessage({ type: '', text: '' });
    const amount = parseFloat(giftCardSellAmount);
    if (!amount || amount <= 0) {
      setGiftCardMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    const code = generateGiftCardCode();
    const { data, error } = await supabase.from('gift_cards').insert([{
      code,
      initial_balance: amount,
      current_balance: amount,
      source: 'purchased',
      status: 'active',
      customer_phone: giftCardSellPhone.trim() || null,
    }]).select().single();

    if (error || !data) {
      setGiftCardMessage({ type: 'error', text: 'Failed to issue gift card. Make sure migration_008 has been run.' });
      return;
    }

    await supabase.from('gift_card_transactions').insert([{ gift_card_id: data.id, type: 'issue', amount }]);
    setGiftCardMessage({ type: 'success', text: `Gift card ${code} issued for ৳${amount}.` });
    setGiftCardSellAmount(''); setGiftCardSellPhone('');
    fetchGiftCards();
  };

  // Issues store credit (same table, different `source`) — used from the
  // Refund flow as an alternative to cash back.
  const issueStoreCredit = async (amount: number, phone?: string) => {
    const code = generateGiftCardCode();
    const { data, error } = await supabase.from('gift_cards').insert([{
      code,
      initial_balance: amount,
      current_balance: amount,
      source: 'issued_as_credit',
      status: 'active',
      customer_phone: phone || null,
    }]).select().single();
    if (!error && data) {
      await supabase.from('gift_card_transactions').insert([{ gift_card_id: data.id, type: 'issue', amount }]);
      fetchGiftCards();
      return code;
    }
    return null;
  };

  const lookupGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setGiftCardLookupMessage({ type: '', text: '' });
    setGiftCardLookupResult(null);
    const code = giftCardLookupCode.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase.from('gift_cards').select('*').eq('code', code).maybeSingle();
    if (error || !data) {
      setGiftCardLookupMessage({ type: 'error', text: 'No gift card found with that code.' });
    } else {
      setGiftCardLookupResult(data);
    }
  };

  const revokeGiftCard = async (id: any) => {
    if (!(await confirm({ message: 'Revoke this gift card? It can no longer be redeemed.', danger: true }))) return;
    const { error } = await supabase.from('gift_cards').update({ status: 'revoked' }).eq('id', id);
    if (!error) fetchGiftCards();
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
    if (!(await confirm({ message: 'Remove this cost entry?', danger: true }))) return;
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
      .select(`*, dresses!inner ( id, name, barcode, quantity, size, color )`)
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

  // `asStoreCredit`: when true, instead of handing cash back, issues a
  // gift_cards row with source='issued_as_credit' for the sale amount —
  // same redemption path as a purchased gift card (usable as a Split
  // Payment line at the POS later).
  const processRefund = async (sale: any, asStoreCredit: boolean = false) => {
    const confirmText = asStoreCredit
      ? `Refund this purchase of ${sale.dresses.name} as store credit instead of cash?`
      : `Are you sure you want to refund this purchase of ${sale.dresses.name}?`;
    if (!(await confirm({ message: confirmText, danger: true }))) return;

    let refundApprover: { id: string; full_name: string } | null = null;
    if (!hasPermission(actingStaffRole(currentStaff), 'process_refund')) {
      refundApprover = await requestManagerApproval(`Refunding ${sale.dresses.name} (৳${sale.amount_paid})`);
      if (!refundApprover) {
        setRefundMessage({ type: 'error', text: 'Refund cancelled — manager approval was required.' });
        return;
      }
    }

    const { error: updateSaleError } = await supabase.from('sales').update({ status: 'refunded' }).eq('id', sale.id);
    if (updateSaleError) {
      setRefundMessage({ type: 'error', text: 'Failed to update sale status.' });
      return;
    }

    const restoredQuantity = sale.dresses.quantity + 1;
    await supabase.from('dresses').update({ quantity: restoredQuantity, status: 'available' }).eq('id', sale.dresses.id);

    if (asStoreCredit) {
      const code = await issueStoreCredit(Number(sale.amount_paid));
      if (code) {
        setRefundMessage({ type: 'success', text: `Refunded as store credit — code ${code} for ৳${sale.amount_paid}. Stock levels updated.` });
      } else {
        setRefundMessage({ type: 'error', text: 'Sale was refunded and stock restored, but issuing the store credit card failed. Make sure migration_008 has been run.' });
      }
    } else {
      setRefundMessage({ type: 'success', text: 'Refund successful! Stock levels updated.' });
    }

    logAudit({
      action: 'refund',
      entityType: 'sale',
      entityId: sale.id,
      before: { status: sale.status, amount_paid: sale.amount_paid },
      after: { status: 'refunded', as_store_credit: asStoreCredit },
      actor: currentStaff,
      actorAccountRole: userRole,
      approvedBy: refundApprover,
    });

    setRefundBarcode('');
    setRefundItemSales([]);
    fetchRecentInventory();
    fetchSalesData();
  };

  useEffect(() => {
    if (activeTab === 'reports' && isAuthenticated) { fetchSalesData(); setReportsPage(1); }
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

  const clearDateFilters = () => { setStartDate(''); setEndDate(''); setReportsPage(1); };

  // List Products groups variant rows (same size/color-less product split
  // across multiple barcodes) back into one card by group_id. Rows with no
  // group_id (older products, or ones added before variants existed) are
  // treated as their own single-variant group keyed by their own id.
  const groupedProducts = (() => {
    const archiveFiltered = recentInventory.filter(item => showArchived ? true : item.status !== 'archived');
    const map = new Map<string, any>();
    for (const item of archiveFiltered) {
      const key = item.group_id || `single-${item.id}`;
      if (!map.has(key)) {
        map.set(key, { key, name: item.name, category: item.category, brand: item.brand, unit: item.unit, image_url: item.image_url, variants: [] as any[] });
      }
      const group = map.get(key);
      if (!group.image_url && item.image_url) group.image_url = item.image_url;
      group.variants.push(item);
    }
    return Array.from(map.values());
  })();

  // POS product grid — always excludes archived stock regardless of the
  // Inventory tab's "show archived" toggle (those two views shouldn't be
  // coupled), grouped the same way as List Products so multi-variant items
  // show one tile.
  const posAllGroups = (() => {
    const active = recentInventory.filter((item: any) => item.status !== 'archived');
    const map = new Map<string, any>();
    for (const item of active) {
      const key = item.group_id || `single-${item.id}`;
      if (!map.has(key)) {
        map.set(key, { key, name: item.name, category: item.category, brand: item.brand, unit: item.unit, image_url: item.image_url, variants: [] as any[] });
      }
      const group = map.get(key);
      if (!group.image_url && item.image_url) group.image_url = item.image_url;
      group.variants.push(item);
    }
    return Array.from(map.values());
  })();
  const posCategoryOptions = ['All', ...Array.from(new Set(posAllGroups.map((g: any) => g.category).filter(Boolean)))] as string[];
  const posFilteredGroups = posAllGroups.filter((g: any) => {
    const matchesCategory = posBrowseCategory === 'All' || g.category === posBrowseCategory;
    const q = posBrowseQuery.trim().toLowerCase();
    const matchesQuery = q === '' ||
      g.name.toLowerCase().includes(q) ||
      g.variants.some((v: any) => v.barcode.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  // A product matches if its name matches, or ANY of its variants' barcodes
  // do — so scanning/typing one variant's barcode still surfaces the card.
  const filteredInventory = stockSearchQuery === '' ? groupedProducts : groupedProducts.filter((p: any) =>
    p.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    p.variants.some((v: any) => v.barcode.toLowerCase().includes(stockSearchQuery.toLowerCase()))
  );

  // The List Products table (below) is flat — one row per barcode/SKU,
  // matching a standard inventory table — rather than the grouped cards
  // used elsewhere. Flatten here so search/pagination count rows, not
  // product groups. groupVariantCount rides along so "Product Type" can
  // show Single vs Variable per row without recomputing it per cell.
  const flatInventoryRows = filteredInventory.flatMap((group: any) =>
    group.variants.map((v: any) => ({ ...v, groupImage: group.image_url, groupVariantCount: group.variants.length }))
  );
  // Search/filter above runs against the full inventory first, so a match on
  // any page is found — pagination below only slices what's already matched.
  const stockTotalPages = Math.max(1, Math.ceil(flatInventoryRows.length / STOCK_PAGE_SIZE));
  const stockPageClamped = Math.min(stockPage, stockTotalPages);
  const paginatedInventory = flatInventoryRows.slice(
    (stockPageClamped - 1) * STOCK_PAGE_SIZE,
    stockPageClamped * STOCK_PAGE_SIZE
  );

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

  const labelResults = labelSearchQuery === '' ? [] : recentInventory.filter(item =>
    item.status !== 'archived' &&
    !labelQueue.some(l => l.id === item.id) &&
    (item.name.toLowerCase().includes(labelSearchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(labelSearchQuery.toLowerCase()))
  );

  const allSalesFiltered = allSalesSearchQuery === '' ? salesRecord : salesRecord.filter(sale =>
    (sale.dresses?.name ?? '').toLowerCase().includes(allSalesSearchQuery.toLowerCase()) ||
    (sale.dresses?.barcode ?? '').toLowerCase().includes(allSalesSearchQuery.toLowerCase())
  );
  // Search always runs against the full filtered list above, so a match on
  // any page is found — pagination below only slices what's already matched.
  const allSalesTotalPages = Math.max(1, Math.ceil(allSalesFiltered.length / ALL_SALES_PAGE_SIZE));
  const allSalesPageClamped = Math.min(allSalesPage, allSalesTotalPages);
  const allSalesPaginated = allSalesFiltered.slice(
    (allSalesPageClamped - 1) * ALL_SALES_PAGE_SIZE,
    allSalesPageClamped * ALL_SALES_PAGE_SIZE
  );

  const activeStock = recentInventory.filter(item => item.status !== 'archived');
  const lowStockItems = activeStock
    .filter(item => item.quantity > 0 && item.quantity <= effectiveReorderPoint(item))
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

  // Reports: Master Transaction Ledger pagination (salesRecord is already
  // date-filtered by fetchSalesData, so this only paginates what's already
  // been filtered — same pattern as the other paginated lists).
  const reportsTotalPages = Math.max(1, Math.ceil(salesRecord.length / REPORTS_PAGE_SIZE));
  const reportsPageClamped = Math.min(reportsPage, reportsTotalPages);
  const reportsPaginated = salesRecord.slice(
    (reportsPageClamped - 1) * REPORTS_PAGE_SIZE,
    reportsPageClamped * REPORTS_PAGE_SIZE
  );

  const goToTab = (tab: string, groupId: string | null = null) => {
    setActiveTab(tab);
    if (groupId) setExpandedGroup(groupId);
  };

  // --- ROLE-BASED ACCESS ---
  // Generalized from the original admin/salesman-only gate to every account
  // role in src/lib/permissions.ts (admin, manager, cashier, inventory_clerk,
  // salesman). Products still only exposes "List Products" to a role that
  // lacks edit_inventory, matching the original salesman behavior exactly;
  // everything else is filtered per-tab by canReachTab().
  const visibleNavGroups = NAV_GROUPS
    .filter((item: any) => item.kind === 'single' ? canReachTab(userRole, item.tab) : item.children.some((c: any) => canReachTab(userRole, c.tab)))
    .map((item: any) => item.kind === 'single' ? item : { ...item, children: item.children.filter((c: any) => canReachTab(userRole, c.tab)) });
  const allowedTabsForRole = new Set<string>(
    visibleNavGroups.flatMap((item: any) => item.kind === 'single' ? [item.tab] : item.children.map((c: any) => c.tab))
  );
  const visibleHeaderActions = HEADER_ACTIONS.filter(a => allowedTabsForRole.has(a.tab));

  // If a session ever ends up on a tab outside its allowed set (default
  // landing tab, a stale link, a button that isn't hidden, browser
  // back/forward), bounce it to POS rather than showing restricted content.
  useEffect(() => {
    if (userRole && !allowedTabsForRole.has(activeTab)) {
      setActiveTab('pos');
      setExpandedGroup('sell');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, activeTab]);

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
          .glow-forgot-link {
            display: block;
            width: 100%;
            text-align: center;
            background: none;
            border: none;
            margin-top: 16px;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: rgba(0,243,255,0.6);
            cursor: pointer;
            transition: color 0.2s;
          }
          .glow-forgot-link:hover { color: #00f3ff; }
          .glow-forgot-copy {
            font-size: 12.5px;
            line-height: 1.6;
            color: rgba(255,255,255,0.55);
            margin-bottom: 18px;
          }
          .glow-forgot-copy strong { color: rgba(255,255,255,0.85); }
        `}</style>

        <div className="glow-card-wrap">
          <div className="glow-card-inner">
            <div className="glow-wordmark">CRAVE <span>ABS</span></div>
            <div className="glow-subtitle">Admin Console</div>
            <hr className="glow-divider" />

            {!showForgotPassword ? (
              <>
                {loginError && (
                  <div className="glow-error">{loginError}</div>
                )}

                <form onSubmit={handleLogin}>
                  <label className="glow-label">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="glow-input rounded-md"
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
                    className="glow-input rounded-md"
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

                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(email); setForgotSent(false); setForgotError(''); }}
                  className="glow-forgot-link"
                >
                  Forgot password?
                </button>
              </>
            ) : forgotSent ? (
              <div>
                <p className="glow-forgot-copy">
                  If <strong>{forgotEmail.trim()}</strong> has an account, a confirmation link was just sent to that inbox.
                  Open it on this device and follow the link to set a new password — it expires after a while, so use it soon.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); }}
                  className="glow-btn"
                  style={{ marginTop: 18 }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p className="glow-forgot-copy">
                  Enter the account's email — we'll send a confirmation link there. Click it to set a new password; nothing changes until then.
                </p>
                {forgotError && (
                  <div className="glow-error">{forgotError}</div>
                )}
                <label className="glow-label">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="glow-input rounded-md"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                />
                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="glow-btn"
                >
                  {forgotSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="glow-forgot-link"
                >
                  Back to sign in
                </button>
              </form>
            )}

            <div className="glow-footer">{businessSettings.address}</div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen text-ink font-sans print:bg-white print:min-h-0">

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Both blocks stay in the DOM at all times, but only ONE of them
             is ever shown per print action — gated by a body class set
             right before window.print() is called (see triggerPrint below). */
          .print-receipt, .print-labels {
            display: none !important;
          }
          body.printing-receipt .print-receipt {
            display: block !important;
          }
          body.printing-labels .print-labels {
            display: block !important;
          }
          .print-label-tag {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="lg:flex print:hidden">

        {/* ---- Backdrop for the mobile sidebar drawer ---- */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-[90] bg-black/50 lg:hidden print:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ---- Sidebar: fixed drawer on mobile (slides in/out), always
              visible in place on desktop (lg:translate-x-0 pins it open) ---- */}
        <aside className={`fixed inset-y-0 left-0 z-[95] w-64 flex flex-col bg-canvas border-r border-thread print:hidden transition-transform duration-300 ease-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ transition: 'background 0.25s, transform 0.3s ease-out', overflow: 'hidden' }}>

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
              /* Was relying on the global --color-muted (a dim blue-gray,
                 #5f7fa8 in dark mode) for inactive labels — legible enough
                 elsewhere in the app but too low-contrast against this
                 near-black sidebar specifically. Warm ivory at reduced
                 opacity reads clearly here AND matches the brass/gold
                 accent used for active items, instead of the slightly
                 off-theme cool blue-gray. Only overrides color inside the
                 sidebar — --color-muted itself is untouched everywhere
                 else in the app. */
              color: var(--color-nav-muted) !important;
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
            {visibleNavGroups.map((item: any) => {
              if (item.kind === 'single') {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.id}
                    onClick={() => { goToTab(item.tab); setMobileSidebarOpen(false); }}
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
                            onClick={() => { goToTab(child.tab, item.id); setMobileSidebarOpen(false); }}
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

        {/* ---- Top bar (mobile / tablet) ----
              Just a hamburger + brand + quick actions now; the full
              navigation lives in the same sidebar as desktop (opened as a
              drawer via the hamburger), instead of a separate mobile-only
              nav pattern, so mobile and laptop navigate identically. */}
        <div className="lg:hidden sticky top-0 z-40 bg-canvas border-b border-thread print:hidden">
          <div className="flex items-center justify-between px-4 h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="w-9 h-9 flex items-center justify-center shrink-0 rounded-lg border border-thread text-ink hover:border-brass hover:text-brass transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-display text-lg text-ink tracking-tight truncate">CRAVE <em className="not-italic text-brass">ABS</em></h1>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
              <button onClick={handleLogout} className="text-[11px] font-bold uppercase tracking-wider text-oxblood whitespace-nowrap">
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ---- Main content ---- */}
        <div className="lg:pl-64 flex-1 print:pl-0 relative">

          {/* ── GLOBAL HEADER TOOLBAR ──
              Flush against the very top of the content column — same y as
              the sidebar's "CRAVE ABS / ADMIN CONSOLE" brand block, so the
              two form one continuous top strip instead of the toolbar
              floating lower with a slab of video showing above it. Lives
              OUTSIDE the max-w-6xl/pt-7 wrapper below on purpose: it needs
              to span the full content width and sit at y:0, not be inset
              with the rest of the page's content.
              Buttons come from HEADER_ACTIONS near the top of this file —
              add an entry there to add a button here, nothing in this
              block needs to change. */}
          <div className="sticky top-0 z-30 bg-black border-b border-thread/60 print:hidden">
            <div className="w-full px-4 sm:px-6 py-[18px] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {visibleHeaderActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => goToTab(action.tab, action.group)}
                      className={`p-btn ${action.variant === 'ghost' ? 'p-btn-ghost' : 'p-btn-primary btn-shimmer'}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {action.label}
                    </button>
                  );
                })}
                {/* Calculator is a popup, not a page, so it lives outside
                    HEADER_ACTIONS and opens a modal instead of navigating. */}
                <button onClick={() => setShowCalculator(true)} className="p-btn p-btn-ghost">
                  <IconCalculator className="w-3.5 h-3.5" /> Calculator
                </button>
                {/* Which physical shop this terminal is selling as — tags
                    every sale and decrements that shop's stock breakdown.
                    Only shown once at least one location exists. */}
                {locations.length > 0 && (
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 border border-brass/40 bg-brass/10 rounded-lg" title="Sales from this terminal are recorded against this location">
                    <IconTag className="w-3.5 h-3.5 text-brass shrink-0" />
                    <select
                      value={activeLocationId}
                      onChange={(e) => changeActiveLocation(e.target.value)}
                      className="bg-transparent text-xs font-bold text-brass-dark uppercase tracking-wide outline-none cursor-pointer"
                    >
                      {locations.map((loc: any) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                    </select>
                  </label>
                )}
              </div>
              <p className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-3">
                {lowStockItems.length > 0 && (
                  <button
                    onClick={() => goToTab('products-list', 'products')}
                    className="flex items-center gap-1.5 px-2.5 py-1 border border-oxblood/40 text-oxblood hover:bg-oxblood hover:text-white transition-colors normal-case tracking-normal font-sans font-bold text-xs"
                    title="Items at or below their reorder point"
                  >
                    <IconArchive className="w-3.5 h-3.5" /> {lowStockItems.length} low stock
                  </button>
                )}
                {new Date().toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Full-bleed content well — spans the entire width next to the
              sidebar (no centered max-width, no side gutters showing the
              page background) so every tab reads as one continuous
              surface instead of a card floating on empty space. */}
          <div className="w-full px-4 sm:px-6 pt-4 pb-4 print:p-0 relative z-10">

            {/* key forces remount on tab switch → triggers .tab-enter animation */}
            <div key={activeTab} className="tab-enter">

            {/* TAB 0: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 print:hidden">

                {/* Location filter — only shown once there's more than one
                    location to distinguish. Every number below (today's
                    revenue, items sold, top sellers) reacts to this. */}
                {locations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted uppercase tracking-wide">Showing:</span>
                    <select
                      value={reportLocationId}
                      onChange={(e) => setReportLocationId(e.target.value)}
                      className="p-input text-xs w-auto py-1.5"
                    >
                      <option value="">All Locations</option>
                      {locations.map((loc: any) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                    </select>
                  </div>
                )}

                {/* Shopify-style stat cards with mini sparklines */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Today's Net — hero dark with brass sparkline */}
                  {(() => {
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                    const todaysCostTotal = dailyCosts
                      .filter((c: any) => c.cost_date === todayStr)
                      .reduce((s: number, c: any) => s + Number(c.amount), 0);
                    const todayNet = todayRevenue - todaysCostTotal;
                    // Mini sparkline — last 7 days revenue trend from surveyRecords
                    const spark = surveyRecords.slice(-7).map(r => r.amount);
                    const sparkMax = Math.max(...spark, 1);
                    const sparkW = 80, sparkH = 32;
                    const pts = spark.map((v, i) => {
                      const x = spark.length < 2 ? sparkW/2 : (i / (spark.length - 1)) * sparkW;
                      const y = sparkH - (v / sparkMax) * sparkH * 0.85;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <div className="anim-card p-card-hero relative" style={{ padding: '22px 24px 18px' }}>
                        <div className="absolute bottom-0 right-6 opacity-40">
                          {spark.length > 1 && (
                            <svg width={sparkW} height={sparkH} className="sparkline">
                              <polyline points={pts} stroke="#c49a4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="relative z-10">
                          <p className="p-stat-card-label" style={{ color: 'rgba(220,200,165,0.65)' }}>Today&rsquo;s Net Revenue</p>
                          <p className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">৳{todayNet.toLocaleString()}</p>
                          {todaysCostTotal > 0 && (
                            <p className="p-stat-card-sub font-mono" style={{ color: 'rgba(220,200,165,0.5)' }}>
                              ৳{todayRevenue.toLocaleString()} − ৳{todaysCostTotal.toLocaleString()} cost
                            </p>
                          )}
                          <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="p-stat-card-trend up" style={{ background: 'rgba(76,175,128,0.2)', color: '#6dcfa0' }}>
                              ● Live
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items sold today */}
                  <div className="anim-card p-stat-card">
                    <p className="p-stat-card-label">Items Sold Today</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="p-stat-card-value p-stat">{todayItemsSold}</span>
                      <span className="text-sm font-medium text-muted">pieces</span>
                    </div>
                    <p className="p-stat-card-sub">From today&rsquo;s transactions</p>
                  </div>

                  {/* Low stock alerts */}
                  <button
                    onClick={() => goToTab('products-list', 'products')}
                    className={`anim-card text-left ${lowStockItems.length > 0 ? 'p-card-danger' : 'p-stat-card'}`}
                    style={{ padding: '20px 24px' }}
                  >
                    <p className="p-stat-card-label"
                       style={{ color: lowStockItems.length > 0 ? 'var(--color-oxblood)' : undefined }}>
                      Low Stock Alerts
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className={`p-stat-card-value ${lowStockItems.length > 0 ? 'p-stat-danger' : 'p-stat'}`}>
                        {lowStockItems.length}
                      </span>
                      <span className="text-sm font-medium text-muted">{outOfStockItems.length} out of stock</span>
                    </div>
                    <p className="p-stat-card-sub">{lowStockItems.length > 0 ? 'Tap to manage stock →' : 'All items stocked ✓'}</p>
                  </button>
                </div>

                {/* Lower two-column panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-card">
                    <div className="p-card-header">
                      <span className="p-card-header-title">
                        <IconAlertTriangle className="w-4 h-4 text-oxblood" />
                        Needs Restocking
                      </span>
                      <button onClick={() => goToTab('products-list', 'products')} className="text-xs font-semibold text-brass hover:text-brass-dark uppercase tracking-wide transition-colors">Manage →</button>
                    </div>
                    {lowStockItems.length === 0 ? (
                      <div className="p-empty">
                        <div className="p-empty-icon"><IconArchive className="w-5 h-5" /></div>
                        <p className="p-empty-title">All stocked up</p>
                        <p className="p-empty-desc">All active items are comfortably stocked.</p>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                        {lowStockItems.slice(0, 6).map(item => (
                          <div key={item.id} className="p-list-item">
                            <div className="min-w-0">
                              <p className="font-semibold text-ink text-sm truncate">{variantLabel(item)}</p>
                              <p className="text-xs text-muted font-mono mt-0.5">{item.barcode}</p>
                            </div>
                            <span className="p-badge p-badge-danger shrink-0">{item.quantity} left</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-card">
                    <div className="p-card-header">
                      <span className="p-card-header-title">
                        <IconTrendingUp className="w-4 h-4 text-brass" />
                        Top Sellers (All Time)
                      </span>
                    </div>
                    {overviewLoading ? (
                      <div className="p-card-body space-y-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
                      </div>
                    ) : topSellers.length === 0 ? (
                      <div className="p-empty">
                        <div className="p-empty-icon"><IconChart className="w-5 h-5" /></div>
                        <p className="p-empty-title">No sales yet</p>
                        <p className="p-empty-desc">Top sellers will appear here once you start recording sales.</p>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                        {topSellers.map((item, i) => (
                          <div key={item.barcode + i} className="p-list-item">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs font-bold text-muted w-5 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-ink text-sm truncate">{variantLabel(item)}</p>
                                <p className="text-xs text-muted">{item.unitsSold} sold</p>
                              </div>
                            </div>
                            <p className="font-mono text-sm font-bold text-ink shrink-0">৳{item.revenue.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-card">
                  <div className="p-card-header">
                    <span className="p-card-header-title">
                      <IconClock className="w-4 h-4 text-brass" />
                      Recent Activity
                    </span>
                    <button onClick={() => goToTab('reports', null)} className="text-xs font-semibold text-brass hover:text-brass-dark uppercase tracking-wide transition-colors">Full Ledger →</button>
                  </div>
                  {salesRecord.length === 0 ? (
                    <div className="p-empty">
                      <div className="p-empty-icon"><IconReceipt className="w-5 h-5" /></div>
                      <p className="p-empty-title">No transactions yet</p>
                      <p className="p-empty-desc">Sales will appear here once you start recording them at the POS.</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                      {salesRecord.slice(0, 6).map(sale => (
                        <div key={sale.id} className="p-list-item">
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{variantLabel(sale.dresses)}</p>
                            <p className="text-xs text-muted font-mono mt-0.5">{new Date(sale.sold_at).toLocaleString('en-BD')}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={sale.status === 'refunded' ? 'p-badge p-badge-muted' : 'p-badge p-badge-success'}>{sale.status}</span>
                            <p className={`font-mono text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>৳{sale.amount_paid}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 1: POS TERMINAL
                Two-panel counter layout: a fixed-width cart/checkout column
                on the left (unchanged logic — same state, same handlers),
                and a browsable product grid on the right so staff aren't
                limited to scanning a physical barcode. Stacks to a single
                column below lg. */}
            {activeTab === 'pos' && (
              <div className="print:hidden grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-4 items-stretch lg:h-[calc(100vh-108px)]">
              <div className="w-full max-w-full lg:max-w-none lg:h-full">
                <div className="p-card lg:h-full lg:overflow-y-auto">
                  {/* POS scan header — pinned while the cart below scrolls */}
                  <div className="sticky top-0 z-10" style={{ padding: '20px 24px 0', background: 'var(--card-bg)' }}>
                    {posMessage.text && (
                      <div className={`anim-alert p-alert mb-4 ${posMessage.type === 'error' ? 'text-oxblood' : 'text-moss'}`}>
                        {posMessage.text}
                      </div>
                    )}
                    <form onSubmit={handleBarcodeSubmit} className="relative mb-6">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: 'var(--color-brass)' }}>
                        <IconScan className="h-5 w-5" />
                      </div>
                      <input
                        type="text" autoFocus
                        placeholder="Scan or type barcode to add to cart..."
                        className="pos-scan-input"
                        style={{ paddingLeft: '46px' }}
                        value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                      />
                    </form>
                  </div>

                  {cart.length === 0 ? (
                    <div className="p-empty" style={{ paddingBottom: 40 }}>
                      <div className="p-empty-icon">
                        <IconBag className="w-5 h-5" />
                      </div>
                      <p className="p-empty-title">Cart is empty</p>
                      <p className="p-empty-desc">Scan an item's barcode above to begin a sale.</p>
                    </div>
                  ) : (
                    <div style={{ padding: '0 24px 24px' }}>
                      {/* Cart items in a clean card */}
                      <p className="p-label mb-3">Current Sale</p>
                      <div className="p-card mb-5" style={{ overflow: 'hidden' }}>
                        {cart.map((item) => (
                          <div key={item.id} className="anim-cart-item flex justify-between items-center gap-3 px-4 py-3.5 hover:bg-brass/5 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink text-sm truncate">{variantLabel(item)}</p>
                              <p className="text-xs text-muted mt-0.5 font-mono">৳{item.price} · {item.quantity} in stock</p>
                            </div>
                            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-xs)' }}>
                              <button type="button" onClick={() => updateCartItemQuantity(item.id, false)} className="w-8 h-8 text-ink font-bold hover:bg-brass/10 hover:text-brass transition-colors">−</button>
                              <span className="px-3 font-mono font-bold text-sm text-ink border-x" style={{ borderColor: 'var(--card-border)' }}>{item.cartQty}</span>
                              <button type="button" onClick={() => updateCartItemQuantity(item.id, true)} className="w-8 h-8 text-ink font-bold hover:bg-brass/10 hover:text-brass transition-colors">+</button>
                            </div>
                            <p className="font-mono font-bold text-ink text-sm min-w-[72px] text-right">৳{item.price * item.cartQty}</p>
                            <button onClick={() => removeFromCart(item.id)} className="text-oxblood text-xs font-semibold hover:underline shrink-0 ml-1">Remove</button>
                          </div>
                        ))}
                      </div>

                      {/* Order summary — discount / tax / total */}
                      <div className="p-card mb-5" style={{ overflow: 'hidden' }}>
                        <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <span className="text-sm text-muted font-medium">Subtotal</span>
                          <span className="font-mono font-semibold text-ink text-sm">৳{cartSubtotal}</span>
                        </div>
                        {/* Customer lookup — search-as-you-type by name or
                            phone (partial match), not the old exact-phone
                            lookup that silently found nothing on the
                            smallest formatting mismatch. */}
                        <div className="px-4 py-3 relative" style={{ borderBottom: posCustomer ? 'none' : '1px solid var(--card-border)' }}>
                          {!posCustomer && (
                            <input
                              type="text" placeholder="Find customer by name or phone…"
                              className="p-input font-mono w-full"
                              style={{ fontSize: 13 }}
                              value={customerLookup}
                              onChange={(e) => { setCustomerLookup(e.target.value); setCustomerMessage(''); setShowQuickAddCustomer(false); }}
                            />
                          )}
                          {!posCustomer && customerSearchResults.length > 0 && (
                            <div className="absolute left-4 right-4 z-20 mt-1 bg-canvas border border-thread rounded-lg shadow-2xl overflow-hidden">
                              {customerSearchResults.map((c: any) => (
                                <button
                                  key={c.id}
                                  onClick={() => { setPosCustomer(c); setCustomerLookup(''); setCustomerSearchResults([]); setCustomerMessage(''); }}
                                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-paper-dim transition-colors flex items-center justify-between gap-2"
                                >
                                  <span className="font-semibold text-ink">{c.name}</span>
                                  <span className="text-muted font-mono">{c.phone || '—'} · {c.loyalty_points} pts</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {posCustomer && (
                          <div className="px-4 py-2 flex justify-between items-center gap-4 bg-canvas" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <span className="text-xs text-ink font-semibold">{posCustomer.name} · {posCustomer.loyalty_points} pts</span>
                            <button onClick={() => { setPosCustomer(null); setRedeemPoints(''); }} className="text-xs text-muted underline">clear</button>
                          </div>
                        )}
                        {posCustomer && maxRedeemablePoints > 0 && (
                          <div className="px-4 py-3 flex justify-between items-center gap-2" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <span className="text-xs text-muted">Redeem points (max {maxRedeemablePoints})</span>
                            <input
                              type="number" min={0} max={maxRedeemablePoints}
                              className="p-input font-mono" style={{ width: 90, fontSize: 13 }}
                              value={redeemPoints} onChange={(e) => setRedeemPoints(e.target.value)}
                            />
                          </div>
                        )}
                        {cartRedeemValue > 0 && (
                          <div className="px-4 py-2 flex justify-between items-center gap-4 bg-brass/10" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <span className="text-xs text-brass font-semibold">Points redeemed</span>
                            <span className="font-mono font-bold text-brass text-sm">-৳{cartRedeemValue}</span>
                          </div>
                        )}
                        {customerMessage && !posCustomer && (
                          <div className="px-4 py-2 text-xs" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <p className="text-muted mb-1.5">{customerMessage}</p>
                            {!showQuickAddCustomer ? (
                              <button
                                onClick={() => { setShowQuickAddCustomer(true); setQuickAddName(/\d/.test(customerLookup) ? '' : customerLookup); setQuickAddPhone(/\d/.test(customerLookup) ? customerLookup : ''); }}
                                className="text-oxblood font-bold uppercase tracking-wide hover:underline"
                              >
                                + Add new customer
                              </button>
                            ) : (
                              <div className="space-y-1.5 mt-1">
                                <input
                                  type="text" placeholder="Name" autoFocus
                                  className="p-input w-full" style={{ fontSize: 12 }}
                                  value={quickAddName} onChange={(e) => setQuickAddName(e.target.value)}
                                />
                                <input
                                  type="text" placeholder="Phone (optional)"
                                  className="p-input w-full font-mono" style={{ fontSize: 12 }}
                                  value={quickAddPhone} onChange={(e) => setQuickAddPhone(e.target.value)}
                                />
                                <div className="flex gap-1.5">
                                  <button onClick={quickAddPosCustomer} disabled={!quickAddName.trim()} className="flex-1 p-btn p-btn-primary justify-center py-1.5 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed">
                                    Add & Select
                                  </button>
                                  <button onClick={() => setShowQuickAddCustomer(false)} className="p-btn p-btn-ghost justify-center py-1.5 text-[11px]">Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Promo code row */}
                        <div className="px-4 py-3 flex justify-between items-center gap-2" style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <input
                            type="text" placeholder="Promo code"
                            className="p-input font-mono uppercase"
                            style={{ width: 130, fontSize: 13 }}
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          />
                          <button onClick={applyPromoCode} className="text-xs font-bold uppercase text-oxblood hover:underline shrink-0">Apply</button>
                        </div>
                        {appliedPromo && (
                          <div className="px-4 py-2 flex justify-between items-center gap-4 bg-brass/10" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <span className="text-xs text-brass font-semibold">{appliedPromo.promotion.name}</span>
                            <span className="font-mono font-bold text-brass text-sm">-৳{cartPromoValue}</span>
                          </div>
                        )}
                        {promoMessage && !appliedPromo && (
                          <div className="px-4 py-2 text-xs text-oxblood" style={{ borderBottom: '1px solid var(--card-border)' }}>{promoMessage}</div>
                        )}
                        {/* Discount row */}
                        <div className="px-4 py-3 flex justify-between items-center gap-4" style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <span className="text-sm text-muted font-medium shrink-0">Discount (৳)</span>
                          <input
                            type="number" min="0" max={cartSubtotal}
                            className="p-input text-right font-mono font-bold"
                            style={{ width: 110, fontSize: 14 }}
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                          />
                        </div>
                        {/* Tax row */}
                        <div className="px-4 py-3 flex justify-between items-center gap-4" style={{ borderBottom: cartTaxValue > 0 ? '1px solid var(--card-border)' : 'none' }}>
                          <span className="text-sm text-muted font-medium shrink-0">Tax</span>
                          <select
                            value={selectedTaxRateId}
                            onChange={(e) => setSelectedTaxRateId(e.target.value)}
                            className="p-input appearance-none cursor-pointer"
                            style={{ width: 160, fontSize: 13 }}
                          >
                            <option value="">No Tax</option>
                            {taxRates.map((t: any) => (
                              <option key={t.id} value={t.id}>{t.name} ({t.rate_percent}%)</option>
                            ))}
                          </select>
                        </div>
                        {cartTaxValue > 0 && (
                          <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <span className="text-sm text-muted font-medium">Tax Amount</span>
                            <span className="font-mono font-semibold text-ink text-sm">+ ৳{cartTaxValue}</span>
                          </div>
                        )}
                        {/* Total */}
                        <div className="px-4 py-4 flex justify-between items-center" style={{ background: 'var(--color-paper-dim)' }}>
                          <span className="text-sm font-bold text-ink uppercase tracking-wide">Total Due</span>
                          <span className="font-mono text-2xl font-bold p-stat-brass">৳{cartTotal}</span>
                        </div>
                        {/* Currency — the sale is always recorded in ৳ (base
                            currency); this just shows what it's worth in a
                            foreign currency for a customer paying that way. */}
                        {currencies.filter((c: any) => !c.is_base).length > 0 && (
                          <div className="px-4 py-3 flex justify-between items-center gap-4" style={{ borderTop: '1px solid var(--card-border)' }}>
                            <span className="text-sm text-muted font-medium shrink-0">Show total in</span>
                            <select
                              value={posCurrencyCode}
                              onChange={(e) => setPosCurrencyCode(e.target.value)}
                              className="p-input appearance-none cursor-pointer"
                              style={{ width: 160, fontSize: 13 }}
                            >
                              {currencies.map((c: any) => (
                                <option key={c.code} value={c.code}>{c.code}{c.is_base ? ' (base)' : ''}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {posCurrencyCode && !currencies.find((c: any) => c.code === posCurrencyCode)?.is_base && (
                          <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--card-border)', background: 'var(--color-paper-dim)' }}>
                            <span className="text-xs text-muted font-medium">≈ in {posCurrencyCode}</span>
                            <span className="font-mono text-sm font-bold text-ink">
                              {currencySymbol(posCurrencyCode)}{convertFromBase(cartTotal, posCurrencyCode).toFixed(2)}
                              {!exchangeRates[posCurrencyCode] && <span className="text-oxblood text-[10px] normal-case ml-1">(no rate set)</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Split Payment toggle — a real button now, not a
                          checkbox, so it reads as an action like the
                          payment method tiles above/below it. */}
                      <button
                        type="button"
                        onClick={() => { setSplitPaymentMode(!splitPaymentMode); setCartPayments([]); setSplitPaymentMessage({ type: '', text: '' }); }}
                        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-xs font-bold uppercase tracking-wide transition-all"
                        style={splitPaymentMode ? {
                          background: 'linear-gradient(135deg,#a8763b 0%,#c49a4a 100%)',
                          borderColor: '#a8763b',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(168,118,59,0.4)',
                        } : {
                          background: 'rgba(168,118,59,0.09)',
                          borderColor: 'rgba(168,118,59,0.35)',
                          color: 'var(--color-brass)',
                        }}
                      >
                        <IconCard className="w-4 h-4" />
                        {splitPaymentMode ? 'Split Payment: ON — tap to use one method' : 'Split Across Multiple Payment Methods'}
                      </button>

                      {splitPaymentMode ? (
                        <div className="mb-5">
                          {cartPayments.length > 0 && (
                            <div className="mb-3 divide-y divide-thread border border-thread">
                              {cartPayments.map((p, i) => (
                                <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold uppercase text-ink">{p.method === 'gift_card' ? 'Gift Card' : p.method}</span>
                                    {p.method === 'gift_card' && <span className="text-[11px] text-muted font-mono ml-2">{p.giftCardCode}</span>}
                                    {p.trxId && <span className="text-[11px] text-muted font-mono ml-2">Trx: {p.trxId}</span>}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono font-bold text-ink text-sm">৳{p.amount}</span>
                                    <button onClick={() => removeSplitPaymentLine(i)} className="text-muted hover:text-oxblood transition-colors">
                                      <IconTrash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between px-1 mb-3">
                            <span className="text-xs font-semibold text-muted">Still due</span>
                            <span className={`font-mono font-bold text-sm ${splitRemaining > 0 ? 'text-oxblood' : 'text-moss'}`}>৳{splitRemaining}</span>
                          </div>
                          {splitPaymentMessage.text && (
                            <div className={`anim-alert p-alert mb-3 ${splitPaymentMessage.type === 'error' ? 'text-oxblood' : 'text-moss'}`}>{splitPaymentMessage.text}</div>
                          )}
                          {splitRemaining > 0 && (
                            <form onSubmit={addSplitPaymentLine} className="p-3 bg-paper-dim border border-thread space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={splitPaymentDraft.method}
                                  onChange={(e) => setSplitPaymentDraft({ ...splitPaymentDraft, method: e.target.value })}
                                  className="p-input text-xs"
                                >
                                  {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{m}</option>))}
                                  <option value="gift_card">Gift Card / Store Credit</option>
                                </select>
                                <input
                                  type="number" min="0" max={splitRemaining} step="0.01"
                                  placeholder={`Up to ৳${splitRemaining}`}
                                  className="p-input text-xs font-mono"
                                  value={splitPaymentDraft.amount}
                                  onChange={(e) => setSplitPaymentDraft({ ...splitPaymentDraft, amount: e.target.value })}
                                />
                              </div>
                              {splitPaymentDraft.method === 'gift_card' ? (
                                <input
                                  type="text" placeholder="Gift card code (e.g. GC-XXXXXXXXXX)"
                                  className="w-full p-input text-xs font-mono"
                                  value={splitPaymentDraft.giftCardCode}
                                  onChange={(e) => setSplitPaymentDraft({ ...splitPaymentDraft, giftCardCode: e.target.value })}
                                />
                              ) : (splitPaymentDraft.method !== 'cash' && splitPaymentDraft.method !== 'bank/card') && (
                                <input
                                  type="text" placeholder="Mobile banking Transaction ID"
                                  className="w-full p-input text-xs font-mono"
                                  value={splitPaymentDraft.trxId}
                                  onChange={(e) => setSplitPaymentDraft({ ...splitPaymentDraft, trxId: e.target.value })}
                                />
                              )}
                              <button type="submit" className="w-full p-btn p-btn-ghost text-xs justify-center">
                                <IconPlus className="w-3.5 h-3.5" /> Add Payment Line
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Payment Method */}
                          <p className="p-label mb-2">Payment Method</p>
                          <div className="grid grid-cols-3 gap-2 mb-5">
                            {PAYMENT_METHODS.map((method) => {
                              const color = PAYMENT_METHOD_COLORS[method];
                              const active = paymentMethod === method;
                              return (
                                <button
                                  key={method}
                                  className="py-2.5 text-[11px] font-bold uppercase tracking-wide rounded-xl border-2 transition-all"
                                  style={active ? {
                                    background: color,
                                    borderColor: color,
                                    color: '#fff',
                                    boxShadow: `0 4px 14px ${color}55`,
                                  } : {
                                    background: `${color}17`,
                                    borderColor: `${color}55`,
                                    color,
                                  }}
                                  onClick={() => setPaymentMethod(method as any)}
                                >
                                  {method}
                                </button>
                              );
                            })}
                          </div>

                          {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && (
                            <div className="mb-5">
                              <input type="text" placeholder="Mobile banking Transaction ID" className="p-input font-mono" value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                            </div>
                          )}
                        </>
                      )}

                      <button
                        onClick={handleCheckout}
                        disabled={splitPaymentMode && splitRemaining > 0}
                        className="btn-shimmer btn-float w-full bg-moss text-white py-4 font-bold text-sm uppercase tracking-wider hover:bg-moss/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconReceipt className="w-5 h-5" />
                        Complete Sale & Print
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Product browser (right panel) ──
                  Reuses the same variant-grouping logic as List Products so
                  a product with several sizes/colors shows one tile, not
                  one per barcode. Single-variant products add straight to
                  cart on click; multi-variant ones expand in place to a row
                  of variant chips so the correct barcode still gets sold. */}
              <div className="p-card lg:h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: '20px 24px 0' }}>
                  <div>
                    <h3 className="text-base font-bold text-ink">Browse Products</h3>
                    <p className="text-xs text-muted mt-0.5">Tap an item to add it to the sale</p>
                  </div>
                  <span className="text-muted text-xs font-mono font-bold">{posFilteredGroups.length} SHOWN</span>
                </div>

                <div style={{ padding: '16px 24px 0' }}>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <IconSearch className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products by name..."
                      className="p-input"
                      style={{ paddingLeft: '38px' }}
                      value={posBrowseQuery}
                      onChange={(e) => setPosBrowseQuery(e.target.value)}
                    />
                  </div>

                  {/* Category pills — All + every category that has stock.
                      Each label gets a stable color from a small palette
                      (hashed by name) so the row reads as colorful chips
                      rather than one plain on/off toggle. */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
                    {posCategoryOptions.map((cat) => {
                      const color = categoryPillColor(cat);
                      const active = posBrowseCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setPosBrowseCategory(cat); setPosExpandedGroupKey(null); }}
                          className="shrink-0 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-full border-2 transition-all"
                          style={active ? {
                            background: color,
                            color: '#fff',
                            borderColor: color,
                            boxShadow: `0 3px 10px ${color}55`,
                          } : {
                            background: `${color}17`,
                            color,
                            borderColor: `${color}55`,
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {posFilteredGroups.length === 0 ? (
                  <div className="p-empty lg:flex-1 lg:flex lg:flex-col lg:justify-center" style={{ paddingBottom: 40 }}>
                    <div className="p-empty-icon">
                      <IconTag className="w-5 h-5" />
                    </div>
                    <p className="p-empty-title">No products match</p>
                    <p className="p-empty-desc">Try a different search term or category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:flex-1 lg:overflow-y-auto" style={{ padding: '0 24px 24px' }}>
                    {posFilteredGroups.map((group) => {
                      const totalStock = group.variants.reduce((s: number, v: any) => s + (v.quantity || 0), 0);
                      const isExpanded = posExpandedGroupKey === group.key;
                      const singleVariant = group.variants.length === 1 ? group.variants[0] : null;
                      const priceLow = Math.min(...group.variants.map((v: any) => v.price));
                      const priceHigh = Math.max(...group.variants.map((v: any) => v.price));
                      return (
                        <div
                          key={group.key}
                          className="rounded-xl border overflow-hidden transition-all"
                          style={{ borderColor: isExpanded ? 'var(--color-brass)' : 'var(--card-border)', background: 'var(--card-bg)', boxShadow: isExpanded ? 'var(--shadow-glow-brass)' : 'var(--shadow-xs)' }}
                        >
                          <button
                            type="button"
                            disabled={totalStock === 0}
                            onClick={() => {
                              if (totalStock === 0) return;
                              if (singleVariant) { addItemToCart(singleVariant); return; }
                              setPosExpandedGroupKey(isExpanded ? null : group.key);
                            }}
                            className="w-full text-left disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <div className="aspect-square w-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-paper-dim)' }}>
                              {group.image_url ? (
                                <img src={group.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <IconImage className="w-6 h-6 text-muted" />
                              )}
                            </div>
                            <div className="px-2.5 py-2">
                              <p className="text-xs font-semibold text-ink leading-snug line-clamp-2">{group.name}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="font-mono text-xs font-bold p-stat-brass">
                                  ৳{priceLow}{priceHigh !== priceLow ? `–${priceHigh}` : ''}
                                </span>
                                <span className={`text-[10px] font-mono font-bold ${totalStock === 0 ? 'text-oxblood' : 'text-muted'}`}>
                                  {totalStock === 0 ? 'OUT' : `${totalStock} in stock`}
                                </span>
                              </div>
                              {group.variants.length > 1 && (
                                <span className="text-[10px] text-muted">{group.variants.length} variants{isExpanded ? ' · pick one ↓' : ''}</span>
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-2.5 pb-2.5 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid var(--card-border)', paddingTop: 8 }}>
                              {group.variants.map((v: any) => {
                                const out = (v.quantity || 0) <= 0;
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    disabled={out}
                                    onClick={() => addItemToCart(v)}
                                    className="px-2 py-1 text-[10px] font-bold rounded-md border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    style={{ borderColor: 'var(--card-border)', color: out ? 'var(--color-muted)' : 'var(--color-ink)', background: 'var(--color-paper-dim)' }}
                                    title={out ? 'Out of stock' : `৳${v.price} · ${v.quantity} in stock`}
                                  >
                                    {variantTag(v) || v.barcode} · ৳{v.price}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* PRODUCTS: LIST PRODUCTS */}
            {activeTab === 'products-list' && (
               <div className="print:hidden">
                  <div className="p-card">
                    <div className="flex items-center justify-between px-7 pt-7 mb-5 gap-4">
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <IconCrate className="w-4 h-4 text-brass" />
                        Active Stock Database
                      </h3>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-muted text-xs font-mono font-bold hidden sm:inline">{recentInventory.length} ITEMS</span>
                        {hasPermission(userRole, 'edit_inventory') && (
                          <button onClick={() => goToTab('products-add', 'products')} className="p-btn p-btn-primary">
                            <IconPlus className="w-3.5 h-3.5" /> Add Product
                          </button>
                        )}
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
                        onChange={(e) => { setStockSearchQuery(e.target.value); setStockPage(1); }}
                      />
                    </div>

                    <label className="flex items-center gap-2 px-7 mb-5 text-[11px] font-bold text-muted uppercase tracking-wide cursor-pointer select-none w-fit">
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => { setShowArchived(e.target.checked); setStockPage(1); }}
                        className="accent-brass w-3.5 h-3.5"
                      />
                      Show archived items
                    </label>

                    <div className="p-divider mx-7 mb-2" />

                    {/* Flat inventory table — one row per barcode/SKU,
                        matching a standard POS admin product list rather
                        than the grouped variant cards used elsewhere. */}
                    <div className="overflow-x-auto">
                      <table className="p-table w-full">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>
                              <input
                                type="checkbox"
                                className="accent-brass w-3.5 h-3.5"
                                checked={paginatedInventory.length > 0 && paginatedInventory.every((r: any) => selectedRowIds.has(r.id))}
                                onChange={(e) => {
                                  const next = new Set(selectedRowIds);
                                  if (e.target.checked) paginatedInventory.forEach((r: any) => next.add(r.id));
                                  else paginatedInventory.forEach((r: any) => next.delete(r.id));
                                  setSelectedRowIds(next);
                                }}
                              />
                            </th>
                            <th>Image</th>
                            <th>Action</th>
                            <th>Product</th>
                            <th>Business Location</th>
                            <th>Selling Price</th>
                            <th>Current Stock</th>
                            <th>Product Type</th>
                            <th>Category</th>
                            <th>Brand</th>
                            <th>Tax</th>
                            <th>Barcode</th>
                            <th>Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedInventory.length === 0 ? (
                            <tr>
                              <td colSpan={13}>
                                <div className="text-center py-12 text-muted">
                                  <IconArchive className="mx-auto h-9 w-9 mb-3 text-thread-dark" />
                                  <p className="text-sm font-medium">No items found matching your search.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedInventory.map((item: any) => {
                              const isArchived = item.status === 'archived';
                              const isLow = !isArchived && item.quantity > 0 && item.quantity <= effectiveReorderPoint(item);
                              const isChecked = selectedRowIds.has(item.id);
                              const menuOpen = openRowMenuId === item.id;
                              return (
                                <tr key={item.id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="accent-brass w-3.5 h-3.5"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const next = new Set(selectedRowIds);
                                        if (e.target.checked) next.add(item.id); else next.delete(item.id);
                                        setSelectedRowIds(next);
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-paper-dim shrink-0 flex items-center justify-center">
                                      {(item.image_url || item.groupImage) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.image_url || item.groupImage} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <IconImage className="w-4 h-4 text-muted" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="relative">
                                    <button
                                      onClick={() => setOpenRowMenuId(menuOpen ? null : item.id)}
                                      className="p-btn p-btn-ghost py-1.5 px-3 text-[11px]"
                                    >
                                      Actions <IconChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {menuOpen && (
                                      <>
                                        {/* Backdrop to catch outside clicks and close the menu */}
                                        <div className="fixed inset-0 z-10" onClick={() => setOpenRowMenuId(null)} />
                                        <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-canvas border border-thread rounded-lg shadow-2xl overflow-hidden py-1">
                                          <button
                                            onClick={() => { setViewingItem(item); setOpenRowMenuId(null); }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-dim transition-colors flex items-center gap-2"
                                          >
                                            <IconTag className="w-3.5 h-3.5 text-muted" /> View
                                          </button>
                                          <button
                                            onClick={() => { openStockHistory(item); setOpenRowMenuId(null); }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-dim transition-colors flex items-center gap-2"
                                          >
                                            <IconClock className="w-3.5 h-3.5 text-muted" /> Product Stock History
                                          </button>
                                          {hasPermission(userRole, 'edit_inventory') && !isArchived && (
                                            <button
                                              onClick={() => { startEditInventory(item); setOpenRowMenuId(null); }}
                                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-dim transition-colors flex items-center gap-2"
                                            >
                                              <IconPencil className="w-3.5 h-3.5 text-muted" /> Edit
                                            </button>
                                          )}
                                          {hasPermission(userRole, 'edit_inventory') && (
                                            isArchived ? (
                                              <button
                                                onClick={() => { restoreInventoryItem(item); setOpenRowMenuId(null); }}
                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-paper-dim transition-colors flex items-center gap-2"
                                                style={{ color: '#3a9d6f' }}
                                              >
                                                <IconUndo className="w-3.5 h-3.5" /> Restore
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => { archiveInventoryItem(item); setOpenRowMenuId(null); }}
                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-oxblood hover:bg-paper-dim transition-colors flex items-center gap-2"
                                              >
                                                <IconArchive className="w-3.5 h-3.5" /> Delete (Archive)
                                              </button>
                                            )
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </td>
                                  <td className="font-semibold max-w-[220px]">
                                    <span className="line-clamp-2">{item.name}</span>
                                    {item.color && <span className="block text-[11px] text-muted font-normal">{item.color}</span>}
                                  </td>
                                  <td className="text-muted">{businessSettings.business_name || 'Main Store'}</td>
                                  <td className="font-mono font-bold">৳{item.price}</td>
                                  <td>
                                    <span className={`p-badge ${isArchived ? 'p-badge-muted' : isLow || item.quantity === 0 ? 'p-badge-danger' : 'p-badge-success'}`}>
                                      {isArchived ? 'archived' : `${item.quantity} Pieces`}
                                    </span>
                                  </td>
                                  <td className="text-muted">{item.groupVariantCount > 1 ? 'Variable' : 'Single'}</td>
                                  <td className="text-muted">{item.category || '—'}</td>
                                  <td className="text-muted">{item.brand || '—'}</td>
                                  <td className="text-muted">
                                    {(() => {
                                      const rate = taxRates.find((t: any) => t.id === item.tax_rate_id);
                                      return rate ? `${rate.name} (${rate.rate_percent}%)` : '—';
                                    })()}
                                  </td>
                                  <td className="font-mono text-xs text-muted">{item.barcode}</td>
                                  <td className="text-muted">{item.size || '—'}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {flatInventoryRows.length > 0 && (
                      <div className="flex items-center justify-between px-7 pt-5 pb-2 gap-4 border-t border-thread/60 mt-2">
                        <p className="text-xs text-muted font-medium">
                          Showing {(stockPageClamped - 1) * STOCK_PAGE_SIZE + 1}
                          –{Math.min(stockPageClamped * STOCK_PAGE_SIZE, flatInventoryRows.length)} of {flatInventoryRows.length}
                          {selectedRowIds.size > 0 && <span className="text-brass font-bold"> · {selectedRowIds.size} selected</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStockPage(p => Math.max(1, p - 1))}
                            disabled={stockPageClamped <= 1}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-thread text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-dim transition-colors"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-muted font-mono">
                            Page {stockPageClamped} / {stockTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStockPage(p => Math.min(stockTotalPages, p + 1))}
                            disabled={stockPageClamped >= stockTotalPages}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-thread text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-dim transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="pb-7" />
                  </div>
               </div>
            )}

            {/* ── View Product modal (Actions ▾ → View) ── */}
            {viewingItem && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={() => setViewingItem(null)}>
                <div className="bg-canvas border border-thread rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-thread">
                    <h3 className="text-sm font-bold text-ink">Product Details</h3>
                    <button onClick={() => setViewingItem(null)} className="text-muted hover:text-ink text-lg leading-none">×</button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="w-full aspect-square max-h-56 rounded-lg overflow-hidden bg-paper-dim flex items-center justify-center">
                      {(viewingItem.image_url || viewingItem.groupImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={viewingItem.image_url || viewingItem.groupImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <IconImage className="w-8 h-8 text-muted" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-ink text-base">{viewingItem.name}</p>
                      <p className="text-xs text-muted mt-0.5">{viewingItem.category}{viewingItem.brand ? ` · ${viewingItem.brand}` : ''} · {viewingItem.unit || 'Piece'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Business Location</p><p className="text-ink">{businessSettings.business_name || 'Main Store'}</p></div>
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Selling Price</p><p className="text-ink font-mono font-bold">৳{viewingItem.price}</p></div>
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Current Stock</p><p className="text-ink">{viewingItem.quantity} Pieces</p></div>
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Product Type</p><p className="text-ink">{viewingItem.groupVariantCount > 1 ? 'Variable' : 'Single'}</p></div>
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Size</p><p className="text-ink">{viewingItem.size || '—'}</p></div>
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Color</p><p className="text-ink">{viewingItem.color || '—'}</p></div>
                      <div><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Tax</p><p className="text-ink">{(() => { const rate = taxRates.find((t: any) => t.id === viewingItem.tax_rate_id); return rate ? `${rate.name} (${rate.rate_percent}%)` : '—'; })()}</p></div>
                      <div className="col-span-2"><p className="text-[11px] text-muted uppercase font-bold tracking-wide">Barcode</p><p className="text-ink font-mono">{viewingItem.barcode}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Product Stock History modal (Actions ▾ → Product Stock History) ──
                Every sale row that touched this barcode, newest first. */}
            {historyItem && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={() => setHistoryItem(null)}>
                <div className="bg-canvas border border-thread rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-thread">
                    <div>
                      <h3 className="text-sm font-bold text-ink">Product Stock History</h3>
                      <p className="text-xs text-muted mt-0.5">{historyItem.name} · {historyItem.barcode}</p>
                    </div>
                    <button onClick={() => setHistoryItem(null)} className="text-muted hover:text-ink text-lg leading-none">×</button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {historyLoading ? (
                      <p className="text-sm text-muted text-center py-10">Loading…</p>
                    ) : historyRows.length === 0 ? (
                      <div className="text-center py-10 text-muted">
                        <IconClock className="mx-auto h-8 w-8 mb-2 text-thread-dark" />
                        <p className="text-sm font-medium">No sales recorded for this item yet.</p>
                      </div>
                    ) : (
                      <table className="p-table w-full">
                        <thead>
                          <tr><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {historyRows.map((row: any) => (
                            <tr key={row.id}>
                              <td className="text-xs">{row.sold_at ? new Date(row.sold_at).toLocaleString() : '—'}</td>
                              <td className="text-xs uppercase text-muted">{row.payment_method}</td>
                              <td className="font-mono font-bold text-xs">৳{row.amount_paid}</td>
                              <td>
                                <span className={`p-badge ${row.status === 'refunded' ? 'p-badge-danger' : 'p-badge-success'}`}>{row.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Edit Product modal (Actions ▾ → Edit) ──
                Same editDraft state/save logic the app already used inline —
                just rendered as a modal now that the list is a flat table. */}
            {editingId !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={cancelEditInventory}>
                <div className="bg-canvas border border-thread rounded-xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-thread shrink-0">
                    <h3 className="text-sm font-bold text-ink">Edit Product</h3>
                    <button onClick={cancelEditInventory} className="text-muted hover:text-ink text-lg leading-none">×</button>
                  </div>
                  <div className="p-5 space-y-3 overflow-y-auto">
                    <div>
                      <label className="p-label">Product Photo</label>
                      <label className="relative block w-20 h-20 rounded-lg overflow-hidden bg-paper-dim cursor-pointer group" title="Click to change photo">
                        {(() => {
                          const current = recentInventory.find((it: any) => it.id === editingId);
                          return current?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={current.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted"><IconImage className="w-5 h-5" /></div>
                          );
                        })()}
                        {photoUploadingId === editingId ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[9px] text-white font-bold uppercase">Saving…</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <IconPencil className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={photoUploadingId === editingId}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            const current = recentInventory.find((it: any) => it.id === editingId);
                            if (file && current) handleReplacePhoto(current, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="Item title" className="p-input text-xs col-span-2" />
                      <select value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} className="p-input text-xs col-span-2">
                        {(categories.length > 0 ? categories.map((c: any) => c.name) : FALLBACK_CATEGORIES).map((name: string) => (<option key={name} value={name}>{name}</option>))}
                      </select>
                      <input value={editDraft.size} onChange={(e) => setEditDraft({ ...editDraft, size: e.target.value })} placeholder="Size" className="p-input text-xs" />
                      <input value={editDraft.color} onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })} placeholder="Color" className="p-input text-xs" />
                      <select value={editDraft.brand} onChange={(e) => setEditDraft({ ...editDraft, brand: e.target.value })} className="p-input text-xs">
                        <option value="">No brand</option>
                        {brands.map((b: any) => (<option key={b.id} value={b.name}>{b.name}</option>))}
                      </select>
                      <select value={editDraft.unit} onChange={(e) => setEditDraft({ ...editDraft, unit: e.target.value })} className="p-input text-xs">
                        <option value="Piece">Piece</option>
                        {units.filter((u: any) => u.name !== 'Piece').map((u: any) => (<option key={u.id} value={u.name}>{u.name}</option>))}
                      </select>
                      <input type="number" value={editDraft.price} onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })} placeholder="Price" className="p-input text-xs" />
                      <input type="number" value={editDraft.quantity} onChange={(e) => setEditDraft({ ...editDraft, quantity: e.target.value })} placeholder="Quantity" className="px-3 py-2 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-xs text-ink font-mono font-bold transition-colors" />
                      <input type="number" min="0" value={editDraft.reorder_point} onChange={(e) => setEditDraft({ ...editDraft, reorder_point: e.target.value })} placeholder={`Reorder point (default: ${LOW_STOCK_THRESHOLD})`} className="w-full p-input text-xs col-span-2" />
                      <select value={editDraft.tax_rate_id} onChange={(e) => setEditDraft({ ...editDraft, tax_rate_id: e.target.value })} className="p-input text-xs col-span-2">
                        <option value="">No tax</option>
                        {taxRates.map((t: any) => (<option key={t.id} value={t.id}>{t.name} ({t.rate_percent}%)</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 p-5 pt-0 shrink-0">
                    <button onClick={() => saveEditInventory(editingId)} className="flex-1 p-btn p-btn-primary justify-center">Save</button>
                    <button onClick={cancelEditInventory} className="flex-1 p-btn p-btn-ghost justify-center">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS: ADD PRODUCT */}
            {activeTab === 'products-add' && (
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconPlus className="w-4 h-4 text-brass" />
                    Add Product
                  </h3>
                  <p className="text-sm text-muted mb-6">Fill in the shared details once, then add one row per size/color — each gets its own barcode, price, and stock count.</p>

                  {invMessage.text && <div className={`anim-alert p-alert ${invMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{invMessage.text}</div>}

                  <form onSubmit={handleAddInventory} className="space-y-5">
                    <div>
                      <label className="p-label">Product Photo</label>
                      <div className="flex items-center gap-4">
                        <label className="p-btn p-btn-ghost cursor-pointer">
                          <IconImage className="w-3.5 h-3.5" /> {invImagePreview ? 'Change Photo' : 'Choose Photo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleInvImageChange} />
                        </label>
                        {invImagePreview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={invImagePreview} alt="Preview" className="w-16 h-16 object-cover border border-thread rounded" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-1.5">Optional — shown on List Products, shared by every variant below.</p>
                    </div>
                    <div>
                      <label className="p-label">Item Title</label>
                      <input required type="text" className="w-full p-input" placeholder="e.g., Premium Cotton Panjabi" value={invName} onChange={(e) => setInvName(e.target.value)} />
                    </div>
                    <div>
                      <label className="p-label">Category</label>
                      <div className="relative">
                        <select required className="w-full px-4 py-2.5 p-input appearance-none cursor-pointer" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
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
                        <label className="p-label">Brand</label>
                        <select className="w-full px-4 py-2.5 p-input appearance-none cursor-pointer" value={invBrand} onChange={(e) => setInvBrand(e.target.value)}>
                          <option value="">No brand</option>
                          {brands.map((b: any) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="p-label">Unit</label>
                        <select className="w-full px-4 py-2.5 p-input appearance-none cursor-pointer" value={invUnit} onChange={(e) => setInvUnit(e.target.value)}>
                          <option value="Piece">Piece</option>
                          {units.filter((u: any) => u.name !== 'Piece').map((u: any) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tax — assigns one of your configured Tax Rates
                        (Settings -> Tax Rates) to this product specifically,
                        shown in List Products and printed on labels. Not
                        the same as the order-level tax picked at checkout —
                        this is the rate that applies to this exact item,
                        which can differ shop to shop if your Tax Rates are
                        set up per location. Optional — leave as "No tax"
                        for items that aren't taxed individually. */}
                    <div>
                      <label className="p-label">Tax</label>
                      <select className="w-full px-4 py-2.5 p-input appearance-none cursor-pointer" value={invTaxRateId} onChange={(e) => setInvTaxRateId(e.target.value)}>
                        <option value="">No tax</option>
                        {taxRates.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.rate_percent}%)</option>
                        ))}
                      </select>
                      {taxRates.length === 0 && (
                        <p className="text-xs text-muted mt-2">
                          No tax rates set up yet. <button type="button" onClick={() => goToTab('settings-tax', 'settings')} className="text-brass font-bold hover:text-brass-dark">Add one in Settings →</button>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-thread">
                      {/* Size/Color Matrix — quick bulk-generator for the
                          variant rows below, standard for clothing where a
                          product comes in every size × color combination. */}
                      <div className="mt-5 p-4 bg-paper-dim border border-thread space-y-3">
                        <div className="flex items-center gap-2">
                          <IconLayers className="w-3.5 h-3.5 text-brass" />
                          <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Size/Color Matrix (optional)</span>
                        </div>
                        <p className="text-xs text-muted">Type sizes and colors once, tick the combinations you actually stock, and add them all as variant rows at once.</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" className="p-input text-sm" placeholder="Sizes, e.g. S, M, L, XL" value={matrixSizesInput} onChange={(e) => setMatrixSizesInput(e.target.value)} />
                          <input type="text" className="p-input text-sm" placeholder="Colors, e.g. Red, Blue, Black" value={matrixColorsInput} onChange={(e) => setMatrixColorsInput(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" className="p-input text-sm" placeholder="Price for all (৳)" value={matrixPrice} onChange={(e) => setMatrixPrice(e.target.value)} />
                          <input type="number" min="0" className="px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold text-sm transition-colors" placeholder="Stock qty for all" value={matrixQty} onChange={(e) => setMatrixQty(e.target.value)} />
                        </div>
                        <button type="button" onClick={generateMatrixGrid} className="p-btn p-btn-ghost text-xs w-full justify-center">
                          <IconLayers className="w-3 h-3" /> Build Matrix
                        </button>

                        {matrixCombos.length > 0 && (
                          <div className="space-y-3 pt-2 border-t border-thread">
                            <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {matrixCombos.map((c, i) => {
                                const key = `${c.size}|${c.color}`;
                                const checked = !!matrixSelected[key];
                                return (
                                  <label key={i} className={`flex items-center gap-2 px-2.5 py-2 border text-xs font-semibold cursor-pointer select-none transition-colors ${checked ? 'border-brass bg-brass-light/30 text-ink' : 'border-thread text-muted'}`}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleMatrixCell(c.size, c.color)} className="accent-brass w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{c.color ? `${c.size} / ${c.color}` : c.size}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted">{Object.values(matrixSelected).filter(Boolean).length} of {matrixCombos.length} selected</p>
                            <button type="button" onClick={applyMatrixToVariants} className="p-btn p-btn-primary text-xs w-full justify-center">
                              <IconPlus className="w-3 h-3" /> Add Selected to Variants
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-5 mb-3">
                        <label className="p-label mb-0">Variants (Size / Color)</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={generateAllMissingBarcodes} disabled={generatingAllBarcodes} className="p-btn p-btn-ghost text-xs disabled:opacity-60">
                            {generatingAllBarcodes ? 'Generating…' : 'Generate All Barcodes'}
                          </button>
                          <button type="button" onClick={addVariantRow} className="p-btn p-btn-ghost text-xs">
                            <IconPlus className="w-3 h-3" /> Add Variant
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {invVariants.map((v, index) => (
                          <div key={index} className="p-4 bg-paper-dim border border-thread space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Variant {index + 1}</span>
                              {invVariants.length > 1 && (
                                <button type="button" onClick={() => removeVariantRow(index)} className="text-muted hover:text-oxblood transition-colors">
                                  <IconTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" className="p-input" placeholder="Size (e.g., M, 32, 0-5)" value={v.size} onChange={(e) => updateVariantField(index, 'size', e.target.value)} />
                              <input type="text" className="p-input" placeholder="Color (optional)" value={v.color} onChange={(e) => updateVariantField(index, 'color', e.target.value)} />
                            </div>
                            <div>
                              <div className="flex gap-2">
                                <input required type="text" className="flex-1 p-input font-mono" placeholder="Scan, type, or generate..." value={v.barcode} onChange={(e) => updateVariantField(index, 'barcode', e.target.value)} />
                                <button
                                  type="button"
                                  onClick={() => generateUniqueBarcodeForVariant(index)}
                                  disabled={v.generating}
                                  className="p-btn p-btn-ghost whitespace-nowrap disabled:opacity-60"
                                >
                                  {v.generating ? 'Generating…' : 'Generate'}
                                </button>
                              </div>
                              {v.barcode && (
                                <div className="mt-2">
                                  <div className="p-2 bg-white border border-thread inline-block">
                                    <BarcodeSVG value={v.barcode} height={38} barWidth={1.4} fontSize={11} />
                                  </div>
                                  <p className="text-[10px] text-muted mt-1 font-mono uppercase">
                                    Detected as {detectBarcodeFormat(v.barcode)}
                                    {detectBarcodeFormat(v.barcode) !== 'CODE128' && ' — scanned from packaging'}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input required type="number" className="p-input" placeholder="Price (৳)" value={v.price} onChange={(e) => updateVariantField(index, 'price', e.target.value)} />
                              <input required type="number" min="1" className="px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" placeholder="Stock qty" value={v.quantity} onChange={(e) => updateVariantField(index, 'quantity', e.target.value)} />
                            </div>
                            <input type="number" min="0" className="w-full p-input" placeholder={`Reorder point (optional — default ${LOW_STOCK_THRESHOLD})`} value={v.reorderPoint} onChange={(e) => updateVariantField(index, 'reorderPoint', e.target.value)} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted mt-3">Leave Size/Color blank for a product with no variants — one row is all you need.</p>
                    </div>

                    <button type="submit" disabled={invImageUploading} className="btn-shimmer w-full mt-2 p-btn p-btn-primary disabled:opacity-60">
                      {invImageUploading ? 'Uploading Photo…' : `Save ${invVariants.length > 1 ? `${invVariants.length} Variants` : 'to Database'}`}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* PRODUCTS: PRINT LABELS */}
            {activeTab === 'products-labels' && (
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconPrinter className="w-4 h-4 text-brass" />
                    Print Labels
                  </h3>
                  <p className="text-sm text-muted mb-6">Search for a product, add it to the batch with how many tags you need, then print the whole batch at once.</p>

                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                      <IconSearch className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by title or barcode..."
                      className="w-full pl-11 pr-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors"
                      value={labelSearchQuery}
                      onChange={(e) => setLabelSearchQuery(e.target.value)}
                    />
                  </div>
                  {labelSearchQuery !== '' && (
                    <div className="divide-y divide-thread/50 max-h-[260px] overflow-y-auto mb-6 border border-thread bg-paper-dim/40">
                      {labelResults.length === 0 && (
                        <p className="text-center py-6 text-sm text-muted">No matching products.</p>
                      )}
                      {labelResults.map(item => (
                        <button key={item.id} onClick={() => addToLabelQueue(item)} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-paper-dim transition-colors px-3">
                          <div className="min-w-0">
                            <p className="font-bold text-ink text-sm truncate">{variantLabel(item)}</p>
                            <p className="text-xs text-muted font-mono">{item.barcode}{item.brand ? ` · ${item.brand}` : ''}</p>
                          </div>
                          <p className="font-mono font-bold text-ink text-sm shrink-0">৳{item.price}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {labelQueue.length === 0 ? (
                    <div className="p-empty">
                      <IconTag className="w-6 h-6 text-muted mx-auto mb-2" />
                      <p className="p-empty-desc">Search above and pick a product to start a print batch.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="divide-y divide-thread border border-thread">
                        {labelQueue.map(item => (
                          <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{item.name}{item.variant ? ` (${item.variant})` : ''}</p>
                              <p className="text-xs text-muted font-mono">{item.barcode} · ৳{item.price}{item.brand ? ` · ${item.brand}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Tags</label>
                              <input
                                type="number"
                                min="1"
                                className="w-16 px-2 py-1.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm text-center"
                                value={labelQtyDraft[item.id] ?? String(item.qty)}
                                onChange={(e) => setLabelQueueQty(item.id, e.target.value)}
                              />
                              <button onClick={() => removeFromLabelQueue(item.id)} className="text-muted hover:text-oxblood transition-colors p-1">
                                <IconTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-paper-dim border border-thread flex items-center justify-center">
                        <div className="bg-white border border-thread rounded p-3 text-center" style={{ width: '62mm' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={businessSettings.logo_url || "/logo-ac.png"} alt="" className="h-[9mm] w-auto mx-auto mb-1" />
                          {labelQueue[labelQueue.length - 1].brand && (
                            <p className="text-[13px] font-bold text-black uppercase tracking-wide mb-0.5" style={{ fontFamily: 'var(--font-display), Georgia, serif' }}>{labelQueue[labelQueue.length - 1].brand}</p>
                          )}
                          <p className="text-[10.5px] font-bold text-black leading-tight truncate">
                            {labelQueue[labelQueue.length - 1].name}
                            {labelQueue[labelQueue.length - 1].category && (
                              <span className="font-bold"> · {labelQueue[labelQueue.length - 1].category}</span>
                            )}
                          </p>
                          {labelQueue[labelQueue.length - 1].variant && (
                            <p className="text-[10px] font-bold text-black mt-0.5">{labelQueue[labelQueue.length - 1].variant}</p>
                          )}
                          <p className="text-[15px] font-bold text-black my-0.5">৳{labelQueue[labelQueue.length - 1].price}</p>
                          {labelQueue[labelQueue.length - 1].taxLabel && (
                            <p className="text-[9px] font-bold text-black mb-0.5">{labelQueue[labelQueue.length - 1].taxLabel} · Total ৳{labelQueue[labelQueue.length - 1].total}</p>
                          )}
                          <div className="flex justify-center">
                            <BarcodeSVG value={labelQueue[labelQueue.length - 1].barcode} height={40} barWidth={1.4} fontSize={11} />
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted text-center -mt-2">Preview of the last item added — this is exactly what prints, one per tag.</p>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted font-medium">{totalLabelCount} label{totalLabelCount === 1 ? '' : 's'} across {labelQueue.length} product{labelQueue.length === 1 ? '' : 's'}</p>
                        <div className="flex gap-2">
                          <button onClick={clearLabelQueue} className="p-btn p-btn-ghost">Clear Batch</button>
                          <button onClick={() => triggerPrint('labels')} className="p-btn p-btn-primary btn-shimmer">
                            <IconPrinter className="w-3.5 h-3.5" /> Print {totalLabelCount} Label{totalLabelCount === 1 ? '' : 's'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRODUCTS: UPDATE PRICE */}
            {activeTab === 'products-price' && (
              <div className="print:hidden">
                <div className="p-card">
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
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread/50 max-h-[560px] overflow-y-auto">
                    {priceSearchQuery === '' ? (
                      <div className="p-empty"><p className="p-empty-desc">Start typing to find a product.</p></div>
                    ) : priceSearchResults.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No matching products.</p></div>
                    ) : (
                      priceSearchResults.map(item => {
                        const isEditing = priceDraftId === item.id;
                        return (
                          <div key={item.id} className="p-list-item">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{variantLabel(item)}</p>
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
                                <button onClick={() => saveQuickPrice(item.id)} className="text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors" style={{ background: '#2563eb' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>Save</button>
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

            {/* PRODUCTS: REORDER SUGGESTIONS */}
            {activeTab === 'products-reorder' && (
              <div className="print:hidden">
                <div className="p-card">
                  <div className="flex items-center justify-between px-7 pt-7 pb-5 gap-4 flex-wrap">
                    <div>
                      <h3 className="text-base font-bold text-ink flex items-center gap-2">
                        <IconTrendingUp className="w-4 h-4 text-brass" />
                        Reorder Suggestions
                      </h3>
                      <p className="text-sm text-muted mt-1">
                        Based on units sold in the last {REORDER_LOOKBACK_DAYS} days. Suggested quantity restocks each item to roughly {REORDER_LOOKBACK_DAYS} days of cover at its current sales pace.
                      </p>
                    </div>
                    <button
                      onClick={fetchReorderVelocity}
                      disabled={reorderLoading}
                      className="p-btn p-btn-ghost shrink-0 disabled:opacity-50"
                    >
                      {reorderLoading ? 'Refreshing…' : '↻ Refresh'}
                    </button>
                  </div>
                  <div className="p-divider mx-7 mb-2" />

                  {(() => {
                    // Build one row per active (non-archived) variant, using
                    // its own reorder point and its own sales velocity.
                    const rows = activeStock.map((item: any) => {
                      const unitsSold = reorderVelocity[String(item.id)] || 0;
                      const avgDaily = unitsSold / REORDER_LOOKBACK_DAYS;
                      const daysLeft = avgDaily > 0 ? item.quantity / avgDaily : Infinity;
                      const reorderPoint = effectiveReorderPoint(item);
                      const targetStock = Math.ceil(avgDaily * REORDER_LOOKBACK_DAYS);
                      const suggestedQty = Math.max(0, targetStock - item.quantity);
                      const needsAttention = item.quantity <= reorderPoint || (avgDaily > 0 && daysLeft <= 14);
                      return { item, unitsSold, avgDaily, daysLeft, reorderPoint, suggestedQty, needsAttention };
                    })
                      .filter((r: any) => r.needsAttention)
                      .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

                    if (rows.length === 0) {
                      return (
                        <div className="p-empty">
                          <div className="p-empty-icon"><IconTrendingUp className="w-5 h-5" /></div>
                          <p className="p-empty-title">Nothing needs reordering right now</p>
                          <p className="p-empty-desc">Every active item is above its reorder point and not projected to run out within 14 days.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="p-table">
                          <thead>
                            <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
                              <th className="p-4 font-bold">Item</th>
                              <th className="p-4 font-bold text-right">In Stock</th>
                              <th className="p-4 font-bold text-right">Reorder Point</th>
                              <th className="p-4 font-bold text-right">Sold / {REORDER_LOOKBACK_DAYS}d</th>
                              <th className="p-4 font-bold text-right">Est. Days Left</th>
                              <th className="p-4 font-bold text-right">Suggested Reorder</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-thread">
                            {rows.map((r: any) => (
                              <tr key={r.item.id} className={r.daysLeft <= 7 ? 'bg-oxblood-light/10' : ''}>
                                <td className="p-4">
                                  <p className="text-sm font-bold text-ink">{variantLabel(r.item)}</p>
                                  <span className="text-xs font-mono text-muted">{r.item.barcode}</span>
                                </td>
                                <td className="p-4 text-sm font-mono text-right text-ink">{r.item.quantity}</td>
                                <td className="p-4 text-sm font-mono text-right text-muted">{r.reorderPoint}</td>
                                <td className="p-4 text-sm font-mono text-right text-ink">{r.unitsSold}</td>
                                <td className="p-4 text-right">
                                  <span className={`text-sm font-mono font-bold ${!Number.isFinite(r.daysLeft) ? 'text-muted' : r.daysLeft <= 7 ? 'text-oxblood' : r.daysLeft <= 14 ? 'text-brass' : 'text-ink'}`}>
                                    {Number.isFinite(r.daysLeft) ? `${Math.round(r.daysLeft)}d` : '—'}
                                  </span>
                                </td>
                                <td className="p-4 text-sm font-mono font-bold text-right text-moss">
                                  {r.suggestedQty > 0 ? `+${r.suggestedQty}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                  <div className="pb-7" />
                </div>
              </div>
            )}

            {/* PRODUCTS: LOCATIONS & TRANSFERS */}
            {activeTab === 'products-locations' && (
              <div className="space-y-6 print:hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Locations list */}
                  <div className="p-card p-7">
                    <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                      <IconTruck className="w-4 h-4 text-brass" />
                      Locations
                    </h3>
                    <p className="text-sm text-muted mb-5">Warehouses, branches, or storage spots you track stock across.</p>
                    {locationMessage.text && (
                      <div className={`anim-alert p-alert ${locationMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{locationMessage.text}</div>
                    )}
                    <form onSubmit={addLocation} className="flex gap-2 mb-5">
                      <input type="text" placeholder="Location name, e.g. Main Store" className="flex-1 p-input text-sm" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} />
                      <button type="submit" className="p-btn p-btn-primary shrink-0"><IconPlus className="w-3.5 h-3.5" /> Add</button>
                    </form>
                    <input type="text" placeholder="Address (optional)" className="w-full p-input text-sm mb-5" value={newLocationAddress} onChange={(e) => setNewLocationAddress(e.target.value)} />
                    <div className="divide-y divide-thread border border-thread">
                      {locations.length === 0 ? (
                        <div className="p-empty"><p className="p-empty-desc">No locations yet — run migration_009 first, then add your first branch/warehouse above.</p></div>
                      ) : (
                        locations.map((loc: any) => (
                          <div key={loc.id} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm">{loc.name}</p>
                              {loc.address && <p className="text-xs text-muted mt-0.5">{loc.address}</p>}
                            </div>
                            <button onClick={() => deleteLocation(loc.id, loc.name)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors shrink-0">
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Transfer stock */}
                  <div className="p-card p-7">
                    <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                      <IconUndo className="w-4 h-4 text-brass" />
                      Transfer Stock
                    </h3>
                    <p className="text-sm text-muted mb-5">
                      Records where stock physically sits. This doesn&rsquo;t change the total quantity the POS sells from — it&rsquo;s a
                      separate breakdown of which location currently holds it.
                    </p>
                    {transferMessage.text && (
                      <div className={`anim-alert p-alert ${transferMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{transferMessage.text}</div>
                    )}
                    <form onSubmit={handleTransferBarcodeSearch} className="flex gap-2 mb-5">
                      <input type="text" placeholder="Scan or type product barcode..." className="flex-1 p-input font-mono" value={transferBarcode} onChange={(e) => setTransferBarcode(e.target.value)} />
                      <button type="submit" className="p-btn p-btn-primary">Find</button>
                    </form>

                    {transferMatch && (
                      <div className="space-y-4">
                        <div className="bg-paper-dim p-4 border border-thread">
                          <p className="font-bold text-ink text-sm">{variantLabel(transferMatch)}</p>
                          <p className="text-xs text-muted font-mono mt-0.5">{transferMatch.barcode} · {transferMatch.quantity} total in stock</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="p-label">From</label>
                            <select value={transferFromLocationId} onChange={(e) => setTransferFromLocationId(e.target.value)} className="w-full p-input text-sm">
                              <option value="">Initial stock (not moving from another location)</option>
                              {locations.map((loc: any) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                            </select>
                            <p className="text-[11px] text-muted mt-1">First time assigning this product to a location? Leave this as "Initial stock".</p>
                          </div>
                          <div>
                            <label className="p-label">To</label>
                            <select value={transferToLocationId} onChange={(e) => setTransferToLocationId(e.target.value)} className="w-full p-input text-sm">
                              <option value="">Select…</option>
                              {locations.map((loc: any) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="p-label">Quantity</label>
                          <input type="number" min="1" className="w-full px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} />
                        </div>
                        <button onClick={handleRecordTransfer} className="p-btn p-btn-primary btn-shimmer w-full py-3">Record Transfer</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current breakdown by location */}
                <div className="p-card overflow-hidden">
                  <div className="p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Stock by Location</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
                          <th className="p-4 font-bold">Item</th>
                          <th className="p-4 font-bold">Location</th>
                          <th className="p-4 font-bold text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {locationStock.length === 0 && (
                          <tr><td colSpan={3} className="p-8 text-center text-muted font-medium">No stock recorded at any location yet — use Transfer Stock above to start tracking a breakdown.</td></tr>
                        )}
                        {locationStock.map((ls: any) => (
                          <tr key={ls.id}>
                            <td className="p-4">
                              <p className="text-sm font-bold text-ink">{ls.dresses?.name}</p>
                              <span className="text-xs font-mono text-muted">{ls.dresses?.barcode}</span>
                            </td>
                            <td className="p-4 text-sm text-ink">{ls.locations?.name}</td>
                            <td className="p-4 text-sm font-mono font-bold text-right text-ink">{ls.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transfer history */}
                <div className="p-card overflow-hidden">
                  <div className="p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Transfer History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Item</th>
                          <th className="p-4 font-bold">From</th>
                          <th className="p-4 font-bold">To</th>
                          <th className="p-4 font-bold text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {stockTransfers.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-muted font-medium">No transfers logged yet.</td></tr>
                        )}
                        {stockTransfers.map((t: any) => (
                          <tr key={t.id}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(t.created_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className="text-sm font-bold text-ink">{t.dresses?.name}</p>
                              <span className="text-xs font-mono text-muted">{t.dresses?.barcode}</span>
                            </td>
                            <td className="p-4 text-sm text-muted">{t.from_location?.name || 'Initial stock'}</td>
                            <td className="p-4 text-sm text-muted">{t.to_location?.name || '—'}</td>
                            <td className="p-4 text-sm font-mono font-bold text-right text-ink">{t.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS: WRITE-OFFS */}
            {activeTab === 'products-writeoffs' && (
              <div className="print:hidden">
                <h3 className="text-xl font-display text-ink mb-2">Write-Offs</h3>
                <p className="text-sm text-muted mb-6">Damaged, defective, lost, or expired stock — removed from sellable inventory with a reason on record.</p>
                <WriteOffsPanel />
              </div>
            )}

            {/* PRODUCTS: CATEGORIES */}
            {activeTab === 'products-categories' && (
              <div className="print:hidden">
                <div className="p-card">
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
                      className="flex-1 p-input text-sm"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="submit" className="p-btn p-btn-primary">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {categories.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No categories yet — built-in defaults are used until you add your own.</p></div>
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
              <div className="print:hidden">
                <div className="p-card">
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
                      className="flex-1 p-input text-sm"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Code, e.g. set"
                      className="w-28 p-input text-sm"
                      value={newUnitCode}
                      onChange={(e) => setNewUnitCode(e.target.value)}
                    />
                    <button type="submit" className="p-btn p-btn-primary shrink-0">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {units.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No units yet.</p></div>
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
              <div className="print:hidden">
                <div className="p-card">
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
                      className="flex-1 p-input text-sm"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                    />
                    <button type="submit" className="p-btn p-btn-primary">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {brands.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No brands yet.</p></div>
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
                  <div className="p-card p-7">
                    <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                      <IconClipboard className="w-4 h-4 text-brass" />
                      New Requisition
                    </h3>
                    <p className="text-sm text-muted mb-6">Log what you need to reorder before placing an actual order.</p>
                    {reqMessage.text && <div className={`anim-alert p-alert ${reqMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{reqMessage.text}</div>}
                    <form onSubmit={handleAddRequisition} className="space-y-5">
                      <div>
                        <label className="p-label">Item Needed</label>
                        <input required type="text" className="w-full p-input" placeholder="e.g., Cotton Panjabi - Medium" value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="p-label">Quantity Needed</label>
                          <input required type="number" min="1" className="w-full p-input" value={reqQuantity} onChange={(e) => setReqQuantity(e.target.value)} />
                        </div>
                        <div>
                          <label className="p-label">Preferred Supplier</label>
                          <input type="text" className="w-full p-input" placeholder="Optional" value={reqSupplier} onChange={(e) => setReqSupplier(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="p-label">Notes</label>
                        <textarea rows={2} className="w-full p-input resize-none" placeholder="Optional" value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="btn-shimmer w-full p-btn p-btn-primary">
                        Log Requisition
                      </button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <div className="p-card h-full flex flex-col">
                    <div className="flex items-center justify-between px-7 pt-7 mb-5">
                      <h3 className="text-base font-bold text-ink">Requisition List</h3>
                      <span className="text-muted text-xs font-mono font-bold">{requisitions.length} LOGGED</span>
                    </div>
                    <div className="p-divider mx-7 mb-2" />
                    <div className="px-7 py-2 divide-y divide-thread overflow-y-auto max-h-[560px]">
                      {requisitions.length === 0 ? (
                        <div className="p-empty"><p className="p-empty-desc">No requisitions logged yet.</p></div>
                      ) : (
                        requisitions.map((r: any) => (
                          <div key={r.id} className="p-list-item">
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
                                r.status === 'fulfilled' ? 'p-badge p-badge-success'
                                : r.status === 'ordered' ? 'p-badge p-badge-brass'
                                : 'p-badge p-badge-muted'
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
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconFileText className="w-4 h-4 text-brass" />
                    New Purchase Order
                  </h3>
                  <p className="text-sm text-muted mb-6">Place an order with a supplier. Stock updates later, once it's received under Add Purchase.</p>
                  {poMessage.text && <div className={`anim-alert p-alert ${poMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{poMessage.text}</div>}
                  <form onSubmit={handleCreatePurchaseOrder} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="p-label">Supplier Name</label>
                        <input required type="text" className="w-full p-input" value={poSupplierName} onChange={(e) => setPoSupplierName(e.target.value)} />
                      </div>
                      <div>
                        <label className="p-label">Supplier Phone</label>
                        <input type="text" className="w-full p-input" placeholder="Optional" value={poSupplierPhone} onChange={(e) => setPoSupplierPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="p-label">Expected Date</label>
                        <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={poExpectedDate} onChange={(e) => setPoExpectedDate(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="p-label">Line Items</label>
                      <div className="space-y-2">
                        {poLineItems.map((li, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Item description"
                              className="flex-1 p-input"
                              value={li.description}
                              onChange={(e) => updatePoLineItem(i, 'description', e.target.value)}
                            />
                            <input
                              type="number"
                              placeholder="Qty"
                              className="w-20 p-input"
                              value={li.quantity}
                              onChange={(e) => updatePoLineItem(i, 'quantity', e.target.value)}
                            />
                            <input
                              type="number"
                              placeholder="Unit Cost"
                              className="w-28 p-input"
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
                      <label className="p-label">Notes</label>
                      <textarea rows={2} className="w-full p-input resize-none" placeholder="Optional" value={poNotes} onChange={(e) => setPoNotes(e.target.value)} />
                    </div>

                    <button type="submit" className="p-btn p-btn-primary">
                      Create Purchase Order
                    </button>
                  </form>
                </div>

                <div className="p-card">
                  <div className="flex items-center justify-between px-7 pt-7 mb-5">
                    <h3 className="text-base font-bold text-ink">Purchase Orders</h3>
                    <span className="text-muted text-xs font-mono font-bold">{purchaseOrders.length} ORDERS</span>
                  </div>
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {purchaseOrders.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No purchase orders yet.</p></div>
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
                                po.status === 'received' ? 'p-badge p-badge-success'
                                : po.status === 'cancelled' ? 'p-badge p-badge-danger'
                                : 'p-badge p-badge-brass'
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
                <div className="p-card overflow-hidden">
                  <div className="flex items-center justify-between p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Purchase History</h3>
                    <button onClick={() => goToTab('purchases-add', 'purchases')} className="p-btn p-btn-primary">
                      <IconPlus className="w-3.5 h-3.5" /> Add Purchase
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
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
                                p.payment_status === 'paid' ? 'p-badge p-badge-success'
                                : p.payment_status === 'due' ? 'p-badge p-badge-danger'
                                : 'p-badge p-badge-brass'
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
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconTruck className="w-4 h-4 text-brass" />
                    Add Purchase (Goods Received)
                  </h3>
                  <p className="text-sm text-muted mb-6">Recording a purchase here adds stock directly to that product's quantity.</p>

                  {purchaseMessage.text && <div className={`anim-alert p-alert ${purchaseMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{purchaseMessage.text}</div>}

                  <form onSubmit={handlePurchaseBarcodeSearch} className="flex gap-2 mb-6">
                    <input type="text" placeholder="Scan or type product barcode..." className="flex-1 p-input" value={purchaseBarcode} onChange={(e) => setPurchaseBarcode(e.target.value)} />
                    <button type="submit" className="p-btn p-btn-primary">Find</button>
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
                          <label className="p-label">Quantity Received</label>
                          <input type="number" min="1" className="w-full px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} />
                        </div>
                        <div>
                          <label className="p-label">Unit Cost (৳)</label>
                          <input type="number" className="w-full p-input" value={purchaseUnitCost} onChange={(e) => setPurchaseUnitCost(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="p-label">Supplier Name</label>
                          <input type="text" className="w-full p-input" placeholder="Optional" value={purchaseSupplierName} onChange={(e) => setPurchaseSupplierName(e.target.value)} />
                        </div>
                        <div>
                          <label className="p-label">Supplier Phone</label>
                          <input type="text" className="w-full p-input" placeholder="Optional" value={purchaseSupplierPhone} onChange={(e) => setPurchaseSupplierPhone(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="p-label">Payment Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['paid', 'due', 'partial'] as const).map((s) => {
                            const color = s === 'paid' ? '#3a9d6f' : s === 'due' ? '#d94f4f' : '#f6921e';
                            const active = purchasePaymentStatus === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setPurchasePaymentStatus(s)}
                                className="py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border-2 transition-all"
                                style={active ? { background: color, borderColor: color, color: '#fff' } : { background: `${color}17`, borderColor: `${color}55`, color }}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={handleRecordPurchase} className="p-btn p-btn-success btn-shimmer w-full py-3.5">
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

                  {returnMessage.text && <div className={`anim-alert p-alert ${returnMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{returnMessage.text}</div>}

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
                          <label className="p-label">Quantity to Return</label>
                          <input type="number" min="1" max={returnMatch.quantity} className="w-full px-4 py-2.5 bg-oxblood-light/40 border border-oxblood/30 focus:border-oxblood outline-none text-ink font-mono font-bold transition-colors" value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} />
                        </div>
                        <div>
                          <label className="p-label">Supplier Name</label>
                          <input type="text" className="w-full p-input" placeholder="Optional" value={returnSupplierName} onChange={(e) => setReturnSupplierName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="p-label">Reason</label>
                        <textarea rows={2} className="w-full p-input resize-none" placeholder="e.g., defective stitching, wrong size shipped" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
                      </div>
                      <button onClick={handleRecordReturn} className="p-btn p-btn-danger w-full py-3.5">
                        Log Return & Adjust Stock
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-card overflow-hidden">
                  <div className="p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Return History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
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

            {/* PURCHASES: SUPPLIERS */}
            {activeTab === 'purchases-suppliers' && (
              <div className="print:hidden">
                <div className="p-card p-7 mb-6">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconUsers className="w-4 h-4 text-brass" />
                    Add Supplier
                  </h3>
                  <p className="text-sm text-muted mb-6">A contact book of who supplies what — separate from any single purchase order or return.</p>

                  {supplierMessage.text && <div className={`anim-alert p-alert ${supplierMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{supplierMessage.text}</div>}

                  <form onSubmit={addSupplier} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="p-label">Supplier Name</label>
                        <input required type="text" className="w-full p-input" placeholder="e.g., Hexa Textiles" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                      </div>
                      <div>
                        <label className="p-label">Phone Number</label>
                        <input required type="text" className="w-full p-input font-mono" placeholder="01XXXXXXXXX" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="p-label">Place</label>
                      <input type="text" className="w-full p-input" placeholder="e.g., Mirpur, Dhaka" value={supplierPlace} onChange={(e) => setSupplierPlace(e.target.value)} />
                    </div>
                    <div>
                      <label className="p-label">Product Details</label>
                      <textarea rows={3} className="w-full p-input resize-none" placeholder="Write freely — what they supply, pricing notes, lead times, anything worth remembering..." value={supplierProductDetails} onChange={(e) => setSupplierProductDetails(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-shimmer w-full p-btn p-btn-primary">
                      Save Supplier
                    </button>
                  </form>
                </div>

                <div className="p-card overflow-hidden">
                  <div className="p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Supplier Directory</h3>
                    <div className="relative mt-4">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                        <IconSearch className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, place, or phone..."
                        className="w-full pl-11 pr-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink text-sm transition-colors"
                        value={supplierSearchQuery}
                        onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-thread">
                    {filteredSuppliers.length === 0 && (
                      <div className="p-empty"><p className="p-empty-desc">{suppliers.length === 0 ? 'No suppliers saved yet.' : 'No suppliers match that search.'}</p></div>
                    )}
                    {filteredSuppliers.map((s: any) => (
                      <div key={s.id} className="p-5">
                        {editingSupplierId === s.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" className="w-full p-input text-sm" placeholder="Name" value={editSupplierDraft.name} onChange={(e) => setEditSupplierDraft({ ...editSupplierDraft, name: e.target.value })} />
                              <input type="text" className="w-full p-input text-sm font-mono" placeholder="Phone" value={editSupplierDraft.phone} onChange={(e) => setEditSupplierDraft({ ...editSupplierDraft, phone: e.target.value })} />
                            </div>
                            <input type="text" className="w-full p-input text-sm" placeholder="Place" value={editSupplierDraft.place} onChange={(e) => setEditSupplierDraft({ ...editSupplierDraft, place: e.target.value })} />
                            <textarea rows={3} className="w-full p-input text-sm resize-none" placeholder="Product details" value={editSupplierDraft.product_details} onChange={(e) => setEditSupplierDraft({ ...editSupplierDraft, product_details: e.target.value })} />
                            <div className="flex gap-2">
                              <button onClick={() => saveEditSupplier(s.id)} className="flex-1 text-white text-[11px] font-bold uppercase tracking-wide py-2 transition-colors" style={{ background: '#2563eb' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
                                Save
                              </button>
                              <button onClick={cancelEditSupplier} className="flex-1 border border-thread text-ink text-[11px] font-bold uppercase tracking-wide py-2 hover:border-thread-dark transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm">{s.name}</p>
                              <p className="text-xs text-muted font-mono mt-0.5">{s.phone}{s.place ? ` · ${s.place}` : ''}</p>
                              {s.product_details && (
                                <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{s.product_details}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => startEditSupplier(s)} title="Edit" className="w-7 h-7 flex items-center justify-center border border-thread text-ink hover:border-brass hover:text-brass transition-colors">
                                <IconPencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteSupplier(s.id, s.name)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SELL: SALES ORDER */}
            {activeTab === 'sell-order' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                <div className="lg:col-span-5">
                  <div className="p-card p-7">
                    <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                      <IconCalendar className="w-4 h-4 text-brass" />
                      New Sales Order
                    </h3>
                    <p className="text-sm text-muted mb-6">Log a customer pre-order to fulfill later — no stock is deducted until you ring it up at the till.</p>
                    {soMessage.text && <div className={`anim-alert p-alert ${soMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{soMessage.text}</div>}
                    <form onSubmit={handleAddSalesOrder} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="p-label">Customer Name</label>
                          <input required type="text" className="w-full p-input" value={soCustomerName} onChange={(e) => setSoCustomerName(e.target.value)} />
                        </div>
                        <div>
                          <label className="p-label">Customer Phone</label>
                          <input type="text" className="w-full p-input" placeholder="Optional" value={soCustomerPhone} onChange={(e) => setSoCustomerPhone(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="p-label">Item Wanted</label>
                        <input required type="text" className="w-full p-input" placeholder="e.g., Maroon Panjabi - Large" value={soItemDescription} onChange={(e) => setSoItemDescription(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="p-label">Quantity</label>
                          <input required type="number" min="1" className="w-full p-input" value={soQuantity} onChange={(e) => setSoQuantity(e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <label className="p-label">Agreed Price (৳)</label>
                          <input type="number" className="w-full p-input" placeholder="Optional" value={soUnitPrice} onChange={(e) => setSoUnitPrice(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="p-label">Needed By</label>
                        <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={soExpectedDate} onChange={(e) => setSoExpectedDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="p-label">Notes</label>
                        <textarea rows={2} className="w-full p-input resize-none" placeholder="Optional" value={soNotes} onChange={(e) => setSoNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="btn-shimmer w-full p-btn p-btn-primary">
                        Log Sales Order
                      </button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <div className="p-card h-full flex flex-col">
                    <div className="flex items-center justify-between px-7 pt-7 mb-5">
                      <h3 className="text-base font-bold text-ink">Sales Orders</h3>
                      <span className="text-muted text-xs font-mono font-bold">{salesOrders.length} LOGGED</span>
                    </div>
                    <div className="p-divider mx-7 mb-2" />
                    <div className="px-7 py-2 divide-y divide-thread overflow-y-auto max-h-[560px]">
                      {salesOrders.length === 0 ? (
                        <div className="p-empty"><p className="p-empty-desc">No sales orders logged yet.</p></div>
                      ) : (
                        salesOrders.map((so: any) => (
                          <div key={so.id} className="p-list-item">
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
                                so.status === 'fulfilled' ? 'p-badge p-badge-success'
                                : so.status === 'cancelled' ? 'p-badge p-badge-danger'
                                : 'p-badge p-badge-brass'
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
                <div className="p-card overflow-hidden">
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
                        onChange={(e) => { setAllSalesSearchQuery(e.target.value); setAllSalesPage(1); }}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
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
                        {allSalesPaginated.map((sale) => (
                          <tr key={sale.id} className={`${sale.status === 'refunded' ? 'opacity-50' : 'hover:bg-brass/5'} transition-colors`}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className={`text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{variantLabel(sale.dresses)}</p>
                              <span className="text-xs font-mono text-muted">{sale.dresses?.barcode}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-ink bg-paper-dim px-2 py-1">
                                {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${sale.status === 'refunded' ? 'p-badge p-badge-muted' : 'p-badge p-badge-success'}`}>
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
                  {allSalesFiltered.length > 0 && (
                    <div className="flex items-center justify-between p-7 pt-5 gap-4 border-t border-thread/60">
                      <p className="text-xs text-muted font-medium">
                        Showing {(allSalesPageClamped - 1) * ALL_SALES_PAGE_SIZE + 1}
                        –{Math.min(allSalesPageClamped * ALL_SALES_PAGE_SIZE, allSalesFiltered.length)} of {allSalesFiltered.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAllSalesPage(p => Math.max(1, p - 1))}
                          disabled={allSalesPageClamped <= 1}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-thread text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-dim transition-colors"
                        >
                          Prev
                        </button>
                        <span className="text-xs text-muted font-mono">
                          Page {allSalesPageClamped} / {allSalesTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAllSalesPage(p => Math.min(allSalesTotalPages, p + 1))}
                          disabled={allSalesPageClamped >= allSalesTotalPages}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-thread text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-dim transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SELL: ADD SALE (search-based quick sale, no scanner needed) */}
            {activeTab === 'sell-add' && (
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconBag className="w-4 h-4 text-brass" />
                    Add Sale
                  </h3>
                  <p className="text-sm text-muted mb-6">Find a product by name when there's no barcode to scan, then complete the sale directly.</p>

                  {addSaleMessage.text && <div className={`anim-alert p-alert ${addSaleMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{addSaleMessage.text}</div>}

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
                      <div className="divide-y divide-thread/50 max-h-[400px] overflow-y-auto">
                        {addSaleSearchQuery !== '' && addSaleResults.length === 0 && (
                          <p className="text-center py-8 text-sm text-muted">No in-stock items match that search.</p>
                        )}
                        {addSaleResults.map(item => (
                          <button key={item.id} onClick={() => selectAddSaleItem(item)} className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-paper-dim transition-colors px-2">
                            <div className="min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{variantLabel(item)}</p>
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
                          <p className="font-bold text-ink text-sm">{variantLabel(addSaleSelectedItem)}</p>
                          <p className="text-xs text-muted font-mono mt-0.5">{addSaleSelectedItem.barcode} · ৳{addSaleSelectedItem.price}</p>
                        </div>
                        <button onClick={() => setAddSaleSelectedItem(null)} className="text-xs font-bold text-muted hover:text-ink uppercase tracking-wide">Change</button>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Payment Method</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {PAYMENT_METHODS.map((method) => {
                            const color = PAYMENT_METHOD_COLORS[method];
                            const active = addSalePaymentMethod === method;
                            return (
                              <button
                                key={method}
                                className="py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border-2 transition-all"
                                style={active ? {
                                  background: color,
                                  borderColor: color,
                                  color: '#fff',
                                  boxShadow: `0 4px 14px ${color}55`,
                                } : {
                                  background: `${color}17`,
                                  borderColor: `${color}55`,
                                  color,
                                }}
                                onClick={() => setAddSalePaymentMethod(method as any)}
                              >
                                {method}
                              </button>
                            );
                          })}
                        </div>
                        {(addSalePaymentMethod !== 'cash' && addSalePaymentMethod !== 'bank/card') && (
                          <input type="text" placeholder="Mobile banking TrxID" className="w-full p-input mb-4" value={addSaleTrxId} onChange={(e) => setAddSaleTrxId(e.target.value)} />
                        )}
                      </div>
                      <button onClick={handleCompleteAddSale} className="p-btn p-btn-success btn-shimmer w-full py-3.5">
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
                <div className="p-card">
                  <div className="flex items-center justify-between px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink">Recent POS Activity</h3>
                    <button onClick={() => goToTab('pos', 'sell')} className="p-btn p-btn-primary">
                      <IconScan className="w-3.5 h-3.5" /> Open POS
                    </button>
                  </div>
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {salesRecord.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No sales recorded yet.</p></div>
                    ) : (
                      salesRecord.slice(0, 30).map(sale => (
                        <div key={sale.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`font-bold text-sm truncate ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{variantLabel(sale.dresses)}</p>
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
              <div className="print:hidden">
                <div className="bg-canvas p-8 border border-oxblood/25">
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-oxblood-light flex items-center justify-center mx-auto mb-4">
                      <IconUndo className="w-6 h-6 text-oxblood" />
                    </div>
                    <h3 className="text-xl font-display text-ink">Refund & Returns Center</h3>
                    <p className="text-muted mt-2 text-sm">Scan an item to pull up its completed sales history.</p>
                  </div>

                  {refundMessage.text && <div className={`px-4 py-3 mb-6 text-sm font-semibold border text-center ${refundMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{refundMessage.text}</div>}

                  <form onSubmit={handleRefundSearch} className="mb-9 flex gap-2">
                    <input type="text" autoFocus placeholder="Scan barcode..." className="flex-1 px-5 py-3.5 bg-paper border border-thread focus:bg-canvas focus:border-oxblood outline-none text-ink font-mono transition-colors text-lg" value={refundBarcode} onChange={(e) => setRefundBarcode(e.target.value)} />
                    <button type="submit" className="p-btn p-btn-danger px-7">Search</button>
                  </form>

                  <div className="divide-y divide-dashed divide-thread-dark ">
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
                          <div className="flex gap-2">
                            <button onClick={() => processRefund(sale, false)} className="p-badge p-badge-danger px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-oxblood hover:text-white transition-colors border border-oxblood/20 flex items-center gap-2">
                              <IconUndo className="w-3.5 h-3.5" />
                              Approve Refund
                            </button>
                            <button onClick={() => processRefund(sale, true)} title="Issue a gift-card code for this amount instead of cash back" className="p-badge p-badge-brass px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-brass hover:text-white transition-colors border border-brass/30 flex items-center gap-2">
                              <IconCard className="w-3.5 h-3.5" />
                              As Store Credit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-card mt-6">
                  <div className="p-6 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Recent Returns</h3>
                  </div>
                  <div className="divide-y divide-thread px-7">
                    {salesRecord.filter(s => s.status === 'refunded').length === 0 ? (
                      <p className="text-center py-10 text-sm text-muted">No returns recorded yet.</p>
                    ) : (
                      salesRecord.filter(s => s.status === 'refunded').slice(0, 10).map(sale => (
                        <div key={sale.id} className="p-list-item">
                          <div className="min-w-0">
                            <p className="font-bold text-ink text-sm truncate">{variantLabel(sale.dresses)}</p>
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

            {/* SELL: EXCHANGE */}
            {activeTab === 'exchange' && (
              <div className="print:hidden">
                <h3 className="text-xl font-display text-ink mb-6">Exchange (Swap Size / Color)</h3>
                <ExchangePanel />
              </div>
            )}

            {/* SELL: LAYAWAY */}
            {activeTab === 'layaway' && (
              <div className="print:hidden">
                <h3 className="text-xl font-display text-ink mb-6">Layaway / Installment Plans</h3>
                <LayawayPanel />
              </div>
            )}

            {/* SELL: PROMOTIONS */}
            {activeTab === 'promotions' && (
              <div className="print:hidden">
                <h3 className="text-xl font-display text-ink mb-6">Promotions</h3>
                <PromotionsPanel accountRole={userRole} />
              </div>
            )}

            {/* SELL: GIFT CARDS */}
            {activeTab === 'gift-cards' && (
              <div className="print:hidden space-y-6">
                {/* Sell a new gift card */}
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconCard className="w-4 h-4 text-brass" />
                    Sell a Gift Card
                  </h3>
                  <p className="text-sm text-muted mb-6">Issues a unique code with a stored balance. Redeem it at the POS as a payment method under Split Payment.</p>

                  {giftCardMessage.text && (
                    <div className={`anim-alert p-alert ${giftCardMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{giftCardMessage.text}</div>
                  )}

                  <form onSubmit={sellGiftCard} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="p-label">Amount (৳)</label>
                        <input required type="number" min="1" className="w-full px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:border-brass outline-none text-ink font-mono font-bold transition-colors" value={giftCardSellAmount} onChange={(e) => setGiftCardSellAmount(e.target.value)} />
                      </div>
                      <div>
                        <label className="p-label">Customer Phone <span className="text-muted font-normal normal-case">(optional)</span></label>
                        <input type="text" className="w-full p-input font-mono" placeholder="01XXXXXXXXX" value={giftCardSellPhone} onChange={(e) => setGiftCardSellPhone(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="btn-shimmer w-full p-btn p-btn-primary">
                      Issue Gift Card
                    </button>
                  </form>
                </div>

                {/* Balance lookup */}
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconSearch className="w-4 h-4 text-brass" />
                    Check Balance
                  </h3>
                  <p className="text-sm text-muted mb-5">Look up a card by its code — useful when a customer isn&rsquo;t sure how much is left.</p>
                  {giftCardLookupMessage.text && (
                    <div className={`anim-alert p-alert ${giftCardLookupMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{giftCardLookupMessage.text}</div>
                  )}
                  <form onSubmit={lookupGiftCard} className="flex gap-2 mb-4">
                    <input type="text" placeholder="GC-XXXXXXXXXX" className="flex-1 p-input font-mono uppercase" value={giftCardLookupCode} onChange={(e) => setGiftCardLookupCode(e.target.value)} />
                    <button type="submit" className="p-btn p-btn-primary">Search</button>
                  </form>
                  {giftCardLookupResult && (
                    <div className="bg-paper-dim p-4 border border-thread flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ink text-sm font-mono">{giftCardLookupResult.code}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {giftCardLookupResult.source === 'issued_as_credit' ? 'Store credit' : 'Gift card'} · {giftCardLookupResult.status}
                        </p>
                      </div>
                      <p className="font-mono text-lg font-bold text-brass">৳{giftCardLookupResult.current_balance}</p>
                    </div>
                  )}
                </div>

                {/* All gift cards */}
                <div className="p-card overflow-hidden">
                  <div className="flex items-center justify-between p-7 pb-5">
                    <h3 className="text-base font-bold text-ink">All Gift Cards & Store Credit</h3>
                    <span className="text-muted text-xs font-mono font-bold">{giftCards.length} ISSUED</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table w-full" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
                          <th className="p-4 font-bold">Code</th>
                          <th className="p-4 font-bold">Type</th>
                          <th className="p-4 font-bold text-right">Issued</th>
                          <th className="p-4 font-bold text-right">Balance</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {giftCards.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-muted font-medium">No gift cards issued yet.</td></tr>
                        )}
                        {giftCards.map((g: any) => (
                          <tr key={g.id}>
                            <td className="p-4 font-mono font-bold text-ink text-sm">{g.code}</td>
                            <td className="p-4 text-sm text-muted">{g.source === 'issued_as_credit' ? 'Store credit' : 'Gift card'}</td>
                            <td className="p-4 text-sm font-mono text-right text-ink">৳{g.initial_balance}</td>
                            <td className="p-4 text-sm font-mono text-right text-ink font-bold">৳{g.current_balance}</td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${
                                g.status === 'active' ? 'p-badge p-badge-success'
                                : g.status === 'redeemed' ? 'p-badge p-badge-muted'
                                : 'p-badge p-badge-danger'
                              }`}>
                                {g.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {g.status === 'active' && (
                                <button onClick={() => revokeGiftCard(g.id)} className="text-[11px] font-bold text-muted hover:text-oxblood uppercase tracking-wide border border-thread px-2.5 py-1 hover:border-oxblood transition-colors">
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MEMBERSHIP: MEMBERS LIST */}
            {activeTab === 'membership-list' && (
              <div className="print:hidden">
                <div className="p-card">
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
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
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
                                    m.status === 'revoked' ? 'p-badge p-badge-muted'
                                    : isExpired ? 'p-badge p-badge-danger'
                                    : isExpiringSoon ? 'p-badge p-badge-brass'
                                    : 'p-badge p-badge-success'
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
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconUserPlus className="w-4 h-4 text-brass" />
                    Enroll New Member
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Membership is registered by mobile number only. It starts today and expires after exactly 1 year.
                    Members get a <span className="font-bold text-brass">{membershipSettings.discount_percent}%</span> discount at checkout.
                  </p>

                  {memberMessage.text && (
                    <div className={`anim-alert p-alert ${memberMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>
                      {memberMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleAddMember} className="space-y-5">
                    <div>
                      <label className="p-label">Mobile Number</label>
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
                      <label className="p-label">
                        Note <span className="text-muted font-normal normal-case">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP customer, referred by..."
                        className="w-full p-input"
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

                    <button type="submit" className="btn-shimmer w-full p-btn p-btn-primary">
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
              <div className="print:hidden space-y-6">
                {/* Discount control */}
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconSettingsGear className="w-4 h-4 text-brass" />
                    Membership Discount
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Set the discount percentage all active members receive at checkout. You can change this at any time — it takes effect immediately.
                  </p>
                  <form onSubmit={saveMembershipSettings} className="space-y-5">
                    <div>
                      <label className="p-label">Discount Percentage (%)</label>
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
                      className="px-7 py-3 font-bold text-sm uppercase tracking-wider transition-colors text-white" style={{ background: membershipSettingsSaved ? '#3a9d6f' : '#2563eb' }}
                    >
                      {membershipSettingsSaved ? '✓ Saved' : 'Save Discount'}
                    </button>
                  </form>
                </div>

                {/* Quick stats */}
                <div className="p-card p-7">
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
                      <div key={stat.label} className="p-card p-4 text-center hover:border-brass/30">
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
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Today's cost</p>
                        <p className="font-mono text-2xl font-bold text-oxblood">৳{todaysTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted mt-1">{todaysCosts.length} entr{todaysCosts.length === 1 ? 'y' : 'ies'}</p>
                      </div>
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">This month</p>
                        <p className="font-mono text-2xl font-bold text-oxblood">৳{monthTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted mt-1">{monthCosts.length} entr{monthCosts.length === 1 ? 'y' : 'ies'}</p>
                      </div>
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">All time</p>
                        <p className="font-mono text-2xl font-bold text-ink">৳{allTimeTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted mt-1">{dailyCosts.length} total entries</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Add entry form */}
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconWallet className="w-4 h-4 text-oxblood" />
                    Add Daily Cost
                  </h3>
                  <p className="text-sm text-muted mb-5">
                    Small out-of-pocket spends — tea, rickshaw fare, a quick repair — that come out of the till.
                    Every entry here is subtracted from Gross Revenue to calculate Net Profit in Reports.
                  </p>

                  {dailyCostMessage.text && (
                    <div className={`anim-alert p-alert ${dailyCostMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>
                      {dailyCostMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleAddDailyCost} className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="p-label">Date</label>
                        <input
                          type="date"
                          className="p-input"
                          value={dailyCostDate}
                          onChange={e => setDailyCostDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="p-label">Amount (৳)</label>
                        <input
                          type="number" min="0" step="1" placeholder="e.g. 10"
                          className="w-36 px-4 py-2.5 bg-oxblood-light/30 border border-oxblood/25 focus:border-oxblood outline-none text-ink font-mono font-bold transition-colors"
                          value={dailyCostAmount}
                          onChange={e => setDailyCostAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="p-label">Note — what was this for?</label>
                      <input
                        type="text" placeholder="e.g. Tea for staff, rickshaw fare to bank"
                        className="w-full p-input"
                        value={dailyCostNote}
                        onChange={e => setDailyCostNote(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="p-btn p-btn-danger btn-shimmer px-6 py-2.5">
                      Record Cost
                    </button>
                  </form>
                </div>

                {/* Entry log */}
                <div className="p-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Recorded costs</h3>
                  </div>
                  {dailyCosts.length === 0 ? (
                    <div className="p-empty"><p className="p-empty-desc">No costs logged yet.</p></div>
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
                <div className="p-card p-5 flex flex-wrap items-end gap-5">
                  <div className="flex-1 min-w-[180px]">
                    <label className="p-label">Filter Start Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={startDate} onChange={(e) => { setStartDate(e.target.value); setReportsPage(1); }} />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="p-label">Filter End Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={endDate} onChange={(e) => { setEndDate(e.target.value); setReportsPage(1); }} />
                  </div>
                  {locations.length > 0 && (
                    <div className="flex-1 min-w-[180px]">
                      <label className="p-label">Location</label>
                      <select
                        className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink text-sm transition-colors"
                        value={reportLocationId}
                        onChange={(e) => { setReportLocationId(e.target.value); setReportsPage(1); }}
                      >
                        <option value="">All Locations</option>
                        {locations.map((loc: any) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                      </select>
                    </div>
                  )}
                  <button onClick={clearDateFilters} className="p-btn p-btn-ghost">
                    Clear Filters
                  </button>
                  <button
                    onClick={exportLedgerCSV}
                    disabled={salesRecord.length === 0}
                    className="px-5 py-2.5 text-white font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: '#2563eb' }}
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gross Revenue */}
                  <div className="anim-card p-card-hero relative" style={{ padding: '22px 24px 18px' }}>
                    <div className="barcode-stripe absolute top-0 right-0 h-full w-20 opacity-[0.04]" style={{ filter: 'invert(1)' }} />
                    <div className="relative z-10">
                      <p className="p-stat-card-label" style={{ color: 'rgba(220,200,165,0.6)' }}>Gross Revenue {startDate ? '(Filtered)' : '(All Time)'}</p>
                      <p className="font-mono font-bold tracking-tight text-white mt-2" style={{ fontSize: 36 }}>৳{totalRevenue.toLocaleString()}</p>
                      <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <IconTrendingUp className="w-3.5 h-3.5 text-brass/70" />
                        <span className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(220,200,165,0.45)' }}>Total collected</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Costs + Net Profit */}
                  {(() => {
                    const filteredCosts = dailyCosts.filter((c: any) => {
                      if (startDate && c.cost_date < startDate) return false;
                      if (endDate && c.cost_date > endDate) return false;
                      return true;
                    });
                    const totalCosts = filteredCosts.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
                    const netProfit = totalRevenue - totalCosts;
                    return (
                      <>
                        <div className="anim-card p-card-danger" style={{ padding: '22px 24px 18px' }}>
                          <p className="p-stat-card-label" style={{ color: 'var(--color-oxblood)', opacity: 0.75 }}>Daily Costs {startDate ? '(Filtered)' : '(All Time)'}</p>
                          <p className="font-mono font-bold p-stat-danger mt-2" style={{ fontSize: 36 }}>৳{totalCosts.toLocaleString()}</p>
                          <p className="p-stat-card-sub">{filteredCosts.length} entr{filteredCosts.length === 1 ? 'y' : 'ies'} recorded</p>
                        </div>
                        <div className={`anim-card ${netProfit < 0 ? 'p-card-danger' : 'p-card-success'}`} style={{ padding: '22px 24px 18px' }}>
                          <p className="p-stat-card-label" style={{ color: netProfit < 0 ? 'var(--color-oxblood)' : 'var(--color-moss)', opacity: 0.75 }}>Net Profit {startDate ? '(Filtered)' : '(All Time)'}</p>
                          <p className={`font-mono font-bold mt-2 ${netProfit < 0 ? 'p-stat-danger' : 'p-stat-success'}`} style={{ fontSize: 36 }}>৳{netProfit.toLocaleString()}</p>
                          <p className="p-stat-card-sub">Revenue minus daily costs</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="anim-card p-stat-card">
                    <p className="p-stat-card-label">Successful Transactions</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="p-stat-card-value p-stat">{salesRecord.filter(s => s.status === 'completed').length}</span>
                      <span className="text-sm font-medium text-muted">items sold</span>
                    </div>
                  </div>
                  <div className="anim-card p-stat-card">
                    <p className="p-stat-card-label">Returns / Refunds</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="p-stat-card-value p-stat-danger">{salesRecord.filter(s => s.status === 'refunded').length}</span>
                      <span className="text-sm font-medium text-muted">items returned</span>
                    </div>
                  </div>
                </div>

                <div className="p-card">
                  <div className="p-card-header">
                    <span className="p-card-header-title">
                      <IconChart className="w-4 h-4 text-brass" />
                      Revenue by Payment Method
                    </span>
                  </div>
                  <div className="p-card-body">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      {Object.entries(revenueByMethod).map(([method, amount]) => (
                        <div key={method} className="p-stat-card hover:border-brass/30 cursor-default" style={{ padding: '14px 16px' }}>
                          <p className="uppercase text-[10px] font-bold text-muted tracking-wider mb-2 whitespace-nowrap">{method}</p>
                          <p className="font-mono text-sm font-bold text-ink">৳{amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-card overflow-hidden">
                  <div className="p-6 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Master Transaction Ledger</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="p-table">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread/60 bg-paper/40">
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
                        {reportsPaginated.map((sale) => (
                          <tr key={sale.id} className={`${sale.status === 'refunded' ? 'opacity-50' : 'hover:bg-brass/5'} transition-colors`}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className={`text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{variantLabel(sale.dresses)}</p>
                              <span className="text-xs font-mono text-muted">{sale.dresses?.barcode}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-ink bg-paper-dim px-2 py-1">
                                {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${sale.status === 'refunded' ? 'p-badge p-badge-muted' : 'p-badge p-badge-success'}`}>
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
                  {salesRecord.length > 0 && (
                    <div className="flex items-center justify-between p-6 pt-4 gap-4 border-t border-thread/60">
                      <p className="text-xs text-muted font-medium">
                        Showing {(reportsPageClamped - 1) * REPORTS_PAGE_SIZE + 1}
                        –{Math.min(reportsPageClamped * REPORTS_PAGE_SIZE, salesRecord.length)} of {salesRecord.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                          disabled={reportsPageClamped <= 1}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-thread text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-dim transition-colors"
                        >
                          Prev
                        </button>
                        <span className="text-xs text-muted font-mono">
                          Page {reportsPageClamped} / {reportsTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReportsPage(p => Math.min(reportsTotalPages, p + 1))}
                          disabled={reportsPageClamped >= reportsTotalPages}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-thread text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-dim transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS: BUSINESS SETTINGS */}
            {activeTab === 'settings-business' && (
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconSettingsGear className="w-4 h-4 text-brass" />
                    Business Settings
                  </h3>
                  <p className="text-sm text-muted mb-6">Your shop's address and phone — shown on the login screen and printed on every receipt.</p>
                  {settingsSaved === 'business' && <div className="px-4 py-3 mb-5 text-sm font-semibold border p-badge p-badge-success">Saved.</div>}
                  <div className="space-y-5">
                    <div>
                      <label className="p-label">Logo</label>
                      <p className="text-xs text-muted mb-2">Printed at the top of every label and receipt. Upload once here instead of it being a file in the site's code — replacing it takes effect immediately, no redeploy.</p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-paper-dim border border-thread flex items-center justify-center shrink-0">
                          {businessSettings.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={businessSettings.logo_url} alt="" className="w-full h-full object-contain p-1.5" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src="/logo-ac.png" alt="" className="w-full h-full object-contain p-1.5" />
                          )}
                        </div>
                        <label className="p-btn p-btn-ghost cursor-pointer">
                          {logoUploading ? 'Uploading…' : businessSettings.logo_url ? 'Replace Logo' : 'Upload Logo'}
                          <input
                            type="file" accept="image/*" className="hidden" disabled={logoUploading}
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file); e.target.value = ''; }}
                          />
                        </label>
                      </div>
                      {!businessSettings.logo_url && (
                        <p className="text-xs text-muted mt-2">Nothing uploaded yet — labels and receipts are using the default logo built into the site.</p>
                      )}
                    </div>
                    <div>
                      <label className="p-label">Business Name</label>
                      <input type="text" className="w-full p-input" value={businessSettings.business_name} onChange={(e) => setBusinessSettings({ ...businessSettings, business_name: e.target.value })} />
                      <p className="text-xs text-muted mt-1.5">Stored for your records — the sidebar wordmark stays "CRAVE ABS" by design.</p>
                    </div>
                    <div>
                      <label className="p-label">Address</label>
                      <input type="text" className="w-full p-input" value={businessSettings.address} onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })} />
                    </div>
                    <div>
                      <label className="p-label">Phone</label>
                      <input type="text" className="w-full p-input" placeholder="Optional — printed on receipts if set" value={businessSettings.phone} onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })} />
                    </div>
                    <button
                      onClick={() => saveBusinessSettings({ business_name: businessSettings.business_name, address: businessSettings.address, phone: businessSettings.phone }, 'business')}
                      className="btn-shimmer w-full p-btn p-btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: INVOICE SETTINGS */}
            {activeTab === 'settings-invoice' && (
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconReceipt className="w-4 h-4 text-brass" />
                    Invoice Settings
                  </h3>
                  <p className="text-sm text-muted mb-6">The two footer lines printed at the bottom of every receipt.</p>
                  {settingsSaved === 'invoice' && <div className="px-4 py-3 mb-5 text-sm font-semibold border p-badge p-badge-success">Saved.</div>}
                  <div className="space-y-5">
                    <div>
                      <label className="p-label">Footer Line 1</label>
                      <input type="text" className="w-full p-input" value={businessSettings.receipt_footer_line1} onChange={(e) => setBusinessSettings({ ...businessSettings, receipt_footer_line1: e.target.value })} />
                    </div>
                    <div>
                      <label className="p-label">Footer Line 2</label>
                      <input type="text" className="w-full p-input" value={businessSettings.receipt_footer_line2} onChange={(e) => setBusinessSettings({ ...businessSettings, receipt_footer_line2: e.target.value })} />
                    </div>
                    <div className="bg-paper-dim border border-thread p-4">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Receipt Preview</p>
                      <p className="text-center text-xs font-bold font-mono text-ink">{businessSettings.receipt_footer_line1}</p>
                      <p className="text-center text-[10px] font-mono text-muted mt-1">{businessSettings.receipt_footer_line2}</p>
                    </div>
                    <button
                      onClick={() => saveBusinessSettings({ receipt_footer_line1: businessSettings.receipt_footer_line1, receipt_footer_line2: businessSettings.receipt_footer_line2 }, 'invoice')}
                      className="btn-shimmer w-full p-btn p-btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: BARCODE SETTINGS */}
            {activeTab === 'settings-barcode' && (
              <div className="print:hidden">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconScan className="w-4 h-4 text-brass" />
                    Barcode Settings
                  </h3>
                  <p className="text-sm text-muted mb-6">A short prefix for barcodes you write yourself on items without a manufacturer tag.</p>
                  {settingsSaved === 'barcode' && <div className="px-4 py-3 mb-5 text-sm font-semibold border p-badge p-badge-success">Saved.</div>}
                  <div className="space-y-5">
                    <div>
                      <label className="p-label">Barcode Prefix</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono uppercase transition-colors" maxLength={10} value={businessSettings.barcode_prefix} onChange={(e) => setBusinessSettings({ ...businessSettings, barcode_prefix: e.target.value.toUpperCase() })} />
                      <p className="text-xs text-muted mt-1.5">e.g. a tag reading <span className="font-mono font-bold text-ink">{businessSettings.barcode_prefix || 'CRV'}-0142</span> for the 142nd hand-tagged item.</p>
                    </div>
                    <button
                      onClick={() => saveBusinessSettings({ barcode_prefix: businessSettings.barcode_prefix }, 'barcode')}
                      className="btn-shimmer w-full p-btn p-btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS: TAX RATES */}
            {activeTab === 'settings-tax' && (
              <div className="print:hidden">
                <div className="p-card">
                  <div className="px-7 pt-7 pb-5">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <IconFileText className="w-4 h-4 text-brass" />
                      Tax Rates
                    </h3>
                    <p className="text-sm text-muted mt-1">Rates defined here appear as a selectable Tax option on the POS screen, applied to the subtotal after any discount.</p>
                  </div>
                  <form onSubmit={addTaxRate} className="px-7 mb-5 grid grid-cols-[1fr_110px_auto] gap-2">
                    <input
                      type="text"
                      placeholder="Name, e.g. VAT"
                      className="w-full p-input text-sm"
                      value={newTaxName}
                      onChange={(e) => setNewTaxName(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="%"
                      step="0.01"
                      className="w-full p-input text-sm"
                      value={newTaxRate}
                      onChange={(e) => setNewTaxRate(e.target.value)}
                    />
                    <button type="submit" className="p-btn p-btn-primary shrink-0">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                  <div className="p-divider mx-7 mb-2" />
                  <div className="px-7 py-2 divide-y divide-thread">
                    {taxRates.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No tax rates yet.</p></div>
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

            {/* SETTINGS: CURRENCY & EXCHANGE RATES */}
            {activeTab === 'settings-currency' && (
              <div className="print:hidden space-y-6">
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink flex items-center gap-2">
                    <IconWallet className="w-4 h-4 text-brass" />
                    Currency & Exchange Rates
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Your products are always priced and reported in <span className="font-bold text-ink">{currencies.find((c: any) => c.is_base)?.code || 'BDT'}</span> (base currency).
                    Add other currencies below to accept foreign-currency payments at the POS — rates come from currencyapi.com and are fetched on demand, never automatically in the background.
                  </p>

                  {currencyMessage.text && (
                    <div className={`anim-alert p-alert ${currencyMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>{currencyMessage.text}</div>
                  )}

                  <form onSubmit={addCurrency} className="flex gap-2 mb-5">
                    <input
                      type="text"
                      placeholder="Code, e.g. USD"
                      maxLength={3}
                      className="flex-1 p-input text-sm font-mono uppercase"
                      value={newCurrencyCode}
                      onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                    />
                    <input
                      type="text"
                      placeholder="Symbol, e.g. $"
                      maxLength={3}
                      className="w-24 p-input text-sm"
                      value={newCurrencySymbol}
                      onChange={(e) => setNewCurrencySymbol(e.target.value)}
                    />
                    <button type="submit" className="p-btn p-btn-primary shrink-0">
                      <IconPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>

                  <button
                    onClick={refreshExchangeRates}
                    disabled={ratesRefreshing || currencies.filter((c: any) => !c.is_base).length === 0}
                    className="p-btn p-btn-primary btn-shimmer w-full mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ratesRefreshing ? 'Fetching latest rates…' : 'Refresh Rates from currencyapi.com'}
                  </button>

                  <div className="divide-y divide-thread border border-thread">
                    {currencies.length === 0 ? (
                      <div className="p-empty"><p className="p-empty-desc">No currencies yet — run migration_008 first, then BDT will appear here automatically as your base currency.</p></div>
                    ) : (
                      currencies.map((c: any) => (
                        <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-ink text-sm">{c.symbol} {c.code}</span>
                            {c.is_base && <span className="p-badge p-badge-brass text-[9px]">BASE</span>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {!c.is_base && (
                              <span className="text-xs font-mono text-muted">
                                {exchangeRates[c.code]
                                  ? `1 ${c.code} = ৳${exchangeRates[c.code].rate.toFixed(2)}`
                                  : 'no rate yet'}
                              </span>
                            )}
                            {!c.is_base && (
                              <button onClick={() => deleteCurrency(c.id, c.code)} title="Remove" className="w-7 h-7 flex items-center justify-center border border-thread text-muted hover:border-oxblood hover:text-oxblood transition-colors">
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <p className="text-xs text-muted mt-4">
                    Add <code className="font-mono bg-paper-dim px-1">CURRENCY_API_KEY</code> to your project&rsquo;s environment
                    variables (Vercel → Settings → Environment Variables, and locally in <code className="font-mono bg-paper-dim px-1">.env.local</code>) —
                    <span className="font-bold text-ink"> never</span> as <code className="font-mono bg-paper-dim px-1">NEXT_PUBLIC_</code>, since that would ship the key to every visitor&rsquo;s browser.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: CUSTOMERS & LOYALTY */}
            {activeTab === 'customers' && (
              <div className="print:hidden">
                <h3 className="text-xl font-display text-ink mb-6">Customers & Loyalty</h3>
                <CustomersPanel accountRole={userRole} />
              </div>
            )}

            {/* TAB: STAFF (clock in/out, staff management, audit log) */}
            {(activeTab === 'staff-clock' || activeTab === 'staff-manage' || activeTab === 'staff-commission' || activeTab === 'staff-accounts' || activeTab === 'audit-log') && (
              <div className="space-y-6 print:hidden">
                <h3 className="text-xl font-display text-ink mb-2">Staff & Security</h3>
                <StaffPanel accountRole={userRole} navTab={activeTab} />
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
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">10-day total</p>
                        <p className="font-mono text-2xl font-bold text-ink">৳{total.toLocaleString()}</p>
                      </div>
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Daily average</p>
                        <p className="font-mono text-2xl font-bold text-ink">{surveyRecords.length ? `৳${avg.toLocaleString()}` : '—'}</p>
                      </div>
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Best day</p>
                        <p className="font-mono text-2xl font-bold text-moss">{best > 0 ? `৳${best.toLocaleString()}` : '—'}</p>
                        <p className="text-xs text-muted mt-1 font-mono">{bestDay?.date ?? ''}</p>
                      </div>
                      <div className="p-card p-5">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Lowest day</p>
                        <p className="font-mono text-2xl font-bold text-oxblood">{low > 0 ? `৳${low.toLocaleString()}` : '—'}</p>
                        <p className="text-xs text-muted mt-1 font-mono">{lowDay?.date ?? ''}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Chart.js bar chart */}
                <div className="p-card p-7">
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
                <div className="p-card p-7">
                  <h3 className="text-base font-bold mb-1 text-ink">Manual entry</h3>
                  <p className="text-sm text-muted mb-5">
                    Add or override a day's total — useful for cash-only sales not yet in the system.
                    "Sync from real sales" will replace manual entries with calculated figures from your actual transactions.
                  </p>
                  {surveyMessage.text && (
                    <div className={`anim-alert p-alert ${surveyMessage.type === 'error' ? 'p-badge p-badge-danger' : 'p-badge p-badge-success'}`}>
                      {surveyMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleAddSurveyEntry} className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="p-label">Date</label>
                      <input
                        type="date"
                        className="p-input"
                        value={surveyDateInput}
                        onChange={e => setSurveyDateInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="p-label">Total sales (৳)</label>
                      <input
                        type="number" min="0" step="1" placeholder="e.g. 18500"
                        className="w-44 p-input"
                        value={surveyAmountInput}
                        onChange={e => setSurveyAmountInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="p-btn p-btn-primary">
                      Save Entry
                    </button>
                  </form>
                </div>

                {/* Entry log */}
                {surveyRecords.length > 0 && (
                  <div className="p-card overflow-hidden">
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
      </div>{/* end lg:flex print:hidden */}

      {/* ── RECEIPT PRINT LAYOUT ──
          Rendered outside the print:hidden wrapper so it's always in the DOM.
          display:none normally; only shown when printing via the print-receipt
          class that the @media print rule above targets.
          Using a fixed-width 80mm column matches thermal receipt printers. */}
      <div className="print-receipt" style={{ display: 'none' }}>
        {cart.length > 0 && (
          <div style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px', color: '#000', padding: '4px', margin: '0 auto', lineHeight: 1.5, fontWeight: 'bold' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.15em', marginBottom: 2 }}>CRAVE ABS</div>
            <div style={{ textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', color: '#000', fontWeight: 'bold', marginBottom: 8 }}>
              {businessSettings.address}{businessSettings.phone ? ` · ${businessSettings.phone}` : ''}
            </div>
            <div style={{ borderBottom: '1px dashed #000', marginBottom: 6 }} />

            {/* Date / time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: 6 }}>
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>
            <div style={{ borderBottom: '1px dashed #000', marginBottom: 8 }} />

            {/* Items */}
            {cart.map((item, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{variantLabel(item)}</div>
                <div style={{ fontSize: '10px', color: '#000', fontWeight: 'bold' }}>CAT: {item.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: 2 }}>
                  <span>{item.cartQty}x Item</span>
                  <span>Tk {item.price * item.cartQty}</span>
                </div>
              </div>
            ))}

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

            {/* Subtotal / discount / tax */}
            {(cartDiscountValue > 0 || cartTaxValue > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                <span>Subtotal:</span><span>Tk {cartSubtotal}</span>
              </div>
            )}
            {cartDiscountValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>
                <span>Discount:</span><span>- Tk {cartDiscountValue}</span>
              </div>
            )}
            {cartTaxValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>
                <span>Tax{cartActiveTaxRate ? ` (${cartActiveTaxRate.name} ${cartActiveTaxRate.rate_percent}%)` : ''}:</span>
                <span>+ Tk {cartTaxValue}</span>
              </div>
            )}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase', marginTop: 4 }}>
              <span>TOTAL:</span><span>TK {cartTotal}</span>
            </div>

            {/* Foreign-currency equivalent, if the cashier picked one other
                than the base currency for this sale. */}
            {posCurrencyCode && !currencies.find((c: any) => c.code === posCurrencyCode)?.is_base && exchangeRates[posCurrencyCode] && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginTop: 2 }}>
                <span>≈ in {posCurrencyCode}:</span>
                <span>{currencySymbol(posCurrencyCode)}{convertFromBase(cartTotal, posCurrencyCode).toFixed(2)}</span>
              </div>
            )}

            {/* Payment */}
            {splitPaymentMode && cartPayments.length > 0 ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>Paid via (split):</div>
                {cartPayments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
                    <span style={{ textTransform: 'uppercase' }}>
                      {p.method === 'gift_card' ? `Gift Card${p.giftCardCode ? ` (${p.giftCardCode})` : ''}` : p.method}
                      {p.trxId ? ` — Trx: ${p.trxId}` : ''}
                    </span>
                    <span>Tk {p.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' }}>
                  Paid via: <strong>{paymentMethod}</strong>
                </div>
                {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && (
                  <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>TrxID: {trxId}</div>
                )}
              </>
            )}

            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0 6px' }} />

            {/* Footer */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{businessSettings.receipt_footer_line1}</div>
            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', marginTop: 2 }}>{businessSettings.receipt_footer_line2}</div>
          </div>
        )}
      </div>

      {/* ── LABEL PRINT LAYOUT ──
          Same pattern as the receipt block above: always in the DOM,
          hidden on screen, shown only when printing via .print-labels.
          Each queued product is expanded into `qty` individual tags so the
          sheet has exactly one tag per physical item to apply. */}
      <div className="print-labels" style={{ display: 'none' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4mm' }}>
          {labelQueue.flatMap((item) =>
            Array.from({ length: item.qty }).map((_, i) => (
              <div
                key={`${item.id}-${i}`}
                className="print-label-tag"
                style={{
                  width: '62mm',
                  border: '1px dashed #999',
                  borderRadius: '2mm',
                  padding: '3mm',
                  fontFamily: 'sans-serif',
                  color: '#000',
                  textAlign: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={businessSettings.logo_url || '/logo-ac.png'} alt="" style={{ height: '9mm', width: 'auto', margin: '0 auto 1mm', display: 'block' }} />
                {item.brand && (
                  <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 700, fontSize: '13px', color: '#000', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    {item.brand}
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '10.5px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}{item.category ? <span style={{ fontWeight: 700 }}> · {item.category}</span> : ''}
                </div>
                {item.variant && (
                  <div style={{ fontWeight: 700, fontSize: '10px', marginTop: 1 }}>{item.variant}</div>
                )}
                <div style={{ fontWeight: 700, fontSize: '15px', margin: '2px 0' }}>৳{item.price}</div>
                {item.taxLabel && (
                  <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '1mm' }}>{item.taxLabel} · Total ৳{item.total}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <BarcodeSVG value={item.barcode} height={40} barWidth={1.4} fontSize={11} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CALCULATOR MODAL ──
          Plain popup utility, available from the header on every page for
          both roles. Closes on Escape, the backdrop, or the × button. */}
      {showCalculator && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 print:hidden"
          onClick={() => setShowCalculator(false)}
        >
          <div
            className="bg-canvas border border-thread rounded-xl shadow-2xl w-[280px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-thread">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <IconCalculator className="w-4 h-4 text-brass" /> Calculator
              </h3>
              <button onClick={() => setShowCalculator(false)} className="text-muted hover:text-ink transition-colors text-lg leading-none">
                ×
              </button>
            </div>

            <div className="px-4 pt-4 pb-3 bg-paper-dim text-right">
              <p className="font-mono font-bold text-ink text-[28px] leading-tight truncate">{calcDisplay}</p>
              {calcOperator && (
                <p className="text-xs text-muted font-mono mt-0.5">{calcOperand} {calcOperator}</p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-px bg-thread p-px">
              <button onClick={calcClear} className="col-span-2 py-3.5 bg-canvas text-oxblood font-bold text-sm hover:bg-oxblood-light/30 transition-colors">C</button>
              <button onClick={calcToggleSign} className="py-3.5 bg-canvas text-ink font-bold text-sm hover:bg-paper-dim transition-colors">±</button>
              <button onClick={calcPercent} className="py-3.5 bg-canvas text-ink font-bold text-sm hover:bg-paper-dim transition-colors">%</button>

              <button onClick={() => calcInputDigit('7')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">7</button>
              <button onClick={() => calcInputDigit('8')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">8</button>
              <button onClick={() => calcInputDigit('9')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">9</button>
              <button onClick={() => calcInputOperator('÷')} className="py-3.5 bg-brass-light/40 text-brass-dark font-bold hover:bg-brass-light/60 transition-colors">÷</button>

              <button onClick={() => calcInputDigit('4')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">4</button>
              <button onClick={() => calcInputDigit('5')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">5</button>
              <button onClick={() => calcInputDigit('6')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">6</button>
              <button onClick={() => calcInputOperator('×')} className="py-3.5 bg-brass-light/40 text-brass-dark font-bold hover:bg-brass-light/60 transition-colors">×</button>

              <button onClick={() => calcInputDigit('1')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">1</button>
              <button onClick={() => calcInputDigit('2')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">2</button>
              <button onClick={() => calcInputDigit('3')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">3</button>
              <button onClick={() => calcInputOperator('-')} className="py-3.5 bg-brass-light/40 text-brass-dark font-bold hover:bg-brass-light/60 transition-colors">−</button>

              <button onClick={() => calcInputDigit('0')} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">0</button>
              <button onClick={calcInputDecimal} className="py-3.5 bg-canvas text-ink font-mono font-bold hover:bg-paper-dim transition-colors">.</button>
              <button onClick={calcBackspace} className="py-3.5 bg-canvas text-ink font-bold hover:bg-paper-dim transition-colors">⌫</button>
              <button onClick={() => calcInputOperator('+')} className="py-3.5 bg-brass-light/40 text-brass-dark font-bold hover:bg-brass-light/60 transition-colors">+</button>

              <button onClick={calcEquals} className="col-span-4 py-3.5 bg-brass text-white font-bold text-sm hover:bg-brass-dark transition-colors">=</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
