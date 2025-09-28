import { useNavigate, useLocation } from "react-router-dom";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Store, Zap, ArrowLeft } from "lucide-react";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL state management with nuqs
  const [userType, setUserType] = useQueryState("userType", parseAsString);
  const [email, setEmail] = useQueryState("email", parseAsString);
  const [password, setPassword] = useQueryState("password", parseAsString);
  const [isLoggedIn, setIsLoggedIn] = useQueryState("loggedIn", parseAsBoolean);

  const handleLogin = () => {
    console.log(`Logging in as ${userType} with email: ${email}`);
    setIsLoggedIn(true);
    if (userType === "logistics") {
      navigate("/logistics");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType(null);
    setEmail("");
    setPassword("");
    navigate("/");
  };

  // If logged in as logistics, show logistics pages
  if (isLoggedIn && userType === "logistics") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-6 w-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">zk-express Logistics</h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={location.pathname === "/logistics" ? "default" : "outline"}
                    size="sm"
                    onClick={() => navigate("/logistics")}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant={location.pathname === "/logistics/delivery" ? "default" : "outline"}
                    size="sm"
                    onClick={() => navigate("/logistics/delivery")}
                  >
                    Delivery Management
                  </Button>
                  <Button
                    variant={location.pathname === "/logistics/oracle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => navigate("/logistics/oracle")}
                  >
                    Oracle Interface
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content - Now handled by React Router */}
        <div className="flex-1">
          {/* Content is rendered by React Router based on current route */}
        </div>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Zap className="h-12 w-12 text-yellow-400 mr-3" />
              <h1 className="text-5xl font-bold text-white">ZK Express</h1>
            </div>
            <p className="text-xl text-gray-300 mb-2">Decentralized Logistics Platform</p>
            <p className="text-gray-400">Choose your role to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-green-500/20 rounded-full w-fit group-hover:bg-green-500/30 transition-colors">
                  <Store className="h-12 w-12 text-green-400" />
                </div>
                <CardTitle className="text-2xl text-white">Merchant</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your inventory, track shipments, and connect with logistics partners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Inventory Management
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Order Tracking
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Analytics Dashboard
                  </div>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setUserType("merchant")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Login as Merchant
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => navigate("/zk-checkout")}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    >
                      ZK Checkout
                    </Button>
                    <Button 
                      onClick={() => navigate("/checkout")}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    >
                      Full Checkout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group" onClick={() => setUserType("logistics")}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-blue-500/20 rounded-full w-fit group-hover:bg-blue-500/30 transition-colors">
                  <Truck className="h-12 w-12 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-white">Logistics Provider</CardTitle>
                <CardDescription className="text-gray-300">
                  Handle deliveries, manage routes, and optimize your logistics operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Route Optimization
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Delivery Tracking
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Fleet Management
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {userType === "merchant" ? (
              <Store className="h-8 w-8 text-green-400 mr-2" />
            ) : (
              <Truck className="h-8 w-8 text-blue-400 mr-2" />
            )}
            <Zap className="h-6 w-6 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl text-white">
            Login as {userType === "merchant" ? "Merchant" : "Logistics Provider"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password || ""}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20  placeholder:text-gray-400 font-black"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setUserType(null)}
              className="flex-1 bg-white/10 border-white/20  hover:bg-white/20 text-black"
            >
              Back
            </Button>
            <Button
              onClick={handleLogin}
              className={`flex-1 ${
                userType === "merchant"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-black`}
            >
              Login
            </Button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <button className="text-yellow-400 hover:text-yellow-300 underline">
                Sign up here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
