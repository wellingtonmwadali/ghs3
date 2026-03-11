import { useNotificationStore } from '@/store/notification.store';
import { useToast } from '@/components/ui/toast';

export function useNotify() {
  const { addNotification } = useNotificationStore();
  const toast = useToast();

  const notify = {
    success: (title: string, message: string) => {
      toast.success(message);
      addNotification({ title, message, type: 'success' });
    },
    error: (title: string, message: string) => {
      toast.error(message);
      addNotification({ title, message, type: 'error' });
    },
    warning: (title: string, message: string) => {
      toast.warning(message);
      addNotification({ title, message, type: 'warning' });
    },
    info: (title: string, message: string) => {
      toast.success(message); // Using success for info as well
      addNotification({ title, message, type: 'info' });
    },
  };

  return notify;
}
