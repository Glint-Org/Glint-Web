import { useState, useRef, useCallback, useEffect } from 'react';

const WS_URL = 'ws://localhost:7700';
const STORAGE_KEY = 'glint_bridge_token';

export function useGLINTBridge() {
  const [connected, setConnected] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [devices, setDevices] = useState([]);
  const wsRef = useRef(null);
  const tokenRef = useRef(localStorage.getItem(STORAGE_KEY) || '');

  const connect = useCallback((token) => {
    if (token) {
      tokenRef.current = token;
      localStorage.setItem(STORAGE_KEY, token);
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    setPairing(true);
    setError(null);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'pair', token: tokenRef.current }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'paired' && msg.success) {
        setConnected(true);
        setPairing(false);
        setError(null);
        return;
      }

      if (msg.type === 'error' && !connected) {
        setPairing(false);
        setError(msg.message || 'Pairing failed');
        ws.close();
        return;
      }

      if (msg.type === 'screenshot') {
        setScreenshots((prev) => [...prev, msg.path]);
      } else if (msg.type === 'batch_result' || msg.type === 'crawl_result') {
        setScreenshots((prev) => [...prev, ...msg.paths]);
      } else if (msg.type === 'devices') {
        setDevices([...msg.usb, ...msg.wifi]);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setPairing(false);
    };

    ws.onerror = () => {
      setConnected(false);
      setPairing(false);
      setError('Cannot reach Glint Bridge. Is it running?');
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const captureSingle = useCallback(() => send({ action: 'capture_single' }), [send]);
  const captureBatch = useCallback((count = 5) => send({ action: 'capture_batch', count }), [send]);
  const crawlApp = useCallback((pkg, maxScreens = 20) => send({ action: 'crawl', package: pkg, max_screens: maxScreens }), [send]);
  const getSession = useCallback(() => send({ action: 'get_session' }), [send]);
  const listDevices = useCallback(() => send({ action: 'list_devices' }), [send]);
  const connectWifi = useCallback((ip, port = 5555) => send({ action: 'connect_wifi', ip, port }), [send]);

  return {
    connected,
    pairing,
    error,
    screenshots,
    devices,
    connect,
    captureSingle,
    captureBatch,
    crawlApp,
    getSession,
    listDevices,
    connectWifi,
  };
}
