/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

const textOf = node =>
  [node.props.children]
    .flat(Infinity)
    .filter(child => typeof child === 'string')
    .join('');

/** Headings are animated word-by-word, so all copy is joined into one string. */
const findAllText = root =>
  root
    .findAllByType('Text')
    .map(textOf)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ');

const pressByLabel = async (root, label) => {
  const target = root
    .findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')
    .pop();
  if (!target) {
    throw new Error(`No pressable found with label "${label}"`);
  }
  await ReactTestRenderer.act(async () => {
    target.props.onPress();
  });
};

const typeInto = async (root, label, value) => {
  const field = root.findAll(
    node => node.props.accessibilityLabel === label && typeof node.props.onChangeText === 'function',
  )[0];
  if (!field) {
    throw new Error(`No input found with label "${label}"`);
  }
  await ReactTestRenderer.act(async () => {
    field.props.onChangeText(value);
  });
};

const flushTimers = async (ms = 1500) => {
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

/** Mounts the app and keeps the renderer alive until the test is torn down. */
let renderer;

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer.root;
};

describe('NexaLiving authentication flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Unmounting stops the looping background animations, so no timers leak.
    if (renderer) {
      await ReactTestRenderer.act(async () => renderer.unmount());
      renderer = null;
    }
    jest.useRealTimers();
  });

  it('starts on the welcome screen and moves to login', async () => {
    const root = await renderApp();

    expect(findAllText(root)).toContain('Welcome To NexaLiving');

    await pressByLabel(root, 'Next');
    expect(findAllText(root)).toContain('Welcome Back!');
  });

  it('rejects an empty login and surfaces field errors', async () => {
    const root = await renderApp();
    await pressByLabel(root, 'Next');

    await pressByLabel(root, 'Login');
    expect(findAllText(root)).toContain('Email address is required.');

    await typeInto(root, 'Email Address', 'not-an-email');
    await pressByLabel(root, 'Login');
    expect(findAllText(root)).toContain('valid email address');
  });

  it('validates a form then reports that no auth provider is configured', async () => {
    const root = await renderApp();
    await pressByLabel(root, 'Next');

    await typeInto(root, 'Email Address', 'waleed@nexaliving.app');
    await typeInto(root, 'Password', 'Nexa2026x');
    await pressByLabel(root, 'Login');
    await flushTimers();

    const copy = findAllText(root);
    expect(copy).toContain('Authentication setup pending');
    expect(copy).not.toContain('Login successful');
  });

  it('navigates to the password recovery screen and back', async () => {
    const root = await renderApp();
    await pressByLabel(root, 'Next');

    await pressByLabel(root, 'Forgot Password?');
    expect(findAllText(root)).toContain('Reset Your Password');

    await pressByLabel(root, 'Remembered it? Back to Login');
    expect(findAllText(root)).toContain('Welcome Back!');
  });

  it('validates CNIC and password match before completing sign up', async () => {
    const root = await renderApp();
    await pressByLabel(root, 'Next');
    await pressByLabel(root, ' Sign Up');
    expect(findAllText(root)).toContain('Create Your NexaLiving Account');

    await pressByLabel(root, 'Next');
    expect(findAllText(root)).toContain('fields need attention');

    await typeInto(root, 'Full Name', 'Waleed Ahmed');
    await typeInto(root, 'Phone Number', '03001234567');
    await typeInto(root, 'CNIC Number', '3520212345671');
    await typeInto(root, 'Complete Address', 'House 12, Block C, DHA Phase 6, Lahore');
    await typeInto(root, 'Email Address', 'waleed@nexaliving.app');
    await typeInto(root, 'Password', 'Nexa2026x');
    await typeInto(root, 'Confirm Password', 'Nexa2026y');

    // CNIC is auto-formatted while typing.
    const cnic = root.findAll(
      node => node.props.accessibilityLabel === 'CNIC Number' && node.props.value !== undefined,
    )[0];
    expect(cnic.props.value).toBe('35202-1234567-1');

    await pressByLabel(root, 'Next');
    expect(findAllText(root)).toContain('Passwords do not match.');

    await typeInto(root, 'Confirm Password', 'Nexa2026x');
    await pressByLabel(root, 'Next');
    await flushTimers();

    const copy = findAllText(root);
    expect(copy).toContain('Welcome to NexaLiving, Waleed!');
    expect(copy).toContain('Account not created yet');
  });
});
