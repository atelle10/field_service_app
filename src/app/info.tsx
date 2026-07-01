import { useInfoController } from '@/controllers/use-info-controller';
import { InfoScreen } from '@/views/info-screen';

export default function InfoRoute() {
  return <InfoScreen {...useInfoController()} />;
}
