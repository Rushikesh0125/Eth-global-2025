// Core Types for zk-express Checkout System

// Merchant Information
export interface Merchant {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  reputation: {
    score: number; // 0-100
    tier: 'Platinum' | 'Gold' | 'Standard' | 'Risk';
    totalOrders: number;
    rating: number; // 1-5 stars
  };
  verification: {
    isVerified: boolean;
    verificationMethod: 'KYC' | 'Self' | 'ThirdParty';
    verifiedAt?: string; // ISO date
  };
}

// Product/Item Information
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in USD or base currency
  currency: string;
  quantity: number;
  category: string;
  image?: string;
  weight?: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
}

// Order Information
export interface Order {
  id: string;
  merchantId: string;
  products: Product[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  deliveryZone?: string; // For logistics
  estimatedDelivery?: string; // ISO date
}

// Customer/User Information
export interface Customer {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
  };
}

// Self Identity for zk-express
export interface SelfIdentity {
  id: string;
  walletAddress: string;
  publicKey: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  credentials: {
    email?: string;
    phone?: string;
    social?: {
      provider: 'twitter' | 'github' | 'discord';
      username: string;
      verified: boolean;
    }[];
  };
  reputation: {
    score: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    totalTransactions: number;
  };
  createdAt: string;
  lastUsed: string;
}

// Payment Information
export interface PaymentMethod {
  type: 'crypto' | 'paypal' | 'card';
  provider: 'ethereum' | 'polygon' | 'paypal' | 'stripe';
  currency: string;
  amount: number;
  details?: {
    // For crypto payments
    walletAddress?: string;
    network?: string;
    gasEstimate?: number;
    // For PayPal PYUSD
    paypalAccount?: string;
    // For card payments
    cardLast4?: string;
    cardBrand?: string;
  };
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  transactionHash?: string; // For crypto payments
  paypalTransactionId?: string; // For PayPal payments
}

// Checkout Session
export interface CheckoutSession {
  id: string;
  order: Order;
  merchant: Merchant;
  customer: Customer;
  selfIdentity?: SelfIdentity;
  paymentIntent?: PaymentIntent;
  qrCode?: {
    data: string; // QR code data
    expiresAt: string; // ISO date
    purpose: 'self-login' | 'payment' | 'verification';
  };
  createdAt: string;
  expiresAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Form Data Types for Checkout
export interface CheckoutFormData {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  payment: {
    method: 'crypto' | 'paypal' | 'card';
    currency: string;
    walletAddress?: string;
    paypalAccount?: string;
  };
  selfIdentity?: {
    walletAddress: string;
    useExisting: boolean;
  };
}

// Error Types
export interface CheckoutError {
  field?: string;
  code: string;
  message: string;
  details?: any;
}

// Utility Types
export type PaymentStatus = PaymentIntent['status'];
export type OrderStatus = Order['status'];
export type MerchantTier = Merchant['reputation']['tier'];
export type SelfTier = SelfIdentity['reputation']['tier'];
