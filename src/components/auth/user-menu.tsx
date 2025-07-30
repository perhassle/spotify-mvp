'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth-store';
import { 
  UserCircleIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full justify-center border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white"
        >
          <Link href="/auth/register">Sign up</Link>
        </Button>
        <Button
          asChild
          variant="spotify"
          size="sm"
          className="w-full justify-center"
        >
          <Link href="/auth/login">Log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* User Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md bg-gray-900 p-3 text-left hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="flex items-center space-x-3 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt={`${user.displayName}'s avatar`}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {user.displayName}
            </p>
            <div className="flex items-center space-x-1">
              {user.isPremium && (
                <SparklesIcon className="h-3 w-3 text-yellow-400" aria-hidden="true" />
              )}
              <p className="text-xs text-gray-400 truncate">
                {user.isPremium ? 'Premium' : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 w-full mb-2 py-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Profile Link */}
          <Link
            href="/profile"
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700 focus:text-white transition-colors"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
            <span>Profile</span>
          </Link>

          {/* Settings Link */}
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700 focus:text-white transition-colors"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <CogIcon className="h-4 w-4" aria-hidden="true" />
            <span>Settings</span>
          </Link>

          {/* Premium Upgrade (for free users) */}
          {!user.isPremium && (
            <Link
              href="/premium"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 focus:outline-none focus:bg-gray-700 focus:text-yellow-300 transition-colors"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              <span>Upgrade to Premium</span>
            </Link>
          )}

          {/* Divider */}
          <div className="border-t border-gray-700 my-1" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700 focus:text-white transition-colors"
            role="menuitem"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}