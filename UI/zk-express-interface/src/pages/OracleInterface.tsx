import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface ProofRequest {
  orderId: string;
  deliveryZone: string;
  partnerWallet: string;
  timestamp: number;
  proof?: string;
}

const OracleInterface: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [partnerWallet, setPartnerWallet] = useState('');
  const [generatedProof, setGeneratedProof] = useState<string>('');
  const [proofHistory, setProofHistory] = useState<ProofRequest[]>([]);

  const generateProximityProof = () => {
    if (!orderId || !deliveryZone || !partnerWallet) {
      alert('Please fill in all fields');
      return;
    }

    // Simulate proof generation
    const timestamp = Date.now();
    const proofData = {
      orderId,
      deliveryZone,
      partnerWallet,
      timestamp,
      signature: `0x${Math.random().toString(16).substr(2, 64)}`
    };

    const proof = JSON.stringify(proofData);
    setGeneratedProof(proof);

    // Add to history
    const newRequest: ProofRequest = {
      orderId,
      deliveryZone,
      partnerWallet,
      timestamp,
      proof
    };

    setProofHistory(prev => [newRequest, ...prev]);
    
    console.log('Proximity proof generated:', proof);
  };

  const copyProof = () => {
    if (generatedProof) {
      navigator.clipboard.writeText(generatedProof);
      alert('Proof copied to clipboard!');
    }
  };

  const clearForm = () => {
    setOrderId('');
    setDeliveryZone('');
    setPartnerWallet('');
    setGeneratedProof('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">zk-express Proof of Proximity Oracle</h1>
          <p className="text-gray-600">Generate cryptographic proofs for location verification</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Proof Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Generate Proximity Proof
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="e.g., ORD-001"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryZone">Delivery Zone (Pincode)</Label>
                  <Input
                    id="deliveryZone"
                    placeholder="e.g., 110001"
                    value={deliveryZone}
                    onChange={(e) => setDeliveryZone(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="partnerWallet">Partner Wallet Address</Label>
                  <Input
                    id="partnerWallet"
                    placeholder="0x..."
                    value={partnerWallet}
                    onChange={(e) => setPartnerWallet(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={generateProximityProof}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Generate Proof
                  </Button>
                  <Button 
                    onClick={clearForm}
                    variant="outline"
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>

                {generatedProof && (
                  <div className="space-y-2">
                    <Label>Generated Proof</Label>
                    <div className="bg-gray-100 p-3 rounded-md">
                      <pre className="text-xs text-gray-700 break-all">
                        {generatedProof}
                      </pre>
                    </div>
                    <Button 
                      onClick={copyProof}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      📋 Copy Proof
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Proof History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Proof History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proofHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No proofs generated yet</p>
                ) : (
                  proofHistory.map((request, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{request.orderId}</p>
                          <p className="text-xs text-gray-600">Zone: {request.deliveryZone}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        Partner: {request.partnerWallet.slice(0, 10)}...
                      </div>
                      
                      {request.proof && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs font-medium text-gray-700 mb-1">Proof:</p>
                          <p className="text-xs text-gray-600 break-all">
                            {request.proof.slice(0, 50)}...
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Oracle Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌐 Oracle Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Online</div>
                <div className="text-sm text-gray-600">Oracle Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{proofHistory.length}</div>
                <div className="text-sm text-gray-600">Proofs Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Logistics partner requests proof for specific order and zone</li>
                <li>• Oracle verifies partner is physically in the delivery zone</li>
                <li>• Cryptographic proof is generated and signed</li>
                <li>• Proof can be used to decrypt customer address</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OracleInterface;
