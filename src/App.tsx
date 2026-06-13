import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Share2, 
  Download, 
  Trash2, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Phone, 
  FileText, 
  Truck, 
  Tag, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  X, 
  Upload, 
  Smartphone,
  Check,
  CreditCard,
  PlusCircle,
  DollarSign,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Transaction } from './types';

// Initial printing products list
const initialProducts: Product[] = [
  { id: 1,  nama: 'Print Hitam Putih A4',      harga: 500,   satuan: 'lembar' },
  { id: 2,  nama: 'Print Warna A4',             harga: 1500,  satuan: 'lembar' },
  { id: 3,  nama: 'Print Hitam Putih F4',       harga: 600,   satuan: 'lembar' },
  { id: 4,  nama: 'Print Warna F4',             harga: 2000,  satuan: 'lembar' },
  { id: 5,  nama: 'Fotokopi A4',               harga: 300,   satuan: 'lembar' },
  { id: 6,  nama: 'Fotokopi F4',               harga: 400,   satuan: 'lembar' },
  { id: 7,  nama: 'Fotokopi Bolak-Balik A4',   harga: 500,   satuan: 'lembar' },
  { id: 8,  nama: 'Penjilidan Biasa',          harga: 3000,  satuan: 'buah'   },
  { id: 9,  nama: 'Penjilidan Ring',            harga: 8000,  satuan: 'buah'   },
  { id: 10, nama: 'Laminating A4',             harga: 5000,  satuan: 'lembar' },
  { id: 11, nama: 'Laminating F4',             harga: 6000,  satuan: 'lembar' },
  { id: 12, nama: 'Banner 1x1m',               harga: 25000, satuan: 'buah'   },
  { id: 13, nama: 'Banner 1x2m',               harga: 45000, satuan: 'buah'   },
  { id: 14, nama: 'Stiker Vinyl A4',           harga: 15000, satuan: 'lembar' },
  { id: 15, nama: 'Undangan Pernikahan',       harga: 3500,  satuan: 'lembar' },
  { id: 16, nama: 'Kartu Nama 2 Sisi',         harga: 15000, satuan: '100 lbr' },
];

export default function App() {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('percetakan_produk');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Failed to parse cached products', e);
      }
    }
    return initialProducts;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [riwayat, setRiwayat] = useState<Transaction[]>(() => {
    const local = localStorage.getItem('percetakan_riwayat');
    return local ? JSON.parse(local) : [];
  });

  // Search and general filtering
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab/Screen layout for mobile ('produk' | 'keranjang')
  const [mobileTab, setMobileTab] = useState<'produk' | 'keranjang'>('produk');

  // Customer metadata
  const [custNama, setCustNama] = useState('');
  const [custHp, setCustHp] = useState('');
  const [custRef, setCustRef] = useState('');
  const [custKirim, setCustKirim] = useState('Ambil SPM Royal');
  const [kirimExtraInput, setKirimExtraInput] = useState<number>(0);

  // Financial status
  const [discValue, setDiscValue] = useState<number>(0);
  const [discPct, setDiscPct] = useState<number>(0);
  const [dpValue, setDpValue] = useState<number>(0);

  // Modals management
  const [activeModal, setActiveModal] = useState<'struk' | 'kelola' | 'custom' | null>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // Custom Jasa modal state inputs
  const [customNama, setCustomNama] = useState('');
  const [customHarga, setCustomHarga] = useState<number>(0);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customKet, setCustomKet] = useState('');

  // Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Toast System
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync products and history to localStorage
  useEffect(() => {
    localStorage.setItem('percetakan_produk', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('percetakan_riwayat', JSON.stringify(riwayat));
  }, [riwayat]);

  // Handle Real-time clock tick
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const totalOmzetHariIni = riwayat.reduce((acc, curr) => acc + curr.total, 0);

  // --- ACTIONS ---
  const triggerToast = (msg: string, isError = false) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message: msg, isError });
    toastTimeout.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id && !item.custom);
    if (existing) {
      setCart(cart.map(item => item.id === product.id && !item.custom ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        id: product.id,
        nama: product.nama,
        harga: product.harga,
        qty: 1,
        ket: '',
        custom: false
      }]);
    }
    triggerToast(`Harga ${product.nama} masuk ke keranjang`);
  };

  const handleAddCustomItem = () => {
    if (!customNama.trim()) {
      triggerToast('Nama item wajib diisi!', true);
      return;
    }
    if (customHarga <= 0) {
      triggerToast('Harga satuan harus lebih besar dari Rp 0!', true);
      return;
    }
    const tempId = Date.now();
    setCart([...cart, {
      id: tempId,
      nama: customNama.trim(),
      harga: customHarga,
      qty: customQty,
      ket: customKet.trim(),
      custom: true
    }]);
    triggerToast(`Item Custom "${customNama}" ditambahkan`);
    setActiveModal(null);
    clearCustomInputs();
  };

  const handleSaveCustomAsProduct = () => {
    if (!customNama.trim()) {
      triggerToast('Nama item wajib diisi!', true);
      return;
    }
    if (customHarga <= 0) {
      triggerToast('Harga satuan harus lebih dari Rp 0!', true);
      return;
    }
    const newId = Math.max(0, ...products.map(p => p.id)) + 1;
    const newProduct: Product = {
      id: newId,
      nama: customNama.trim(),
      harga: customHarga,
      satuan: 'unit'
    };
    setProducts([...products, newProduct]);
    triggerToast(`Produk "${customNama}" tersimpan permanen!`);
    
    // Add to cart as well
    setCart([...cart, {
      id: newId,
      nama: customNama.trim(),
      harga: customHarga,
      qty: customQty,
      ket: customKet.trim(),
      custom: false
    }]);
    setActiveModal(null);
    clearCustomInputs();
  };

  const clearCustomInputs = () => {
    setCustomNama('');
    setCustomHarga(0);
    setCustomQty(1);
    setCustomKet('');
  };

  const removeItemFromCart = (idx: number) => {
    const item = cart[idx];
    setCart(cart.filter((_, i) => i !== idx));
    triggerToast(`Item "${item.nama}" dihapus dari keranjang`);
  };

  const adjustQty = (idx: number, delta: number) => {
    const updated = [...cart];
    updated[idx].qty += delta;
    if (updated[idx].qty <= 0) {
      updated.splice(idx, 1);
    }
    setCart(updated);
  };

  const handleKirimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCustKirim(val);
    setKirimExtraInput(0); // Reset custom delivery parameter
  };

  // Safe Ongkir calculators
  const getOngkirValue = (): number => {
    if (custKirim === 'Kirim JNT') return kirimExtraInput;
    if (custKirim === 'Kirim Jemkot 2k Per Km') return kirimExtraInput * 2000;
    if (custKirim === 'Kirim Jemkot Random 10k') return 10000;
    return 0;
  };

  const getOngoingSubtotal = () => cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

  // Handle absolute percent change calculation
  const handleDiscPctChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value) || 0;
    setDiscPct(pct);
    const sub = getOngoingSubtotal();
    const diskonCalculated = Math.round((sub * pct) / 100);
    setDiscValue(diskonCalculated);
  };

  const handleDiscValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setDiscValue(val);
    const sub = getOngoingSubtotal();
    if (sub > 0) {
      setDiscPct(Math.round((val / sub) * 100));
    } else {
      setDiscPct(0);
    }
  };

  const resetAllCalculations = () => {
    setCart([]);
    setCustNama('');
    setCustHp('');
    setCustRef('');
    setCustKirim('Ambil SPM Royal');
    setKirimExtraInput(0);
    setDiscValue(0);
    setDiscPct(0);
    setDpValue(0);
  };

  const handleProcessTransaction = () => {
    if (!cart.length) return;
    const subtotal = getOngoingSubtotal();
    const ongkir = getOngkirValue();
    const total = Math.max(0, subtotal - discValue + ongkir);
    
    let clampedDp = dpValue;
    if (clampedDp > total) clampedDp = total;
    const sisa = Math.max(0, total - clampedDp);

    const kirimDetail = custKirim === 'Kirim Jemkot 2k Per Km' && kirimExtraInput > 0 ? `${kirimExtraInput} km` : '';

    const newTrx: Transaction = {
      id: 'TRX' + Date.now().toString(),
      waktu: currentTime.toLocaleString('id-ID'),
      custNama: custNama.trim() || 'Umum',
      custHp: custHp.trim(),
      custRef: custRef.trim(),
      custKirim,
      kirimDetail,
      ongkir,
      items: JSON.parse(JSON.stringify(cart)),
      subtotal,
      diskon: discValue,
      total,
      dp: clampedDp,
      sisa
    };

    setRiwayat([newTrx, ...riwayat]);
    setLastTransaction(newTrx);
    setActiveModal('struk');
    resetAllCalculations();
    triggerToast('🎉 Transaksi berhasil diproses!');
  };

  // Delete product helper from management panel
  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    triggerToast('Produk dihapus dari database lokal');
  };

  const handleResetAllProducts = () => {
    if (window.confirm('Hapus semua produk dari database? Tindakan ini tidak dapat dibatalkan.')) {
      setProducts([]);
      triggerToast('Semua produk berhasil dihapus', true);
    }
  };

  // --- COMPONENT CALCULATIONS ---
  const ongoingSubtotal = getOngoingSubtotal();
  const calculatedOngkir = getOngkirValue();
  const ongoingTotal = Math.max(0, ongoingSubtotal - discValue + calculatedOngkir);
  const clampedDpValue = dpValue > ongoingTotal ? ongoingTotal : dpValue;
  const ongoingSisa = Math.max(0, ongoingTotal - clampedDpValue);

  // Search filter matching
  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- TEMPLATE EXCEL CREATORS ---
  const handleDownloadTemplate = () => {
    const mock = [
      { 'Nama': 'Print Hitam Putih A4', 'Harga': 500, 'Satuan': 'lembar' },
      { 'Nama': 'Print Warna F4', 'Harga': 2000, 'Satuan': 'lembar' },
      { 'Nama': 'Stiker Cutting Vinyl', 'Harga': 15000, 'Satuan': 'A3' },
      { 'Nama': 'Jasa Desain Spanduk', 'Harga': 35000, 'Satuan': 'file' }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mock);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
    XLSX.writeFile(wb, 'Template-Excel-SPM.xlsx');
    triggerToast('Template Excel didownload!');
  };

  const handleDownloadKatalog = () => {
    if (!products.length) {
      triggerToast('Belum ada produk untuk diexport!', true);
      return;
    }
    const katalog = products.map((p, i) => ({
      'No.': i + 1,
      'Nama Produk': p.nama,
      'Harga Satuan (Rp)': p.harga,
      'Satuan': p.satuan || 'unit',
      'Harga Terformat': `Rp ${p.harga.toLocaleString('id-ID')}`
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(katalog);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 40 },
      { wch: 18 },
      { wch: 15 },
      { wch: 22 }
    ];

    const todayStr = currentTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const metaArray = [
      ['📊 SPM PRODUCTION - KATALOG SELLER'],
      ['Kawasan Perum Royal City Cluster Sydney C4'],
      ['Kontak WA: 081230973135'],
      [''],
      ['Tanggal Export:', todayStr],
      ['Total Inventaris:', products.length],
      ['Tipe File:', 'PWA Android Cashier Registry']
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metaArray);
    wsMeta['!cols'] = [{ wch: 22 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(wb, wsMeta, 'Informasi_Toko');
    XLSX.utils.book_append_sheet(wb, ws, 'Katalog_Inventaris');

    XLSX.writeFile(wb, `Katalog-Excel-SPM-${Date.now().toString().slice(-6)}.xlsx`);
    triggerToast(`Katalog (${products.length} item) didownload!`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];

        if (!rows.length) {
          triggerToast('File Excel kosong atau format salah!', true);
          return;
        }

        // Auto detect header keys
        const firstRowKeys = Object.keys(rows[0]);
        const findMatchedKey = (...candidates: string[]) => 
          firstRowKeys.find(k => candidates.some(c => k.toLowerCase().trim() === c.toLowerCase()));

        const keyNama = findMatchedKey('nama', 'nama produk', 'product', 'item', 'name');
        const keyHarga = findMatchedKey('harga', 'price', 'harga satuan', 'harga jual', 'harga_satuan');
        const keySatuan = findMatchedKey('satuan', 'unit', 'keterangan', 'satuan_jual');

        if (!keyNama || !keyHarga) {
          triggerToast('Kolom "Nama" dan "Harga" wajib ada di Excel!', true);
          return;
        }

        let addedCount = 0;
        let skippedCount = 0;
        const currentNames = new Set(products.map(p => p.nama.toLowerCase()));
        let initialId = Math.max(0, ...products.map(p => p.id)) + 1;

        const importedList: Product[] = [];

        rows.forEach(row => {
          const rawNama = String(row[keyNama] || '').trim();
          const cleanHarga = parseInt(String(row[keyHarga]).replace(/[^\d]/g, '')) || 0;
          const rawSatuan = keySatuan ? String(row[keySatuan] || '').trim() || 'unit' : 'unit';

          if (!rawNama || cleanHarga <= 0) {
            skippedCount++;
            return;
          }

          if (currentNames.has(rawNama.toLowerCase())) {
            skippedCount++;
            return;
          }

          importedList.push({
            id: initialId++,
            nama: rawNama,
            harga: cleanHarga,
            satuan: rawSatuan
          });
          currentNames.add(rawNama.toLowerCase());
          addedCount++;
        });

        if (importedList.length > 0) {
          setProducts([...products, ...importedList]);
          triggerToast(`Berhasil mengimport ${addedCount} produk!`);
        } else {
          triggerToast('Tidak ada produk baru yang diimport', true);
        }
      } catch (err: any) {
        console.error(err);
        triggerToast('Gagal memproses file Excel: ' + err.message, true);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input element
  };

  // --- WHATSAPP receipt format sender ---
  const handleShareWA = (t: Transaction) => {
    const dash = '─'.repeat(28);
    let msg = `🖨️ *SPM PRODUCTION*\n`;
    msg += `Perum Royal City Cluster Sydney C4\n`;
    msg += `WA Pemesanan: 081230973135\n`;
    msg += `${dash}\n`;
    msg += `📋 No. Trx : *${t.id.slice(-8)}*\n`;
    msg += `📅 Waktu : ${t.waktu}\n`;
    msg += `👤 Klien : *${t.custNama}*\n`;
    if (t.custRef) msg += `📦 No. Order/Ref : ${t.custRef}\n`;
    if (t.custKirim) msg += `🚚 Kirim via : ${t.custKirim}${t.kirimDetail ? ` (${t.kirimDetail})` : ''}\n`;
    msg += `${dash}\n`;
    
    t.items.forEach(item => {
      msg += `▪ ${item.nama}${item.ket ? ` [${item.ket}]` : ''}\n`;
      msg += `  ${item.qty} x Rp ${item.harga.toLocaleString('id-ID')} = *Rp ${(item.harga * item.qty).toLocaleString('id-ID')}*\n`;
    });
    
    msg += `${dash}\n`;
    msg += `Subtotal : Rp ${t.subtotal.toLocaleString('id-ID')}\n`;
    if (t.diskon) msg += `Diskon : -Rp ${t.diskon.toLocaleString('id-ID')}\n`;
    if (t.ongkir) msg += `Ongkir : +Rp ${t.ongkir.toLocaleString('id-ID')}\n`;
    msg += `*TOTAL TAGIHAN : Rp ${t.total.toLocaleString('id-ID')}*\n`;
    
    if (t.dp > 0) {
      msg += `💰 DP Dibayar : Rp ${t.dp.toLocaleString('id-ID')}\n`;
      msg += `🔴 *SISA BAYAR : Rp ${t.sisa.toLocaleString('id-ID')}*\n`;
    }
    
    msg += `${dash}\n`;
    msg += `_Dokumen ini adalah bukti transaksi sah dari SPM Production. Terima kasih atas kerja samanya!_ 🙏`;

    const encoded = encodeURIComponent(msg);
    const rawPhone = (t.custHp || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.replace(/^0/, '62');
    
    const waUrl = cleanPhone.length >= 9 
      ? `https://wa.me/${cleanPhone}?text=${encoded}` 
      : `https://wa.me/?text=${encoded}`;
    
    window.open(waUrl, '_blank');
  };

  // --- DRAW JPEG RECEIPT ---
  const handleDownloadJpg = (t: Transaction) => {
    try {
      const W = 420;
      const PAD = 24;
      const LINE_H = 22;
      const FONT_SZ = 14;

      const lines: Array<{
        text?: string;
        isCenter?: boolean;
        isBold?: boolean;
        isBig?: boolean;
        isDivider?: boolean;
        pair?: [string, string];
      }> = [];

      // Structure all info
      lines.push({ text: '🖨️ SPM PRODUCTION', isCenter: true, isBold: true, isBig: true });
      lines.push({ text: 'Perum Royal City Cluster Sydney C4', isCenter: true });
      lines.push({ text: 'WA Pemesanan: 081230973135', isCenter: true });
      lines.push({ isDivider: true });
      
      lines.push({ pair: ['No. Transaksi', t.id.slice(-8)] });
      lines.push({ pair: ['Tanggal', t.waktu] });
      lines.push({ pair: ['Klien', t.custNama] });
      if (t.custHp) lines.push({ pair: ['No. HP', t.custHp] });
      if (t.custRef) lines.push({ pair: ['No. Ref', t.custRef] });
      if (t.custKirim) lines.push({ pair: ['Pengiriman', `${t.custKirim}${t.kirimDetail ? ` (${t.kirimDetail})` : ''}`] });
      lines.push({ isDivider: true });

      t.items.forEach(item => {
        lines.push({ text: `${item.nama}${item.ket ? ` (${item.ket})` : ''}`, isBold: true });
        lines.push({ pair: [`   ${item.qty} x Rp ${item.harga.toLocaleString('id-ID')}`, `Rp ${(item.harga * item.qty).toLocaleString('id-ID')}`] });
      });

      lines.push({ isDivider: true });
      lines.push({ pair: ['Subtotal', `Rp ${t.subtotal.toLocaleString('id-ID')}`] });
      if (t.diskon) lines.push({ pair: ['Diskon', `- Rp ${t.diskon.toLocaleString('id-ID')}`] });
      if (t.ongkir) lines.push({ pair: ['Ongkir', `+ Rp ${t.ongkir.toLocaleString('id-ID')}`] });
      
      lines.push({ pair: ['TOTAL', `Rp ${t.total.toLocaleString('id-ID')}`], isBold: true, isBig: true });
      
      if (t.dp > 0) {
        lines.push({ pair: ['Uang Muka (DP)', `Rp ${t.dp.toLocaleString('id-ID')}`], isBold: true });
        lines.push({ pair: ['SISA TAGIHAN', `Rp ${t.sisa.toLocaleString('id-ID')}`], isBold: true, isBig: true });
      }

      lines.push({ isDivider: true });
      lines.push({ text: 'Terima kasih atas orderan Anda', isCenter: true });
      lines.push({ text: 'Layanan Cetak Cepat & Berkualitas', isCenter: true });

      // Calculate canvas height
      let totalHeight = PAD;
      lines.forEach(l => {
        if (l.isDivider) {
          totalHeight += 16;
        } else {
          totalHeight += l.isBig ? LINE_H + 6 : LINE_H;
        }
      });
      totalHeight += PAD;

      const canvas = document.createElement('canvas');
      const DPR = 2; // For crystal clear retina rendering
      canvas.width = W * DPR;
      canvas.height = totalHeight * DPR;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(DPR, DPR);

      // Draw backdrop
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, totalHeight);

      let currentY = PAD;
      lines.forEach(l => {
        if (l.isDivider) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(PAD, currentY + 8);
          ctx.lineTo(W - PAD, currentY + 8);
          ctx.stroke();
          ctx.setLineDash([]);
          currentY += 16;
          return;
        }

        const size = l.isBig ? FONT_SZ + 3 : FONT_SZ;
        ctx.font = `${l.isBold ? 'bold' : 'normal'} ${size}px "Courier New", Courier, monospace`;
        ctx.fillStyle = '#0f172a';

        if (l.pair) {
          ctx.textAlign = 'left';
          ctx.fillText(l.pair[0], PAD, currentY + size);
          ctx.textAlign = 'right';
          ctx.fillText(l.pair[1], W - PAD, currentY + size);
          currentY += l.isBig ? LINE_H + 6 : LINE_H;
        } else if (l.text) {
          ctx.textAlign = l.isCenter ? 'center' : 'left';
          const xPos = l.isCenter ? W / 2 : PAD;
          
          // Wrap text
          const words = l.text.split(' ');
          let currentLine = '';
          const maxTextWidth = W - (PAD * 2);

          words.forEach(word => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (ctx.measureText(testLine).width > maxTextWidth) {
              ctx.fillText(currentLine, xPos, currentY + size);
              currentY += LINE_H;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });

          if (currentLine) {
            ctx.fillText(currentLine, xPos, currentY + size);
            currentY += l.isBig ? LINE_H + 6 : LINE_H;
          }
        }
      });

      const elementUrl = canvas.toDataURL('image/jpeg', 0.98);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.download = `Struk_SPM_${t.id.slice(-6)}.jpg`;
      downloadAnchor.href = elementUrl;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      triggerToast('Struk terunduh sebagai JPG!');
    } catch (e: any) {
      console.error(e);
      triggerToast('Gagal memproses struk: ' + e.message, true);
    }
  };

  const currentMonthOmzetString = totalOmzetHariIni.toLocaleString('id-ID');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans flex flex-col overflow-x-hidden select-none pb-20 md:pb-0">
      
      {/* --- BENTO HEADER & STATS CONTAINER --- */}
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 pt-4 md:pt-6 flex-shrink-0">
        <header className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0d1017]/80 backdrop-blur-md rounded-3xl p-4 border border-white/5 shadow-xl">
          
          {/* Logo & Platform Name (Bento Card 1) */}
          <div className="md:col-span-4 flex items-center gap-4 bg-gradient-to-br from-[#121620] to-[#161c2b] p-3 rounded-2xl border border-white/[0.03]">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
              🖨️
            </div>
            <div>
              <h1 className="font-condensed font-black text-xl md:text-2xl tracking-wider text-white select-none">
                SPM PRODUCTION
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">
                  KASIR ONLINE ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Omzet Pembukuan Stat Widget (Bento Card 2 - Lime Yellow High Contrast Accent) */}
          <div className="md:col-span-3 bg-gradient-to-br from-[#e2f97c] to-[#c2db53] text-slate-950 p-4 rounded-3xl border border-white/10 flex flex-col justify-between shadow-md">
            <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider block">Omzet Pembukuan</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-condensed text-xl md:text-2xl font-black tracking-tight">
                Rp {currentMonthOmzetString}
              </span>
              <span className="text-[10px] bg-slate-950/10 text-slate-900 font-black px-1.5 py-0.5 rounded-md uppercase">
                Hari Ini
              </span>
            </div>
          </div>

          {/* Total Transaksi Stat Widget (Bento Card 3 - Deep Slate Accent) */}
          <div className="md:col-span-2 bg-[#121620] p-4 rounded-3xl border border-white/[0.04] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Transaksi</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-condensed text-xl md:text-2xl font-black text-indigo-400">
                {riwayat.length} <span className="text-xs text-slate-500">Trx</span>
              </span>
              <span className="text-[9px] text-[#22c55e] font-bold">Stable</span>
            </div>
          </div>

          {/* Live Date Time Widget (Bento Card 4 - Monospace Elegance) */}
          <div className="md:col-span-2 bg-[#121620] p-4 rounded-3xl border border-white/[0.04] flex flex-col justify-between hidden md:flex">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Waktu Sistem</span>
            <div className="mt-1 leading-tight">
              <div className="text-[11px] text-slate-300 font-semibold">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' })}
              </div>
              <div className="text-lg font-black font-mono tracking-wide text-white">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Control Settings (Bento Card 5) */}
          <div className="md:col-span-1 flex items-center justify-center p-1">
            <button 
              id="btn-settings-trigger"
              onClick={() => setActiveModal('kelola')}
              className="w-full h-full py-3 md:py-0 border border-[#1e2433] hover:border-slate-500 bg-[#121620] hover:bg-[#1a2030] text-slate-200 rounded-2xl transition-all flex md:flex-col items-center justify-center gap-2 cursor-pointer text-xs font-bold active:scale-95 shadow-sm"
            >
              <Settings className="w-5 h-5 text-indigo-400 animate-spin-hover" />
              <span className="md:text-[10px] uppercase font-black tracking-widest text-slate-300">katalog</span>
            </button>
          </div>

        </header>
      </div>

      {/* --- MAIN INTERACTIVE BENTO WORKSPACE --- */}
      <main className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden h-auto lg:h-[calc(100vh-140px)]">
        
        {/* --- LEFT HAND SIDE: PRODUCTS CATALOG BENTO --- */}
        <section className={`lg:col-span-7 xl:col-span-8 flex flex-col bg-[#0d1017]/80 rounded-3xl border border-white/5 overflow-hidden shadow-xl ${mobileTab === 'produk' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Action Row Bento Bar */}
          <div className="p-4 bg-[#111520]/90 border-b border-white/[0.03] flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                id="search-produks-input"
                type="text"
                placeholder="Cari layanan / produk cetak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl focus:border-indigo-400 focus:outline-none text-sm text-slate-100 placeholder-slate-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button 
              id="btn-custom-add-shortcut"
              onClick={() => setActiveModal('custom')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/40 transition-all hover:-translate-y-0.5 active:translate-y-0 select-none"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cetak Custom</span>
            </button>
          </div>

          {/* Product Items Bento-style Grid container */}
          <div className="flex-1 overflow-y-auto p-4 content-start">
            <AnimatePresence mode="popLayout">
              {filteredProducts.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center p-12 text-slate-450 gap-3 border border-dashed border-white/10 rounded-3xl bg-slate-900/20"
                >
                  <AlertCircle className="w-10 h-10 text-slate-600" />
                  <p className="text-sm font-semibold">Layanan tidak ditemukan</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveModal('custom'); }} 
                    className="mt-1 text-xs font-bold text-[#e1f87a] hover:underline cursor-pointer"
                  >
                    Buat Custom Layanan Baru &rarr;
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((p) => {
                    const quantityInCart = cart.find(c => c.id === p.id && !c.custom)?.qty || 0;
                    return (
                      <motion.div
                        id={`product-card-${p.id}`}
                        layoutId={`prod-${p.id}`}
                        key={p.id}
                        onClick={() => handleAddToCart(p)}
                        className={`group relative overflow-hidden bg-[#121622]/90 border rounded-2xl p-4 cursor-pointer hover:border-slate-500 active:scale-95 transition-all text-left flex flex-col justify-between min-h-[132px] ${
                          quantityInCart > 0 
                            ? 'border-indigo-500 bg-[#161c2d]/90 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500/30' 
                            : 'border-white/[0.04] shadow-sm shadow-black/10'
                        }`}
                      >
                        <div className="absolute right-3.5 top-3.5">
                          {quantityInCart > 0 && (
                            <span className="h-6 min-w-6 px-1.5 rounded-lg bg-indigo-600 text-[11px] font-black text-white flex items-center justify-center animate-bounce">
                              {quantityInCart}
                            </span>
                          )}
                        </div>

                        {/* Bento visual tag element */}
                        <div className={`h-1.5 w-6 rounded-full mb-3.5 transition-colors ${quantityInCart > 0 ? 'bg-indigo-500' : 'bg-slate-700/80 group-hover:bg-indigo-400'}`}></div>

                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                            {p.nama}
                          </h3>
                          <span className="text-[9px] text-slate-450 block mt-1 uppercase tracking-wider font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">
                            Spm / {p.satuan || 'unit'}
                          </span>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-white/[0.04] flex items-end justify-between">
                          <span className="font-condensed font-black text-sm sm:text-base text-slate-100">
                            Rp {p.harga.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Tambah +
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* --- RIGHT HAND SIDE: CASHIER BASKET BENTO --- */}
        <section className={`lg:col-span-5 xl:col-span-4 bg-[#0d1017]/80 rounded-3xl border border-white/5 flex flex-col overflow-hidden shadow-xl ${mobileTab === 'keranjang' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Cart Header Panel */}
          <div className="p-4 bg-[#111520]/90 border-b border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h2 className="font-condensed font-black text-base text-white tracking-wide uppercase">DETAIL INVOICE</h2>
              <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] font-black text-slate-300">
                {cart.length} LINE
              </span>
            </div>

            {/* Print trigger in header */}
            <button
              id="cashier-pay-trigger"
              disabled={cart.length === 0}
              onClick={handleProcessTransaction}
              className="px-4 py-1.5 bg-[#e2f97c] hover:bg-[#d0e666] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-condensed font-black text-xs tracking-wider rounded-xl uppercase transition-all active:scale-95 shadow-md shadow-slate-950/20 max-h-10 cursor-pointer disabled:cursor-not-allowed"
            >
              Bayar & Cetak
            </button>
          </div>

          {/* Customer input fields structured in a Bento panel */}
          <div className="p-4 bg-slate-950/20 border-b border-white/[0.03] grid grid-cols-1 gap-3.5 flex-shrink-0">
            <div>
              <label className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Pelanggan</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  id="client-name-input"
                  type="text"
                  placeholder="Nama klien (Format: Umum / Instansi)"
                  value={custNama}
                  onChange={(e) => setCustNama(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 bg-slate-900/60 border border-white/5 focus:border-indigo-500 rounded-xl focus:outline-none text-xs text-slate-100 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Nomor WA</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    id="client-phone-input"
                    type="tel"
                    placeholder="08xxxxxxxx"
                    value={custHp}
                    onChange={(e) => setCustHp(e.target.value)}
                    className="w-full pl-9.5 pr-4 py-2 bg-slate-900/60 border border-white/5 focus:border-indigo-500 rounded-xl focus:outline-none text-xs text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 block">No Referensi / PO</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    id="client-ref-input"
                    type="text"
                    placeholder="PO-XXXX"
                    value={custRef}
                    onChange={(e) => setCustRef(e.target.value)}
                    className="w-full pl-9.5 pr-4 py-2 bg-slate-900/60 border border-white/5 focus:border-indigo-500 rounded-xl focus:outline-none text-xs text-slate-100 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Methods Bento Line */}
            <div>
              <label className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Metode Pengiriman</label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    id="delivery-options-select"
                    value={custKirim}
                    onChange={handleKirimChange}
                    className="w-full pl-9.5 pr-8 py-2 bg-slate-900/60 border border-white/5 focus:border-indigo-500 rounded-xl focus:outline-none text-xs text-slate-100 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Ambil SPM Royal">🏬 Ambil SPM Royal</option>
                    <option value="Ambil SPM Kampus">🏫 Ambil SPM Kampus</option>
                    <option value="Kirim JNT">📦 Kirim JNT</option>
                    <option value="Kirim Jemkot 2k Per Km">🛵 Kirim Jemkot 2k Per Km</option>
                    <option value="Kirim Jemkot Random 10k">🛵 Kirim Jemkot Random 10k (Sby/Gresik)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Conditional shipping inputs */}
                {custKirim === 'Kirim JNT' && (
                  <input
                    id="shipping-jnt-input"
                    type="number"
                    min="0"
                    placeholder="Ongkir (Rp)"
                    value={kirimExtraInput || ''}
                    onChange={(e) => setKirimExtraInput(parseInt(e.target.value) || 0)}
                    className="w-24 px-2.5 py-2 bg-slate-900/60 border border-white/5 focus:border-indigo-500 rounded-xl focus:outline-none text-xs text-slate-100"
                  />
                )}

                {custKirim === 'Kirim Jemkot 2k Per Km' && (
                  <input
                    id="shipping-distance-input"
                    type="number"
                    min="0"
                    placeholder="Jarak (Km)"
                    value={kirimExtraInput || ''}
                    onChange={(e) => setKirimExtraInput(parseInt(e.target.value) || 0)}
                    className="w-24 px-2.5 py-2 bg-slate-900/60 border border-white/5 focus:border-indigo-500 rounded-xl focus:outline-none text-xs text-slate-100"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Cart items listing */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-8">
                  <ShoppingCart className="w-8 h-8 text-slate-700 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-400">Keranjang cetak kosong</p>
                  <p className="text-[10px] text-slate-500">Pilih item dari daftar layanan sebelah kiri</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#121622]/90 border border-white/[0.04] rounded-2xl p-3.5 relative flex flex-col justify-between shadow-sm"
                  >
                    {/* Delete trigger button */}
                    <button 
                      onClick={() => removeItemFromCart(index)}
                      className="absolute right-3.5 top-3.5 text-slate-450 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-100 pr-8 leading-tight line-clamp-1">
                        {item.nama}
                      </h4>
                      {item.custom && (
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-black uppercase mt-1 inline-block">
                          Custom
                        </span>
                      )}
                      
                      {/* Sub notes editor */}
                      <input 
                        type="text"
                        placeholder="Catatan cetak: ukuran / berat bahan / sisi..."
                        value={item.ket}
                        onChange={(e) => {
                          const updated = [...cart];
                          updated[index].ket = e.target.value;
                          setCart(updated);
                        }}
                        className="w-full bg-slate-950/80 border border-white/5 px-2.5 py-1 rounded-lg text-[11px] text-slate-300 placeholder-slate-650 mt-2 focus:outline-none focus:border-slate-500 transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-white/[0.04]">
                      {/* Quantity control */}
                      <div className="flex items-center gap-1 bg-slate-950/40 p-0.5 rounded-lg border border-white/[0.03]">
                        <button 
                          onClick={() => adjustQty(index, -1)}
                          className="w-7 h-7 hover:bg-white/5 text-slate-200 rounded-md flex items-center justify-center cursor-pointer active:scale-95 select-none transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black font-mono">
                          {item.qty}
                        </span>
                        <button 
                          onClick={() => adjustQty(index, 1)}
                          className="w-7 h-7 hover:bg-white/5 text-slate-200 rounded-md flex items-center justify-center cursor-pointer active:scale-95 select-none transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-200 bg-slate-950/35 px-2.5 py-1 rounded-lg border border-white/[0.02]">
                        Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Discounts, Down payments and variables in dedicated Bento subcomponent */}
          <div className="px-4 py-3 bg-[#111520]/90 border-t border-b border-white/[0.03] flex-shrink-0 grid grid-cols-1 gap-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5 font-mono">
                <Tag className="w-3.5 h-3.5 text-[#e2f97c]" />
                DISCOUNT BAR
              </span>
              
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-950 border border-white/5 rounded-xl px-2.5 max-w-[120px]">
                  <input 
                    type="number"
                    min="0"
                    value={discValue || ''}
                    placeholder="0"
                    onChange={handleDiscValChange}
                    className="w-full text-right bg-transparent text-xs font-bold text-slate-200 border-none outline-none py-1.5 placeholder-slate-600"
                  />
                  <span className="text-[10px] text-slate-500 font-bold ml-1 font-mono">Rp</span>
                </div>

                <span className="text-slate-600 text-xs">/</span>

                <div className="flex items-center bg-slate-950 border border-white/5 rounded-xl px-2.5 max-w-[70px]">
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={discPct || ''}
                    placeholder="0"
                    onChange={handleDiscPctChange}
                    className="w-full text-right bg-transparent text-xs font-bold text-slate-200 border-none outline-none py-1.5 placeholder-slate-600"
                  />
                  <span className="text-[10px] text-slate-500 font-bold ml-1 font-mono">%</span>
                </div>
              </div>
            </div>

            {/* Down Payment (DP) Input */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5 font-mono">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                UANG MUKA (DP)
              </span>

              <div className="flex items-center bg-slate-950 border border-white/5 rounded-xl px-2.5 max-w-[150px]">
                <input 
                  type="number"
                  min="0"
                  value={dpValue || ''}
                  placeholder="0 (Lunas)"
                  onChange={(e) => setDpValue(parseInt(e.target.value) || 0)}
                  className="w-full text-right bg-transparent text-xs font-bold text-slate-200 border-none outline-none py-1.5 placeholder-slate-650"
                />
                <span className="text-[10px] text-slate-500 font-bold ml-1.5 font-mono">Rp</span>
              </div>
            </div>
          </div>

          {/* Invoice Summary and checkouts styled as a bold Bento segment */}
          <div className="p-4 bg-[#111520]/90 space-y-3.5 flex-shrink-0">
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between items-center">
                <span>Subtotal Item</span>
                <span className="font-bold text-slate-200">Rp {ongoingSubtotal.toLocaleString('id-ID')}</span>
              </div>

              {discValue > 0 && (
                <div className="flex justify-between items-center">
                  <span>Diskon Ditambahkan</span>
                  <span className="text-red-400 font-bold">- Rp {discValue.toLocaleString('id-ID')}</span>
                </div>
              )}

              {calculatedOngkir > 0 && (
                <div className="flex justify-between items-center">
                  <span>Ongkos Kirim ({custKirim})</span>
                  <span className="text-indigo-400 font-bold">+ Rp {calculatedOngkir.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-white/[0.04] pt-3">
              <span className="font-black text-xs uppercase text-slate-300 tracking-widest font-mono">TOTAL BILLING</span>
              <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400">
                Rp {ongoingTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {dpValue > 0 && (
              <div className="space-y-1.5 pt-2.5 border-t border-dotted border-white/5">
                <div className="flex justify-between items-center text-xs text-slate-400 font-semibold font-mono">
                  <span>Uang Muka Terbayar</span>
                  <span className="text-[#e2f97c] font-black">Rp {clampedDpValue.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-200 font-mono">
                  <span className="font-black text-red-400 uppercase tracking-widest">SISA TAGIHAN</span>
                  <span className="text-base text-red-400 font-black">
                    Rp {ongoingSisa.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Main Checkout Pay Button */}
            <div className="pt-1 select-none">
              <button
                id="btn-bill-checkout"
                disabled={cart.length === 0}
                onClick={handleProcessTransaction}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-condensed font-black text-base tracking-wider rounded-2xl uppercase transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-indigo-950/20"
              >
                PROSES BAYAR & CETAK RECEIPT
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- FLOATING ACTION BUTTON FOR MOBILE (ADD CUSTOM ITEM) --- */}
      <button 
        onClick={() => { clearCustomInputs(); setActiveModal('custom'); }}
        className="fixed bottom-20 right-5 lg:hidden w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-950/50 cursor-pointer active:scale-90 transition-transform z-30"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* --- BOTTOM MOBILE NAVIGATION BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#11141d] border-t border-slate-800/80 z-40 lg:hidden py-1">
        <div className="grid grid-cols-2 h-12">
          <button 
            onClick={() => mobilePage('produk')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${mobileTab === 'produk' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
          >
            <div className="text-lg">🛍️</div>
            <span className="text-[10px] tracking-wide uppercase">Daftar Produk</span>
          </button>
          
          <button 
            onClick={() => mobilePage('keranjang')}
            className={`flex flex-col items-center justify-center gap-1 relative cursor-pointer transition-colors ${mobileTab === 'keranjang' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
          >
            <div className="text-lg relative">
              🛒
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 text-[8px] bg-red-500 text-white h-4.5 min-w-4.5 rounded-full flex items-center justify-center font-extrabold px-1">
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-wide uppercase">Kasir / Keranjang</span>
          </button>
        </div>
      </nav>

      {/* --- MODAL DIALOGS AND POPUPS --- */}
      <AnimatePresence>
        
        {/* MODAL 1: STRUK INVOICE IN COURIER THEME */}
        {activeModal === 'struk' && lastTransaction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#1c2230] border border-slate-800 rounded-2xl p-5 w-full max-w-sm max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-2.5">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#22c55e] flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping" />
                    BUKTI TRANSAKSI
                  </h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Struk Content styled in Courier font monospace */}
                <div id="thermal-receipt-container" className="bg-white text-slate-900 rounded-lg p-4 font-mono text-[11px] leading-relaxed select-text shadow-inner">
                  <div className="text-center mb-3">
                    <h2 className="text-sm font-extrabold tracking-wide uppercase text-slate-950 font-sans">
                      🖨️ SPM PRODUCTION
                    </h2>
                    <p className="text-[10px] leading-tight text-slate-600 font-sans">
                      Perum Royal City Cluster Sydney C4
                    </p>
                    <p className="text-[9px] text-slate-500 font-sans">
                      WA Pemesanan: 081230973135
                    </p>
                  </div>

                  <div className="border-t border-dashed border-slate-450 my-2"></div>
                  
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>No. Transaksi</span>
                      <span className="font-bold">{lastTransaction.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu</span>
                      <span>{lastTransaction.waktu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pelanggan</span>
                      <span className="font-bold uppercase">{lastTransaction.custNama}</span>
                    </div>
                    {lastTransaction.custRef && (
                      <div className="flex justify-between">
                        <span>No. Ref/PO</span>
                        <span>{lastTransaction.custRef}</span>
                      </div>
                    )}
                    {lastTransaction.custKirim && (
                      <div className="flex justify-between">
                        <span>Pengiriman</span>
                        <span className="font-bold text-right truncate max-w-[150px]">
                          {lastTransaction.custKirim}{lastTransaction.kirimDetail && ` (${lastTransaction.kirimDetail})`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-450 my-2"></div>

                  <div className="space-y-2">
                    {lastTransaction.items.map((item, idx) => (
                      <div key={idx}>
                        <div className="font-bold text-slate-950 truncate">{item.nama}</div>
                        {item.ket && <div className="text-[10px] italic text-slate-600">Note: {item.ket}</div>}
                        <div className="flex justify-between text-slate-755">
                          <span>{item.qty} x Rp {item.harga.toLocaleString('id-ID')}</span>
                          <span className="font-bold text-slate-900">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-slate-450 my-2"></div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp {lastTransaction.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {lastTransaction.diskon > 0 && (
                      <div className="flex justify-between text-red-650">
                        <span>Diskon Potongan</span>
                        <span>- Rp {lastTransaction.diskon.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {lastTransaction.ongkir > 0 && (
                      <div className="flex justify-between">
                        <span>Ongkos Kirim</span>
                        <span>+ Rp {lastTransaction.ongkir.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs text-slate-950 pt-1 border-t border-slate-200 mt-1 font-sans">
                      <span>TOTAL BILL</span>
                      <span>Rp {lastTransaction.total.toLocaleString('id-ID')}</span>
                    </div>

                    {lastTransaction.dp > 0 && (
                      <>
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-dotted border-slate-300">
                          <span>DP (Uang Muka)</span>
                          <span>Rp {lastTransaction.dp.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-red-600 text-xs text-right mt-0.5">
                          <span>SISA BAYAR</span>
                          <span>Rp {lastTransaction.sisa.toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-450 mt-3 pt-2 text-center text-[10px] text-slate-650 font-sans leading-relaxed">
                    <p className="font-bold">Terima kasih atas kepercayaan Anda</p>
                    <p>Produksi Cetak Cepat SPM</p>
                  </div>
                </div>
              </div>

              {/* Struk actions */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => handleShareWA(lastTransaction)}
                  className="py-2.5 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim WA</span>
                </button>

                <button
                  onClick={() => handleDownloadJpg(lastTransaction)}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh JPG</span>
                </button>

                <button
                  onClick={() => {
                    const printWin = window.open('', '_blank', 'width=350,height=600');
                    if (printWin) {
                      const printContent = document.getElementById('thermal-receipt-container')?.innerHTML || '';
                      printWin.document.write(`
                        <html>
                          <head>
                            <title>Print Struk</title>
                            <style>
                              body { font-family: monospace; font-size: 11px; padding: 20px; color: black; background: white; margin: 0; }
                              .text-center { text-align: center; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .border-t { border-top: 1px dashed #555; }
                              .my-2 { margin-top: 8px; margin-bottom: 8px; }
                              .font-bold { font-weight: bold; }
                              .text-sm { font-size: 12px; }
                            </style>
                          </head>
                          <body onload="window.print(); window.close();">
                            ${printContent}
                          </body>
                        </html>
                      `);
                      printWin.document.close();
                    }
                  }}
                  className="col-span-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Termal</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL 2: CUSTOM SERVICE/ITEM INPUT FORM */}
        {activeModal === 'custom' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#1c2230] border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Layanan Cetak / Desain Custom
                  </h3>
                  <button 
                    onClick={() => { setActiveModal(null); clearCustomInputs(); }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Item name */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Nama Item Custom *</label>
                    <input 
                      id="custom-name-field"
                      type="text"
                      placeholder="Contoh: Banner Spanduk Ultah 3x2m"
                      value={customNama}
                      onChange={(e) => setCustomNama(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Item Price */}
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Harga Satuan (Rp) *</label>
                      <input 
                        id="custom-price-field"
                        type="number"
                        min="0"
                        placeholder="Rp"
                        value={customHarga || ''}
                        onChange={(e) => setCustomHarga(parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-200"
                      />
                      
                      {/* Quick price shortcuts */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[500, 1000, 5000, 10000, 25000, 50000, 100000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCustomHarga(val)}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-[10px] px-1.5 py-0.5 rounded text-indigo-400 font-bold active:scale-95 cursor-pointer transition-all"
                          >
                            {val < 1000 ? `${val}` : `${val/1000}k`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Jumlah Pemesanan *</label>
                      <input 
                        id="custom-qty-field"
                        type="number"
                        min="1"
                        value={customQty}
                        onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Operational Notes */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Catatan Khusus Desain (Bahan/Warna/Sisi)</label>
                    <textarea 
                      id="custom-notes-field"
                      rows={2.5}
                      placeholder="Spesifikasi bahan, laminasi, warna cetak bolak-balik dsb..."
                      value={customKet}
                      onChange={(e) => setCustomKet(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-200 resize-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-5">
                <button
                  id="btn-add-custom-cart"
                  onClick={handleAddCustomItem}
                  className="flex-1 py-3 bg-[#111424] border border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/20 hover:border-indigo-500 font-bold rounded-xl text-xs sm:text-sm tracking-wide uppercase transition-all duration-150 cursor-pointer shadow-sm active:scale-95 text-center"
                >
                  🛒 Masuk Keranjang
                </button>
                
                <button
                  id="btn-save-custom-product"
                  onClick={handleSaveCustomAsProduct}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm tracking-wide uppercase transition-all duration-150 cursor-pointer shadow-md shadow-indigo-950/20 active:scale-95 text-center"
                >
                  💾 Simpan Permanent
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL 3: INVENTORY SETUP & IMPORT EXCEL MANAGER */}
        {activeModal === 'kelola' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#1c2230] border border-slate-800 rounded-2xl p-5 w-full max-w-2xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    Manajemen & Kelola Katalog Produk
                  </h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Import / Export file section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  <label className="cursor-pointer">
                    <input 
                      id="excel-file-uploader"
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImportExcel}
                      className="hidden"
                    />
                    <span className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-center select-none">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Excel
                    </span>
                  </label>

                  <button
                    onClick={handleDownloadTemplate}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template Excel
                  </button>

                  <button
                    onClick={handleDownloadKatalog}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Katalog
                  </button>

                  <button
                    onClick={handleResetAllProducts}
                    className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Semua
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 leading-normal mb-4 px-1">
                  💡 Unggah file Excel dengan header kolom (<b className="text-slate-300">Nama</b>, <b className="text-slate-300">Harga</b>) wajib diisi. Contoh layout persis di Template Excel.
                </div>

                {/* Database Table view */}
                <div className="overflow-y-auto max-h-[380px] border border-slate-850 rounded-xl bg-slate-900/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#121622] sticky top-0 border-b border-slate-800 text-slate-400 font-semibold">
                      <tr>
                        <th className="p-3">Nama Jasa / Produk</th>
                        <th className="p-3 w-32">Harga Jual</th>
                        <th className="p-3 w-28">Satuan</th>
                        <th className="p-3 w-24 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                            Katalog inventaris masih kosong. Unggah spreadsheet Anda atau simpan manual.
                          </td>
                        </tr>
                      ) : (
                        products.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-semibold text-slate-200 truncate max-w-xs">{prod.nama}</td>
                            <td className="p-3 font-mono text-emerald-400 font-semibold">
                              Rp {prod.harga.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                              {prod.satuan || 'unit'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1 px-2 pb-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-transparent rounded-lg transition-all cursor-pointer text-xs"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Tutup Panel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOAST SYSTEM INTERACTIVITY --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 max-w-sm ${
              toast.isError 
                ? 'bg-red-950/95 text-red-200 border-red-500/30' 
                : 'bg-[#151c2d]/95 text-emerald-200 border-[#22c55e]/30'
            }`}
          >
            <div className={`h-2.5 w-2.5 rounded-full ${toast.isError ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-ping'}`} />
            <p className="text-xs sm:text-sm font-semibold leading-tight">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Switch tabs helper for mobile screen responsive flow
  function mobilePage(tabName: 'produk' | 'keranjang') {
    setMobileTab(tabName);
  }
}
