export const Language = {
  English: 'en',
  Spanish: 'es',
} as const;

export type LanguageCode = (typeof Language)[keyof typeof Language];

type TranslationParams = Record<string, string | number>;

const translations = {
  en: {
    about: 'About',
    addNew: 'Add New',
    addPublisher: 'Add Publisher',
    algorithmDetails: 'Distribution algorithm details',
    appDescription:
      'Field Service Assistant helps organize field service groups by assigning publishers to vehicles and overseers, then allowing the distribution to be reviewed, adjusted, saved, and restored later.',
    appOpenSource:
      'This app is open-source. The project source is available on GitHub.',
    appLogo: 'Field Service Assistant logo',
    autoSaveResults: 'Auto-save Results',
    autoSaveFailed: 'Auto-save failed',
    cacheCleared: 'Cache cleared',
    cacheClearedMessage:
      'Stored publishers, saved results, and preferences were removed from this device.',
    cacheClearFailed: 'Cache could not be cleared',
    calculatingDistribution: 'Calculating distribution...',
    cancel: 'Cancel',
    cancelVehicleNameEdit: 'Cancel vehicle name edit',
    capacityDetails: 'Default seat capacity details',
    capacityInfo: 'Default is {capacity}. Applies to newly created vehicles.',
    chooseLanguage: 'Choose your language',
    clearAll: 'Clear All',
    clearCache: 'Clear Cache',
    clearCachedData: 'Clear cached app data',
    clearCachedDataQuestion: 'Clear cached data?',
    clearCachedDataMessage:
      'This removes stored publishers, saved results, and preferences from this device.',
    clearSavedResultsQuestion: 'Clear saved results?',
    clearSavedResultsMessage: 'This removes all saved results from this device.',
    closeCountPicker: 'Close count picker',
    closeMenu: 'Close menu',
    closePublisherEditor: 'Close publisher editor',
    confirm: 'Confirm',
    confirmDeleteActions: 'Confirm Delete Actions',
    delete: 'Delete',
    defaultSeatCapacity: 'Default Seat Capacity',
    decreaseDefaultSeatCapacity: 'Decrease default seat capacity',
    deleteAll: 'Delete All',
    deleteAllPublishersQuestion: 'Delete all publishers?',
    deleteAllPublishersMessage:
      'This removes all saved publisher names from this device.',
    deleteSavedResult: 'Delete saved result',
    deleteSavedResultQuestion: 'Delete saved result?',
    deleteSavedResultMessage: 'This removes the saved result from this device.',
    distributionAlgorithm: 'Distribution Algorithm',
    distributionSummary: 'Distribution Summary',
    dropOnVehicleWithOpenSeats: 'Drop on a vehicle with open seats.',
    editPublisher: 'Edit Publisher',
    enterPublisherName: 'Enter publisher name',
    githubRepo: 'Github Repo',
    history: 'History',
    historyCleared: 'History cleared',
    historyClearedMessage: 'All saved results were removed from this device.',
    historyClearFailed: 'History could not be cleared',
    home: 'Home',
    info: 'Info',
    language: 'Language',
    languageMeta: 'You can change this later in Options.',
    markSelected: 'Mark {label} selected',
    maximizeComfort: 'Maximize Comfort',
    maximizeComfortInfo:
      'Maximize Comfort spreads publishers across available vehicles more evenly.',
    menu: 'Menu',
    minimizeVehicles: 'Minimize Vehicles',
    minimizeVehiclesInfo: 'Minimize Vehicles uses the fewest vehicles possible.',
    noActiveDistribution: 'No active distribution',
    noActiveDistributionText:
      'This home screen is ready, but no publisher or vehicle counts have been selected yet. Use Start Over to begin a new distribution.',
    noAvailableVehicleSeats: 'No available vehicle seats remain.',
    publisherRequired: 'At least one publisher is required.',
    noPublishers: 'No publishers',
    noSavedPublishers: 'No saved publishers',
    noSavedPublishersText: 'Publisher names saved from seat labels will appear here.',
    noSavedResults: 'No saved results',
    noSavedResultsText: 'Saved distributions will appear here after you tap Save.',
    noSeatsAvailable: 'No seats available',
    notEnoughSeats: 'Not enough seats',
    open: 'Open',
    ok: 'OK',
    openMenu: 'Open menu',
    openSourceCredits: 'Open Source Credits',
    openSourceIntro:
      'Field Service Assistant uses open-source libraries and frameworks, including:',
    options: 'Options',
    publisher: 'publisher',
    publisherName: 'Publisher name',
    publishers: 'Publishers',
    recalculate: 'Recalculate',
    remove: 'Remove',
    removePublisher: 'Remove {name}',
    removePublisherQuestion: 'Remove publisher?',
    removePublisherMessage: 'This removes the saved publisher name from this device.',
    restore: 'Restore',
    restoreDefaultPublisherLabel: 'Restore default publisher label',
    resultDeleted: 'Result deleted',
    resultDeletedMessage: 'The saved result was removed from this device.',
    resultDeleteFailed: 'Result could not be deleted',
    resultSaveFailed: 'Result could not be saved',
    resultSaved: 'Result saved',
    resultSavedMessage: 'This distribution result was saved on this device.',
    savedPublishers: 'Saved Publishers',
    savedResult: 'Saved result',
    save: 'Save',
    saveVehicleName: 'Save vehicle name',
    selectLanguagePrompt: 'Select a language to continue.',
    serviceView: 'Service View',
    serviceViewActive: 'Service View Active',
    serviceViewStartFailed: 'Service View could not start',
    showUnusedVehicles: 'Show Unused Vehicles',
    sortPublishersAlphabetically: 'Sort Publishers Alphabetically',
    start: 'Start',
    startOver: 'Start Over',
    storageGenericError: 'This storage action failed. Please try again.',
    storagePermissionError:
      'Storage is unavailable on this device. Please try again after restarting the app.',
    storedData: 'Stored Data',
    strategyApplyNote: 'Strategy changes mark current results for recalculation.',
    selectionsChanged:
      'Selections changed - press Recalculate to update this distribution.',
    summaryStartsExpanded: 'Summary Starts Expanded',
    totalSeats: 'Total Seats',
    unableToGenerateDistribution: 'Unable to generate a distribution.',
    unused: 'unused',
    version: 'Version {version}',
    vehicle: 'vehicle',
    vehicleFull: 'Vehicle is full.',
    increaseDefaultSeatCapacity: 'Increase default seat capacity',
    vehicleName: '{label} name',
    vehicles: 'Vehicles',
    vehiclesUsed: 'Vehicles Used',
    vehicleCapacityInvalid: '{label} must have a valid seat capacity.',
    vehicleRequired: 'At least one vehicle is required.',
    capacityShortage:
      '{publishers} publishers need {seatsNeeded} seats, but {vehicles} vehicles provide {seatsAvailable}.',
    welcomePublisherPrompt:
      'Welcome! To begin, please enter the number of publishers in your group:',
    vehiclePrompt: 'Great, now please enter the number of vehicles in your group:',
  },
  es: {
    about: 'Acerca de',
    addNew: 'Agregar',
    addPublisher: 'Agregar publicador',
    algorithmDetails: 'Detalles del algoritmo de distribución',
    appDescription:
      'Field Service Assistant ayuda a organizar grupos de servicio del campo asignando publicadores a vehículos y encargados, y permite revisar, ajustar, guardar y restaurar la distribución más tarde.',
    appOpenSource:
      'Esta app es de código abierto. El código del proyecto está disponible en GitHub.',
    appLogo: 'Logo de Field Service Assistant',
    autoSaveResults: 'Guardar resultados automáticamente',
    autoSaveFailed: 'Error al guardar automáticamente',
    cacheCleared: 'Caché borrada',
    cacheClearedMessage:
      'Los publicadores guardados, resultados guardados y preferencias se eliminaron de este dispositivo.',
    cacheClearFailed: 'No se pudo borrar la caché',
    calculatingDistribution: 'Calculando distribución...',
    cancel: 'Cancelar',
    cancelVehicleNameEdit: 'Cancelar edición del nombre del vehículo',
    capacityDetails: 'Detalles de la capacidad predeterminada',
    capacityInfo: 'El valor predeterminado es {capacity}. Aplica a vehículos nuevos.',
    chooseLanguage: 'Elige tu idioma',
    clearAll: 'Borrar todo',
    clearCache: 'Borrar caché',
    clearCachedData: 'Borrar datos guardados de la app',
    clearCachedDataQuestion: '¿Borrar datos guardados?',
    clearCachedDataMessage:
      'Esto elimina publicadores guardados, resultados guardados y preferencias de este dispositivo.',
    clearSavedResultsQuestion: '¿Borrar resultados guardados?',
    clearSavedResultsMessage: 'Esto elimina todos los resultados guardados de este dispositivo.',
    closeCountPicker: 'Cerrar selector de cantidad',
    closeMenu: 'Cerrar menú',
    closePublisherEditor: 'Cerrar editor de publicador',
    confirm: 'Confirmar',
    confirmDeleteActions: 'Confirmar acciones de borrado',
    delete: 'Borrar',
    defaultSeatCapacity: 'Capacidad predeterminada',
    decreaseDefaultSeatCapacity: 'Disminuir capacidad predeterminada',
    deleteAll: 'Borrar todo',
    deleteAllPublishersQuestion: '¿Borrar todos los publicadores?',
    deleteAllPublishersMessage:
      'Esto elimina todos los nombres de publicadores guardados de este dispositivo.',
    deleteSavedResult: 'Borrar resultado guardado',
    deleteSavedResultQuestion: '¿Borrar resultado guardado?',
    deleteSavedResultMessage: 'Esto elimina el resultado guardado de este dispositivo.',
    distributionAlgorithm: 'Algoritmo de distribución',
    distributionSummary: 'Resumen de distribución',
    dropOnVehicleWithOpenSeats: 'Suelta sobre un vehículo con asientos disponibles.',
    editPublisher: 'Editar publicador',
    enterPublisherName: 'Ingresa el nombre del publicador',
    githubRepo: 'Repositorio de GitHub',
    history: 'Historial',
    historyCleared: 'Historial borrado',
    historyClearedMessage: 'Todos los resultados guardados se eliminaron de este dispositivo.',
    historyClearFailed: 'No se pudo borrar el historial',
    home: 'Inicio',
    info: 'Info',
    language: 'Idioma',
    languageMeta: 'Puedes cambiarlo más tarde en Opciones.',
    markSelected: 'Marcar {label} seleccionado',
    maximizeComfort: 'Maximizar comodidad',
    maximizeComfortInfo:
      'Maximizar comodidad distribuye los publicadores entre los vehículos disponibles de forma más pareja.',
    menu: 'Menú',
    minimizeVehicles: 'Minimizar vehículos',
    minimizeVehiclesInfo: 'Minimizar vehículos usa la menor cantidad de vehículos posible.',
    noActiveDistribution: 'No hay distribución activa',
    noActiveDistributionText:
      'Esta pantalla de inicio está lista, pero aún no se han seleccionado cantidades de publicadores o vehículos. Usa Empezar de nuevo para iniciar una nueva distribución.',
    noAvailableVehicleSeats: 'No quedan asientos disponibles en los vehículos.',
    publisherRequired: 'Se requiere al menos un publicador.',
    noPublishers: 'Sin publicadores',
    noSavedPublishers: 'No hay publicadores guardados',
    noSavedPublishersText:
      'Los nombres de publicadores guardados desde las etiquetas de asientos aparecerán aquí.',
    noSavedResults: 'No hay resultados guardados',
    noSavedResultsText: 'Las distribuciones guardadas aparecerán aquí después de tocar Guardar.',
    noSeatsAvailable: 'No hay asientos disponibles',
    notEnoughSeats: 'No hay suficientes asientos',
    open: 'Disponible',
    ok: 'OK',
    openMenu: 'Abrir menú',
    openSourceCredits: 'Créditos de código abierto',
    openSourceIntro:
      'Field Service Assistant usa bibliotecas y frameworks de código abierto, incluyendo:',
    options: 'Opciones',
    publisher: 'publicador',
    publisherName: 'Nombre del publicador',
    publishers: 'Publicadores',
    recalculate: 'Recalcular',
    remove: 'Eliminar',
    removePublisher: 'Eliminar {name}',
    removePublisherQuestion: '¿Eliminar publicador?',
    removePublisherMessage: 'Esto elimina el nombre guardado del publicador de este dispositivo.',
    restore: 'Restaurar',
    restoreDefaultPublisherLabel: 'Restaurar etiqueta predeterminada del publicador',
    resultDeleted: 'Resultado eliminado',
    resultDeletedMessage: 'El resultado guardado se eliminó de este dispositivo.',
    resultDeleteFailed: 'No se pudo eliminar el resultado',
    resultSaveFailed: 'No se pudo guardar el resultado',
    resultSaved: 'Resultado guardado',
    resultSavedMessage: 'Este resultado de distribución se guardó en este dispositivo.',
    savedPublishers: 'Publicadores guardados',
    savedResult: 'Resultado guardado',
    save: 'Guardar',
    saveVehicleName: 'Guardar nombre del vehículo',
    selectLanguagePrompt: 'Selecciona un idioma para continuar.',
    serviceView: 'Vista de servicio',
    serviceViewActive: 'Vista de servicio activa',
    serviceViewStartFailed: 'No se pudo iniciar la vista de servicio',
    showUnusedVehicles: 'Mostrar vehículos sin usar',
    sortPublishersAlphabetically: 'Ordenar publicadores alfabéticamente',
    start: 'Iniciar',
    startOver: 'Empezar de nuevo',
    storageGenericError: 'La acción de almacenamiento falló. Inténtalo de nuevo.',
    storagePermissionError:
      'El almacenamiento no está disponible en este dispositivo. Inténtalo de nuevo después de reiniciar la app.',
    storedData: 'Datos guardados',
    strategyApplyNote: 'Cambiar la estrategia marca los resultados actuales para recalcular.',
    selectionsChanged:
      'Las selecciones cambiaron - toca Recalcular para actualizar esta distribución.',
    summaryStartsExpanded: 'Resumen expandido al iniciar',
    totalSeats: 'Asientos totales',
    unableToGenerateDistribution: 'No se pudo generar una distribución.',
    unused: 'sin usar',
    version: 'Versión {version}',
    vehicle: 'vehículo',
    vehicleFull: 'El vehículo está lleno.',
    increaseDefaultSeatCapacity: 'Aumentar capacidad predeterminada',
    vehicleName: 'Nombre de {label}',
    vehicles: 'Vehículos',
    vehiclesUsed: 'Vehículos usados',
    vehicleCapacityInvalid: '{label} debe tener una capacidad de asientos válida.',
    vehicleRequired: 'Se requiere al menos un vehículo.',
    capacityShortage:
      '{publishers} publicadores necesitan {seatsNeeded} asientos, pero {vehicles} vehículos ofrecen {seatsAvailable}.',
    welcomePublisherPrompt:
      '¡Bienvenido! Para comenzar, ingresa la cantidad de publicadores en tu grupo:',
    vehiclePrompt: 'Muy bien, ahora ingresa la cantidad de vehículos en tu grupo:',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === Language.English || value === Language.Spanish;
}

export function translate(
  language: LanguageCode,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const template: string = translations[language][key] ?? translations.en[key];

  return Object.entries(params).reduce(
    (text, [paramKey, value]) =>
      text.replaceAll(`{${paramKey}}`, String(value)),
    template,
  );
}

export function formatDefaultPublisherLabel(language: LanguageCode, index: number) {
  return language === Language.Spanish ? `Publicador ${index}` : `Publisher ${index}`;
}

export function formatDefaultVehicleLabel(language: LanguageCode, index: number) {
  return language === Language.Spanish ? `Vehículo ${index}` : `Vehicle ${index}`;
}

export function formatPublishersCount(language: LanguageCode, count: number) {
  if (language === Language.Spanish) {
    return `${count} ${count === 1 ? 'publicador' : 'publicadores'}`;
  }

  return `${count} ${count === 1 ? 'publisher' : 'publishers'}`;
}

export function formatVehiclesCount(language: LanguageCode, count: number) {
  if (language === Language.Spanish) {
    return `${count} ${count === 1 ? 'vehículo' : 'vehículos'}`;
  }

  return `${count} ${count === 1 ? 'vehicle' : 'vehicles'}`;
}

export function formatSeatLabel(language: LanguageCode, count: number) {
  if (language === Language.Spanish) {
    return count === 1 ? 'asiento' : 'asientos';
  }

  return count === 1 ? 'seat' : 'seats';
}

export function formatStorageActionErrorMessage(
  language: LanguageCode,
  error: unknown,
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return translate(language, 'storageGenericError');
}
