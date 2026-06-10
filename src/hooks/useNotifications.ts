import { useState, useEffect, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [enabled, setEnabled] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') setEnabled(true);
  }, []);

  const toggle = useCallback(async () => {
    if (!enabled) {
      if (permission !== 'granted') {
        await requestPermission();
      } else {
        setEnabled(true);
      }
    } else {
      setEnabled(false);
    }
  }, [enabled, permission, requestPermission]);

  const scheduleNotification = useCallback(
    (title: string, body: string, fireAt: Date) => {
      if (!enabled || permission !== 'granted') return;
      const delay = fireAt.getTime() - Date.now();
      if (delay <= 0) return;
      setTimeout(() => {
        new Notification(title, { body, icon: '/favicon.ico' });
      }, delay);
    },
    [enabled, permission]
  );

  useEffect(() => {
    setPermission(
      typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
  }, []);

  return { permission, enabled, toggle, scheduleNotification };
}
