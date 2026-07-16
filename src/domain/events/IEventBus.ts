export interface IEventBus {
  subscribe(eventType: string, callback: (payload: any) => void): void;
  unsubscribe(eventType: string, callback: (payload: any) => void): void;
  publish(eventType: string, payload?: any): void;
}
