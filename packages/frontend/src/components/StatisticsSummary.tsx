import React, { useEffect, useState } from 'react';
import { statisticsService } from '@/services/statisticsService';
import type { GeneralStatistics } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, FolderTree, FileText, Network } from 'lucide-react';

const StatisticsSummary: React.FC = () => {
  const [stats, setStats] = useState<GeneralStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const fetchedStats = statisticsService.getGeneralStatistics();
      setStats(fetchedStats);
    } catch (error) {
      console.error("Error fetching general statistics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-3/4" /> {/* For CardTitle */}
              <Skeleton className="h-4 w-4" /> {/* For Icon */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" /> {/* For the main stat number */}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (!stats) return <p className="text-center text-red-500">Could not load statistics.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalProjects}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
          <FolderTree className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalAreas}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sub-Areas</CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalSubAreas}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Models</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalModels}</div></CardContent>
      </Card>
    </div>
  );
};
export default StatisticsSummary;
