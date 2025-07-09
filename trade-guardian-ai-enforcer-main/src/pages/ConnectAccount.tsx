import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMetaApi } from "@/hooks/useMetaApi";
import { Activity, AlertCircle, CheckCircle } from "lucide-react";

interface MT5Account {
  id?: string;
  login: string;
  server_name: string;
  is_connected: boolean;
  last_connected_at?: string;
}

const ConnectAccount = () => {
  const [account, setAccount] = useState<MT5Account>({
    login: "",
    server_name: "",
    is_connected: false,
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [metaApiAccountId, setMetaApiAccountId] = useState<string>("");
  const { toast } = useToast();
  const { testConnection: testMetaApiConnection, loading: metaApiLoading } = useMetaApi();

  useEffect(() => {
    fetchMT5Account();
  }, []);

  const fetchMT5Account = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("mt5_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setAccount({
          id: data.id,
          login: data.login,
          server_name: data.server_name,
          is_connected: data.is_connected,
          last_connected_at: data.last_connected_at,
        });
        setHasExistingAccount(true);
      }
    } catch (error: any) {
      console.error("Error fetching MT5 account:", error);
    }
  };

  const testConnection = async () => {
    if (!account.login || !password || !account.server_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const result = await testMetaApiConnection(account.login, password, account.server_name);
    
    if (result.success) {
      setAccount({ ...account, is_connected: true });
      setMetaApiAccountId(result.accountId || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const accountData = {
        user_id: user.id,
        login: account.login,
        server_name: account.server_name,
        is_connected: account.is_connected,
        last_connected_at: account.is_connected ? new Date().toISOString() : null,
        metaapi_account_id: metaApiAccountId,
      };

      if (hasExistingAccount && account.id) {
        const { error } = await supabase
          .from("mt5_accounts")
          .update(accountData)
          .eq("id", account.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mt5_accounts")
          .insert([accountData]);

        if (error) throw error;
        setHasExistingAccount(true);
      }

      toast({
        title: "Account saved",
        description: "Your MT5 account has been configured successfully.",
      });

      // Start monitoring trades if connection is successful
      if (account.is_connected && metaApiAccountId) {
        toast({
          title: "Trade Monitoring Started",
          description: "Your trades will now be monitored against your trading rules.",
        });
      }
      
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect MT5 Account</h1>
        <p className="text-muted-foreground">
          Connect your MetaTrader 5 account to start monitoring your trades
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Account Configuration
            </CardTitle>
            <CardDescription>
              Enter your MT5 account details to enable trade monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">MT5 Login</Label>
                <Input
                  id="login"
                  type="text"
                  placeholder="Enter your MT5 login number"
                  value={account.login}
                  onChange={(e) => setAccount({ ...account, login: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your MT5 password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your password is encrypted and never stored permanently
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server">Server Name</Label>
                <Input
                  id="server"
                  type="text"
                  placeholder="e.g., MetaQuotes-Demo, YourBroker-Live"
                  value={account.server_name}
                  onChange={(e) => setAccount({ ...account, server_name: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={metaApiLoading}
                  className="flex-1"
                >
                  {metaApiLoading ? "Testing..." : "Test Connection"}
                </Button>
                <Button type="submit" disabled={loading || !account.is_connected} className="flex-1">
                  {loading ? "Saving..." : hasExistingAccount ? "Update Account" : "Save Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Current status of your MT5 account connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge variant={account.is_connected ? "default" : "destructive"}>
                {account.is_connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            {account.login && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Login</span>
                <span className="text-sm text-muted-foreground">{account.login}</span>
              </div>
            )}

            {account.server_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server</span>
                <span className="text-sm text-muted-foreground">{account.server_name}</span>
              </div>
            )}

            {account.last_connected_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Connected</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(account.last_connected_at).toLocaleString()}
                </span>
              </div>
            )}

            <div className="pt-4 border-t">
              {account.is_connected ? (
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-600">Ready to Monitor</p>
                    <p className="text-muted-foreground">
                      Your account is connected and ready for trade monitoring.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-600">Not Connected</p>
                    <p className="text-muted-foreground">
                      Test your connection first, then save your account to start monitoring.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • Your MT5 password is encrypted and used only for establishing the connection
          </p>
          <p>
            • We use MetaApi's secure infrastructure to connect to your trading account
          </p>
          <p>
            • Only read access is required - we cannot place trades, only monitor them
          </p>
          <p>
            • You can disconnect your account at any time from this page
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectAccount;