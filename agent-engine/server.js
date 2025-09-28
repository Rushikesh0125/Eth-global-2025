// server.js
const app = require('./index.js'); // Import the simplified Express app

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log('📡 Ready to handle requests');
    console.log('='.repeat(50));
});
