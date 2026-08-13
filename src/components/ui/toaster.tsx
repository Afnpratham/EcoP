"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { toastStore, useToasts } from "@/components/ui/toast-store";

/**
 * Toast viewport. Mounts once in <Providers/>. Use the `toast` helper from
 * `@/components/ui/toaster` anywhere in client code.
 */
export function Toaster() {
  const toasts = useToasts();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant }) => (
        <Toast
          key={id}
          variant={variant}
          onOpenChange={(open) => !open && toastStore.dismiss(id)}
        >
          <div className="grid gap-0.5">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export { toast } from "@/components/ui/toast-store";
