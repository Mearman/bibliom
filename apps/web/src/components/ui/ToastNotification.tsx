/**
 * Toast Notification System
 *
 * Provides a flexible toast notification system with different
 * variants, positioning, and auto-dismiss functionality.
 */

import { NotificationData,notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconLoader,
  IconX,
} from '@tabler/icons-react';
import { useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastOptions extends Omit<NotificationData, 'message'> {
  variant?: ToastVariant;
  autoClose?: number | boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const DEFAULT_AUTO_CLOSE = 5000;
const IS_LOADING_AUTO_CLOSE = false;

/**
 * Get notification configuration for variant
 * @param variant
 */
const getNotificationConfig = (variant: ToastVariant = 'info') => {
  const configs = {
    success: {
      color: 'green',
      icon: <IconCheck size={20} />,
      autoClose: DEFAULT_AUTO_CLOSE,
    },
    error: {
      color: 'red',
      icon: <IconX size={20} />,
      autoClose: DEFAULT_AUTO_CLOSE,
    },
    warning: {
      color: 'orange',
      icon: <IconAlertTriangle size={20} />,
      autoClose: DEFAULT_AUTO_CLOSE,
    },
    info: {
      color: 'blue',
      icon: <IconInfoCircle size={20} />,
      autoClose: DEFAULT_AUTO_CLOSE,
    },
    loading: {
      color: 'blue',
      icon: <IconLoader size={20} className="rotate" />,
      autoClose: IS_LOADING_AUTO_CLOSE,
      loading: true,
    },
  };

  return configs[variant] || configs.info;
};

/**
 * Show a success toast notification
 * @param message
 * @param options
 */
export const showSuccessToast = (
  message: string,
  options?: Omit<ToastOptions, 'variant'>
): string => {
  const config = getNotificationConfig('success');
  return notifications.show({
    message,
    ...config,
    ...options,
  });
};

/**
 * Show an error toast notification
 * @param message
 * @param options
 */
export const showErrorToast = (
  message: string,
  options?: Omit<ToastOptions, 'variant'>
): string => {
  const config = getNotificationConfig('error');
  return notifications.show({
    message,
    ...config,
    ...options,
  });
};

/**
 * Show a warning toast notification
 * @param message
 * @param options
 */
export const showWarningToast = (
  message: string,
  options?: Omit<ToastOptions, 'variant'>
): string => {
  const config = getNotificationConfig('warning');
  return notifications.show({
    message,
    ...config,
    ...options,
  });
};

/**
 * Show an info toast notification
 * @param message
 * @param options
 */
export const showInfoToast = (
  message: string,
  options?: Omit<ToastOptions, 'variant'>
): string => {
  const config = getNotificationConfig('info');
  return notifications.show({
    message,
    ...config,
    ...options,
  });
};

/**
 * Show a loading toast notification
 * @param message
 * @param options
 */
export const showLoadingToast = (
  message: string,
  options?: Omit<ToastOptions, 'variant'>
): string => {
  const config = getNotificationConfig('loading');
  return notifications.show({
    message,
    ...config,
    ...options,
  });
};

/**
 * Show a custom toast with specific configuration
 * @param title
 * @param message
 * @param variant
 * @param options
 */
export const showToast = (
  title: string,
  message: string,
  variant: ToastVariant = 'info',
  options?: Omit<ToastOptions, 'variant'>
): string => {
  const config = getNotificationConfig(variant);
  return notifications.show({
    title,
    message,
    ...config,
    ...options,
  });
};

/**
 * Hide a specific toast notification
 * @param id
 */
export const hideToast = (id: string): void => {
  notifications.hide(id);
};

/**
 * Hide all toast notifications
 */
export const hideAllToasts = (): void => {
  notifications.clean();
};

/**
 * Toast utility class for common application scenarios
 */
export class ToastManager {
  private static toastIds: string[] = [];

  /**
   * Show operation success toast
   * @param operation
   * @param details
   */
  static showOperationSuccess(operation: string, details?: string): string {
    const message = details ? `${operation}: ${details}` : operation;
    const id = showSuccessToast(message);
    this.toastIds.push(id);
    return id;
  }

  /**
   * Show operation error toast
   * @param operation
   * @param error
   */
  static showOperationError(operation: string, error?: string | Error): string {
    const errorMessage = error instanceof Error ? error.message : error || 'Unknown error';
    const message = `${operation} failed: ${errorMessage}`;
    const id = showErrorToast(message, {
      autoClose: 8000, // Show errors longer
    });
    this.toastIds.push(id);
    return id;
  }

  /**
   * Show operation loading toast
   * @param operation
   */
  static showOperationLoading(operation: string): string {
    const message = `${operation}...`;
    const id = showLoadingToast(message);
    this.toastIds.push(id);
    return id;
  }

  /**
   * Update loading toast to success
   * @param loadingId
   * @param operation
   * @param details
   */
  static updateLoadingToSuccess(loadingId: string, operation: string, details?: string): void {
    notifications.update({
      id: loadingId,
      color: 'green',
      icon: <IconCheck size={20} />,
      message: details ? `${operation}: ${details}` : operation,
      loading: false,
      autoClose: DEFAULT_AUTO_CLOSE,
    });
  }

  /**
   * Update loading toast to error
   * @param loadingId
   * @param operation
   * @param error
   */
  static updateLoadingToError(loadingId: string, operation: string, error?: string | Error): void {
    const errorMessage = error instanceof Error ? error.message : error || 'Unknown error';
    const message = `${operation} failed: ${errorMessage}`;
    notifications.update({
      id: loadingId,
      color: 'red',
      icon: <IconX size={20} />,
      message,
      loading: false,
      autoClose: 8000,
    });
  }

  /**
   * Show network error toast
   * @param error
   */
  static showNetworkError(error: string = 'Network error occurred. Please check your connection.'): string {
    return showErrorToast(error, {
      title: 'Network Error',
      autoClose: 10000,
    });
  }

  /**
   * Show validation error toast
   * @param errors
   */
  static showValidationError(errors: string[]): string {
    const message = `Please fix the following errors: ${errors.join(', ')}`;
    return showWarningToast(message, {
      title: 'Validation Error',
      autoClose: 10000,
    });
  }

  /**
   * Show permission error toast
   * @param action
   */
  static showPermissionError(action: string): string {
    const message = `You don't have permission to ${action}.`;
    return showWarningToast(message, {
      title: 'Permission Denied',
      autoClose: 8000,
    });
  }

  /**
   * Clear all toasts managed by this instance
   */
  static clearAll(): void {
    for (const id of this.toastIds) {
      hideToast(id);
    }
    this.toastIds = [];
  }
}

/**
 * React hook for toast management
 */
export const useToast = () => {
  // Use useCallback to stabilize function references if React hooks are needed
  const success = useCallback(showSuccessToast, []);
  const error = useCallback(showErrorToast, []);
  const warning = useCallback(showWarningToast, []);
  const info = useCallback(showInfoToast, []);
  const loading = useCallback(showLoadingToast, []);
  const hide = useCallback(hideToast, []);
  const clearAll = useCallback(hideAllToasts, []);

  return {
    success,
    error,
    warning,
    info,
    loading,
    hide,
    clearAll,
    manager: ToastManager,
  };
};

// No default export - use named exports from the class declaration above