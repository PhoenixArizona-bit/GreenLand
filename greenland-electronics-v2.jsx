import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── CURRENCY CONTEXT ─────────────────────────────────────────────────────────
const CurrencyContext = createContext({ symbol: "$", code: "USD", rate: 1 });
const useCurrency = () => useContext(CurrencyContext);

const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar",       rate: 1       },
  { code: "PKR", symbol: "₨",  name: "Pakistani Rupee", rate: 278.5   },
  { code: "EUR", symbol: "€",   name: "Euro",            rate: 0.92    },
  { code: "GBP", symbol: "£",   name: "British Pound",   rate: 0.79    },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham",      rate: 3.67    },
  { code: "SAR", symbol: "﷼",   name: "Saudi Riyal",     rate: 3.75    },
  { code: "INR", symbol: "₹",   name: "Indian Rupee",    rate: 83.1    },
  { code: "CAD", symbol: "C$",  name: "Canadian Dollar", rate: 1.36    },
  { code: "AUD", symbol: "A$",  name: "Australian Dollar",rate: 1.53   },
];

// ─── STORAGE LAYER (Local → ready for Supabase swap) ─────────────────────────
// To migrate to Supabase: replace each LS.get/set call in `db` with supabase queries
const LS = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// db = data access object. Each method mirrors a future Supabase table query.
const db = {
  // ── Categories ──
  getCats:    ()    => LS.get("gl_cats"),
  setCats:    (v)   => LS.set("gl_cats", v),
  // ── Products ──
  getProds:   ()    => LS.get("gl_prods"),
  setProds:   (v)   => LS.set("gl_prods", v),
  // ── Orders ──
  getOrders:  ()    => LS.get("gl_orders"),
  setOrders:  (v)   => LS.set("gl_orders", v),
  // ── Users ──
  getUsers:   ()    => LS.get("gl_users"),
  setUsers:   (v)   => LS.set("gl_users", v),
  // ── Cart ──
  getCart:    ()    => LS.get("gl_cart"),
  setCart:    (v)   => LS.set("gl_cart", v),
  // ── Session ──
  getSession: ()    => LS.get("gl_user"),
  setSession: (v)   => LS.set("gl_user", v),
  // ── Settings ──
  getSettings:()    => LS.get("gl_settings"),
  setSettings:(v)   => LS.set("gl_settings", v),
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I = {
  Cart:         ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  User:         ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Search:       ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter:       ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Star:         ({ filled=false, s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={filled?"#f59e0b":"none"} stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Plus:         ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus:        ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:        ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Package:      ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Grid:         ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  ShoppingBag:  ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  MapPin:       ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Phone:        ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.4 1.14 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>,
  Mail:         ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  ChevronRight: ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Shield:       ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check:        ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:            ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Zap:          ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Truck:        ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Eye:          ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:       ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Home:         ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  LogOut:       ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Upload:       ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  Refresh:      ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  AlertCircle:  ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CheckCircle:  ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Users:        ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Dollar:       ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Edit:         ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Warning:      ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Info:         ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CreditCard:   ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Banknote:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  EP:           ({ s=18, color="#16a34a" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill={color} fillOpacity="0.12"/><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill={color} fontFamily="system-ui,sans-serif">EP</text></svg>,
  JC:           ({ s=18, color="#dc2626" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill={color} fillOpacity="0.12"/><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill={color} fontFamily="system-ui,sans-serif">JC</text></svg>,
  PinDot:       ({ s=10 }) => <svg width={s} height={s} viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4"/></svg>,
  Menu:         ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Lock:         ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Settings:     ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Laptop:       ({ s=36 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9m16 0H4m16 0l1.28 2.55a1 1 0 01-.9 1.45H3.62a1 1 0 01-.9-1.45L4 16"/></svg>,
  Mobile:       ({ s=36 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  Headphones:   ({ s=36 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>,
  Tv:           ({ s=36 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>,
  Camera:       ({ s=36 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Cpu:          ({ s=36 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
};

const CatIcon = ({ name, s=36 }) => {
  const n = (name||"").toLowerCase();
  if (n.includes("laptop")||n.includes("computer")) return <I.Laptop s={s}/>;
  if (n.includes("phone")||n.includes("mobile"))   return <I.Mobile s={s}/>;
  if (n.includes("audio")||n.includes("headphone")) return <I.Headphones s={s}/>;
  if (n.includes("tv")||n.includes("display"))      return <I.Tv s={s}/>;
  if (n.includes("camera"))                          return <I.Camera s={s}/>;
  if (n.includes("component")||n.includes("cpu"))   return <I.Cpu s={s}/>;
  return <I.Zap s={s}/>;
};

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEF_CATS = [
  { id:"cat1", name:"Laptops & Computers", description:"Powerful machines", image:null },
  { id:"cat2", name:"Mobile Phones",       description:"Latest smartphones", image:null },
  { id:"cat3", name:"Audio & Headphones",  description:"Crystal clear sound", image:null },
  { id:"cat4", name:"TV & Displays",       description:"Immersive visuals", image:null },
  { id:"cat5", name:"Cameras",             description:"Capture every moment", image:null },
  { id:"cat6", name:"Components & Parts",  description:"Build your setup", image:null },
];
const DEF_PRODS = [
  { id:"p1", categoryId:"cat1", name:"ProBook Elite X1",      price:1299, stock:15, rating:4.5, reviews:[], description:"14-inch laptop with Intel Core i7, 16GB RAM, 512GB SSD.", image:null, featured:true  },
  { id:"p2", categoryId:"cat2", name:"GreenPhone S25 Ultra",  price:999,  stock:30, rating:4.8, reviews:[], description:"6.7-inch AMOLED, 200MP camera, 5000mAh battery.", image:null, featured:true  },
  { id:"p3", categoryId:"cat3", name:"SoundElite Pro ANC",    price:349,  stock:50, rating:4.6, reviews:[], description:"Active noise cancelling, 30hr battery, Hi-Res audio.", image:null, featured:true  },
  { id:"p4", categoryId:"cat4", name:'ClearView 4K OLED 65"', price:2199, stock:8,  rating:4.7, reviews:[], description:"65-inch 4K OLED, Dolby Vision, 120Hz.", image:null, featured:false },
  { id:"p5", categoryId:"cat5", name:"SnapPro R7 Mirrorless", price:1899, stock:12, rating:4.9, reviews:[], description:"45MP full-frame, 8K video, dual card slots.", image:null, featured:true  },
  { id:"p6", categoryId:"cat6", name:"NexGen RTX 5080 GPU",   price:879,  stock:5,  rating:4.8, reviews:[], description:"16GB GDDR7, dominate every workload.", image:null, featured:false },
  { id:"p7", categoryId:"cat1", name:"UltraSlim Air 13",      price:849,  stock:20, rating:4.3, reviews:[], description:"Feather-light 13\", 18hr battery.", image:null, featured:false },
  { id:"p8", categoryId:"cat2", name:"BudgetMax X10",         price:299,  stock:60, rating:4.1, reviews:[], description:"Affordable 6.5\" phone, 64MP camera.", image:null, featured:false },
];
const DEF_SETTINGS = {
  currencyCode: "USD",
  codCharge: 0,          // COD handling fee in USD
  deliveryCharge: 5,     // flat delivery fee in USD
  easypaisa: { number: "0300-0000000", holder: "GreenLand Store" },
  jazzcash:  { number: "0301-0000000", holder: "GreenLand Store" },
};

function initStorage() {
  if (!db.getCats())     db.setCats(DEF_CATS);
  if (!db.getProds())    db.setProds(DEF_PRODS);
  if (!db.getOrders())   db.setOrders([]);
  if (!db.getUsers())    db.setUsers([]);
  if (!db.getCart())     db.setCart([]);
  if (!db.getSettings()) db.setSettings(DEF_SETTINGS);
  else {
    // Migrate old settings that lack new fields
    const s = db.getSettings();
    const merged = { ...DEF_SETTINGS, ...s };
    if (!merged.easypaisa) merged.easypaisa = DEF_SETTINGS.easypaisa;
    if (!merged.jazzcash)  merged.jazzcash  = DEF_SETTINGS.jazzcash;
    if (merged.codCharge === undefined)      merged.codCharge      = DEF_SETTINGS.codCharge;
    if (merged.deliveryCharge === undefined) merged.deliveryCharge = DEF_SETTINGS.deliveryCharge;
    db.setSettings(merged);
  }
}

function haversine(lat1,lon1,lat2,lon2) {
  const R=6371e3, toR=x=>x*Math.PI/180;
  const dLat=toR(lat2-lat1), dLon=toR(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3200);
  },[]);
  return {toasts,show};
}
function Toasts({toasts}) {
  return (
    <div style={{position:"fixed",top:16,left:12,right:12,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:t.type==="error"?"#dc2626":t.type==="warning"?"#d97706":"#16a34a",color:"#fff",padding:"12px 14px",borderRadius:12,fontSize:13,fontWeight:500,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",display:"flex",alignItems:"center",gap:8,animation:"slideDown 0.3s ease"}}>
          {t.type==="error"?<I.AlertCircle s={15}/>:<I.CheckCircle s={15}/>} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Logo({size=20}) {
  return (
    <span style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:size,letterSpacing:"-0.03em",lineHeight:1}}>
      <span style={{color:"#16a34a"}}>Green</span><span style={{color:"#5c3a1e"}}>Land</span>
    </span>
  );
}

function ImgUpload({value,onChange,label="Upload Image",compact=false}) {
  const ref=useRef();
  const handle=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);};
  return (
    <div>
      <input type="file" accept="image/*" ref={ref} style={{display:"none"}} onChange={handle}/>
      <div onClick={()=>ref.current.click()} style={{border:"2px dashed #bbf7d0",borderRadius:10,padding:compact?"10px 8px":14,textAlign:"center",cursor:"pointer",background:"#f0fdf4",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        {value?<img src={value} alt="preview" style={{width:compact?48:72,height:compact?48:72,objectFit:"cover",borderRadius:8}}/>:<div style={{color:"#16a34a"}}><I.Upload s={compact?18:24}/></div>}
        <span style={{fontSize:11,color:"#16a34a",fontWeight:600}}>{value?"Change":label}</span>
      </div>
    </div>
  );
}

function StarPicker({value,onChange}) {
  const [hover,setHover]=useState(0);
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{cursor:"pointer"}} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)} onClick={()=>onChange(i)}>
          <I.Star filled={i<=(hover||value)} s={26}/>
        </span>
      ))}
    </div>
  );
}

function Field({label,type="text",value,onChange,placeholder,required,small}) {
  const [show,setShow]=useState(false);
  const isP=type==="password";
  return (
    <div style={{marginBottom:small?8:12}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:"#555",marginBottom:3}}>{label}{required&&<span style={{color:"#ef4444"}}> *</span>}</label>}
      <div style={{position:"relative"}}>
        <input type={isP&&show?"text":type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          style={{width:"100%",padding:small?"10px 12px":"12px 14px",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:small?13:14,color:"#1a1a1a",outline:"none",background:"#fafafa",fontFamily:"inherit",paddingRight:isP?42:14,WebkitAppearance:"none",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        {isP&&<button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:0,display:"flex",alignItems:"center"}}>{show?<I.EyeOff s={15}/>:<I.Eye s={15}/>}</button>}
      </div>
    </div>
  );
}

function StatusBadge({status}) {
  const m={Processing:["#fef3c7","#d97706"],Shipped:["#dbeafe","#1d4ed8"],Delivered:["#dcfce7","#15803d"],Cancelled:["#fee2e2","#dc2626"]};
  const [bg,fg]=m[status]||["#f1f5f9","#64748b"];
  return <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:bg,color:fg,whiteSpace:"nowrap"}}>{status}</span>;
}

// ─── PRICE DISPLAY ────────────────────────────────────────────────────────────
function Price({usd}) {
  const {symbol,rate,code}=useCurrency();
  const converted=usd*rate;
  const formatted=code==="PKR"||code==="INR"
    ? Math.round(converted).toLocaleString()
    : converted.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2});
  return <>{symbol}{formatted}</>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const ADMIN_PASS = "greenland_admin_2024";

export default function App() {
  const [page,setPage]    = useState("home");
  const [user,setUser]    = useState(null);
  const [isAdmin,setIsAdmin] = useState(false);
  const [cats,setCats]    = useState([]);
  const [prods,setProds]  = useState([]);
  const [orders,setOrders]= useState([]);
  const [users,setUsers]  = useState([]);
  const [cart,setCart]    = useState([]);
  const [selProd,setSelProd] = useState(null);
  const [filterCat,setFilterCat] = useState("all");
  const [searchQ,setSearchQ]     = useState("");
  const [cartOpen,setCartOpen]   = useState(false);
  const [logoTaps,setLogoTaps]   = useState(0);
  const [currency,setCurrency]   = useState(CURRENCIES[0]);
  const [storeSettings,setStoreSettings] = useState(DEF_SETTINGS);
  const logoTimer = useRef(null);
  const {toasts,show:toast} = useToast();

  useEffect(()=>{
    initStorage();
    setCats(db.getCats()||[]);
    setProds(db.getProds()||[]);
    setOrders(db.getOrders()||[]);
    setUsers(db.getUsers()||[]);
    setCart(db.getCart()||[]);
    const saved=db.getSession();
    if(saved){setUser(saved);if(saved.isAdmin)setIsAdmin(true);}
    const settings=db.getSettings()||DEF_SETTINGS;
    const cur=CURRENCIES.find(c=>c.code===settings.currencyCode)||CURRENCIES[0];
    setCurrency(cur);
    setStoreSettings(settings);
  },[]);

  const syncCats   = c=>{setCats(c);   db.setCats(c);};
  const syncProds  = p=>{setProds(p);  db.setProds(p);};
  const syncOrders = o=>{setOrders(o); db.setOrders(o);};
  const syncUsers  = u=>{setUsers(u);  db.setUsers(u);};
  const syncCart   = c=>{setCart(c);   db.setCart(c);};
  const syncSettings = s=>{db.setSettings(s);};

  const changeCurrency = code=>{
    const cur=CURRENCIES.find(c=>c.code===code)||CURRENCIES[0];
    setCurrency(cur);
    const settings=db.getSettings()||DEF_SETTINGS;
    const updated={...settings,currencyCode:code};
    syncSettings(updated);
    setStoreSettings(updated);
    toast(`Currency set to ${cur.name}`);
  };

  const updateStoreSettings = (newSettings) => {
    syncSettings(newSettings);
    setStoreSettings(newSettings);
    const cur=CURRENCIES.find(c=>c.code===newSettings.currencyCode)||CURRENCIES[0];
    setCurrency(cur);
    toast("Settings saved!");
  };

  const addToCart=(prod,qty=1)=>{
    const ex=cart.find(i=>i.pid===prod.id);
    const nc=ex?cart.map(i=>i.pid===prod.id?{...i,qty:i.qty+qty}:i):[...cart,{pid:prod.id,qty}];
    syncCart(nc); toast(`${prod.name} added!`);
  };

  const cartTotal=cart.reduce((a,i)=>{const p=prods.find(x=>x.id===i.pid);return a+(p?p.price*i.qty:0);},0);
  const cartCount=cart.reduce((a,i)=>a+i.qty,0);
  const logout=()=>{setUser(null);setIsAdmin(false);db.setSession(null);setPage("home");toast("Logged out.");};

  const handleLogoTap=()=>{
    const n=logoTaps+1; setLogoTaps(n);
    clearTimeout(logoTimer.current);
    if(n>=5){setLogoTaps(0);setPage("admin-login");return;}
    logoTimer.current=setTimeout(()=>setLogoTaps(0),2000);
  };

  const filteredProds=prods.filter(p=>{
    const mc=filterCat==="all"||p.categoryId===filterCat;
    const mq=!searchQ||p.name.toLowerCase().includes(searchQ.toLowerCase());
    return mc&&mq;
  });

  const addReview=(prodId,review)=>{
    const updated=prods.map(p=>{
      if(p.id!==prodId)return p;
      const newRevs=[...(p.reviews||[]),review];
      const avg=newRevs.reduce((a,r)=>a+r.rating,0)/newRevs.length;
      return {...p,reviews:newRevs,rating:Math.round(avg*10)/10};
    });
    syncProds(updated);
    const up=updated.find(p=>p.id===prodId);
    if(up)setSelProd(up);
    toast("Review submitted!");
  };

  const GLOBAL_STYLE = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    html,body{background:#f0f4f0;overflow-x:hidden;}
    ::-webkit-scrollbar{display:none;}
    @keyframes slideDown{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pop{0%{transform:scale(0.95);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    input,textarea,select,button{font-family:'Sora',system-ui,sans-serif!important;}
    button{touch-action:manipulation;}
  `;

  if(isAdmin&&page==="admin") {
    return (
      <CurrencyContext.Provider value={currency}>
        <style>{GLOBAL_STYLE}</style>
        <Toasts toasts={toasts}/>
        <AdminPortal
          cats={cats} prods={prods} orders={orders} users={users}
          onCats={syncCats} onProds={syncProds} onOrders={syncOrders} toast={toast}
          currency={currency} currencies={CURRENCIES} onCurrencyChange={changeCurrency}
          storeSettings={storeSettings} onSettingsChange={updateStoreSettings}
          onExit={()=>{setIsAdmin(false);setUser(null);db.setSession(null);setPage("home");}}
        />
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={currency}>
      <div style={{minHeight:"100vh",background:"#f9fdf9",fontFamily:"'Sora',system-ui,sans-serif",maxWidth:480,margin:"0 auto",position:"relative",overflowX:"hidden"}}>
        <style>{GLOBAL_STYLE}</style>
        <Toasts toasts={toasts}/>

        {/* TOP NAV */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #e8f5e9",padding:"0 12px"}}>
          <div style={{display:"flex",alignItems:"center",height:54,gap:8}}>
            <div onClick={handleLogoTap} style={{cursor:"pointer",userSelect:"none",flexShrink:0,position:"relative",padding:"4px 0"}}>
              <Logo size={17}/>
              {logoTaps>0&&logoTaps<5&&(
                <span style={{position:"absolute",top:-4,right:-8,background:"#16a34a",color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{5-logoTaps}</span>
              )}
            </div>
            <div style={{flex:1,display:"flex",alignItems:"center",background:"#f0fdf4",border:"1.5px solid #dcfce7",borderRadius:50,padding:"0 10px",gap:5,minWidth:0}}>
              <I.Search s={13}/>
              <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setPage("shop");}} placeholder="Search products..."
                style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#1a1a1a",flex:1,padding:"8px 0",minWidth:0,width:"100%"}}/>
            </div>
            <button onClick={()=>setCartOpen(true)} style={{position:"relative",background:"#16a34a",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <I.Cart s={16}/>
              {cartCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{paddingBottom:72}}>
          {page==="home"     && <HomePage cats={cats} prods={prods} onCatClick={id=>{setFilterCat(id);setPage("shop");}} onProd={setSelProd} onAdd={addToCart} onShop={()=>setPage("shop")}/>}
          {page==="shop"     && <ShopPage prods={filteredProds} cats={cats} filterCat={filterCat} setFilterCat={setFilterCat} onProd={setSelProd} onAdd={addToCart}/>}
          {page==="account"  && !user && <LoginPage users={users} onLogin={u=>{setUser(u);db.setSession(u);setPage("home");toast(`Welcome back, ${u.name}!`);}} onRegister={()=>setPage("register")} toast={toast}/>}
          {page==="account"  && user  && <AccountPage user={user} orders={orders} prods={prods} onUpdate={u=>{setUser(u);db.setSession(u);const nu=users.map(x=>x.id===u.id?u:x);syncUsers(nu);toast("Profile updated!");}} onProd={setSelProd} onLogout={logout}/>}
          {page==="register" && <RegisterPage users={users} onDone={u=>{const nu=[...users,u];syncUsers(nu);setUser(u);db.setSession(u);setPage("home");toast(`Welcome, ${u.name}!`);}} onBack={()=>setPage("account")} toast={toast}/>}
          {page==="checkout" && user && <CheckoutPage cart={cart} prods={prods} user={user} orders={orders} storeSettings={storeSettings} onPlaced={o=>{const no=[...orders,o];syncOrders(no);syncCart([]);setPage("success");toast("Order placed!");}} toast={toast}/>}
          {page==="success"  && <SuccessPage onContinue={()=>setPage("shop")}/>}
          {page==="about"    && <AboutPage/>}
          {page==="admin-login" && <AdminLoginPage toast={toast} onAdminIn={u=>{setUser(u);setIsAdmin(true);db.setSession(u);setPage("admin");toast("Admin access granted.");}} onBack={()=>setPage("home")}/>}
        </div>

        {/* BOTTOM NAV */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #e8f5e9",display:"flex",zIndex:99,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {[
            {id:"home",   label:"Home"},
            {id:"shop",   label:"Shop"},
            {id:"about",  label:"About"},
            {id:"account",label:user?"Account":"Sign In"},
          ].map(n=>{
            const NavIcon=()=>{
              if(n.id==="home")    return <I.Home s={20}/>;
              if(n.id==="shop")    return <I.ShoppingBag s={20}/>;
              if(n.id==="about")   return <I.Shield s={20}/>;
              return <I.User s={20}/>;
            };
            return (
            <button key={n.id} onClick={()=>setPage(n.id)} style={{flex:1,background:"none",border:"none",padding:"9px 4px 7px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:page===n.id?"#16a34a":"#9ca3af",transition:"color 0.15s"}}>
              <NavIcon/>
              <span style={{fontSize:9,fontWeight:page===n.id?700:500,whiteSpace:"nowrap"}}>{n.label}</span>
            </button>
          );})
        </div>

        {cartOpen&&<CartDrawer cart={cart} prods={prods} onClose={()=>setCartOpen(false)} onUpdate={syncCart} total={cartTotal} onCheckout={()=>{setCartOpen(false);setPage(user?"checkout":"account");}}/>}
        {selProd&&<ProdModal prod={selProd} cats={cats} onClose={()=>setSelProd(null)} onAdd={addToCart} user={user} orders={orders} onReview={addReview}/>}
      </div>
    </CurrencyContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function HomePage({cats,prods,onCatClick,onProd,onAdd,onShop}) {
  const featured=prods.filter(p=>p.featured).slice(0,6);
  return (
    <div>
      {/* Hero */}
      <div style={{background:"linear-gradient(160deg,#052e16,#15803d)",padding:"24px 16px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,background:"rgba(74,222,128,0.08)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",bottom:-40,left:-20,width:120,height:120,background:"rgba(74,222,128,0.06)",borderRadius:"50%"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.25)",borderRadius:50,padding:"4px 10px",marginBottom:12}}>
            <I.Zap s={11}/><span style={{fontSize:10,color:"#4ade80",fontWeight:600}}>New Arrivals Just Dropped</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.25,marginBottom:8,letterSpacing:"-0.02em"}}>
            Premium Electronics<br/><span style={{color:"#4ade80"}}>For Every Need</span>
          </h1>
          <p style={{color:"#86efac",fontSize:12,lineHeight:1.6,marginBottom:16}}>
            Discover the latest in tech — laptops, phones, audio, and more.
          </p>
          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
            {[["500+","Products"],["50+","Brands"],["10K+","Customers"],["4.8★","Rating"]].map(([v,l])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#4ade80"}}>{v}</div>
                <div style={{fontSize:8,color:"#86efac",marginTop:1}}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={onShop} style={{background:"#4ade80",color:"#052e16",border:"none",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:6,width:"100%",justifyContent:"center"}}>
            <I.ShoppingBag s={16}/> Shop Now
          </button>
        </div>
      </div>

      {/* Categories */}
      <div style={{padding:"18px 14px 0"}}>
        <h2 style={{fontSize:15,fontWeight:800,color:"#1a1a1a",marginBottom:12,letterSpacing:"-0.02em"}}>Categories</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {cats.map(cat=>(
            <div key={cat.id} onClick={()=>onCatClick(cat.id)} style={{background:"#fff",borderRadius:12,padding:"12px 6px",textAlign:"center",cursor:"pointer",border:"1px solid #e8f5e9",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              {cat.image?(
                <img src={cat.image} alt={cat.name} style={{width:38,height:38,objectFit:"cover",borderRadius:8,margin:"0 auto 6px",display:"block"}}/>
              ):(
                <div style={{color:"#16a34a",display:"flex",justifyContent:"center",marginBottom:6}}><CatIcon name={cat.name} s={30}/></div>
              )}
              <div style={{fontSize:10,fontWeight:600,color:"#1a1a1a",lineHeight:1.3}}>{cat.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div style={{padding:"18px 14px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:15,fontWeight:800,color:"#1a1a1a",letterSpacing:"-0.02em"}}>Featured</h2>
          <button onClick={onShop} style={{background:"none",border:"none",color:"#16a34a",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:2}}>See all <I.ChevronRight s={13}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {featured.map(p=><ProdCard key={p.id} prod={p} cats={cats} onAdd={onAdd} onClick={onProd}/>)}
        </div>
      </div>

      {/* Trust badges */}
      <div style={{margin:"18px 14px 0",background:"#fff",borderRadius:14,padding:14,border:"1px solid #e8f5e9"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {id:"truck",  title:"Free Delivery",   sub:"Orders over $100"},
            {id:"shield", title:"2yr Warranty",     sub:"All products"},
            {id:"refresh",title:"Easy Returns",     sub:"30-day policy"},
            {id:"zap",    title:"Fast Dispatch",    sub:"Within 24 hrs"},
          ].map(({id,title,sub})=>{
            const BadgeIcon=()=>{
              if(id==="truck")  return <I.Truck s={18}/>;
              if(id==="shield") return <I.Shield s={18}/>;
              if(id==="refresh")return <I.Refresh s={18}/>;
              return <I.Zap s={18}/>;
            };
            return (
            <div key={id} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{color:"#16a34a",flexShrink:0}}><BadgeIcon/></div>
              <div><div style={{fontSize:11,fontWeight:700,color:"#1a1a1a"}}>{title}</div><div style={{fontSize:10,color:"#94a3b8"}}>{sub}</div></div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProdCard({prod,cats,onAdd,onClick}) {
  const cat=cats.find(c=>c.id===prod.categoryId);
  const revCount=prod.reviews?.length||0;
  return (
    <div onClick={()=>onClick(prod)} style={{background:"#fff",borderRadius:12,overflow:"hidden",cursor:"pointer",border:"1px solid #e8f5e9",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
      <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",height:110,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {prod.image?<img src={prod.image} alt={prod.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{color:"#16a34a",opacity:0.35}}><CatIcon name={cat?.name||prod.name} s={38}/></div>}
        {prod.featured&&<span style={{position:"absolute",top:6,left:6,background:"#16a34a",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:20}}>Featured</span>}
        {prod.stock===0&&<span style={{position:"absolute",top:6,right:6,background:"#dc2626",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:20}}>Sold Out</span>}
        {prod.stock>0&&prod.stock<=5&&<span style={{position:"absolute",top:6,right:6,background:"#f59e0b",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:20}}>Low Stock</span>}
      </div>
      <div style={{padding:"9px 9px 11px"}}>
        <div style={{fontSize:8,color:"#16a34a",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{cat?.name?.split(" ")[0]||"Tech"}</div>
        <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{prod.name}</div>
        <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
          {[1,2,3,4,5].map(i=><I.Star key={i} filled={i<=Math.round(prod.rating)} s={9}/>)}
          <span style={{fontSize:9,color:"#888",marginLeft:2}}>({revCount})</span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
          <div style={{fontSize:14,fontWeight:800,color:"#16a34a",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><Price usd={prod.price}/></div>
          <button onClick={e=>{e.stopPropagation();onAdd(prod);}} disabled={prod.stock===0}
            style={{background:prod.stock===0?"#e5e7eb":"#16a34a",color:prod.stock===0?"#9ca3af":"#fff",border:"none",borderRadius:7,width:28,height:28,cursor:prod.stock===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <I.Plus s={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ShopPage({prods,cats,filterCat,setFilterCat,onProd,onAdd}) {
  const [showFilter,setShowFilter]=useState(false);
  return (
    <div style={{padding:"14px 14px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8}}>
        <h1 style={{fontSize:17,fontWeight:800,color:"#1a1a1a",letterSpacing:"-0.02em",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {filterCat==="all"?"All Products":cats.find(c=>c.id===filterCat)?.name||"Products"}
        </h1>
        <button onClick={()=>setShowFilter(s=>!s)} style={{background:"#f0fdf4",border:"1px solid #dcfce7",borderRadius:9,padding:"6px 10px",cursor:"pointer",color:"#16a34a",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <I.Filter s={13}/> Filter
        </button>
      </div>
      {showFilter&&(
        <div style={{marginBottom:12,animation:"slideDown 0.2s ease"}}>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
            {[{id:"all",name:"All"},...cats].map(c=>(
              <button key={c.id} onClick={()=>setFilterCat(c.id)} style={{background:filterCat===c.id?"#16a34a":"#fff",color:filterCat===c.id?"#fff":"#555",border:"1.5px solid",borderColor:filterCat===c.id?"#16a34a":"#e5e7eb",borderRadius:50,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>{prods.length} products</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {prods.length===0?(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"48px 0",color:"#94a3b8"}}>
            <I.Package s={36}/><div style={{fontSize:14,fontWeight:600,marginTop:10}}>No products found</div>
          </div>
        ):prods.map(p=><ProdCard key={p.id} prod={p} cats={cats} onAdd={onAdd} onClick={onProd}/>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ProdModal({prod,cats,onClose,onAdd,user,orders,onReview}) {
  const cat=cats.find(c=>c.id===prod.categoryId);
  const [tab,setTab]=useState("info");
  const [rev,setRev]=useState({rating:5,name:"",text:""});
  const hasOrdered=user&&orders.some(o=>o.userId===user.id&&o.status==="Delivered"&&o.items?.some(i=>i.pid===prod.id));
  const alreadyReviewed=user&&prod.reviews?.some(r=>r.userId===user.id);
  const submitReview=()=>{
    if(!rev.name){return;}
    onReview(prod.id,{...rev,userId:user?.id,date:new Date().toISOString()});
    setRev({rating:5,name:"",text:""});
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{position:"relative",width:"100%",maxWidth:480,background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:4,background:"#e5e7eb",borderRadius:2}}/></div>
        <div style={{overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch"}}>
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",height:180,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            {prod.image?<img src={prod.image} alt={prod.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{color:"#16a34a",opacity:0.3}}><CatIcon name={cat?.name||""} s={72}/></div>}
            <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.3)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={15}/></button>
          </div>
          <div style={{padding:"14px 14px 24px"}}>
            <div style={{fontSize:9,color:"#16a34a",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>{cat?.name}</div>
            <h2 style={{fontSize:18,fontWeight:800,color:"#1a1a1a",marginBottom:6,letterSpacing:"-0.02em"}}>{prod.name}</h2>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                {[1,2,3,4,5].map(i=><I.Star key={i} filled={i<=Math.round(prod.rating)} s={13}/>)}
              </div>
              <span style={{fontSize:12,color:"#888"}}>{prod.rating} ({prod.reviews?.length||0} reviews)</span>
            </div>
            <div style={{fontSize:22,fontWeight:800,color:"#16a34a",marginBottom:12}}><Price usd={prod.price}/></div>
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              {["info","reviews"].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",background:tab===t?"#16a34a":"#f0fdf4",color:tab===t?"#fff":"#555",border:"none",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{t}</button>
              ))}
            </div>
            {tab==="info"&&(
              <div>
                <p style={{fontSize:13,color:"#555",lineHeight:1.65,marginBottom:14}}>{prod.description}</p>
                <div style={{display:"flex",gap:8,alignItems:"center",background:"#f0fdf4",borderRadius:10,padding:"10px 12px",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:prod.stock===0?"#dc2626":prod.stock<=5?"#d97706":"#15803d"}}>
                    {prod.stock===0?"Out of stock":prod.stock<=5?`Only ${prod.stock} left`:`${prod.stock} in stock`}
                  </div>
                </div>
                <button onClick={()=>onAdd(prod)} disabled={prod.stock===0} style={{width:"100%",background:prod.stock===0?"#e5e7eb":"#16a34a",color:prod.stock===0?"#9ca3af":"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:700,cursor:prod.stock===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                  {prod.stock===0?"Out of Stock":<><I.Plus s={16}/> Add to Cart</>}
                </button>
              </div>
            )}
            {tab==="reviews"&&(
              <div>
                {hasOrdered&&!alreadyReviewed&&(
                  <div style={{background:"#f0fdf4",borderRadius:12,padding:14,marginBottom:14,border:"1.5px solid #bbf7d0"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:10}}>Leave a Review</div>
                    <StarPicker value={rev.rating} onChange={r=>setRev(v=>({...v,rating:r}))}/>
                    <div style={{marginTop:10}}>
                      <Field label="Name" value={rev.name} onChange={e=>setRev(v=>({...v,name:e.target.value}))} placeholder="Your name" small/>
                      <div style={{marginBottom:10}}>
                        <textarea value={rev.text} onChange={e=>setRev(v=>({...v,text:e.target.value}))} placeholder="Share your thoughts..." rows={2}
                          style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                      </div>
                      <button onClick={submitReview} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Submit Review</button>
                    </div>
                  </div>
                )}
                {(prod.reviews||[]).length===0?(
                  <div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontSize:13}}>No reviews yet</div>
                ):(prod.reviews||[]).slice().reverse().map((r,i)=>(
                  <div key={i} style={{paddingBottom:12,marginBottom:12,borderBottom:"1px solid #f0f0f0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{width:30,height:30,background:"#16a34a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>{r.name?.[0]?.toUpperCase()||"?"}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{r.name}</div>
                        <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(i=><I.Star key={i} filled={i<=r.rating} s={10}/>)}</div>
                      </div>
                      <div style={{fontSize:10,color:"#94a3b8",marginLeft:"auto"}}>{new Date(r.date).toLocaleDateString()}</div>
                    </div>
                    {r.text&&<p style={{fontSize:12,color:"#555",lineHeight:1.5}}>{r.text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CART DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function CartDrawer({cart,prods,onClose,onUpdate,total,onCheckout}) {
  const upd=(pid,qty)=>{
    if(qty<=0)onUpdate(cart.filter(i=>i.pid!==pid));
    else onUpdate(cart.map(i=>i.pid===pid?{...i,qty}:i));
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:200}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)"}} onClick={onClose}/>
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:32,height:4,background:"#e5e7eb",borderRadius:2}}/></div>
        <div style={{padding:"10px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #f0f0f0"}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1a1a1a"}}>Your Cart</div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={14}/></button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"6px 14px",WebkitOverflowScrolling:"touch"}}>
          {cart.length===0?(
            <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><I.Cart s={40}/><div style={{fontSize:14,fontWeight:600,marginTop:10}}>Cart is empty</div></div>
          ):cart.map(item=>{
            const p=prods.find(x=>x.id===item.pid);if(!p)return null;
            return (
              <div key={item.pid} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid #f8f8f8",alignItems:"center"}}>
                <div style={{width:48,height:48,background:"#f0fdf4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                  {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{color:"#16a34a",opacity:0.4}}><I.Package s={20}/></div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#16a34a"}}><Price usd={p.price}/></div>
                </div>
                <div style={{display:"flex",alignItems:"center",border:"1px solid #e5e7eb",borderRadius:8}}>
                  <button onClick={()=>upd(item.pid,item.qty-1)} style={{background:"none",border:"none",padding:"6px 8px",cursor:"pointer",color:"#555",display:"flex",alignItems:"center"}}><I.Minus s={12}/></button>
                  <span style={{padding:"0 6px",fontWeight:700,fontSize:13}}>{item.qty}</span>
                  <button onClick={()=>upd(item.pid,item.qty+1)} style={{background:"none",border:"none",padding:"6px 8px",cursor:"pointer",color:"#555",display:"flex",alignItems:"center"}}><I.Plus s={12}/></button>
                </div>
                <button onClick={()=>upd(item.pid,0)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",padding:4,display:"flex",alignItems:"center"}}><I.Trash s={14}/></button>
              </div>
            );
          })}
        </div>
        {cart.length>0&&(
          <div style={{padding:"10px 14px 20px",borderTop:"1px solid #f0f0f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:13,color:"#555"}}>Total</span>
              <span style={{fontSize:18,fontWeight:800,color:"#1a1a1a"}}><Price usd={total}/></span>
            </div>
            <button onClick={onCheckout} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <I.Truck s={16}/> Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH PAGES
// ═══════════════════════════════════════════════════════════════════════════════
function AuthWrap({title,subtitle,children}) {
  return (
    <div style={{padding:"20px 14px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <Logo size={20}/>
        <h2 style={{fontSize:20,fontWeight:800,color:"#1a1a1a",margin:"10px 0 4px",letterSpacing:"-0.02em"}}>{title}</h2>
        <p style={{fontSize:12,color:"#888"}}>{subtitle}</p>
      </div>
      <div style={{background:"#fff",borderRadius:18,padding:18,border:"1px solid #e8f5e9",boxShadow:"0 4px 20px rgba(22,163,74,0.07)"}}>{children}</div>
    </div>
  );
}

function LoginPage({users,onLogin,onRegister,toast}) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const handle=e=>{
    e.preventDefault();
    const u=users.find(x=>x.email===email&&x.password===pass);
    if(!u){toast("Invalid email or password.","error");return;}
    onLogin(u);
  };
  return (
    <AuthWrap title="Welcome Back" subtitle="Sign in to your account">
      <div>
        <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
        <Field label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Your password" required/>
        <button onClick={handle} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4,marginBottom:12}}>Sign In</button>
        <p style={{textAlign:"center",fontSize:13,color:"#888"}}>No account? <span onClick={onRegister} style={{color:"#16a34a",fontWeight:700,cursor:"pointer"}}>Create one</span></p>
      </div>
    </AuthWrap>
  );
}

function RegisterPage({users,onDone,onBack,toast}) {
  const [form,setForm]=useState({name:"",email:"",phone:"",password:"",street:"",city:"",lat:null,lng:null});
  const [locating,setLocating]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const getLocation=()=>{
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{setForm(f=>({...f,lat:pos.coords.latitude,lng:pos.coords.longitude}));setLocating(false);toast("Location captured!");},
      ()=>{setLocating(false);toast("Location denied, you can still register.","warning");}
    );
  };
  const handle=e=>{
    e.preventDefault();
    if(users.find(u=>u.email===form.email)){toast("Email already exists.","error");return;}
    if(form.password.length<6){toast("Password must be at least 6 characters.","error");return;}
    onDone({...form,id:"u_"+Date.now(),isAdmin:false});
  };
  return (
    <AuthWrap title="Create Account" subtitle="Join GreenLand today">
      <div>
        <Field label="Full Name" value={form.name} onChange={set("name")} placeholder="John Smith" required/>
        <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required/>
        <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="+1 234 567 8900" required/>
        <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required/>
        <div style={{background:"#f0fdf4",borderRadius:10,padding:12,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"#15803d",marginBottom:8,display:"flex",alignItems:"center",gap:4}}><I.MapPin s={12}/> Delivery Address</div>
          <Field label="Street" value={form.street} onChange={set("street")} placeholder="123 Main Street" required small/>
          <Field label="City" value={form.city} onChange={set("city")} placeholder="New York" required small/>
          <button type="button" onClick={getLocation} disabled={locating} style={{width:"100%",background:form.lat?"#dcfce7":"#fff",border:`1.5px dashed ${form.lat?"#16a34a":"#bbf7d0"}`,borderRadius:9,padding:"10px",cursor:"pointer",fontSize:12,fontWeight:600,color:form.lat?"#15803d":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            {locating?"Detecting...":form.lat?<><I.Check s={13}/> Location Captured</>:<><I.MapPin s={13}/> Get My Location</>}
          </button>
        </div>
        <button onClick={handle} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:12}}>Create Account</button>
        <p style={{textAlign:"center",fontSize:13,color:"#888"}}>Have account? <span onClick={onBack} style={{color:"#16a34a",fontWeight:700,cursor:"pointer"}}>Sign in</span></p>
      </div>
    </AuthWrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function AccountPage({user,orders,prods,onUpdate,onProd,onLogout}) {
  const myOrders=orders.filter(o=>o.userId===user.id);
  const [form,setForm]=useState({...user});
  const [tab,setTab]=useState("orders");
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  return (
    <div style={{padding:14}}>
      <div style={{background:"linear-gradient(135deg,#052e16,#15803d)",borderRadius:16,padding:16,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:46,height:46,background:"rgba(255,255,255,0.15)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:800,flexShrink:0}}>{user.name[0].toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
          <div style={{fontSize:11,color:"#86efac",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
        </div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:9,padding:"7px 10px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,flexShrink:0}}>
          <I.LogOut s={12}/> Out
        </button>
      </div>
      <div style={{display:"flex",background:"#f0fdf4",borderRadius:10,padding:3,marginBottom:14}}>
        {["orders","profile"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"#fff":"none",border:"none",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:tab===t?700:500,color:tab===t?"#16a34a":"#888",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>
      {tab==="orders"&&(
        <div>
          {myOrders.length===0?(
            <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><I.Package s={36}/><div style={{fontSize:13,fontWeight:600,marginTop:10}}>No orders yet</div></div>
          ):myOrders.slice().reverse().map(o=>(
            <div key={o.id} style={{background:"#fff",borderRadius:12,padding:12,marginBottom:10,border:"1px solid #e8f5e9"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:10,color:"#94a3b8"}}>{o.id}</span>
                <StatusBadge status={o.status}/>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:"#16a34a",marginBottom:2}}><Price usd={o.total}/></div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{new Date(o.placedAt).toLocaleDateString()} · {o.items?.length} item(s)</div>
              {o.status==="Delivered"&&(
                <div style={{marginTop:7,display:"flex",flexWrap:"wrap",gap:5}}>
                  {o.items?.map(item=>{
                    const p=prods.find(x=>x.id===item.pid);
                    if(!p)return null;
                    return <button key={item.pid} onClick={()=>onProd(p)} style={{fontSize:10,color:"#16a34a",background:"#f0fdf4",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontWeight:600}}>★ Review {item.productName}</button>;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {tab==="profile"&&(
        <div style={{background:"#fff",borderRadius:12,padding:14,border:"1px solid #e8f5e9"}}>
          <Field label="Full Name" value={form.name} onChange={set("name")}/>
          <Field label="Email" type="email" value={form.email} onChange={set("email")}/>
          <Field label="Phone" value={form.phone} onChange={set("phone")}/>
          <Field label="Street" value={form.street||""} onChange={set("street")}/>
          <Field label="City" value={form.city||""} onChange={set("city")}/>
          <button onClick={()=>onUpdate(form)} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Changes</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT
// ═══════════════════════════════════════════════════════════════════════════════
function CheckoutPage({cart,prods,user,orders,onPlaced,toast,storeSettings}) {
  const s = storeSettings || DEF_SETTINGS;
  const [step,setStep]=useState("review");
  const [pay,setPay]=useState("cod");
  const [verifying,setVerifying]=useState(false);
  const [addressConfirmed,setAddressConfirmed]=useState(false);
  const [editingAddress,setEditingAddress]=useState(false);
  const [addressForm,setAddressForm]=useState({street:user.street||"",city:user.city||""});
  const [copied,setCopied]=useState("");
  const subtotal=cart.reduce((a,i)=>{const p=prods.find(x=>x.id===i.pid);return a+(p?p.price*i.qty:0);},0);
  const deliveryFee=parseFloat(s.deliveryCharge)||0;
  const codFee=pay==="cod"?(parseFloat(s.codCharge)||0):0;
  const total=subtotal+deliveryFee+codFee;

  const verifyLocation=()=>{
    if(!user.lat){toast("No saved location — please confirm your address below.","warning");setStep("pay");return;}
    setVerifying(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{const d=haversine(pos.coords.latitude,pos.coords.longitude,user.lat,user.lng);setVerifying(false);if(d<=500){toast("✓ Location verified!");setStep("pay");}else{toast(`You are ${Math.round(d)}m from your saved address.`,"warning");setStep("pay");}},
      ()=>{setVerifying(false);toast("Location unavailable.","warning");setStep("pay");}
    );
  };

  const placeOrder=()=>{
    if(!addressConfirmed){toast("Please confirm your delivery address first.","error");return;}
    onPlaced({
      id:"ORD_"+Date.now(),userId:user.id,
      customerName:user.name,customerPhone:user.phone,customerEmail:user.email,
      deliveryAddress:`${addressForm.street}, ${addressForm.city}`,
      items:cart.map(i=>{const p=prods.find(x=>x.id===i.pid);return{pid:i.pid,productName:p?.name,price:p?.price,qty:i.qty};}),
      subtotal,deliveryFee,codFee,total,paymentMethod:pay,status:"Processing",placedAt:new Date().toISOString(),
    });
  };

  const copyToClipboard=(text,key)=>{
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(key);setTimeout(()=>setCopied(""),2000);
    toast("Copied!");
  };

  const steps=["review","verify","pay"];
  const epAcc = s.easypaisa || DEF_SETTINGS.easypaisa;
  const jcAcc = s.jazzcash  || DEF_SETTINGS.jazzcash;

  return (
    <div style={{padding:14}}>
      <h1 style={{fontSize:18,fontWeight:800,color:"#1a1a1a",marginBottom:16,letterSpacing:"-0.02em"}}>Checkout</h1>
      {/* Step indicators */}
      <div style={{display:"flex",alignItems:"flex-start",marginBottom:16}}>
        {steps.map((s2,i)=>(
          <div key={s2} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:step===s2?"#16a34a":steps.indexOf(step)>i?"#16a34a":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",color:steps.indexOf(step)>=i?"#fff":"#9ca3af",fontSize:11,fontWeight:700}}>
                {steps.indexOf(step)>i?<I.Check s={12}/>:i+1}
              </div>
              <div style={{fontSize:9,fontWeight:600,color:step===s2?"#16a34a":"#9ca3af",marginTop:3,textTransform:"capitalize"}}>{s2}</div>
            </div>
            {i<2&&<div style={{height:2,flex:1,background:steps.indexOf(step)>i?"#16a34a":"#e5e7eb",margin:"0 4px 14px"}}/>}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Review ── */}
      {step==="review"&&(
        <div style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e8f5e9"}}>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#1a1a1a"}}>Order Summary</h3>
          {cart.map(item=>{const p=prods.find(x=>x.id===item.pid);if(!p)return null;return(
            <div key={item.pid} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f8f8f8",fontSize:13}}>
              <span style={{color:"#1a1a1a",flex:1,marginRight:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name} <span style={{color:"#94a3b8"}}>×{item.qty}</span></span>
              <span style={{fontWeight:700,color:"#16a34a",flexShrink:0}}><Price usd={p.price*item.qty}/></span>
            </div>
          );})}
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #f0fdf4"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#555",marginBottom:4}}>
              <span>Subtotal</span><span><Price usd={subtotal}/></span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#555",marginBottom:6}}>
              <span>Delivery</span><span style={{color:"#16a34a",fontWeight:600}}>{deliveryFee===0?"Free":<Price usd={deliveryFee}/>}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14,paddingTop:6,borderTop:"2px solid #f0fdf4"}}>
              <span>Total (estimated)</span><span style={{color:"#16a34a"}}><Price usd={subtotal+deliveryFee}/></span>
            </div>
          </div>
          <button onClick={()=>setStep("verify")} style={{width:"100%",marginTop:12,background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Continue</button>
        </div>
      )}

      {/* ── STEP 2: Verify Location ── */}
      {step==="verify"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #e8f5e9",textAlign:"center"}}>
          <div style={{color:"#16a34a",marginBottom:12,display:"flex",justifyContent:"center"}}><I.MapPin s={40}/></div>
          <h3 style={{fontSize:16,fontWeight:800,color:"#1a1a1a",marginBottom:6}}>Verify Location</h3>
          <p style={{color:"#555",fontSize:12,lineHeight:1.65,marginBottom:18}}>Confirm your live GPS matches your delivery address to avoid failed deliveries.</p>
          <button onClick={verifyLocation} disabled={verifying} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
            {verifying?"Verifying...":<><I.MapPin s={15}/> Verify My Location</>}
          </button>
          <button onClick={()=>setStep("pay")} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>Skip</button>
        </div>
      )}

      {/* ── STEP 3: Payment + Address Confirmation ── */}
      {step==="pay"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Address confirm — THE anti-fake-address system */}
          <div style={{background:"#fff",borderRadius:14,padding:14,border:`2px solid ${addressConfirmed?"#16a34a":"#f59e0b"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <I.MapPin s={16}/>
                <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Delivery Address</span>
              </div>
              {addressConfirmed
                ? <span style={{fontSize:10,background:"#dcfce7",color:"#15803d",padding:"3px 8px",borderRadius:20,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><I.Check s={10}/>Confirmed</span>
                : <span style={{fontSize:10,background:"#fef3c7",color:"#d97706",padding:"3px 8px",borderRadius:20,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><I.Warning s={10}/>Needs Confirmation</span>
              }
            </div>

            {/* Big companies like Daraz/Amazon show the address and make you tap "Deliver here" */}
            <div style={{background:"#f8fdf8",borderRadius:9,padding:"10px 12px",marginBottom:10,border:"1px solid #e8f5e9"}}>
              <div style={{fontSize:12,color:"#1a1a1a",fontWeight:600,marginBottom:2}}>{user.name}</div>
              <div style={{fontSize:12,color:"#555"}}>{user.phone}</div>
              {!editingAddress?(
                <div style={{fontSize:12,color:"#555",marginTop:2}}>
                  {addressForm.street || user.street || <span style={{color:"#ef4444"}}>No street entered</span>}, {addressForm.city || user.city || <span style={{color:"#ef4444"}}>No city</span>}
                </div>
              ):(
                <div style={{marginTop:8}}>
                  <div style={{marginBottom:6}}>
                    <label style={{fontSize:10,fontWeight:600,color:"#555",display:"block",marginBottom:2}}>Street / House No. *</label>
                    <input value={addressForm.street} onChange={e=>setAddressForm(f=>({...f,street:e.target.value}))} placeholder="e.g. House 5, Street 12, Block A"
                      style={{width:"100%",padding:"9px 11px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:12,outline:"none",background:"#fff",boxSizing:"border-box",fontFamily:"inherit"}}
                      onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                  </div>
                  <div>
                    <label style={{fontSize:10,fontWeight:600,color:"#555",display:"block",marginBottom:2}}>City *</label>
                    <input value={addressForm.city} onChange={e=>setAddressForm(f=>({...f,city:e.target.value}))} placeholder="e.g. Lahore"
                      style={{width:"100%",padding:"9px 11px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:12,outline:"none",background:"#fff",boxSizing:"border-box",fontFamily:"inherit"}}
                      onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                  </div>
                </div>
              )}
            </div>

            {user.lat&&(
              <div style={{fontSize:10,color:"#16a34a",fontWeight:600,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
                <I.Check s={11}/> GPS location on file
              </div>
            )}

            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>setEditingAddress(s=>!s)} style={{flex:1,background:"#f0fdf4",border:"1px solid #dcfce7",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:11,color:"#15803d",fontWeight:600}}>
                {editingAddress?"Cancel Edit":<><I.Edit s={11}/> Edit Address</>}
              </button>
              <button
                onClick={()=>{
                  if(!addressForm.street||!addressForm.city){toast("Enter street and city first.","error");return;}
                  setEditingAddress(false);setAddressConfirmed(true);toast("Address confirmed ✓");
                }}
                style={{flex:2,background:"#16a34a",border:"none",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <I.MapPin s={12}/> Deliver Here
              </button>
            </div>

            {!addressConfirmed&&(
              <div style={{marginTop:10,background:"#fef3c7",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#92400e",lineHeight:1.5}}>
                <I.Warning s={12} style={{display:"inline",verticalAlign:"middle"}}/> You must tap <strong>"Deliver Here"</strong> to confirm your address. This helps us avoid delivery failures.
              </div>
            )}
          </div>

          {/* Payment method */}
          <div style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e8f5e9"}}>
            <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#1a1a1a"}}>Payment Method</h3>
            {[
              {val:"cod",        label:"Cash on Delivery"},
              {val:"easypaisa",  label:"EasyPaisa"},
              {val:"jazzcash",   label:"JazzCash"},
              {val:"card",       label:"Credit / Debit Card"},
            ].map(({val,label})=>{
              const PayIcon=()=>{
                if(val==="cod")       return <I.Banknote s={17}/>;
                if(val==="easypaisa") return <I.EP s={20} color="#16a34a"/>;
                if(val==="jazzcash")  return <I.JC s={20} color="#dc2626"/>;
                return <I.CreditCard s={17}/>;
              };
              return (
              <label key={val} onClick={()=>setPay(val)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px",border:`2px solid ${pay===val?"#16a34a":"#e5e7eb"}`,borderRadius:10,cursor:"pointer",marginBottom:8,background:pay===val?"#f0fdf4":"#fff"}}>
                <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${pay===val?"#16a34a":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {pay===val&&<div style={{width:8,height:8,background:"#16a34a",borderRadius:"50%"}}/>}
                </div>
                <span style={{display:"flex",alignItems:"center",color:pay===val?"#15803d":"#555"}}><PayIcon/></span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:pay===val?700:400,color:pay===val?"#15803d":"#374151"}}>{label}</div>
                  {val==="cod"&&parseFloat(s.codCharge)>0&&(
                    <div style={{fontSize:10,color:"#d97706",fontWeight:600}}>+<Price usd={parseFloat(s.codCharge)||0}/> COD fee</div>
                  )}
                </div>
              </label>
            );})}

            {/* EasyPaisa instructions */}
            {pay==="easypaisa"&&(
              <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,padding:14,marginTop:4,border:"1.5px solid #bbf7d0",animation:"slideDown 0.2s ease"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#15803d",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><I.EP s={16} color="#16a34a"/> Send payment to EasyPaisa</div>
                <div style={{background:"#fff",borderRadius:9,padding:"10px 12px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:2}}>Account Number</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:800,color:"#1a1a1a",letterSpacing:"0.03em"}}>{epAcc.number}</span>
                    <button onClick={()=>copyToClipboard(epAcc.number,"ep_num")} style={{background:"#16a34a",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#fff",fontSize:10,fontWeight:700}}>
                      {copied==="ep_num"?"Copied!":"Copy"}
                    </button>
                  </div>
                </div>
                <div style={{background:"#fff",borderRadius:9,padding:"10px 12px",marginBottom:10}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:2}}>Account Holder</div>
                  <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{epAcc.holder}</span>
                </div>
                <div style={{fontSize:11,color:"#15803d",lineHeight:1.5}}>Send exactly <strong><Price usd={total}/></strong> and upload the screenshot after placing the order.</div>
              </div>
            )}

            {/* JazzCash instructions */}
            {pay==="jazzcash"&&(
              <div style={{background:"linear-gradient(135deg,#fff5f5,#fee2e2)",borderRadius:12,padding:14,marginTop:4,border:"1.5px solid #fca5a5",animation:"slideDown 0.2s ease"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#dc2626",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><I.JC s={16} color="#dc2626"/> Send payment to JazzCash</div>
                <div style={{background:"#fff",borderRadius:9,padding:"10px 12px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:2}}>Mobile Account Number</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:800,color:"#1a1a1a",letterSpacing:"0.03em"}}>{jcAcc.number}</span>
                    <button onClick={()=>copyToClipboard(jcAcc.number,"jc_num")} style={{background:"#dc2626",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#fff",fontSize:10,fontWeight:700}}>
                      {copied==="jc_num"?"Copied!":"Copy"}
                    </button>
                  </div>
                </div>
                <div style={{background:"#fff",borderRadius:9,padding:"10px 12px",marginBottom:10}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:2}}>Account Holder</div>
                  <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{jcAcc.holder}</span>
                </div>
                <div style={{fontSize:11,color:"#dc2626",lineHeight:1.5}}>Send exactly <strong><Price usd={total}/></strong> and upload the screenshot after placing the order.</div>
              </div>
            )}
          </div>

          {/* Order total breakdown */}
          <div style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e8f5e9"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#555",marginBottom:4}}>
              <span>Subtotal</span><span><Price usd={subtotal}/></span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#555",marginBottom:4}}>
              <span>Delivery</span><span style={{color:"#16a34a",fontWeight:600}}>{deliveryFee===0?"Free":<Price usd={deliveryFee}/>}</span>
            </div>
            {codFee>0&&(
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#d97706",marginBottom:4}}>
                <span>COD Fee</span><span><Price usd={codFee}/></span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,paddingTop:8,borderTop:"2px solid #f0fdf4",marginTop:4}}>
              <span>Total</span><span style={{color:"#16a34a"}}><Price usd={total}/></span>
            </div>
          </div>

          <button onClick={placeOrder} disabled={!addressConfirmed}
            style={{width:"100%",background:addressConfirmed?"#16a34a":"#94a3b8",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:addressConfirmed?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"background 0.2s"}}>
            <I.Check s={16}/> Place Order · <Price usd={total}/>
          </button>
          {!addressConfirmed&&(
            <div style={{textAlign:"center",fontSize:11,color:"#d97706",marginTop:-4}}>Confirm your delivery address above to place the order</div>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessPage({onContinue}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",padding:24}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:72,height:72,background:"#16a34a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",animation:"pulse 1.5s ease infinite"}}>
          <I.Check s={32}/>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,color:"#1a1a1a",marginBottom:8,letterSpacing:"-0.02em"}}>Order Placed!</h2>
        <p style={{color:"#555",fontSize:13,lineHeight:1.7,marginBottom:20}}>Thank you! Your order is being processed. Once delivered, you can leave a review.</p>
        <button onClick={onContinue} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Continue Shopping</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function AboutPage() {
  return (
    <div style={{padding:14}}>
      <div style={{background:"linear-gradient(135deg,#052e16,#15803d)",borderRadius:16,padding:20,textAlign:"center",marginBottom:14}}>
        <Logo size={22}/>
        <p style={{color:"#86efac",fontSize:12,marginTop:8,lineHeight:1.65}}>Your trusted destination for premium electronics.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {id:"shield",title:"Authentic",    sub:"All products verified"},
          {id:"truck", title:"Fast Delivery",sub:"Within 24 hours"},
          {id:"users", title:"10K+ Customers",sub:"Happy customers"},
          {id:"star",  title:"4.8 Rating",   sub:"Top rated store"},
        ].map(({id,title,sub})=>{
          const AIcon=()=>{
            if(id==="shield") return <I.Shield s={20}/>;
            if(id==="truck")  return <I.Truck s={20}/>;
            if(id==="users")  return <I.Users s={20}/>;
            return <I.Star filled s={20}/>;
          };
          return (
          <div key={title} style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #e8f5e9"}}>
            <div style={{color:"#16a34a",marginBottom:6}}><AIcon/></div>
            <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{title}</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>{sub}</div>
          </div>
          );
        })}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:14,border:"1px solid #e8f5e9"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#15803d",marginBottom:10}}>Contact Us</div>
        {[
          {id:"mail",  text:"support@greenland.com"},
          {id:"phone", text:"+1 (800) 555-0199"},
          {id:"pin",   text:"500 Tech Drive, San Francisco"},
        ].map(({id,text})=>{
          const ContactIcon=()=>{
            if(id==="mail")  return <I.Mail s={13}/>;
            if(id==="phone") return <I.Phone s={13}/>;
            return <I.MapPin s={13}/>;
          };
          return <div key={id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#555",marginBottom:8}}><ContactIcon/>{text}</div>;
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN LOGIN (secret — tap logo 5×)
// ═══════════════════════════════════════════════════════════════════════════════
function AdminLoginPage({toast,onAdminIn,onBack}) {
  const [pass,setPass]=useState("");
  const [geoChecking,setGeoChecking]=useState(false);
  const [step,setStep]=useState("pass");

  const handlePass=()=>{
    if(pass!==ADMIN_PASS){toast("Wrong password.","error");return;}
    setStep("geo");
  };
  const verifyGeo=()=>{
    setGeoChecking(true);
    if(!navigator.geolocation){onAdminIn({id:"admin",name:"Admin",email:"admin@greenland.com",isAdmin:true});return;}
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const STORE_LAT=37.7749,STORE_LNG=-122.4194,RADIUS=50000;
        const d=haversine(pos.coords.latitude,pos.coords.longitude,STORE_LAT,STORE_LNG);
        setGeoChecking(false);
        if(d<=RADIUS){toast("Location verified! Welcome, Admin.");onAdminIn({id:"admin",name:"Admin",email:"admin@greenland.com",isAdmin:true});}
        else{toast(`Access denied. ${Math.round(d/1000)}km from store.`,"error");}
      },
      ()=>{setGeoChecking(false);toast("Location denied — proceeding.","warning");onAdminIn({id:"admin",name:"Admin",email:"admin@greenland.com",isAdmin:true});}
    );
  };
  return (
    <div style={{padding:14,minHeight:"70vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:18,padding:22,border:"1px solid #e8f5e9",boxShadow:"0 8px 32px rgba(22,163,74,0.1)",animation:"pop 0.3s ease"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{width:52,height:52,background:"#f0fdf4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",border:"2px solid #dcfce7"}}><I.Lock s={22}/></div>
          <Logo size={18}/>
          <h2 style={{fontSize:16,fontWeight:800,color:"#1a1a1a",margin:"8px 0 3px"}}>Admin Access</h2>
          <p style={{fontSize:11,color:"#94a3b8"}}>Restricted area — authorized only</p>
        </div>
        {step==="pass"&&(
          <div>
            <Field label="Admin Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Enter admin password" required/>
            <button onClick={handlePass} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Verify Password</button>
            <button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:12}}>← Back to store</button>
          </div>
        )}
        {step==="geo"&&(
          <div style={{textAlign:"center"}}>
            <div style={{color:"#16a34a",display:"flex",justifyContent:"center",marginBottom:12}}><I.MapPin s={36}/></div>
            <p style={{fontSize:12,color:"#555",lineHeight:1.65,marginBottom:16}}>Verify your location to confirm you're at an authorized location.</p>
            <button onClick={verifyGeo} disabled={geoChecking} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
              {geoChecking?"Checking...":<><I.MapPin s={14}/> Verify Location</>}
            </button>
            <button onClick={()=>setStep("pass")} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:11}}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PORTAL
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPortal({cats,prods,orders,users,onCats,onProds,onOrders,toast,currency,currencies,onCurrencyChange,storeSettings,onSettingsChange,onExit}) {
  const [tab,setTab]=useState("dashboard");
  const [menuOpen,setMenuOpen]=useState(false);
  const stats={
    revenue:orders.reduce((a,o)=>a+(o.total||0),0),
    orders:orders.length,prods:prods.length,customers:users.length,
  };
  const tabs=[
    {id:"dashboard", label:"Dashboard"},
    {id:"categories",label:"Categories"},
    {id:"products",  label:"Products"},
    {id:"orders",    label:"Orders"},
    {id:"customers", label:"Customers"},
    {id:"settings",  label:"Settings"},
  ];
  const TabIcon=({id})=>{
    if(id==="dashboard")  return <I.Home s={17}/>;
    if(id==="categories") return <I.Grid s={17}/>;
    if(id==="products")   return <I.Package s={17}/>;
    if(id==="orders")     return <I.ShoppingBag s={17}/>;
    if(id==="customers")  return <I.Users s={17}/>;
    return <I.Settings s={17}/>;
  };
  return (
    <div style={{minHeight:"100vh",background:"#f8fdf9",fontFamily:"'Sora',system-ui,sans-serif",maxWidth:480,margin:"0 auto",overflowX:"hidden"}}>
      {/* Admin Top Bar */}
      <div style={{background:"#052e16",padding:"0 12px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",height:52,gap:8}}>
          <button onClick={()=>setMenuOpen(s=>!s)} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I.Menu s={16}/></button>
          <Logo size={15}/>
          <span style={{fontSize:10,color:"#4ade80",fontWeight:600,background:"rgba(74,222,128,0.15)",padding:"2px 7px",borderRadius:20}}>Admin</span>
          <button onClick={onExit} style={{marginLeft:"auto",background:"#dc2626",border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,flexShrink:0}}>
            <I.LogOut s={12}/> Exit
          </button>
        </div>
      </div>

      {/* Side Drawer */}
      {menuOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}} onClick={()=>setMenuOpen(false)}/>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:220,background:"#fff",boxShadow:"4px 0 24px rgba(0,0,0,0.12)",animation:"pop 0.2s ease",overflowY:"auto"}}>
            <div style={{padding:"18px 14px 10px",borderBottom:"1px solid #e8f5e9"}}><Logo size={16}/><div style={{fontSize:9,color:"#94a3b8",marginTop:1}}>Admin Portal</div></div>
            <div style={{padding:"6px 8px"}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>{setTab(t.id);setMenuOpen(false);}} style={{width:"100%",textAlign:"left",background:tab===t.id?"#f0fdf4":"none",border:"none",borderRadius:9,padding:"10px 12px",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?"#16a34a":"#555",display:"flex",alignItems:"center",gap:9,marginBottom:2}}>
                  <TabIcon id={t.id}/> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{padding:12,paddingBottom:80}}>
        <h1 style={{fontSize:17,fontWeight:800,color:"#1a1a1a",marginBottom:14,letterSpacing:"-0.02em"}}>{tabs.find(t=>t.id===tab)?.label}</h1>
        {tab==="dashboard"  && <AdminDash stats={stats} orders={orders} prods={prods} currency={currency}/>}
        {tab==="categories" && <AdminCats cats={cats} onChange={onCats} toast={toast}/>}
        {tab==="products"   && <AdminProds prods={prods} cats={cats} onChange={onProds} toast={toast}/>}
        {tab==="orders"     && <AdminOrders orders={orders} onChange={onOrders} toast={toast}/>}
        {tab==="customers"  && <AdminCustomers users={users} orders={orders}/>}
        {tab==="settings"   && <AdminSettings currency={currency} currencies={currencies} onCurrencyChange={onCurrencyChange} storeSettings={storeSettings} onSettingsChange={onSettingsChange} toast={toast}/>}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #e8f5e9",display:"flex",zIndex:99,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",padding:"8px 2px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:tab===t.id?"#16a34a":"#9ca3af"}}>
            <TabIcon id={t.id}/><span style={{fontSize:8,fontWeight:tab===t.id?700:500,whiteSpace:"nowrap"}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({icon,label,value,color="#16a34a"}) {
  return (
    <div style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:"1px solid #e8f5e9",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:36,height:36,background:color+"18",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color,flexShrink:0}}>{icon}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{label}</div>
        <div style={{fontSize:17,fontWeight:800,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
      </div>
    </div>
  );
}

function AdminDash({stats,orders,prods,currency}) {
  const recent=orders.slice().reverse().slice(0,5);
  const lowStock=prods.filter(p=>p.stock<=5);
  const fmtRevenue=()=>{
    const v=stats.revenue*currency.rate;
    return currency.symbol+(currency.code==="PKR"||currency.code==="INR"?Math.round(v).toLocaleString():v.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0}));
  };
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <StatCard icon={<I.Dollar s={16}/>} label="Revenue" value={fmtRevenue()}/>
        <StatCard icon={<I.ShoppingBag s={16}/>} label="Orders" value={stats.orders} color="#7c3aed"/>
        <StatCard icon={<I.Package s={16}/>} label="Products" value={stats.prods} color="#0891b2"/>
        <StatCard icon={<I.Users s={16}/>} label="Customers" value={stats.customers} color="#d97706"/>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #e8f5e9",marginBottom:10}}>
        <h3 style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:10}}>Recent Orders</h3>
        {recent.length===0?<div style={{textAlign:"center",color:"#94a3b8",padding:16,fontSize:12}}>No orders yet</div>:
          recent.map(o=>(
            <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f8f8f8"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{o.customerName}</div>
                <div style={{fontSize:9,color:"#94a3b8"}}>{new Date(o.placedAt).toLocaleDateString()}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontWeight:800,color:"#16a34a"}}><Price usd={o.total}/></span>
                <StatusBadge status={o.status}/>
              </div>
            </div>
          ))}
      </div>
      {lowStock.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #fef3c7"}}>
          <h3 style={{fontSize:13,fontWeight:700,color:"#d97706",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><I.Warning s={13}/>Low Stock</h3>
          {lowStock.map(p=>(
            <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8f8f8"}}>
              <span style={{fontSize:12,color:"#1a1a1a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{p.name}</span>
              <span style={{fontSize:11,fontWeight:700,color:p.stock===0?"#dc2626":"#f59e0b",flexShrink:0}}>{p.stock===0?"Out of stock":`${p.stock} left`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN SETTINGS ───────────────────────────────────────────────────────────
function AdminSettings({currency,currencies,onCurrencyChange,storeSettings,onSettingsChange,toast}) {
  const s = storeSettings || DEF_SETTINGS;
  const [local,setLocal] = useState({
    codCharge:      String(s.codCharge ?? 0),
    deliveryCharge: String(s.deliveryCharge ?? 5),
    ep_number:      s.easypaisa?.number  || "",
    ep_holder:      s.easypaisa?.holder  || "",
    jc_number:      s.jazzcash?.number   || "",
    jc_holder:      s.jazzcash?.holder   || "",
  });
  const setF = k => e => setLocal(l=>({...l,[k]:e.target.value}));

  const saveCharges = () => {
    const updated = {
      ...s,
      codCharge:      parseFloat(local.codCharge)||0,
      deliveryCharge: parseFloat(local.deliveryCharge)||0,
      easypaisa: { number: local.ep_number, holder: local.ep_holder },
      jazzcash:  { number: local.jc_number, holder: local.jc_holder },
    };
    onSettingsChange(updated);
  };

  const SectionHeader = ({icon,title,sub}) => (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <div style={{width:34,height:34,background:"#f0fdf4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#16a34a"}}>{icon}</div>
      <div><div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{title}</div><div style={{fontSize:11,color:"#94a3b8"}}>{sub}</div></div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      {/* ── Charges ── */}
      <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e8f5e9"}}>
        <SectionHeader icon={<I.Truck s={16}/>} title="Delivery & COD Charges" sub="Set fees customers pay at checkout"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>COD Charge (USD)</label>
            <input value={local.codCharge} onChange={setF("codCharge")} type="number" min="0" step="0.5"
              style={{width:"100%",padding:"10px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none",background:"#fafafa",boxSizing:"border-box",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>Fee for cash on delivery</div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Delivery Charge (USD)</label>
            <input value={local.deliveryCharge} onChange={setF("deliveryCharge")} type="number" min="0" step="0.5"
              style={{width:"100%",padding:"10px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none",background:"#fafafa",boxSizing:"border-box",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>Flat shipping fee</div>
          </div>
        </div>
        <div style={{background:"#f0fdf4",borderRadius:9,padding:"9px 12px",marginBottom:12,fontSize:12,color:"#15803d",fontWeight:500}}>
          Preview: Subtotal + <strong><Price usd={parseFloat(local.deliveryCharge)||0}/></strong> delivery
          {parseFloat(local.codCharge)>0 && <> + <strong><Price usd={parseFloat(local.codCharge)||0}/></strong> COD fee (for COD orders)</>}
        </div>
      </div>

      {/* ── EasyPaisa ── */}
      <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e8f5e9"}}>
        <SectionHeader
          icon={<I.EP s={22} color="#16a34a"/>}
          title="EasyPaisa Account"
          sub="Shown to customers who choose EasyPaisa"
        />
        <div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Account Number</label>
          <input value={local.ep_number} onChange={setF("ep_number")} placeholder="0300-0000000"
            style={{width:"100%",padding:"10px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none",background:"#fafafa",boxSizing:"border-box",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Account Holder Name</label>
          <input value={local.ep_holder} onChange={setF("ep_holder")} placeholder="Your Name"
            style={{width:"100%",padding:"10px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none",background:"#fafafa",boxSizing:"border-box",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
      </div>

      {/* ── JazzCash ── */}
      <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e8f5e9"}}>
        <SectionHeader
          icon={<I.JC s={22} color="#dc2626"/>}
          title="JazzCash Account"
          sub="Shown to customers who choose JazzCash"
        />
        <div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Account Number</label>
          <input value={local.jc_number} onChange={setF("jc_number")} placeholder="0301-0000000"
            style={{width:"100%",padding:"10px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none",background:"#fafafa",boxSizing:"border-box",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Account Holder Name</label>
          <input value={local.jc_holder} onChange={setF("jc_holder")} placeholder="Your Name"
            style={{width:"100%",padding:"10px 12px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:13,outline:"none",background:"#fafafa",boxSizing:"border-box",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#16a34a"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
      </div>

      {/* ── Save button ── */}
      <button onClick={saveCharges} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        <I.Check s={16}/> Save All Settings
      </button>

      {/* ── Currency ── */}
      <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e8f5e9"}}>
        <SectionHeader icon={<I.Dollar s={16}/>} title="Store Currency" sub="Changes prices across the entire store"/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {currencies.map(c=>(
            <button key={c.code} onClick={()=>onCurrencyChange(c.code)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",border:`2px solid ${currency.code===c.code?"#16a34a":"#e5e7eb"}`,borderRadius:10,cursor:"pointer",background:currency.code===c.code?"#f0fdf4":"#fff",width:"100%",textAlign:"left"}}>
              <div style={{width:34,height:34,background:currency.code===c.code?"#16a34a":"#f1f5f9",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:currency.code===c.code?"#fff":"#555",fontWeight:700}}>{c.symbol}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:currency.code===c.code?"#16a34a":"#1a1a1a"}}>{c.name}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{c.code} · 1 USD = {c.rate} {c.code}</div>
              </div>
              {currency.code===c.code&&<div style={{color:"#16a34a",flexShrink:0}}><I.Check s={16}/></div>}
            </button>
          ))}
        </div>
      </div>

      <div style={{background:"#f0fdf4",borderRadius:10,padding:12,border:"1px solid #dcfce7"}}>
        <div style={{fontSize:11,color:"#15803d",fontWeight:600,marginBottom:3,display:"flex",alignItems:"center",gap:4}}><I.Info s={12}/>Supabase Note</div>
        <div style={{fontSize:11,color:"#555",lineHeight:1.55}}>Settings are stored in localStorage. Swap <code style={{background:"#e0f2fe",padding:"1px 4px",borderRadius:4,fontSize:10}}>db.getSettings/setSettings</code> with a Supabase <code style={{background:"#e0f2fe",padding:"1px 4px",borderRadius:4,fontSize:10}}>settings</code> table when you migrate.</div>
      </div>
    </div>
  );
}

// ─── ADMIN CATEGORIES ─────────────────────────────────────────────────────────
function AdminCats({cats,onChange,toast}) {
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",description:"",image:null});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const save=()=>{
    if(!form.name){toast("Name required","error");return;}
    if(editing)onChange(cats.map(c=>c.id===editing?{...c,...form}:c));
    else onChange([...cats,{...form,id:"cat_"+Date.now()}]);
    setShowForm(false);setEditing(null);toast(editing?"Updated!":"Added!");
  };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,alignItems:"center"}}>
        <span style={{fontSize:12,color:"#888"}}>{cats.length} categories</span>
        <button onClick={()=>{setForm({name:"",description:"",image:null});setEditing(null);setShowForm(true);}} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
          <I.Plus s={13}/> Add
        </button>
      </div>
      {showForm&&(
        <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:12,border:"1.5px solid #bbf7d0",animation:"slideDown 0.2s ease"}}>
          <h3 style={{fontSize:13,fontWeight:700,marginBottom:12,color:"#1a1a1a"}}>{editing?"Edit":"New"} Category</h3>
          <Field label="Name *" value={form.name} onChange={set("name")} placeholder="e.g. Laptops & Computers" small/>
          <Field label="Description" value={form.description} onChange={set("description")} placeholder="Short description" small/>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Category Image</label>
            <ImgUpload value={form.image} onChange={img=>setForm(f=>({...f,image:img}))} label="Upload Image" compact/>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={save} style={{flex:1,background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"10px",cursor:"pointer",fontSize:12,fontWeight:700}}>Save</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"10px 12px",cursor:"pointer",fontSize:12,color:"#555"}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {cats.map(cat=>(
          <div key={cat.id} style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #e8f5e9",display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:40,height:40,background:"#f0fdf4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
              {cat.image?<img src={cat.image} alt={cat.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{color:"#16a34a"}}><CatIcon name={cat.name} s={22}/></div>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.name}</div>
              <div style={{fontSize:11,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.description}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>{setForm({...cat});setEditing(cat.id);setShowForm(true);}} style={{background:"#f0fdf4",border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11,color:"#16a34a",fontWeight:600}}>Edit</button>
              <button onClick={()=>{if(window.confirm("Delete?"))onChange(cats.filter(c=>c.id!==cat.id));toast("Deleted.");}} style={{background:"#fee2e2",border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11,color:"#dc2626",fontWeight:600}}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN PRODUCTS ───────────────────────────────────────────────────────────
function AdminProds({prods,cats,onChange,toast}) {
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",categoryId:"",price:"",stock:"",description:"",image:null,featured:false});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const save=()=>{
    if(!form.name||!form.price||!form.categoryId){toast("Name, category & price required.","error");return;}
    const data={...form,price:Number(form.price),stock:Number(form.stock)||0};
    if(editing)onChange(prods.map(p=>p.id===editing?{...p,...data}:p));
    else onChange([...prods,{...data,id:"p_"+Date.now(),rating:0,reviews:[]}]);
    setShowForm(false);setEditing(null);toast(editing?"Updated!":"Added!");
  };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,alignItems:"center"}}>
        <span style={{fontSize:12,color:"#888"}}>{prods.length} products</span>
        <button onClick={()=>{setForm({name:"",categoryId:"",price:"",stock:"",description:"",image:null,featured:false});setEditing(null);setShowForm(true);}} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
          <I.Plus s={13}/> Add Product
        </button>
      </div>
      {showForm&&(
        <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:12,border:"1.5px solid #bbf7d0",animation:"slideDown 0.2s ease"}}>
          <h3 style={{fontSize:13,fontWeight:700,marginBottom:12,color:"#1a1a1a"}}>{editing?"Edit":"New"} Product</h3>
          <Field label="Product Name *" value={form.name} onChange={set("name")} placeholder="e.g. ProBook Elite" small/>
          <div style={{marginBottom:8}}>
            <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Category *</label>
            <select value={form.categoryId} onChange={set("categoryId")} style={{width:"100%",padding:"9px 11px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:12,outline:"none",background:"#fff",WebkitAppearance:"none",boxSizing:"border-box"}}>
              <option value="">Select...</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Field label="Price (USD) *" value={form.price} onChange={set("price")} placeholder="999" type="number" small/>
            <Field label="Stock Qty" value={form.stock} onChange={set("stock")} placeholder="0" type="number" small/>
          </div>
          {form.stock!==""&&Number(form.stock)>=0&&(
            <div style={{marginBottom:8,padding:"7px 10px",background:Number(form.stock)===0?"#fee2e2":Number(form.stock)<=5?"#fef3c7":"#f0fdf4",borderRadius:7,fontSize:11,fontWeight:600,color:Number(form.stock)===0?"#dc2626":Number(form.stock)<=5?"#d97706":"#16a34a"}}>
              {Number(form.stock)===0?"Out of stock":Number(form.stock)<=5?`Low stock: ${form.stock} units`:`In stock: ${form.stock} units`}
            </div>
          )}
          <div style={{marginBottom:8}}>
            <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:3}}>Description</label>
            <textarea value={form.description} onChange={set("description")} placeholder="Product details..." rows={2}
              style={{width:"100%",padding:"9px 11px",border:"1.5px solid #e5e7eb",borderRadius:9,fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:"#555",display:"block",marginBottom:4}}>Product Image</label>
            <ImgUpload value={form.image} onChange={img=>setForm(f=>({...f,image:img}))} label="Upload Image" compact/>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,fontWeight:600,color:"#374151",marginBottom:12}}>
            <input type="checkbox" checked={form.featured} onChange={e=>setForm(f=>({...f,featured:e.target.checked}))} style={{accentColor:"#16a34a",width:14,height:14}}/>
            Mark as Featured
          </label>
          <div style={{display:"flex",gap:7}}>
            <button onClick={save} style={{flex:1,background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"10px",cursor:"pointer",fontSize:12,fontWeight:700}}>Save</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"10px 12px",cursor:"pointer",fontSize:12,color:"#555"}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {prods.map(p=>{
          const cat=cats.find(c=>c.id===p.categoryId);
          return (
            <div key={p.id} style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #e8f5e9",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:40,height:40,background:"#f0fdf4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{color:"#16a34a"}}><CatIcon name={cat?.name||""} s={22}/></div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{fontSize:12,color:"#16a34a",fontWeight:700}}><Price usd={p.price}/></div>
                <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:700,color:p.stock===0?"#dc2626":p.stock<=5?"#d97706":"#555"}}>Qty: {p.stock}</span>
                  {p.featured&&<span style={{fontSize:8,background:"#dcfce7",color:"#15803d",padding:"1px 5px",borderRadius:20,fontWeight:700}}>FEATURED</span>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                <button onClick={()=>{setForm({...p,price:String(p.price),stock:String(p.stock)});setEditing(p.id);setShowForm(true);}} style={{background:"#f0fdf4",border:"none",borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:11,color:"#16a34a",fontWeight:600}}>Edit</button>
                <button onClick={()=>{if(window.confirm("Delete?"))onChange(prods.filter(x=>x.id!==p.id));toast("Deleted.");}} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:11,color:"#dc2626",fontWeight:600}}>Del</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN ORDERS ─────────────────────────────────────────────────────────────
function AdminOrders({orders,onChange,toast}) {
  const [sel,setSel]=useState(null);
  const sorted=orders.slice().reverse();
  const upd=(id,status)=>{
    onChange(orders.map(o=>o.id===id?{...o,status}:o));
    setSel(s=>s?.id===id?{...s,status}:s);
    toast(`Order ${status.toLowerCase()}.`);
  };
  return (
    <div>
      {sel&&(
        <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:12,border:"1.5px solid #16a34a",animation:"slideDown 0.2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Order Details</h3>
            <button onClick={()=>setSel(null)} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X s={13}/></button>
          </div>
          <div style={{background:"#f0fdf4",borderRadius:9,padding:10,marginBottom:10,fontSize:12}}>
            <div style={{fontWeight:700,color:"#1a1a1a"}}>{sel.customerName}</div>
            <div style={{color:"#555",marginTop:2}}>{sel.customerPhone} · {sel.customerEmail}</div>
            <div style={{color:"#555"}}>{sel.deliveryAddress}</div>
          </div>
          {sel.items?.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8f8f8",fontSize:12}}>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{item.productName} ×{item.qty}</span>
              <span style={{fontWeight:700,color:"#16a34a",flexShrink:0}}><Price usd={item.price*item.qty}/></span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:700,fontSize:13}}>
            <span>Total</span><span style={{color:"#16a34a"}}><Price usd={sel.total}/></span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:4}}>
            {["Processing","Shipped","Delivered","Cancelled"].map(s=>(
              <button key={s} onClick={()=>upd(sel.id,s)} style={{padding:"8px",borderRadius:8,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",background:sel.status===s?(s==="Cancelled"?"#fee2e2":"#f0fdf4"):"#fff",borderColor:sel.status===s?(s==="Cancelled"?"#dc2626":"#16a34a"):"#e5e7eb",color:sel.status===s?(s==="Cancelled"?"#dc2626":"#16a34a"):"#64748b"}}>
                {sel.status===s&&<I.Check s={10}/>}{" "}{s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sorted.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:12}}>No orders yet</div>:
          sorted.map(o=>(
            <div key={o.id} onClick={()=>setSel(o)} style={{background:"#fff",borderRadius:12,padding:12,border:`1.5px solid ${sel?.id===o.id?"#16a34a":"#e8f5e9"}`,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{o.customerName}</div>
                <StatusBadge status={o.status}/>
              </div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>{o.id}</div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:"#555"}}>{new Date(o.placedAt).toLocaleDateString()} · {o.paymentMethod}</span>
                <span style={{fontSize:13,fontWeight:800,color:"#16a34a"}}><Price usd={o.total}/></span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── ADMIN CUSTOMERS ──────────────────────────────────────────────────────────
function AdminCustomers({users,orders}) {
  return (
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:12}}>{users.length} customers</div>
      {users.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:12}}>No customers yet</div>:
        users.map(u=>{
          const myOrders=orders.filter(o=>o.userId===u.id);
          const spent=myOrders.reduce((a,o)=>a+(o.total||0),0);
          return (
            <div key={u.id} style={{background:"#fff",borderRadius:12,padding:12,marginBottom:8,border:"1px solid #e8f5e9",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:38,height:38,background:"#16a34a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,flexShrink:0}}>{u.name?.[0]?.toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                <div style={{fontSize:10,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                <div style={{fontSize:10,color:"#555"}}>{u.phone}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:800,color:"#16a34a"}}><Price usd={spent}/></div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{myOrders.length} orders</div>
                {u.lat&&<div style={{fontSize:9,color:"#16a34a",fontWeight:600,display:"flex",alignItems:"center",gap:3}}><I.MapPin s={9}/>GPS saved</div>}
              </div>
            </div>
          );
        })}
    </div>
  );
}
