import { useState, useEffect, useCallback } from 'react';

export interface CampaignAnalytics {
  campaignId: string;
  totalDonations: number;
  totalAmount: number;
  uniqueDonors: number;
  averageDonation: number;
  dailyDonations: { date: string; amount: number }[];
  donorDistribution: { range: string; count: number }[];
}

export function useAnalytics(campaignId?: string) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement actual SDK call to fetch analytics
      // const result = await sdk.getCampaignAnalytics(campaignId);
      // setAnalytics(result);
      
      // Mock data for now
      const mockAnalytics: CampaignAnalytics = {
        campaignId: campaignId || '1',
        totalDonations: 150,
        totalAmount: 50000,
        uniqueDonors: 89,
        averageDonation: 333.33,
        dailyDonations: [
          { date: '2024-01-01', amount: 5000 },
          { date: '2024-01-02', amount: 7500 },
          { date: '2024-01-03', amount: 4200 },
          { date: '2024-01-04', amount: 8900 },
          { date: '2024-01-05', amount: 6100 },
        ],
        donorDistribution: [
          { range: '0-100', count: 45 },
          { range: '101-500', count: 30 },
          { range: '501-1000', count: 10 },
          { range: '1000+', count: 4 },
        ],
      };
      setAnalytics(mockAnalytics);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics,
  };
}
