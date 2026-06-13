export interface Product {
  id: number;
  nama: string;
  harga: number;
  satuan?: string;
}

export interface CartItem {
  id: number;
  nama: string;
  harga: number;
  qty: number;
  ket: string;
  custom: boolean;
}

export interface Transaction {
  id: string;
  waktu: string;
  custNama: string;
  custHp: string;
  custRef: string;
  custKirim: string;
  kirimDetail: string;
  ongkir: number;
  items: CartItem[];
  subtotal: number;
  diskon: number;
  total: number;
  dp: number;
  sisa: number;
}
