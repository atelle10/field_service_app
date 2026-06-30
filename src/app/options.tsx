import { useOptionsController } from '@/controllers/use-options-controller';
import { OptionsScreen } from '@/views/options-screen';

export default function OptionsRoute() {
  return <OptionsScreen {...useOptionsController()} />;
}
