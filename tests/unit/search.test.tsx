import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect } from 'vitest';
import { StationSearch } from '../../src/components/StationSearch';
import { db } from '../../src/db/database';
it('affiche un état vide pour la recherche locale', async () => {
  await db.stations.clear();
  render(<StationSearch label="Départ" onChange={() => {}} />);
  fireEvent.focus(screen.getByLabelText('Départ'));
  await waitFor(() =>
    expect(screen.getByText('Aucun arrêt local correspondant.')).toBeInTheDocument(),
  );
});

it('garde les suggestions lors du passage du focus à une option', async () => {
  await db.stations.put({
    id: 'test-focus',
    sourceId: 'focus',
    externalId: 'FOCUS',
    name: 'Arrêt focus',
    latitude: 48,
    longitude: 2,
    importedAt: '2026-10-09',
  });
  let selected = '';
  render(
    <StationSearch
      label="Origine de test"
      sourceId="focus"
      onChange={(s) => {
        selected = s.id;
      }}
    />,
  );
  const input = screen.getByLabelText('Origine de test');
  fireEvent.focus(input);
  const option = await screen.findByRole('button', { name: /Arrêt focus/ });
  fireEvent.blur(input, { relatedTarget: option });
  expect(option).toBeVisible();
  fireEvent.click(option);
  expect(selected).toBe('test-focus');
  await db.stations.delete('test-focus');
});
