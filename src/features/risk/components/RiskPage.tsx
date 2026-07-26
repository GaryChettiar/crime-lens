// import { useState, useMemo } from 'react';
// import { DashboardLayout } from '@/components/templates/DashboardLayout';
// import { Typography } from '@/components/atoms/Typography';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Badge } from '@/components/atoms/Badge';
// import { Button } from '@/components/ui/button';
// import { Info } from 'lucide-react';
// import { RiskDriversCard } from '@/features/intelligence';


// export function RiskPage() {
//   const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
//   const isAvailable = false;

//   const selectedMetrics = useMemo(() => {
//     if (selectedDistrict === 'all') {
//       return { historical: 55, forecast: 53, crowd: 38 };
//     }
//     return { historical: 40, forecast: 40, crowd: 30 };
//   }, [selectedDistrict]);

//   const getRiskLevelBadge = (level: 'low' | 'medium' | 'high' | 'critical') => {
//     switch (level) {
//       case 'critical':
//         return <Badge variant="risk-critical" size="sm">Critical</Badge>;
//       case 'high':
//         return <Badge variant="risk-high" size="sm">High</Badge>;
//       case 'medium':
//         return <Badge variant="risk-medium" size="sm">Medium</Badge>;
//       case 'low':
//       default:
//         return <Badge variant="risk-low" size="sm">Low</Badge>;
//     }
//   };

//   return (
//     <DashboardLayout title="Risk Assessment">
//       <div className="space-y-6 max-w-7xl mx-auto">
//         {/* Header Title Block */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-4">
//           <div>
//             <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
//               Strategic Risk & Safety Index
//             </Typography>
//             <Typography variant="body-sm" color="muted" className="mt-1 flex items-center gap-1.5">
//               <Badge variant="outline" className="text-warning border-warning/20 bg-warning/5 font-semibold">Active OSINT Enrichment</Badge>
//               Sector-by-sector composite risk metrics synthesizing historical caseloads, forecast models, and real-time open source news reports.
//             </Typography>
//           </div>
//           {selectedDistrict !== 'all' && (
//             <Button
//               onClick={() => setSelectedDistrict('all')}
//               variant="outline"
//               size="sm"
//               className="text-xs"
//             >
//               Reset to All Districts
//             </Button>
//           )}
//         </div>

//         {/* Layout Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
//           {/* LEFT: Sector Safety Matrix moved to Forecast page */}
//           <Card className="lg:col-span-2 bg-card/20 border-border/60 backdrop-blur-sm shadow-sm p-4 flex items-center justify-center">
//             <CardHeader className="p-0">
//               <CardTitle className="text-sm font-semibold text-muted-foreground">Sector Safety Matrix</CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//               <div className="text-xs text-muted-foreground">Moved to Crime Forecast page — see Forecast > Crime Forecast for the Sector Safety Matrix.</div>
//             </CardContent>
//           </Card>

//           {/* RIGHT: Selected Risk Drivers (1/3 width) */}
//           <div className="lg:col-span-1 space-y-4">
//             <RiskDriversCard
//               selectedDistrict={selectedDistrict}
//               historicalScore={selectedMetrics.historical}
//               forecastScore={selectedMetrics.forecast}
//               crowdScore={selectedMetrics.crowd}
//             />

//             <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-4 text-xs space-y-2">
//               <Typography variant="body-sm" className="font-bold text-foreground flex items-center gap-1">
//                 <Info className="h-3.5 w-3.5 text-primary" />
//                 Strategic Weighting Guide
//               </Typography>
//               <Typography variant="caption" color="muted" className="leading-relaxed">
//                 CrimeLens calculates threats by blending local records with live indicators. 
//                 <strong className="text-foreground"> OSINT News Intelligence (20%)</strong> functions as an early-warning signal, raising district alert states ahead of official police reporting pipelines.
//               </Typography>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }
// export default RiskPage;
