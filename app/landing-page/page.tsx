import { getDashboardData, aggregateByAdAndSegment } from '@/lib/data-processing';
import LandingPageClient from '../_components/LandingPageClient';

export default function LandingPagePage() {
  const { ads } = getDashboardData();
  const aggregated = aggregateByAdAndSegment(ads);
  return <LandingPageClient ads={aggregated} />;
}
