import { getDashboardData, aggregateByAdAndSegment } from '@/lib/data-processing';
import CriativoClient from '../_components/CriativoClient';

export default function CriativoPage() {
  const { ads } = getDashboardData();
  const aggregated = aggregateByAdAndSegment(ads);
  return <CriativoClient ads={aggregated} />;
}
