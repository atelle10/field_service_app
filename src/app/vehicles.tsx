import { useVehicleSelectionController } from '@/controllers/use-vehicle-selection-controller';
import { translate } from '@/i18n';
import { CountPickerScreen } from '@/views/count-picker-screen';

export default function VehicleSelectScreen() {
  const controller = useVehicleSelectionController();

  return (
    <CountPickerScreen
      prompt={translate(controller.language, 'vehiclePrompt')}
      selectedCount={controller.vehicleCount}
      counts={controller.vehicleCountOptions}
      onCountChange={controller.setVehicleCount}
      onConfirm={controller.confirmVehicleCount}
    />
  );
}
