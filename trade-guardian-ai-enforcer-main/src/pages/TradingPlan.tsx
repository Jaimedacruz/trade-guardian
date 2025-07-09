import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface TradingPlan {
  id?: string;
  max_trades_per_day: number;
  max_risk_percent: number;
  allowed_symbols: string[];
  session_start: string;
  session_end: string;
  max_daily_loss_percent: number;
  is_active: boolean;
}

const TradingPlan = () => {
  const [plan, setPlan] = useState<TradingPlan>({
    max_trades_per_day: 5,
    max_risk_percent: 2.0,
    allowed_symbols: [],
    session_start: "09:00",
    session_end: "17:00",
    max_daily_loss_percent: 5.0,
    is_active: true,
  });
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTradingPlan();
  }, []);

  const fetchTradingPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trading_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPlan({
          id: data.id,
          max_trades_per_day: data.max_trades_per_day,
          max_risk_percent: parseFloat(String(data.max_risk_percent)),
          allowed_symbols: data.allowed_symbols || [],
          session_start: data.session_start,
          session_end: data.session_end,
          max_daily_loss_percent: parseFloat(String(data.max_daily_loss_percent)),
          is_active: data.is_active,
        });
        setHasExistingPlan(true);
      }
    } catch (error: any) {
      console.error("Error fetching trading plan:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const planData = {
        user_id: user.id,
        max_trades_per_day: plan.max_trades_per_day,
        max_risk_percent: plan.max_risk_percent,
        allowed_symbols: plan.allowed_symbols,
        session_start: plan.session_start,
        session_end: plan.session_end,
        max_daily_loss_percent: plan.max_daily_loss_percent,
        is_active: plan.is_active,
      };

      if (hasExistingPlan && plan.id) {
        const { error } = await supabase
          .from("trading_plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("trading_plans")
          .insert([planData]);

        if (error) throw error;
        setHasExistingPlan(true);
      }

      toast({
        title: "Trading plan saved",
        description: "Your trading rules have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = () => {
    if (newSymbol && !plan.allowed_symbols.includes(newSymbol.toUpperCase())) {
      setPlan({
        ...plan,
        allowed_symbols: [...plan.allowed_symbols, newSymbol.toUpperCase()],
      });
      setNewSymbol("");
    }
  };

  const removeSymbol = (symbol: string) => {
    setPlan({
      ...plan,
      allowed_symbols: plan.allowed_symbols.filter((s) => s !== symbol),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Plan</h1>
        <p className="text-muted-foreground">
          Set up your trading rules to enforce discipline and risk management
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Rules Configuration</CardTitle>
          <CardDescription>
            Define your trading parameters. These rules will be automatically enforced on all your trades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxTrades">Maximum Trades Per Day</Label>
                <Input
                  id="maxTrades"
                  type="number"
                  min="1"
                  max="50"
                  value={plan.max_trades_per_day}
                  onChange={(e) =>
                    setPlan({ ...plan, max_trades_per_day: parseInt(e.target.value) || 1 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of trades allowed per trading day
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRisk">Maximum Risk Per Trade (%)</Label>
                <Input
                  id="maxRisk"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={plan.max_risk_percent}
                  onChange={(e) =>
                    setPlan({ ...plan, max_risk_percent: parseFloat(e.target.value) || 0.1 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum percentage of account to risk per trade
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionStart">Session Start Time</Label>
                <Input
                  id="sessionStart"
                  type="time"
                  value={plan.session_start}
                  onChange={(e) =>
                    setPlan({ ...plan, session_start: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionEnd">Session End Time</Label>
                <Input
                  id="sessionEnd"
                  type="time"
                  value={plan.session_end}
                  onChange={(e) =>
                    setPlan({ ...plan, session_end: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maxDailyLoss">Maximum Daily Loss (%)</Label>
                <Input
                  id="maxDailyLoss"
                  type="number"
                  min="1"
                  max="20"
                  step="0.1"
                  value={plan.max_daily_loss_percent}
                  onChange={(e) =>
                    setPlan({ ...plan, max_daily_loss_percent: parseFloat(e.target.value) || 1.0 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum percentage of account value you're willing to lose in a single day
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Allowed Trading Symbols</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter symbol (e.g., EURUSD)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSymbol())}
                />
                <Button type="button" variant="outline" onClick={addSymbol}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.allowed_symbols.map((symbol) => (
                  <Badge key={symbol} variant="secondary" className="px-3 py-1">
                    {symbol}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0"
                      onClick={() => removeSymbol(symbol)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              {plan.allowed_symbols.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No symbols added. If empty, all symbols will be allowed.
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : hasExistingPlan ? "Update Trading Plan" : "Create Trading Plan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingPlan;