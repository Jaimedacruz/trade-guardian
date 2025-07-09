import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMetaApi } from "@/hooks/useMetaApi";
import { useToast } from "@/hooks/use-toast";
import { Activity, Play, Square, RefreshCw } from "lucide-react";

const TradeMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [monitoringStats, setMonitoringStats] = useState({
    tradesChecked: 0,
    violations: 0,
    lastCheck: null as Date | null,
  });
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const { monitorTrades, syncTrades } = useMetaApi();
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const performSync = async (userId: string, accountId: string) => {
    try {
      console.log('performSync called with:', userId, accountId);
      const result = await syncTrades(userId, accountId);
      console.log('syncTrades result:', result);
      if (result.success) {
        toast({
          title: "Trades Synced",
          description: `${result.syncedTrades} trades synced from MT5 account.`,
        });
        return true;
      } else {
        console.error('Sync failed:', result.error);
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('performSync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const manualSync = async () => {
    try {
      setIsSyncing(true);
      console.log('Starting manual sync...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        toast({
          title: "Authentication Required",
          description: "Please log in to sync trades.",
          variant: "destructive",
        });
        return;
      }
      console.log('User authenticated:', user.id);

      const { data: mt5Account } = await supabase
        .from("mt5_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_connected", true)
        .single();

      console.log('MT5 Account found:', mt5Account);

      if (!mt5Account || !mt5Account.metaapi_account_id) {
        console.log('No connected MT5 account found');
        toast({
          title: "No Connected Account",
          description: "Please connect your MT5 account first.",
          variant: "destructive",
        });
        return;
      }

      console.log('Calling performSync with:', user.id, mt5Account.metaapi_account_id);
      await performSync(user.id, mt5Account.metaapi_account_id);
    } finally {
      setIsSyncing(false);
    }
  };

  const startMonitoring = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mt5Account } = await supabase
        .from("mt5_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_connected", true)
        .single();

      if (!mt5Account || !mt5Account.metaapi_account_id) {
        toast({
          title: "No Connected Account",
          description: "Please connect your MT5 account first.",
          variant: "destructive",
        });
        return;
      }

      setIsMonitoring(true);
      
      // Initial sync and monitoring
      await performMonitoring(user.id, mt5Account.metaapi_account_id);
      
      // Set up interval monitoring (every 30 seconds)
      const id = setInterval(async () => {
        await performMonitoring(user.id, mt5Account.metaapi_account_id);
      }, 30000);
      
      setIntervalId(id);
      
      toast({
        title: "Monitoring Started",
        description: "Your trades are now being monitored for rule violations.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const stopMonitoring = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsMonitoring(false);
    
    toast({
      title: "Monitoring Stopped",
      description: "Trade monitoring has been paused.",
    });
  };

  const performMonitoring = async (userId: string, accountId: string) => {
    try {
      // First sync trades
      await syncTrades(userId, accountId);
      
      // Then monitor for violations
      const result = await monitorTrades(userId, accountId);
      
      if (result.success) {
        setMonitoringStats({
          tradesChecked: result.tradesChecked,
          violations: result.violations,
          lastCheck: new Date(),
        });
        
        if (result.violations > 0) {
          toast({
            title: "Rule Violations Detected",
            description: `${result.violations} trade(s) violated rules and were automatically closed.`,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Monitoring error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Trade Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>

          <Button
            onClick={manualSync}
            variant="outline"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Trades
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {monitoringStats.lastCheck && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Trades Checked</p>
              <p className="text-muted-foreground">{monitoringStats.tradesChecked}</p>
            </div>
            <div>
              <p className="font-medium">Violations</p>
              <p className="text-red-600">{monitoringStats.violations}</p>
            </div>
            <div>
              <p className="font-medium">Last Check</p>
              <p className="text-muted-foreground">
                {monitoringStats.lastCheck.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Use "Sync Trades" to manually fetch your latest trades from MT5. Monitoring checks your trades every 30 seconds against your trading rules and automatically closes violating positions.
        </p>
      </CardContent>
    </Card>
  );
};

export default TradeMonitoring;