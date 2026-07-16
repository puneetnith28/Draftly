import { IEventBus } from '../../domain/events/IEventBus';

export class GlobalEventBus implements IEventBus {
  private static instance: GlobalEventBus;
  private listeners: Record<string, Array<(payload: any) => void>> = {};

  private constructor() {}

  public static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }
    return GlobalEventBus.instance;
  }

  public subscribe(eventType: string, callback: (payload: any) => void): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  public unsubscribe(eventType: string, callback: (payload: any) => void): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter((cb) => cb !== callback);
  }

  public publish(eventType: string, payload?: any): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }
}
