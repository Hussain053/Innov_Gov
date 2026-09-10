import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Notification } from '../types';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    
    if (token.startsWith('demo_token_')) {
      const demoList: Notification[] = [
        {
          id: 101,
          notification_type: 'PILOT_ASSIGNED',
          title: 'Pilot Deployment Authorized',
          message: 'Department of Energy authorized sandbox pilot execution under GFR 149 relaxation.',
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        },
        {
          id: 102,
          notification_type: 'APPLICATION_SHORTLISTED',
          title: 'Application Shortlisted for Pilot',
          message: 'AI Matching Engine scored 94% compatibility. Shortlisted for pilot setup.',
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          id: 103,
          notification_type: 'EVALUATION_COMPLETED',
          title: 'Evaluator Scorecard Published',
          message: 'CleanTech Evaluation Board submitted RECOMMEND decision with 93.2% composite score.',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        },
      ];
      setNotifications((prev) => (prev.length > 0 ? prev : demoList));
      setUnreadCount((prev) => (prev > 0 ? prev : 2));
      return;
    }

    try {
      const [list, count] = await Promise.all([
        notificationService.listNotifications(0, 20),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [token, user]);

  // Initial load and periodic polling every 12 seconds for responsive demo updates
  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token, user, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      const updated = await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: updated.read_at } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
