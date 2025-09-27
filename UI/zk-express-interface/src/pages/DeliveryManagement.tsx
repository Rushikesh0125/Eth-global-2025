import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface DeliveryOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageDetails: string;
  deliveryZone: string;
  bidAmount: number;
  status: 'assigned' | 'proximity-proof-required' | 'address-decrypted' | 'out-for-delivery' | 'delivered' | 'failed';
  proximityProof?: string;
  deliveryNotes?: string;
  customerRating?: number;
}

const DeliveryManagement: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      customerAddress: 'Encrypted - Proof Required',
      packageDetails: 'Electronics - iPhone 15 Pro',
      deliveryZone: '110001',
      bidAmount: 2.50,
      status: 'proximity-proof-required'
    },
    {
      id: '2',
      orderId: 'ORD-002',
      customerName: 'Priya Patel',
      customerPhone: '+91 87654 32109',
      customerAddress: '456 Park Street, Sector 22, Mumbai - 400001',
      packageDetails: 'Fashion - Designer Dress',
      deliveryZone: '400001',
      bidAmount: 1.80,
      status: 'out-for-delivery'
    },
    {
      id: '3',
      orderId: 'ORD-003',
      customerName: 'Amit Kumar',
      customerPhone: '+91 76543 21098',
      customerAddress: '789 Tech Park, Electronic City, Bangalore - 560001',
      packageDetails: 'Books - Programming Guide',
      deliveryZone: '560001',
      bidAmount: 3.20,
      status: 'delivered'
    }
  ]);

  const [deliveryNotes, setDeliveryNotes] = useState<{ [key: string]: string }>({});
  const [customerRatings, setCustomerRatings] = useState<{ [key: string]: number }>({});

  const handleGenerateProximityProof = (orderId: string) => {
    const mockProof = `proof_${orderId}_${Date.now()}`;
    
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { 
              ...order, 
              status: 'address-decrypted',
              proximityProof: mockProof,
              customerAddress: order.customerAddress === 'Encrypted - Proof Required' 
                ? '123 Main Street, Sector 15, Delhi - 110001' 
                : order.customerAddress
            }
          : order
      )
    );
    
    console.log(`Proximity proof generated for order ${orderId}: ${mockProof}`);
  };

  const handleStartDelivery = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, status: 'out-for-delivery' }
          : order
      )
    );
    
    console.log(`Delivery started for order ${orderId}`);
  };

  const handleCompleteDelivery = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, status: 'delivered' }
          : order
      )
    );
    
    console.log(`Delivery completed for order ${orderId}`);
  };

  const handleFailedDelivery = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, status: 'failed' }
          : order
      )
    );
    
    console.log(`Delivery failed for order ${orderId}`);
  };

  const handleRateCustomer = (orderId: string, rating: number) => {
    setCustomerRatings(prev => ({ ...prev, [orderId]: rating }));
    console.log(`Customer rated ${rating}/5 for order ${orderId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'proximity-proof-required': return 'bg-orange-100 text-orange-800';
      case 'address-decrypted': return 'bg-purple-100 text-purple-800';
      case 'out-for-delivery': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return '📋';
      case 'proximity-proof-required': return '🔒';
      case 'address-decrypted': return '🔓';
      case 'out-for-delivery': return '🚚';
      case 'delivered': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Management</h1>
          <p className="text-gray-600">Track and manage your assigned deliveries</p>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{order.orderId}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(order.status)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Details */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Customer</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-sm text-gray-600">{order.customerPhone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Package</p>
                      <p className="text-sm text-gray-600">{order.packageDetails}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-sm text-gray-600">{order.customerAddress}</p>
                      <p className="text-sm text-gray-500">Zone: {order.deliveryZone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Earnings</p>
                      <p className="text-sm text-green-600 font-semibold">₹{order.bidAmount}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {order.status === 'proximity-proof-required' && (
                      <Button 
                        onClick={() => handleGenerateProximityProof(order.orderId)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        🔒 Generate Proximity Proof
                      </Button>
                    )}
                    
                    {order.status === 'address-decrypted' && (
                      <Button 
                        onClick={() => handleStartDelivery(order.orderId)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        🚚 Start Delivery
                      </Button>
                    )}
                    
                    {order.status === 'out-for-delivery' && (
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`notes-${order.id}`} className="text-xs">Delivery Notes</Label>
                          <Input
                            id={`notes-${order.id}`}
                            placeholder="Add delivery notes..."
                            value={deliveryNotes[order.id] || ''}
                            onChange={(e) => setDeliveryNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleCompleteDelivery(order.orderId)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            ✅ Delivered
                          </Button>
                          <Button 
                            onClick={() => handleFailedDelivery(order.orderId)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            ❌ Failed
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'delivered' && (
                      <div className="space-y-2">
                        <div className="text-center">
                          <p className="text-sm text-green-600 font-medium">✅ Successfully Delivered</p>
                          <p className="text-xs text-gray-500">Earned: ₹{order.bidAmount}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Rate Customer Experience</Label>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => handleRateCustomer(order.orderId, rating)}
                                className={`text-lg ${
                                  customerRatings[order.id] >= rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ⭐
                              </button>
                            ))}
                          </div>
                          {customerRatings[order.id] && (
                            <p className="text-xs text-gray-500 mt-1">
                              Rated: {customerRatings[order.id]}/5 stars
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'failed' && (
                      <div className="text-center">
                        <p className="text-sm text-red-600 font-medium">❌ Delivery Failed</p>
                        <p className="text-xs text-gray-500">No earnings for this delivery</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter(o => ['assigned', 'proximity-proof-required', 'address-decrypted', 'out-for-delivery'].includes(o.status)).length}
              </div>
              <div className="text-sm text-gray-600">Active Deliveries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {orders.filter(o => o.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{orders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + order.bidAmount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;
