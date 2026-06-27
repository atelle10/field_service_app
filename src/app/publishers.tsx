import { usePublishersController } from '@/controllers/use-publishers-controller';
import { PublishersScreen } from '@/views/publishers-screen';

export default function PublishersRoute() {
  return <PublishersScreen {...usePublishersController()} />;
}
