import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface Auction {
  id: string;
  orderId: string;
  reputationTier: 'Platinum' | 'Gold' | 'Standard' | 'Risk';
  deliveryZone: string;
  packageDetails: string;
  currentBid: number;
  timeRemaining: number;
  status: 'active' | 'ended' | 'claimed';
}

interface AssignedOrder {
  id: string;
  orderId: string;
  customerAddress: string;
  packageDetails: string;
  deliveryZone: string;
  bidAmount: number;
  status: 'assigned' | 'proximity-proof-required' | 'in-transit' | 'delivered';
  proximityProof?: string;
}

const LogisticsDashboard: React.FC = () => {
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      reputationTier: 'Gold',
      deliveryZone: '110001',
      packageDetails: 'Electronics - Smartphone',
      currentBid: 2.50,
      timeRemaining: 45,
      status: 'active'
    },
    {
      id: '2',
      orderId: 'ORD-002',
      reputationTier: 'Platinum',
      deliveryZone: '400001',
      packageDetails: 'Fashion - Clothing',
      currentBid: 1.80,
      timeRemaining: 23,
      status: 'active'
    },
    {
      id: '3',
      orderId: 'ORD-003',
      reputationTier: 'Standard',
      deliveryZone: '560001',
      packageDetails: 'Books - Educational',
      currentBid: 3.20,
      timeRemaining: 67,
      status: 'active'
    }
  ]);

  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([
    {
      id: '1',
      orderId: 'ORD-004',
      customerAddress: 'Encrypted - Proof Required',
      packageDetails: 'Electronics - Laptop',
      deliveryZone: '110001',
      bidAmount: 2.00,
      status: 'proximity-proof-required'
    }
  ]);

  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: string }>({});
  const [proximityProofs, setProximityProofs] = useState<{ [key: string]: string }>({});

  const handleBid = (auctionId: string) => {
    const bidAmount = parseFloat(bidAmounts[auctionId]);
    if (bidAmount && bidAmount > 0) {
      // Update auction with new bid
      setActiveAuctions(prev => 
        prev.map(auction => 
          auction.id === auctionId 
            ? { ...auction, currentBid: bidAmount }
            : auction
        )
      );
      
      // Clear bid input
      setBidAmounts(prev => ({ ...prev, [auctionId]: '' }));
      
      console.log(`Bid placed: ${bidAmount} for auction ${auctionId}`);
    }
  };

  const handleGenerateProximityProof = (orderId: string) => {
    // Simulate generating proximity proof
    const mockProof = `proof_${orderId}_${Date.now()}`;
    setProximityProofs(prev => ({ ...prev, [orderId]: mockProof }));
    
    // Update order status
    setAssignedOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, status: 'in-transit', proximityProof: mockProof }
          : order
      )
    );
    
    console.log(`Proximity proof generated for order ${orderId}: ${mockProof}`);
  };

  const handleDecryptAddress = (orderId: string) => {
    // Simulate address decryption after proximity proof
    setAssignedOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, customerAddress: '123 Main Street, Sector 15, Delhi - 110001' }
          : order
      )
    );
    
    console.log(`Address decrypted for order ${orderId}`);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Standard': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Risk': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'claimed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">zk-express Logistics Dashboard</h1>
          <p className="text-gray-600">Manage auctions, bids, and deliveries</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Auctions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Active Auctions</h2>
            <div className="space-y-4">
              {activeAuctions.map((auction) => (
                <Card key={auction.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{auction.orderId}</CardTitle>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(auction.reputationTier)}`}>
                          {auction.reputationTier}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(auction.status)}`}>
                          {auction.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Package: {auction.packageDetails}</p>
                        <p className="text-sm text-gray-600">Zone: {auction.deliveryZone}</p>
                        <p className="text-sm text-gray-600">Current Bid: ₹{auction.currentBid}</p>
                        <p className="text-sm text-gray-600">Time Left: {auction.timeRemaining}s</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`bid-${auction.id}`} className="text-xs">Your Bid (₹)</Label>
                          <Input
                            id={`bid-${auction.id}`}
                            type="number"
                            step="0.1"
                            placeholder="Enter bid amount"
                            value={bidAmounts[auction.id] || ''}
                            onChange={(e) => setBidAmounts(prev => ({ ...prev, [auction.id]: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <Button 
                          onClick={() => handleBid(auction.id)}
                          className="mt-6 bg-blue-600 hover:bg-blue-700"
                          disabled={auction.status !== 'active'}
                        >
                          Place Bid
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Assigned Orders */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">My Assigned Orders</h2>
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{order.orderId}</CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'proximity-proof-required' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('-', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Package: {order.packageDetails}</p>
                        <p className="text-sm text-gray-600">Zone: {order.deliveryZone}</p>
                        <p className="text-sm text-gray-600">Winning Bid: ₹{order.bidAmount}</p>
                        <p className="text-sm text-gray-600">Address: {order.customerAddress}</p>
                      </div>
                      
                      <div className="space-y-2">
                        {order.status === 'proximity-proof-required' && (
                          <div className="space-y-2">
                            <Button 
                              onClick={() => handleGenerateProximityProof(order.orderId)}
                              className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                              Generate Proximity Proof
                            </Button>
                            <p className="text-xs text-gray-500 text-center">
                              Click to prove you're in zone {order.deliveryZone}
                            </p>
                          </div>
                        )}
                        
                        {order.status === 'in-transit' && (
                          <div className="space-y-2">
                            <Button 
                              onClick={() => handleDecryptAddress(order.orderId)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Decrypt Full Address
                            </Button>
                            <p className="text-xs text-gray-500 text-center">
                              Proximity verified. Click to decrypt delivery address.
                            </p>
                          </div>
                        )}
                        
                        {order.status === 'delivered' && (
                          <div className="text-center">
                            <p className="text-sm text-green-600 font-medium">✅ Order Delivered</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{activeAuctions.length}</div>
              <div className="text-sm text-gray-600">Active Auctions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{assignedOrders.length}</div>
              <div className="text-sm text-gray-600">Assigned Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">₹{assignedOrders.reduce((sum, order) => sum + order.bidAmount, 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">4.8</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LogisticsDashboard;
