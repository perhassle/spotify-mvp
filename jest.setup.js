// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      reload: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  headers: new Headers(),
  status: 200,
  statusText: 'OK',
})

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { 
      value: 1, 
      setValueAtTime: jest.fn(),
      cancelScheduledValues: jest.fn(),
      setTargetAtTime: jest.fn(),
    },
  }),
  createAnalyser: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    getByteFrequencyData: jest.fn(),
  }),
  createDynamicsCompressor: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
  }),
  createBiquadFilter: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    type: 'peaking',
    frequency: { value: 1000 },
    Q: { value: 1 },
    gain: { value: 0 },
  }),
  createStereoPanner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    pan: { value: 0 },
  }),
  createBufferSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn((when = 0) => {
      // Simulate immediate playback start
      const node = global.AudioContext().createBufferSource();
      setTimeout(() => {
        if (node.onended) {
          node.onended();
        }
      }, 100);
    }),
    stop: jest.fn(),
    buffer: null,
    playbackRate: { value: 1 },
    onended: null,
  }),
  decodeAudioData: jest.fn().mockResolvedValue({
    duration: 180,
    length: 8000000,
    numberOfChannels: 2,
    sampleRate: 44100,
  }),
  currentTime: 0,
  destination: {},
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})