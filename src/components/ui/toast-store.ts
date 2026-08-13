"use client";

import * as React from "react";

export type ToastVariant = "default" | "success" | "destructive";

export interface ToastItem {
  id: number;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Minimal external store for toasts. One module-level singleton is fine for a
 * browser SPA — it keeps `toast.success(...)` callable from anywhere without
 * prop-drilling a context.
 */
let nextId = 1;
let items: ToastItem[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

export function useToasts(): ToastItem[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const toastStore = {
  push(input: ToastInput) {
    const id = nextId++;
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "default",
      duration: input.duration ?? 5000,
    };
    items = [...items, item];
    emit();
    // Auto-dismiss.
    window.setTimeout(() => this.dismiss(id), item.duration);
    return id;
  },
  dismiss(id: number) {
    items = items.filter((i) => i.id !== id);
    emit();
  },
};

/** Easiest way to fire a toast from client code. */
export const toast = {
  show(input: ToastInput) {
    toastStore.push(input);
  },
  success(description: string, title = "Success") {
    toastStore.push({ title, description, variant: "success" });
  },
  error(description: string, title = "Something went wrong") {
    toastStore.push({ title, description, variant: "destructive" });
  },
};
