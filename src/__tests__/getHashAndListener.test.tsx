jest.mock('react-native', () => {
  const state = { platformOS: 'android' as 'android' | 'ios' };
  (global as typeof globalThis & { __mockPlatformState?: typeof state }).__mockPlatformState = state;
  const mockAddListener = jest.fn(() => ({ remove: jest.fn() }));
  (global as typeof globalThis & { __mockAddListener?: typeof mockAddListener }).__mockAddListener =
    mockAddListener;
  return {
    Platform: {
      get OS() {
        return state.platformOS;
      },
    },
    NativeModules: { OtpAutoVerify: {} },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: mockAddListener,
    })),
  };
});

jest.mock('../NativeOtpAutoVerify', () => {
  const getHash = jest.fn();
  const removeListeners = jest.fn();
  (
    global as typeof globalThis & {
      __mockNativeOtp?: { getHash: typeof getHash; removeListeners: typeof removeListeners };
    }
  ).__mockNativeOtp = { getHash, removeListeners };
  return {
    __esModule: true,
    default: {
      getConstants: () => ({ OTP_RECEIVED_EVENT: 'otpReceived' }),
      getHash: (...args: unknown[]) => getHash(...args),
      startSmsRetriever: jest.fn().mockResolvedValue(true),
      removeListeners: (...args: unknown[]) => removeListeners(...args),
    },
  };
});

const getMockNativeOtp = () =>
  (
    global as typeof globalThis & {
      __mockNativeOtp?: { getHash: jest.Mock; removeListeners: jest.Mock };
    }
  ).__mockNativeOtp!;

import { getHash, removeListener, useOtpVerification } from '../index';

const getMockState = () =>
  (global as typeof globalThis & { __mockPlatformState?: { platformOS: 'android' | 'ios' } })
    .__mockPlatformState!;

describe('getHash', () => {
  beforeEach(() => {
    getMockState().platformOS = 'android';
    getMockNativeOtp().getHash.mockReset();
  });

  it('returns hash array on Android', async () => {
    getMockNativeOtp().getHash.mockResolvedValue(['hash1', 'hash2']);
    const result = await getHash();
    expect(result).toEqual(['hash1', 'hash2']);
    expect(getMockNativeOtp().getHash).toHaveBeenCalled();
  });

  it('returns empty array on iOS', async () => {
    getMockState().platformOS = 'ios';
    const result = await getHash();
    expect(result).toEqual([]);
    expect(getMockNativeOtp().getHash).not.toHaveBeenCalled();
  });

  it('returns Array from native result', async () => {
    getMockNativeOtp().getHash.mockResolvedValue(['only']);
    const result = await getHash();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('only');
  });
});

describe('removeListener', () => {
  beforeEach(() => {
    getMockState().platformOS = 'android';
    getMockNativeOtp().removeListeners.mockClear();
  });

  it('calls removeListeners on Android', () => {
    removeListener();
    expect(getMockNativeOtp().removeListeners).toHaveBeenCalledWith(0);
  });

  it('does not call removeListeners on iOS', () => {
    getMockState().platformOS = 'ios';
    removeListener();
    expect(getMockNativeOtp().removeListeners).not.toHaveBeenCalled();
  });
});

describe('useOtpVerification', () => {
  it('is exported and is a function', () => {
    expect(typeof useOtpVerification).toBe('function');
  });
});
