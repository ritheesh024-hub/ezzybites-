'use client';

type Listener = (error: any) => void;

class ErrorEmitter {
  private listeners: { [event: string]: Listener[] } = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, error: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(error));
    }
  }

  off(event: string, listener: Listener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
    }
  }
}

export const errorEmitter = new ErrorEmitter();
