// Simple logger utility to control console output
const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;
const ENABLE_VERBOSE_LOGS = false; // Set to true to enable detailed logs

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV && ENABLE_VERBOSE_LOGS) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error(...args); // Always show errors
  },
  
  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (IS_DEV && ENABLE_VERBOSE_LOGS) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (IS_DEV && ENABLE_VERBOSE_LOGS) {
      console.debug(...args);
    }
  }
};

// Replace console.log globally during development
if (IS_DEV) {
  const originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    // Only show logs if they're important or if verbose mode is enabled
    const message = args[0]?.toString() || '';
    
    // Whitelist important logs
    if (
      message.includes('ERROR') ||
      message.includes('CRITICAL') ||
      message.includes('ALERT') ||
      message.includes('TODO') ||
      message.includes('FIXME')
    ) {
      originalConsoleLog(...args);
    } else if (ENABLE_VERBOSE_LOGS) {
      originalConsoleLog(...args);
    }
    // Otherwise, suppress the log
  };
}

