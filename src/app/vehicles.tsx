import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CountPickerScreen } from '@/components/count-picker-screen';

const vehicleCounts = Array.from({ length: 20 }, (_, index) => index + 1);

export default function VehicleSelectScreen() {
  const { publishers } = useLocalSearchParams<{ publishers?: string }>();
  const [vehicleCount, setVehicleCount] = useState(1);

  const confirmVehicleCount = () => {
    console.debug('Group counts confirmed', {
      publishers: publishers ? Number(publishers) : undefined,
      vehicles: vehicleCount,
    });
  };

  return (
    <CountPickerScreen
      prompt="Great, now please enter the number of vehicles in your group:"
      selectedCount={vehicleCount}
      counts={vehicleCounts}
      onCountChange={setVehicleCount}
      onConfirm={confirmVehicleCount}
    />
  );
}
