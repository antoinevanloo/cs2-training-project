'use client';

import { signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-cs2-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">CS</span>
          </div>
          <span className="text-lg font-bold text-white">CS2 Coach</span>
        </div>

        {/* Search (Desktop) */}
        <div className="hidden lg:block flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une demo..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cs2-accent"
            />
          </div>
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <span className="hidden md:block text-sm text-white">{user.name}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1">
              <div className="px-4 py-2 border-b border-gray-700">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
