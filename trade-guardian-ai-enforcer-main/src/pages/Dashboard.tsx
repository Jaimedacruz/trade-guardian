import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import TradeMonitoring from "@/components/TradeMonitoring";
import { Activity, DollarSign, Target, AlertCircle } from "lucide-react";

interface Stats {
  totalTrades: number;
  openTrades: number;
  todayTrades: number;
  violations: number;
  dailyPnL: number;
  isAccountConnected: boolean;
  hasTradingPlan: boolean;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalTrades: 0,
    openTrades: 0,
    todayTrades: 0,
    violations: 0,
    dailyPnL: 0,
    isAccountConnected: false,
    hasTradingPlan: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has a trading plan
      const { data: tradingPlan } = await supabase
        .from("trading_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      // Check if user has connected MT5 account
      const { data: mt5Account } = await supabase
        .from("mt5_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_connected", true)
        .single();

      // Get trade statistics
      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id);

      const today = new Date().toDateString();
      const todayTrades = trades?.filter(trade => 
        new Date(trade.opened_at).toDateString() === today
      ) || [];

      const openTrades = trades?.filter(trade => trade.is_open) || [];
      const violations = trades?.filter(trade => !trade.follows_rules) || [];
      
      const dailyPnL = todayTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);

      setStats({
        totalTrades: trades?.length || 0,
        openTrades: openTrades.length,
        todayTrades: todayTrades.length,
        violations: violations.length,
        dailyPnL,
        isAccountConnected: !!mt5Account,
        hasTradingPlan: !!tradingPlan,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your trading discipline and performance
        </p>
      </div>

      {/* Setup Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Plan</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={stats.hasTradingPlan ? "default" : "destructive"}>
              {stats.hasTradingPlan ? "Configured" : "Not Set"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.hasTradingPlan 
                ? "Your trading rules are active" 
                : "Set up your trading plan to enforce discipline"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MT5 Account</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={stats.isAccountConnected ? "default" : "destructive"}>
              {stats.isAccountConnected ? "Connected" : "Not Connected"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.isAccountConnected 
                ? "Ready to monitor trades" 
                : "Connect your MT5 account to start monitoring"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTrades}</div>
            <p className="text-xs text-muted-foreground">
              Trades executed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTrades}</div>
            <p className="text-xs text-muted-foreground">
              Currently open trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.dailyPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's profit/loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Violations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.violations}</div>
            <p className="text-xs text-muted-foreground">
              Total violations to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trade Monitoring Component */}
      {stats.hasTradingPlan && stats.isAccountConnected && (
        <TradeMonitoring />
      )}

      {/* Quick Actions */}
      {(!stats.hasTradingPlan || !stats.isAccountConnected) && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>
              Complete these steps to start monitoring your trades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stats.hasTradingPlan && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Set up Trading Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Define your trading rules and risk parameters
                  </p>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            )}
            {!stats.isAccountConnected && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Connect MT5 Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Link your MetaTrader 5 account for trade monitoring
                  </p>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;