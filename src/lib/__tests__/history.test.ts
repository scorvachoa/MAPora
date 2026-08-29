import { describe, it, expect } from 'vitest'
import { HistoryStack } from '@/lib/history'

describe('HistoryStack (undo/redo contract)', () => {
  it('starts with no undo/redo available', () => {
    const h = new HistoryStack<number>(0)
    expect(h.current).toBe(0)
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it('pushes states and allows undo to restore the previous one', () => {
    const h = new HistoryStack<number>(0)
    h.push(1)
    h.push(2)
    h.push(3)
    expect(h.current).toBe(3)

    expect(h.undo()).toBe(2)
    expect(h.current).toBe(2)
    expect(h.canUndo).toBe(true)
    expect(h.canRedo).toBe(true)

    expect(h.undo()).toBe(1)
    expect(h.undo()).toBe(0)
    expect(h.canUndo).toBe(false)
    expect(h.current).toBe(0)
  })

  it('undo past the beginning is a no-op and returns null', () => {
    const h = new HistoryStack<string>('a')
    expect(h.undo()).toBe(null)
    expect(h.current).toBe('a')
  })

  it('redo re-applies undone states in order', () => {
    const h = new HistoryStack<number>(0)
    h.push(1)
    h.push(2)
    h.undo() // -> 1
    h.undo() // -> 0
    expect(h.redo()).toBe(1)
    expect(h.redo()).toBe(2)
    expect(h.canRedo).toBe(false)
  })

  it('pushing after an undo discards the redo branch', () => {
    const h = new HistoryStack<number>(0)
    h.push(1)
    h.push(2)
    h.undo() // -> 1, future = [2]
    h.push(99) // should clear future
    expect(h.canRedo).toBe(false)
    expect(h.current).toBe(99)
    h.undo()
    expect(h.current).toBe(1)
  })

  it('restores the exact snapshot that was pushed', () => {
    const h = new HistoryStack<{ v: number }>({ v: 1 })
    h.push({ v: 2 })
    h.push({ v: 3 })
    h.undo()
    expect(h.current).toEqual({ v: 2 })
    h.undo()
    expect(h.current).toEqual({ v: 1 })
  })

  // NOTE: callers (the Zustand store) must pass immutable snapshots. The store
  // already replaces state with new objects on every update, so no deep clone
  // is needed here.
})
