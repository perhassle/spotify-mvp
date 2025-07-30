'use client';

import { useMemo } from 'react';
import { checkPasswordStrength, type PasswordStrength } from '@/lib/auth/validation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

const strengthLabels = [
  'Very Weak',
  'Weak', 
  'Fair',
  'Good',
  'Strong',
  'Very Strong'
];

const strengthColors = [
  'bg-red-500',
  'bg-red-400',
  'bg-orange-400',
  'bg-yellow-400',
  'bg-green-400',
  'bg-green-500'
];

export function PasswordStrengthIndicator({ 
  password, 
  showDetails = true 
}: PasswordStrengthIndicatorProps) {
  const strength: PasswordStrength = useMemo(() => {
    if (!password) {
      return { score: 0, feedback: [], isValid: false };
    }
    return checkPasswordStrength(password);
  }, [password]);

  if (!password) {
    return null;
  }

  const strengthLabel = strengthLabels[strength.score] || strengthLabels[0];
  const strengthColor = strengthColors[strength.score] || strengthColors[0];

  return (
    <div className="space-y-2 text-sm">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Password strength
          </span>
          <span 
            className={`font-medium ${
              strength.isValid 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {strengthLabel}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
                i < strength.score 
                  ? strengthColor 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              role="progressbar"
              aria-valuenow={strength.score}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-label={`Password strength: ${strengthLabel}`}
            />
          ))}
        </div>
      </div>

      {/* Detailed Feedback */}
      {showDetails && strength.feedback.length > 0 && (
        <div className="space-y-1">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Requirements:
          </p>
          <ul className="space-y-1">
            {[
              'At least 8 characters',
              'Lowercase letter (a-z)',
              'Uppercase letter (A-Z)', 
              'Number (0-9)',
              'Special character (!@#$%^&*)'
            ].map((requirement, index) => {
              const isMet = !strength.feedback.some(feedback => 
                (index === 0 && feedback.includes('8 characters')) ||
                (index === 1 && feedback.includes('lowercase')) ||
                (index === 2 && feedback.includes('uppercase')) ||
                (index === 3 && feedback.includes('numbers')) ||
                (index === 4 && feedback.includes('special'))
              );

              return (
                <li 
                  key={requirement}
                  className={`flex items-center space-x-2 ${
                    isMet 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {isMet ? (
                    <CheckCircleIcon 
                      className="w-4 h-4 flex-shrink-0" 
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircleIcon 
                      className="w-4 h-4 flex-shrink-0" 
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-xs">{requirement}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}