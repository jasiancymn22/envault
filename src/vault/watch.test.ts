import { watchVault, formatWatchEvent, WatchEvent } from './watch';
import * as fs from 'fs';

jest.mock('fs');

const mockFsWatch = fs.watch as jest.Mock;

function makeMockWatcher() {
  const listeners: Record<string, Function[]> = {};
  return {
    on: jest.fn((event: string, cb: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),
    close: jest.fn(),
    emit: (event: string, ...args: unknown[]) => {
      (listeners[event] || []).forEach((cb) => cb(...args));
    },
    triggerChange: (type = 'change') => {
      (listeners['__fsEvent'] || []).forEach((cb) => cb(type));
    },
  };
}

describe('watchVault', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('calls callback on vault change after debounce', () => {
    const mockWatcher = makeMockWatcher();
    let fsWatchCallback: Function;
    mockFsWatch.mockImplementation((_path: string, cb: Function) => {
      fsWatchCallback = cb;
      return mockWatcher;
    });

    const callback = jest.fn();
    const handle = watchVault('/fake/vault.env.vault', callback, 300);

    fsWatchCallback!('change');
    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].type).toBe('change');

    handle.stop();
  });

  it('debounces rapid events', () => {
    let fsWatchCallback: Function;
    const mockWatcher = makeMockWatcher();
    mockFsWatch.mockImplementation((_path: string, cb: Function) => {
      fsWatchCallback = cb;
      return mockWatcher;
    });

    const callback = jest.fn();
    const handle = watchVault('/fake/vault.env.vault', callback, 300);

    fsWatchCallback!('change');
    jest.advanceTimersByTime(100);
    fsWatchCallback!('change');
    jest.advanceTimersByTime(100);
    fsWatchCallback!('change');
    jest.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);
    handle.stop();
  });

  it('stop() prevents further callbacks', () => {
    let fsWatchCallback: Function;
    const mockWatcher = makeMockWatcher();
    mockFsWatch.mockImplementation((_path: string, cb: Function) => {
      fsWatchCallback = cb;
      return mockWatcher;
    });

    const callback = jest.fn();
    const handle = watchVault('/fake/vault.env.vault', callback, 100);
    handle.stop();
    expect(handle.isActive()).toBe(false);
    fsWatchCallback!('change');
    jest.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('formatWatchEvent', () => {
  it('formats a watch event string', () => {
    const event: WatchEvent = {
      type: 'change',
      vaultPath: '/project/.env.vault',
      timestamp: new Date('2024-01-15T10:00:00.000Z'),
    };
    const result = formatWatchEvent(event);
    expect(result).toBe('[2024-01-15T10:00:00.000Z] vault changed: /project/.env.vault');
  });
});
