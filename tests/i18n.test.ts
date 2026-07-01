/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatPublishersCount,
  formatVehiclesCount,
  Language,
  translate,
} from '@/i18n';

describe('i18n', () => {
  it('translates interpolated strings', () => {
    assert.equal(
      translate(Language.Spanish, 'capacityInfo', { capacity: 5 }),
      'El valor predeterminado es 5. Aplica a vehículos nuevos.',
    );
  });

  it('formats publisher and vehicle counts by language', () => {
    assert.equal(formatPublishersCount(Language.English, 1), '1 publisher');
    assert.equal(formatPublishersCount(Language.Spanish, 2), '2 publicadores');
    assert.equal(formatVehiclesCount(Language.English, 2), '2 vehicles');
    assert.equal(formatVehiclesCount(Language.Spanish, 1), '1 vehículo');
  });
});
