import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    CreditCard,
    MapPin,
    QrCode,
    Shield,
    Star,
    Truck,
    Wallet,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type {
    CheckoutFormData,
    Merchant,
    Order,
    SelfIdentity
} from '../types';

// Mock data for demonstration
const mockMerchant: Merchant = {
  id: 'merchant_001',
  name: 'TechGear Store',
  logo: 'https://via.placeholder.com/60x60/6366f1/ffffff?text=TG',
  description: 'Premium electronics and gadgets',
  address: {
    street: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA'
  },
  contact: {
    email: 'support@techgear.com',
    phone: '+1-555-0123',
    website: 'https://techgear.com'
  },
  reputation: {
    score: 95,
    tier: 'Platinum',
    totalOrders: 15420,
    rating: 4.8
  },
  verification: {
    isVerified: true,
    verificationMethod: 'KYC',
    verifiedAt: '2024-01-15T00:00:00Z'
  }
};

const mockOrder: Order = {
  id: 'order_001',
  merchantId: 'merchant_001',
  products: [
    {
      id: 'prod_001',
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium noise-cancelling headphones with 30-hour battery life',
      price: 199.99,
      currency: 'USD',
      quantity: 1,
      category: 'Electronics',
      image: 'https://via.placeholder.com/80x80/f3f4f6/374151?text=🎧',
      weight: 0.3,
      dimensions: { length: 20, width: 15, height: 8 }
    },
    {
      id: 'prod_002',
      name: 'USB-C Charging Cable',
      description: 'Fast charging cable, 6ft length',
      price: 24.99,
      currency: 'USD',
      quantity: 2,
      category: 'Accessories',
      image: 'https://via.placeholder.com/80x80/f3f4f6/374151?text=🔌',
      weight: 0.1
    }
  ],
  subtotal: 249.97,
  tax: 20.00,
  shipping: 9.99,
  total: 279.96,
  currency: 'USD',
  status: 'pending',
  createdAt: '2024-01-20T10:30:00Z',
  updatedAt: '2024-01-20T10:30:00Z',
  deliveryZone: 'SF-001',
  estimatedDelivery: '2024-01-25T18:00:00Z'
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      }
    },
    payment: {
      method: 'crypto',
      currency: 'USD',
      walletAddress: ''
    },
    selfIdentity: {
      walletAddress: '',
      useExisting: false
    }
  });

  const [selfIdentity, setSelfIdentity] = useState<SelfIdentity | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState('');

  // Mock Self identity verification
  const handleSelfLogin = () => {
    setShowQR(true);
    setQrData('self://login?session=checkout_001&merchant=merchant_001');
    
    // Simulate successful verification after 3 seconds
    setTimeout(() => {
      setSelfIdentity({
        id: 'self_001',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        publicKey: '0x04...',
        verificationStatus: 'verified',
        credentials: {
          email: 'user@example.com',
          social: [{
            provider: 'twitter',
            username: '@crypto_user',
            verified: true
          }]
        },
        reputation: {
          score: 85,
          tier: 'Gold',
          totalTransactions: 47
        },
        createdAt: '2024-01-01T00:00:00Z',
        lastUsed: '2024-01-20T10:30:00Z'
      });
      setShowQR(false);
    }, 3000);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment successful! Order confirmed.');
    }, 2000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Zap className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  zk-express
                </h1>
              </div>
              <div className="text-sm text-gray-500">Checkout</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Merchant Info */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={mockMerchant.logo} 
                    alt={mockMerchant.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{mockMerchant.name}</CardTitle>
                    <p className="text-sm text-gray-600">{mockMerchant.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(mockMerchant.reputation.tier)}`}>
                        {mockMerchant.reputation.tier}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600">{mockMerchant.reputation.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {mockMerchant.reputation.totalOrders.toLocaleString()} orders
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockOrder.products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Qty: {product.quantity}</span>
                        <span>Weight: {product.weight}kg</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(product.price * product.quantity).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">${product.price} each</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.customer.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { ...prev.customer, firstName: e.target.value }
                      }))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.customer.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { ...prev.customer, lastName: e.target.value }
                      }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer: { ...prev.customer, email: e.target.value }
                    }))}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.customer.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer: { ...prev.customer, phone: e.target.value }
                    }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.customer.address.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer: { 
                        ...prev.customer, 
                        address: { ...prev.customer.address, street: e.target.value }
                      }
                    }))}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.customer.address.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { 
                          ...prev.customer, 
                          address: { ...prev.customer.address, city: e.target.value }
                        }
                      }))}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.customer.address.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { 
                          ...prev.customer, 
                          address: { ...prev.customer.address, state: e.target.value }
                        }
                      }))}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.customer.address.zipCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { 
                          ...prev.customer, 
                          address: { ...prev.customer.address, zipCode: e.target.value }
                        }
                      }))}
                      placeholder="94105"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Self Identity Section */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Self Identity Verification
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Verify your identity using Self protocol for enhanced security and reputation
                </p>
              </CardHeader>
              <CardContent>
                {!selfIdentity ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Identity Verification Required</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Connect your Self identity to unlock reputation-based benefits and secure checkout.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleSelfLogin}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Connect with Self
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Identity Verified</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3 w-3 text-gray-500" />
                          <span className="font-mono text-xs">{selfIdentity.walletAddress.slice(0, 10)}...{selfIdentity.walletAddress.slice(-8)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(selfIdentity.reputation.tier)}`}>
                            {selfIdentity.reputation.tier} Tier
                          </span>
                          <span className="text-gray-600">{selfIdentity.reputation.totalTransactions} transactions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showQR && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                    <div className="mb-2">
                      <QrCode className="h-16 w-16 mx-auto text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Scan QR code with Self app</p>
                    <p className="text-xs text-gray-500 font-mono">{qrData}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="crypto"
                      name="payment"
                      value="crypto"
                      checked={formData.payment.method === 'crypto'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment: { ...prev.payment, method: e.target.value as 'crypto' }
                      }))}
                      className="text-purple-600"
                    />
                    <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      Crypto Payment
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paypal"
                      name="payment"
                      value="paypal"
                      checked={formData.payment.method === 'paypal'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment: { ...prev.payment, method: e.target.value as 'paypal' }
                      }))}
                      className="text-blue-600"
                    />
                    <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      PayPal PYUSD
                    </Label>
                  </div>
                </div>

                {formData.payment.method === 'crypto' && (
                  <div>
                    <Label htmlFor="walletAddress">Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      value={formData.payment.walletAddress}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment: { ...prev.payment, walletAddress: e.target.value }
                      }))}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: Ethereum, Polygon, Base
                    </p>
                  </div>
                )}

                {formData.payment.method === 'paypal' && (
                  <div>
                    <Label htmlFor="paypalAccount">PayPal Account</Label>
                    <Input
                      id="paypalAccount"
                      value={formData.payment.paypalAccount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment: { ...prev.payment, paypalAccount: e.target.value }
                      }))}
                      placeholder="your-email@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pay with PYUSD stablecoin
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${mockOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${mockOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${mockOrder.shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${mockOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                
                {selfIdentity && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span>Reputation discount applied</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {selfIdentity.reputation.tier} tier benefits
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Zone: {mockOrder.deliveryZone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span>Est. Delivery: Jan 25, 2024</span>
                </div>
                <div className="text-xs text-gray-500">
                  Delivered by verified zk-express logistics partners
                </div>
              </CardContent>
            </Card>

            {/* Complete Order Button */}
            <Button 
              onClick={handlePayment}
              disabled={isProcessing || !formData.customer.firstName || !formData.customer.lastName || !formData.customer.email}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Complete Order - ${mockOrder.total.toFixed(2)}
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="text-center text-xs text-gray-500">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="h-3 w-3" />
                <span>Secured by zk-express</span>
              </div>
              <p>Your payment and personal data are protected with zero-knowledge proofs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
