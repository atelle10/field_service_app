import { useLocalSearchParams } from 'expo-router';

import { useResultsController } from '@/controllers/use-results-controller';
import { ResultsScreen } from '@/views/results-screen';

export default function ResultsRoute() {
  const { publishers, vehicles } = useLocalSearchParams<{
    publishers?: string;
    vehicles?: string;
  }>();
  const routeKey = `${publishers ?? ''}-${vehicles ?? ''}`;

  return <ResultsRouteContent key={routeKey} />;
}

function ResultsRouteContent() {
  const controller = useResultsController();

  return <ResultsScreen {...controller} />;
}
