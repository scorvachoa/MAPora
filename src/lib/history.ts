// Generic, framework-agnostic undo/redo stack.
// The editor store should adopt this (or an equivalent) so that undo/redo
// actually restores state. These tests pin the expected contract that the
// fix for the broken history (see review) must satisfy.
export interface HistorySnapshot<T> {
  label: string
  state: T
}

export class HistoryStack<T> {
  private past: HistorySnapshot<T>[] = []
  private present: HistorySnapshot<T> | null = null
  private future: HistorySnapshot<T>[] = []
  private maxDepth: number

  constructor(initial?: T, label = 'init', maxDepth = 100) {
    this.maxDepth = maxDepth
    if (initial !== undefined) this.present = { label, state: initial }
  }

  get current(): T | null {
    return this.present ? this.present.state : null
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  get depth(): number {
    return this.past.length + (this.present ? 1 : 0)
  }

  push(state: T, label = 'change'): void {
    if (this.present) this.past.push(this.present)
    if (this.past.length > this.maxDepth) {
      this.past.splice(0, this.past.length - this.maxDepth)
    }
    this.present = { label, state }
    this.future = []
  }

  undo(): T | null {
    if (!this.past.length) return null
    if (this.present) this.future.unshift(this.present)
    this.present = this.past.pop()!
    return this.present.state
  }

  redo(): T | null {
    if (!this.future.length) return null
    if (this.present) this.past.push(this.present)
    this.present = this.future.shift()!
    return this.present.state
  }

  reset(initial: T, label = 'init'): void {
    this.past = []
    this.future = []
    this.present = { label, state: initial }
  }
}
