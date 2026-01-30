// Core behavior type definitions
export interface Behavior<TState, TEvent, TEffect> {
  id: string;
  initial: TState;
  transitions: TransitionMap<TState, TEvent>;
  effects?: EffectMap<TState, TEvent, TEffect>;
}

export type TransitionMap<TState, TEvent> = {
  [K in TState]?: {
    [E in keyof TEvent]?: {
      target: TState;
      guard?: (context: any, event: TEvent[E]) => boolean;
    };
  };
};

export type EffectMap<TState, TEvent, TEffect> = {
  [K in TState]?: {
    onEnter?: (context: any) => Promise<TEffect | void>;
    onExit?: (context: any) => Promise<TEffect | void>;
  };
};

export interface BehaviorContext<TState, TData> {
  state: TState;
  data: TData;
  history: Array<{ state: TState; timestamp: Date }>;
}

export class BehaviorMachine<TState extends string, TEvent, TEffect, TData> {
  private context: BehaviorContext<TState, TData>;
  private behavior: Behavior<TState, TEvent, TEffect>;

  constructor(behavior: Behavior<TState, TEvent, TEffect>, initialData: TData, initialState?: TState) {
    this.behavior = behavior;
    // Use provided initial state, or try to get it from data if it has a 'state' property, otherwise use behavior.initial
    const startState = initialState || (initialData as any)?.state || behavior.initial;
    this.context = {
      state: startState,
      data: initialData,
      history: [{ state: startState, timestamp: new Date() }],
    };
  }

  async transition(eventType: keyof TEvent, eventData: TEvent[keyof TEvent]): Promise<boolean> {
    const currentState = this.context.state;
    const transitions = this.behavior.transitions[currentState];

    if (!transitions || !transitions[eventType]) {
      return false;
    }

    const transition = transitions[eventType];
    
    if (transition.guard && !transition.guard(this.context, eventData)) {
      return false;
    }

    // Exit effects
    const exitEffect = this.behavior.effects?.[currentState]?.onExit;
    if (exitEffect) {
      await exitEffect(this.context);
    }

    // Update state
    this.context.state = transition.target;
    this.context.history.push({
      state: transition.target,
      timestamp: new Date(),
    });

    // Enter effects
    const enterEffect = this.behavior.effects?.[transition.target]?.onEnter;
    if (enterEffect) {
      await enterEffect(this.context);
    }

    return true;
  }

  getState(): TState {
    return this.context.state;
  }

  getContext(): BehaviorContext<TState, TData> {
    return { ...this.context };
  }

  getData(): TData {
    return this.context.data;
  }

  updateData(updates: Partial<TData>): void {
    this.context.data = { ...this.context.data, ...updates };
  }
}
