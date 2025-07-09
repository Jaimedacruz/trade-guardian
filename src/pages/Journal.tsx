import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Trade {
  id: string;
  trade_id: string;
  symbol: string;
  trade_type: string;
  volume: number;
  open_price: number;
  close_price?: number;
  profit?: number;
  opened_at: string;
  closed_at?: string;
  is_open: boolean;
  follows_rules: boolean;
  violations: string[];
  auto_closed: boolean;
  auto_close_reason?: string;
}

const Journal = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ruleFilter, setRuleFilter] = useState("all");

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, statusFilter, ruleFilter]);

  const fetchTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false });

      if (error) throw error;

      setTrades(data || []);
    } catch (error: any) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTrades = () => {
    let filtered = [...trades];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (trade) =>
          trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trade.trade_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "open") {
        filtered = filtered.filter((trade) => trade.is_open);
      } else if (statusFilter === "closed") {
        filtered = filtered.filter((trade) => !trade.is_open);
      }
    }

    // Rule compliance filter
    if (ruleFilter !== "all") {
      if (ruleFilter === "compliant") {
        filtered = filtered.filter((trade) => trade.follows_rules);
      } else if (ruleFilter === "violations") {
        filtered = filtered.filter((trade) => !trade.follows_rules);
      }
    }

    setFilteredTrades(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTradeBadgeVariant = (trade: Trade) => {
    if (!trade.follows_rules) return "destructive";
    if (trade.is_open) return "secondary";
    return "default";
  };

  const getTradeBadgeText = (trade: Trade) => {
    if (!trade.follows_rules) return "Rule Violation";
    if (trade.is_open) return "Open";
    return "Closed";
  };

  if (loading) {
    return <div>Loading journal...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
        <p className="text-muted-foreground">
          Review all your trades and rule compliance history
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trades.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trades.filter((t) => t.is_open).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {trades.filter((t) => !t.follows_rules).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                trades
                  .filter((t) => !t.is_open && t.profit)
                  .reduce((sum, t) => sum + (t.profit || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search by symbol or trade ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ruleFilter} onValueChange={setRuleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rule Compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="compliant">Rule Compliant</SelectItem>
                <SelectItem value="violations">Rule Violations</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setRuleFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>
            Showing {filteredTrades.length} of {trades.length} trades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {trades.length === 0 ? "No trades found" : "No trades match your filters"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade ID</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Open Price</TableHead>
                    <TableHead>Close Price</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Violations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-mono text-sm">
                        {trade.trade_id}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {trade.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.trade_type === "BUY" ? "default" : "secondary"}>
                          {trade.trade_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.volume}</TableCell>
                      <TableCell>{trade.open_price?.toFixed(5)}</TableCell>
                      <TableCell>
                        {trade.close_price ? trade.close_price.toFixed(5) : "-"}
                      </TableCell>
                      <TableCell>
                        {trade.profit ? (
                          <span className={trade.profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(trade.profit)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(trade.opened_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTradeBadgeVariant(trade)}>
                          {getTradeBadgeText(trade)}
                        </Badge>
                        {trade.auto_closed && (
                          <Badge variant="outline" className="ml-1">
                            Auto-Closed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.violations && trade.violations.length > 0 ? (
                          <div className="space-y-1">
                            {trade.violations.map((violation, index) => (
                              <Badge key={index} variant="destructive" className="mr-1">
                                {violation}
                              </Badge>
                            ))}
                            {trade.auto_close_reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {trade.auto_close_reason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Compliant</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Journal;