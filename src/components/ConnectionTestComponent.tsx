import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ConnectionTest } from '../utils/connectionTest';

export function ConnectionTestComponent() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await ConnectionTest.runAllTests();
    } catch (error) {
      logs.push(`Error: ${error}`);
    } finally {
      console.log = originalLog;
      setResults(logs);
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-md">
      <h3 className="text-white font-bold mb-2">🔍 Connection Test</h3>
      
      <Button
        onClick={runTests}
        disabled={isRunning}
        className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isRunning ? 'Testing...' : 'Test Frontend ↔ Backend'}
      </Button>

      {results.length > 0 && (
        <div className="bg-slate-900 rounded p-3 max-h-60 overflow-y-auto">
          <h4 className="text-green-400 font-semibold mb-2">Test Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="text-sm text-slate-300 mb-1">
              {result}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-400 mt-2">
        <div>Backend: http://localhost:3001</div>
        <div>Frontend: http://localhost:5173</div>
      </div>
    </div>
  );
}
