import { useLanguageController } from '@/controllers/use-language-controller';
import { LanguageScreen } from '@/views/language-screen';

export default function LanguageRoute() {
  const controller = useLanguageController();

  return <LanguageScreen {...controller} />;
}
