# zk-express Checkout System - TypeScript Interfaces

This document outlines the TypeScript interfaces used in the zk-express checkout system for backend collaboration.

## Core Interfaces

### Merchant
```typescript
interface Merchant {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  address: Address;
  contact: Contact;
  reputation: Reputation;
  verification: Verification;
}
```

### Order
```typescript
interface Order {
  id: string;
  merchantId: string;
  products: Product[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deliveryZone?: string;
  estimatedDelivery?: string;
}
```

### Self Identity
```typescript
interface SelfIdentity {
  id: string;
  walletAddress: string;
  publicKey: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  credentials: Credentials;
  reputation: SelfReputation;
  createdAt: string;
  lastUsed: string;
}
```

### Payment
```typescript
interface PaymentMethod {
  type: 'crypto' | 'paypal' | 'card';
  provider: 'ethereum' | 'polygon' | 'paypal' | 'stripe';
  currency: string;
  amount: number;
  details?: PaymentDetails;
}

interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  transactionHash?: string;
  paypalTransactionId?: string;
}
```

### Checkout Session
```typescript
interface CheckoutSession {
  id: string;
  order: Order;
  merchant: Merchant;
  customer: Customer;
  selfIdentity?: SelfIdentity;
  paymentIntent?: PaymentIntent;
  qrCode?: QRCode;
  createdAt: string;
  expiresAt: string;
}
```

## API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## Form Data Structure

```typescript
interface CheckoutFormData {
  customer: CustomerFormData;
  payment: PaymentFormData;
  selfIdentity?: SelfIdentityFormData;
}
```

## Key Features

1. **Merchant Verification**: KYC, Self, or ThirdParty verification methods
2. **Reputation System**: Tiered reputation (Platinum, Gold, Standard, Risk)
3. **Self Identity Integration**: Zero-knowledge identity verification
4. **Multiple Payment Methods**: Crypto (ETH, Polygon, Base), PayPal PYUSD
5. **QR Code Authentication**: Self protocol integration for identity proof
6. **Delivery Zone Management**: Logistics integration with zone-based delivery

## Backend Integration Points

### Required Endpoints
- `POST /api/checkout/session` - Create checkout session
- `POST /api/payment/intent` - Create payment intent
- `POST /api/self/verify` - Verify Self identity
- `GET /api/merchant/:id` - Get merchant details
- `POST /api/order/create` - Create order

### Webhook Events
- `payment.succeeded`
- `payment.failed`
- `self.verified`
- `order.created`
- `order.updated`

## Security Considerations

1. All sensitive data should be encrypted
2. Self identity verification uses zero-knowledge proofs
3. Payment processing includes transaction hash verification
4. QR codes have expiration times for security
5. Reputation scores affect pricing and delivery options

## Usage Example

```typescript
// Create checkout session
const session = await createCheckoutSession({
  merchantId: 'merchant_001',
  products: [...],
  customer: {...},
  selfIdentity: {...}
});

// Process payment
const payment = await processPayment({
  sessionId: session.id,
  paymentMethod: {
    type: 'crypto',
    provider: 'ethereum',
    walletAddress: '0x...'
  }
});
```
