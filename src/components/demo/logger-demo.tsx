'use client';

import React, { useState } from 'react';
import { useLogger } from '@/lib/client-logger';
import { Button } from '@/components/ui/button';

export function LoggerDemo() {
  const [count, setCount] = useState(0);
  const componentLogger = useLogger('LoggerDemo');

  const handleClick = () => {
    const endTimer = componentLogger.startTimer('button.click');
    
    setCount(prev => prev + 1);
    
    // Log feature usage
    componentLogger.feature('demo', 'button_click', {
      count: count + 1,
      timestamp: new Date().toISOString()
    });
    
    endTimer();
  };

  const handleError = () => {
    try {
      throw new Error('Demo error for testing');
    } catch (error) {
      componentLogger.error('Demo error occurred', error as Error, {
        context: 'error_demo_button'
      });
    }
  };

  const handleWarning = () => {
    componentLogger.warn('This is a warning message', {
      warningType: 'demo',
      severity: 'low'
    });
  };

  const handleInfo = () => {
    componentLogger.info('Information logged', {
      infoType: 'user_action',
      details: 'User clicked info button'
    });
  };

  return (
    <div className="p-6 space-y-4 bg-zinc-900 rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Logger Demo</h2>
      
      <div className="space-y-2">
        <p className="text-gray-300">Click count: {count}</p>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleClick} variant="default">
            Track Click
          </Button>
          
          <Button onClick={handleError} variant="destructive">
            Log Error
          </Button>
          
          <Button onClick={handleWarning} variant="outline">
            Log Warning
          </Button>
          
          <Button onClick={handleInfo} variant="secondary">
            Log Info
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-400">
        <p>Open browser console to see logs in development mode.</p>
        <p>In production, logs are sent to the server.</p>
      </div>
    </div>
  );
}