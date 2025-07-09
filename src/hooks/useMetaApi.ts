import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMetaApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = async (login: string, password: string, serverName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('metaapi-service', {
        body: {
          action: 'test-connection',
          login,
          password,
          serverName,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Your MT5 account is connected and ready for monitoring.",
        });
        return { success: true, accountId: data.accountId };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to your MT5 account.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const monitorTrades = async (userId: string, accountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('metaapi-service', {
        body: {
          action: 'monitor-trades',
          userId,
          accountId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Trade monitoring error:', error);
      return { success: false, error: error.message };
    }
  };

  const syncTrades = async (userId: string, accountId: string) => {
    try {
      console.log('useMetaApi: syncTrades called with:', { userId, accountId });
      const { data, error } = await supabase.functions.invoke('metaapi-service', {
        body: {
          action: 'sync-trades',
          userId,
          accountId,
        },
      });

      console.log('useMetaApi: syncTrades response:', { data, error });
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('useMetaApi: Trade sync error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    testConnection,
    monitorTrades,
    syncTrades,
    loading,
  };
};