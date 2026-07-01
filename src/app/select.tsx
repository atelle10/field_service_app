import { usePublisherSelectionController } from '@/controllers/use-publisher-selection-controller';
import { translate } from '@/i18n';
import { CountPickerScreen } from '@/views/count-picker-screen';

export default function PublisherSelectScreen() {
  const controller = usePublisherSelectionController();

  return (
    <CountPickerScreen
      prompt={translate(controller.language, 'welcomePublisherPrompt')}
      selectedCount={controller.publisherCount}
      counts={controller.publisherCountOptions}
      onCountChange={controller.setPublisherCount}
      onConfirm={controller.confirmPublisherCount}
    />
  );
}
