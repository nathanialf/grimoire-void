// Module-level singleton used to pass spawn context between scene routes.
// Set by an outgoing scene before navigate(); consumed by the incoming scene
// on mount so it knows where to place the player. Auto-resets to 'default'
// after consumption so subsequent fresh navigations spawn at the entrance.

export type MuseumSpawnIntent = 'default' | 'fromCarcosa'

let museumIntent: MuseumSpawnIntent = 'default'

export const museumSpawnIntent = {
  set(v: MuseumSpawnIntent): void {
    museumIntent = v
  },
  consume(): MuseumSpawnIntent {
    const v = museumIntent
    museumIntent = 'default'
    return v
  },
}
