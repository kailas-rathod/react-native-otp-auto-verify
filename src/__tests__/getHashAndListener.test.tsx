type MockGlobals = {
  __mockPlatformOS: { platformOS: string };
  __mockGetHash: jest.Mock;
  __mockRemoveListeners: jest.Mock;
};

const mockG = global as unknown as MockGlobals;

jest.mock('react-native', () => {
  const g = global as unknown as MockGlobals;
  const platformState = { platformOS: 'android' };
  g.__mockPlatformOS = platformState;
  const addListener = jest.fn(() => ({ remove: jest.fn() }));
  return {
    Platform: {
      get OS() {
        return g.__mockPlatformOS.platformOS;
      },
    },
    NativeModules: { OtpAutoVerify: {} },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener,
    })),
  };
});

jest.mock('../NativeOtpAutoVerify', () => {
  const g = global as unknown as MockGlobals;
  const getHash = jest.fn();
  const removeListeners = jest.fn();
  g.__mockGetHash = getHash;
  g.__mockRemoveListeners = removeListeners;
  return {
    __esModule: true,
    getOtpNativeModule: () => ({
      getConstants: () => ({ OTP_RECEIVED_EVENT: 'otpReceived' }),
      getHash: (...args: unknown[]) => getHash(...args),
      startSmsRetriever: jest.fn().mockResolvedValue(true),
      removeListeners: (...args: unknown[]) => removeListeners(...args),
    }),
  };
});

import { getHash, removeListener, useOtpVerification } from '../index';

describe('getHash', () => {
  beforeEach(() => {
    mockG.__mockPlatformOS.platformOS = 'android';
    mockG.__mockGetHash.mockReset();
  });

  it('returns hash array on Android', async () => {
    mockG.__mockGetHash.mockResolvedValue(['hash1', 'hash2']);
    const result = await getHash();
    expect(result).toEqual(['hash1', 'hash2']);
    expect(mockG.__mockGetHash).toHaveBeenCalled();
  });

  it('returns empty array on iOS', async () => {
    mockG.__mockPlatformOS.platformOS = 'ios';
    const result = await getHash();
    expect(result).toEqual([]);
    expect(mockG.__mockGetHash).not.toHaveBeenCalled();
  });

  it('returns Array from native result', async () => {
    mockG.__mockGetHash.mockResolvedValue(['only']);
    const result = await getHash();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('only');
  });
});

describe('removeListener', () => {
  beforeEach(() => {
    mockG.__mockPlatformOS.platformOS = 'android';
    mockG.__mockRemoveListeners.mockClear();
  });

  it('calls removeListeners on Android', () => {
    removeListener();
    expect(mockG.__mockRemoveListeners).toHaveBeenCalledWith(0);
  });

  it('does not call removeListeners on iOS', () => {
    mockG.__mockPlatformOS.platformOS = 'ios';
    removeListener();
    expect(mockG.__mockRemoveListeners).not.toHaveBeenCalled();
  });
});

describe('useOtpVerification', () => {
  it('is exported and is a function', () => {
    expect(typeof useOtpVerification).toBe('function');
  });
});
