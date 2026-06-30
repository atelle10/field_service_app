import { useHistoryController } from '@/controllers/use-history-controller';
import { HistoryScreen } from '@/views/history-screen';

export default function HistoryRoute() {
  return <HistoryScreen {...useHistoryController()} />;
}
