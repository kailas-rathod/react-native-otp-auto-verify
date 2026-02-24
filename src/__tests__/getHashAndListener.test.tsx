const mockState = { platformOS: 'android' as 'android' | 'ios' };
const mockGetHash = jest.fn();
const mockRemoveListeners = jest.fn();
const mockAddListener = jest.fn(() => ({ remove: jest.fn() }));

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockState.platformOS;
    },
  },
  NativeModules: { OtpAutoVerify: {} },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: mockAddListener,
  })),
}));

jest.mock('../NativeOtpAutoVerify', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({ OTP_RECEIVED_EVENT: 'otpReceived' }),
    getHash: (...args: unknown[]) => mockGetHash(...args),
    startSmsRetriever: jest.fn().mockResolvedValue(true),
    removeListeners: (...args: unknown[]) => mockRemoveListeners(...args),
  },
}));

import { getHash, removeListener, useOtpVerification } from '../index';

describe('getHash', () => {
  beforeEach(() => {
    mockState.platformOS = 'android';
    mockGetHash.mockReset();
  });

  it('returns hash array on Android', async () => {
    mockGetHash.mockResolvedValue(['hash1', 'hash2']);
    const result = await getHash();
    expect(result).toEqual(['hash1', 'hash2']);
    expect(mockGetHash).toHaveBeenCalled();
  });

  it('returns empty array on iOS', async () => {
    mockState.platformOS = 'ios';
    const result = await getHash();
    expect(result).toEqual([]);
    expect(mockGetHash).not.toHaveBeenCalled();
  });

  it('returns Array from native result', async () => {
    mockGetHash.mockResolvedValue(['only']);
    const result = await getHash();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('only');
  });
});

describe('removeListener', () => {
  beforeEach(() => {
    mockState.platformOS = 'android';
    mockRemoveListeners.mockClear();
  });

  it('calls removeListeners on Android', () => {
    removeListener();
    expect(mockRemoveListeners).toHaveBeenCalledWith(0);
  });

  it('does not call removeListeners on iOS', () => {
    mockState.platformOS = 'ios';
    removeListener();
    expect(mockRemoveListeners).not.toHaveBeenCalled();
  });
});

describe('useOtpVerification', () => {
  it('is exported and is a function', () => {
    expect(typeof useOtpVerification).toBe('function');
  });
});
