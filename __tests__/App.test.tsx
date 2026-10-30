/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(renderer!.root).toBeTruthy();

  // The auth screens run looping background animations, so the tree has to be
  // unmounted or those timers outlive the test environment.
  await ReactTestRenderer.act(async () => {
    renderer!.unmount();
  });
});
