'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  MusicalNoteIcon,
  UserIcon,
  CalendarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { useSocialStore } from '@/stores/social-store';
import { formatDate } from '@/lib/format-utils';
import { Notification } from '@/types';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { data: session } = useSession();
  const {
    notifications,
    unreadNotificationCount,
    isLoading,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocialStore();

  const [isOpen, setIsOpen] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  // Update visible notifications
  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, 5)); // Show latest 5
  }, [notifications]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_release':
        return <MusicalNoteIcon className="w-4 h-4 text-green-500" />;
      case 'artist_update':
        return <UserIcon className="w-4 h-4 text-blue-500" />;
      case 'friend_activity':
        return <HeartIcon className="w-4 h-4 text-pink-500" />;
      case 'playlist_update':
        return <CalendarIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <BellIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_release':
        return 'bg-green-500/10 border-green-500/20';
      case 'artist_update':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'friend_activity':
        return 'bg-pink-500/10 border-pink-500/20';
      case 'playlist_update':
        return 'bg-purple-500/10 border-purple-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
        aria-label={`Notifications${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}`}
      >
        {unreadNotificationCount > 0 ? (
          <BellSolidIcon className="w-6 h-6" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadNotificationCount > 0 && (
                <Button
                  onClick={handleMarkAllRead}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                aria-label="Close notifications"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent mx-auto"></div>
                <p className="text-gray-400 text-sm mt-2">Loading notifications...</p>
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <BellIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No notifications yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Follow artists to get notified about new releases
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-gray-800/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full border ${getNotificationBgColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-white' : 'text-gray-300'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            <p className={`text-sm mt-1 ${
                              !notification.isRead ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(notification.createdAt, 'short')}
                            </p>
                          </div>

                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        {notification.actionUrl && notification.actionText && (
                          <Link
                            href={notification.actionUrl}
                            className="inline-block mt-2 text-xs text-green-400 hover:text-green-300 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notification.actionText} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {visibleNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 bg-gray-800/50">
              <Link
                href="/notifications"
                className="block text-center text-sm text-green-400 hover:text-green-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}