type Listener<T> = (event: T) => void

export class EventBus<T extends Record<string, any>> {
  private listeners = new Map<string, Set<Listener<any>>>()

  emit<K extends keyof T & string>(type: K, event: T[K]): void {
    const set = this.listeners.get(type)
    if (set) set.forEach(fn => fn(event))
  }

  on<K extends keyof T & string>(type: K, handler: Listener<T[K]>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(handler)
    return () => { this.listeners.get(type)?.delete(handler) }
  }
}

// Singleton instance
export const eventBus = new EventBus()
