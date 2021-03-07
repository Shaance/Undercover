import '@testing-library/jest-dom/extend-expect'

import { render } from '@testing-library/svelte'

import { undercoverCount, mrWhiteCount } from '../store'

import { get } from 'svelte/store'

import Settings from '../Settings.svelte';

test('Settings component has expected text', () => {
  const { getByText } = render(Settings);

  expect(getByText('Settings')).toBeInTheDocument();
  expect(getByText('Undercover')).toBeInTheDocument();
  expect(getByText('Mr White')).toBeInTheDocument();
});

test('Undercover and Mr.white are initialized at store value', () => {
  const { getByTestId } = render(Settings);

  const ucCount = Number.parseInt(getByTestId('undercoverCount').textContent);
  const expectedUcCount = get(undercoverCount);
  expect(ucCount).toEqual(expectedUcCount);

  const whiteCount = Number.parseInt(getByTestId('mrWhiteCount').textContent);
  const expectedMrWhiteCount = get(mrWhiteCount);
  expect(whiteCount).toEqual(expectedMrWhiteCount);
});
