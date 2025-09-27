# ASI-Powered E-commerce Reputation & Logistics Engine

An intelligent reputation management system for e-commerce platforms that uses ASI (Artificial Superintelligence) from asi1.ai to make context-aware reputation decisions and automatically allocate orders to logistics partners based on customer reputation scores.

## Architecture

The system consists of several modular components:

- **ASI Client**: Handles intelligent analysis using asi1.ai API
- **Blockchain Service**: Manages smart contract interactions for immutable order history
- **Reputation Engine**: Core business logic combining ASI intelligence with blockchain data
- **Firebase Logistics Service**: Manages logistics partners and order allocations
- **Main API Server**: Express.js server providing REST endpoints

## Features

### Intelligent Reputation Management
- Context-aware reputation scoring using ASI
- Behavioral pattern analysis and risk prediction
- Blockchain-based immutable order history
- Fallback rule-based scoring when ASI unavailable

### Smart Logistics Allocation
- Automatic partner selection based on reputation thresholds
- Service area and capacity management
- Real-time allocation tracking
- Performance analytics for logistics partners

### Comprehensive Analytics
- Customer behavior insights and risk assessment
- Logistics partner performance metrics
- System-wide analytics and reporting
- ASI-powered consultation for specific customer questions

## Prerequisites

- Node.js 16+
- Ethereum wallet with gas funds
- ASI API key from asi1.ai
- Firebase project with Firestore and Realtime Database
- Deployed smart contracts (RepRegistry and OrderRegistry)

## Installation

1. Clone the repository and install dependencies:
```bash
npm install express ethers cors crypto axios firebase-admin dotenv
```

2. Set up environment variables in `.env`:
```env
# Server
PORT=3001

# Blockchain
RPC_URL=https://your-ethereum-rpc-endpoint
PRIVATE_KEY=0x...your-wallet-private-key
REGISTRY_CONTRACT_ADDRESS=0x...reputation-contract-address
ORDER_REGISTRY_CONTRACT_ADDRESS=0x...order-registry-contract-address

# API Keys
AI_API_KEY=your-secure-api-key
ASI_API_KEY=your-asi1-ai-api-key

# Firebase
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
```

3. Add Firebase service account credentials as `serviceAccount.json` in project root.

4. Deploy the smart contracts:
   - RepRegistry: Manages user reputation scores
   - OrderRegistry: Tracks complete order lifecycle

5. Grant contract roles:
   - Grant MANAGER role to API server address in RepRegistry
   - Grant RECORDER_ROLE to API server address in OrderRegistry

## Usage

### Start the Server
```bash
npm start
```

The server will test all connections and display a comprehensive status report.

### Create Order with Logistics Allocation
```bash
curl -X POST http://localhost:3001/orders/create \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "orderValue": 299.99,
    "productCategory": "electronics",
    "destination": "Mumbai, Maharashtra"
  }'
```

### Record Delivery Failure
```bash
curl -X POST http://localhost:3001/orders/order456/delivery-failed \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "reason": "absent",
    "attemptCount": 2
  }'
```

### Add Logistics Partner
```bash
curl -X POST http://localhost:3001/logistics/partners \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Express Delivery Co",
    "minReputationThreshold": 80,
    "serviceAreas": ["mumbai", "pune", "delhi"],
    "dailyOrderLimit": 150
  }'
```

### Get User Analytics
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3001/analytics/user123
```

## API Endpoints

### Core Operations
- `GET /health` - System health check
- `GET /analytics/:userId` - User behavior analytics
- `POST /orders/create` - Create order with logistics allocation
- `POST /orders/:orderId/delivery-failed` - Record delivery failure
- `POST /orders/:orderId/return` - Record product return
- `POST /orders/:orderId/complete` - Mark order completed
- `POST /behavior/positive` - Record positive behavior

### Logistics Management
- `POST /logistics/partners` - Add logistics partner
- `GET /logistics/partners` - Get all active partners
- `GET /logistics/partners/:partnerId/performance` - Partner analytics
- `POST /logistics/partners/search` - Search partners by criteria
- `GET /logistics/analytics` - System logistics analytics

### ASI Features
- `POST /asi/risk-assessment` - Batch customer risk analysis
- `POST /asi/consult` - AI consultation for customer questions

## How It Works

### Order Creation Flow
1. API receives order creation request
2. ASI analyzes customer reputation for order bonus points
3. System fetches available logistics partners
4. ASI determines best partner match based on:
   - Customer reputation vs partner thresholds
   - Service area coverage
   - Partner capacity and performance
5. Order recorded on blockchain immutably
6. Allocation tracked in Firebase for real-time management

### Partner Allocation Logic
- Partners define minimum/maximum reputation thresholds
- System filters partners by customer reputation and service area
- ASI analyzes best match considering multiple factors
- Falls back to random allocation if no qualified partners
- Real-time capacity tracking prevents overallocation

### Reputation Scoring
- ASI analyzes complete customer history for context-aware decisions
- Considers factors like order value, behavior patterns, improvement trends
- Escalates penalties for repeat problematic behavior
- Rewards loyal customers with good track records
- Falls back to rule-based scoring when ASI unavailable

## Configuration

### Logistics Partner Configuration
Partners can be configured with:
- Reputation thresholds (min/max)
- Service areas
- Daily capacity limits
- Special capabilities
- Product category preferences

### ASI Configuration
- Temperature: 0.2-0.3 for consistent decisions
- Max tokens: 800-1200 for comprehensive analysis
- Fallback enabled for service continuity

## Monitoring

The system provides comprehensive monitoring:
- Real-time service health checks
- Connection status for all dependencies
- Automatic daily cleanup of old records
- Performance metrics for logistics partners
- System-wide analytics and reporting

## Error Handling

- Graceful degradation when services unavailable
- Comprehensive error logging with troubleshooting guidance
- Automatic retries for transient failures
- Clean separation of critical vs non-critical services

## Development

### Project Structure
```
project/
├── ASIClient.js                 # ASI API integration
├── BlockchainDataService.js     # Smart contract interactions
├── ASIReputationEngine.js       # Core business logic
├── FirebaseLogisticsService.js  # Logistics management
├── app.js                       # Main API server
├── serviceAccount.json          # Firebase credentials
├── .env                         # Environment variables
└── package.json
```

### Adding New Features
1. Extend the appropriate service class
2. Add API endpoints in main server
3. Update error handling and logging
4. Add tests for new functionality

## Troubleshooting

### Common Issues
- **Port in use**: Change PORT environment variable
- **Blockchain connection failed**: Check RPC_URL and network connectivity
- **Firebase connection failed**: Verify serviceAccount.json and project configuration
- **ASI API unavailable**: System continues with fallback scoring
- **Missing environment variables**: Check .env file completeness

### Logs
The system provides detailed startup logs showing:
- Environment variable validation
- Service connection status
- Partner initialization results
- Server startup confirmation
- Ongoing operational logs

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review service connection logs
- Verify environment configuration
- Check API key validity