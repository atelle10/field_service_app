import { useVehicleSelectionController } from '@/controllers/use-vehicle-selection-controller';
import { CountPickerScreen } from '@/views/count-picker-screen';

export default function VehicleSelectScreen() {
  const controller = useVehicleSelectionController();

  return (
    <CountPickerScreen
      prompt="Great, now please enter the number of vehicles in your group:"
      selectedCount={controller.vehicleCount}
      counts={controller.vehicleCountOptions}
      onCountChange={controller.setVehicleCount}
      onConfirm={controller.confirmVehicleCount}
    />
  );
}
