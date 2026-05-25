import { getDashboardData, aggregateByAdAndSegment } from '@/lib/data-processing';
import SegmentoClient from '../_components/SegmentoClient';

export default function SegmentoPage() {
  const { ads } = getDashboardData();
  const aggregated = aggregateByAdAndSegment(ads);
  return <SegmentoClient ads={aggregated} />;
}
