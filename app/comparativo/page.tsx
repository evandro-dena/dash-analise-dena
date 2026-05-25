import { getDashboardData, aggregateByAdAndSegment } from '@/lib/data-processing';
import ComparativoClient from '../_components/ComparativoClient';

export default function ComparativoPage() {
  const { ads } = getDashboardData();
  const aggregated = aggregateByAdAndSegment(ads);
  return <ComparativoClient ads={aggregated} />;
}
