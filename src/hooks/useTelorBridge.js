import { useState, useRef, useCallback, useEffect } from 'react';

const WS_URL = 'ws://localhost:7700';

export function useGLINTBridge() {
  const [connected, setConnected] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [devices, setDevices] = useState([]);
  const wsRef = useRef(null);
  const pendingRef = useRef({});

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'screenshot') {
        setScreenshots((prev) => [...prev, msg.path]);
      } else if (msg.type === 'batch_result' || msg.type === 'crawl_result') {
        setScreenshots((prev) => [...prev, ...msg.paths]);
      } else if (msg.type === 'devices') {
        setDevices([...msg.usb, ...msg.wifi]);
      }
    };

    return () => ws.close();
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

  return { connected, screenshots, devices, captureSingle, captureBatch, crawlApp, getSession, listDevices, connectWifi };
}
