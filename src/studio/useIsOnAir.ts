// Thin re-export of the on-air hook so studio-scoped code can import it from a
// single, discoverable location. The implementation lives in the program-clock
// store (derives on-air state from the active production's scheduled air time).
export { useIsOnAir } from '@/store/programClock.store'
