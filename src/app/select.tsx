import { usePublisherSelectionController } from '@/controllers/use-publisher-selection-controller';
import { CountPickerScreen } from '@/views/count-picker-screen';

export default function PublisherSelectScreen() {
  const controller = usePublisherSelectionController();

  return (
    <CountPickerScreen
      prompt="Welcome! To begin, please enter the number of publishers in your group:"
      selectedCount={controller.publisherCount}
      counts={controller.publisherCountOptions}
      onCountChange={controller.setPublisherCount}
      onConfirm={controller.confirmPublisherCount}
    />
  );
}
