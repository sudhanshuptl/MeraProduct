/**
 * MeraProduct Logger Utility
 * Provides clean, organized logging with debug mode toggle
 */

class Logger {
  constructor(moduleName = 'MeraProduct') {
    this.moduleName = moduleName;
    this.debugMode = this.isDebugEnabled();
  }

  /**
   * Check if debug mode is enabled
   * Can be toggled via: localStorage.setItem('meraproduct_debug', 'true')
   */
  isDebugEnabled() {
    try {
      return localStorage.getItem('meraproduct_debug') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Enable debug mode
   */
  static enableDebug() {
    localStorage.setItem('meraproduct_debug', 'true');
    console.log('🐛 [MeraProduct] Debug mode ENABLED. Reload the page to see detailed logs.');
  }

  /**
   * Disable debug mode
   */
  static disableDebug() {
    localStorage.setItem('meraproduct_debug', 'false');
    console.log('🐛 [MeraProduct] Debug mode DISABLED.');
  }

  /**
   * Format log message with emoji and context
   */
  format(emoji, message, ...args) {
    return [`${emoji} [${this.moduleName}]`, message, ...args];
  }

  /**
   * Info level - Always shown (important events)
   */
  info(message, ...args) {
    console.log(...this.format('ℹ️', message, ...args));
  }

  /**
   * Success level - Always shown (positive outcomes)
   */
  success(message, ...args) {
    console.log(...this.format('✅', message, ...args));
  }

  /**
   * Warning level - Always shown (important warnings)
   */
  warn(message, ...args) {
    console.warn(...this.format('⚠️', message, ...args));
  }

  /**
   * Error level - Always shown
   */
  error(message, ...args) {
    console.error(...this.format('❌', message, ...args));
  }

  /**
   * Debug level - Only shown when debug mode enabled
   */
  debug(message, ...args) {
    if (this.debugMode) {
      console.log(...this.format('🔍', message, ...args));
    }
  }

  /**
   * Verbose debug - Only shown when debug mode enabled
   */
  verbose(message, ...args) {
    if (this.debugMode) {
      console.log(...this.format('📝', message, ...args));
    }
  }

  /**
   * Group logs for better organization (debug mode only)
   */
  group(title, collapsed = true) {
    if (this.debugMode) {
      if (collapsed) {
        console.groupCollapsed(`🔍 [${this.moduleName}] ${title}`);
      } else {
        console.group(`🔍 [${this.moduleName}] ${title}`);
      }
    }
  }

  /**
   * End group
   */
  groupEnd() {
    if (this.debugMode) {
      console.groupEnd();
    }
  }

  /**
   * Log object/data structure (debug mode only)
   */
  data(label, obj) {
    if (this.debugMode) {
      console.log(`🔍 [${this.moduleName}] ${label}:`, obj);
    }
  }

  /**
   * Table view for structured data (debug mode only)
   */
  table(label, data) {
    if (this.debugMode) {
      console.log(`🔍 [${this.moduleName}] ${label}:`);
      console.table(data);
    }
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.Logger = Logger;
}
