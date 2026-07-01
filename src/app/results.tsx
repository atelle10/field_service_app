import { useResultsController } from '@/controllers/use-results-controller';
import { ResultsScreen } from '@/views/results-screen';

export default function ResultsRoute() {
  const controller = useResultsController();

  return <ResultsScreen {...controller} />;
}
