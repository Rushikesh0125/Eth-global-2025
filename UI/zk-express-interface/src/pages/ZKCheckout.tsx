import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    CreditCard,
    Eye,
    EyeOff,
    Lock,
    QrCode,
    Shield,
    Star,
    Wallet,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs';
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

// Mock data
const mockMerchant: Merchant = {
  id: 'merchant_001',
  name: 'TechGear Store',
  logo: 'https://via.placeholder.com/40x40/6366f1/ffffff?text=TG',
  description: 'Premium electronics',
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
      description: 'Premium noise-cancelling headphones',
      price: 199.99,
      currency: 'USD',
      quantity: 1,
      category: 'Electronics',
      image: 'https://via.placeholder.com/60x60/f3f4f6/374151?text=🎧',
      weight: 0.3
    },
    {
      id: 'prod_002',
      name: 'USB-C Charging Cable',
      description: 'Fast charging cable, 6ft',
      price: 24.99,
      currency: 'USD',
      quantity: 2,
      category: 'Accessories',
      image: 'https://via.placeholder.com/60x60/f3f4f6/374151?text=🔌',
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

const ZKCheckout: React.FC = () => {
  const navigate = useNavigate();
  
  // URL state management with nuqs
  const [email, setEmail] = useQueryState("email", parseAsString);
  const [walletAddress, setWalletAddress] = useQueryState("wallet", parseAsString);
  const [paymentMethod, setPaymentMethod] = useQueryState("paymentMethod", parseAsString);
  const [isProcessing, setIsProcessing] = useQueryState("processing", parseAsBoolean);
  const [selfVerified, setSelfVerified] = useQueryState("selfVerified", parseAsBoolean);
  const [showQR, setShowQR] = useQueryState("showQR", parseAsBoolean);

  const handleSelfVerify = () => {
    setShowQR(true);
    setTimeout(() => {
      setSelfVerified(true);
      setShowQR(false);
    }, 2000);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment successful! 🎉');
      navigate("/");
    }, 3000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/")}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Zap className="h-8 w-8 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">zk-express</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Zero-Knowledge Secure</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Order Summary */}
          <div className="space-y-6">
            {/* Merchant Card */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={mockMerchant.logo} 
                    alt={mockMerchant.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white">{mockMerchant.name}</h2>
                    <p className="text-gray-300">{mockMerchant.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(mockMerchant.reputation.tier)}`}>
                        {mockMerchant.reputation.tier}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-300">{mockMerchant.reputation.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockOrder.products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-12 h-12 rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{product.name}</h3>
                      <p className="text-sm text-gray-400">{product.description}</p>
                      <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">${(product.price * product.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white">${mockOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Tax</span>
                    <span className="text-white">${mockOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Shipping</span>
                    <span className="text-white">${mockOrder.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-white/10 pt-2">
                    <span className="text-white">Total</span>
                    <span className="text-white">${mockOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Payment */}
          <div className="space-y-6">
            {/* Self Identity Verification */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selfVerified ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">Zero-Knowledge Identity</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Verify your identity using Self protocol for enhanced security and reputation benefits.
                      </p>
                    </div>
                    
                    {!showQR ? (
                      <Button 
                        onClick={handleSelfVerify}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Verify with Self
                      </Button>
                    ) : (
                      <div className="text-center p-6 bg-gray-800/50 rounded-lg">
                        <div className="mb-4">
                          <QrCode className="h-16 w-16 mx-auto text-purple-400" />
                        </div>
                        <p className="text-sm text-gray-300 mb-2">Scan with Self app</p>
                        <p className="text-xs text-gray-500 font-mono">self://verify?session=zk_001</p>
                        <div className="mt-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mx-auto"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-300">Identity Verified</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-3 w-3" />
                        <span className="font-mono text-xs">0x742d...4d8b6</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Gold Tier
                        </span>
                        <span className="text-xs text-gray-400">47 transactions</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="crypto"
                      name="payment"
                      value="crypto"
                      checked={paymentMethod === 'crypto'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-purple-600"
                    />
                    <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer text-white">
                      <Wallet className="h-4 w-4" />
                      Crypto Payment
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="paypal"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer text-white">
                      <CreditCard className="h-4 w-4" />
                      PayPal PYUSD
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {paymentMethod === 'crypto' && (
                  <div>
                    <Label htmlFor="wallet" className="text-white">Wallet Address</Label>
                    <Input
                      id="wallet"
                      value={walletAddress || ""}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Supported: Ethereum, Polygon, Base
                    </p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div>
                    <Label htmlFor="paypal" className="text-white">PayPal Account</Label>
                    <Input
                      id="paypal"
                      type="email"
                      placeholder="your-paypal@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Pay with PYUSD stablecoin
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complete Payment */}
            <Button 
              onClick={handlePayment}
              disabled={isProcessing || !email || (paymentMethod === 'crypto' && !walletAddress)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 text-lg font-semibold disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing Payment...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Complete Payment - ${mockOrder.total.toFixed(2)}
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="text-center text-xs text-gray-400">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-green-400" />
                <span>Secured by zk-express</span>
              </div>
              <p>Your payment is protected with zero-knowledge proofs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZKCheckout;
