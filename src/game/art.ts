// Every emoji in the game comes from this file, so real art can replace them in one place.
import type { Tile } from './map'

export const TILE_EMOJI: Record<Tile, string> = {
  road: '',
  grass: '',
  tree: '🌳',
  water: '🌊',
  building: '',
  door: '🚪',
}

export const PLAYER_EMOJI = '🧑'

/** `color` matches the place's storefront on the homepage. */
export const PLACE_ART: Record<string, { sign: string; host: string; greeting_vi: string; color: string }> = {
  cafe: { sign: '☕', host: '🧑‍🍳', greeting_vi: 'Chào bạn! Hôm nay bạn muốn học từ nào ở quán cà phê?', color: '#2F7F7A' },
  supermarket: { sign: '🛒', host: '🧑‍💼', greeting_vi: 'Xin chào! Bạn muốn học từ nào khi đi siêu thị?', color: '#E8553D' },
  taxi: { sign: '🚕', host: '🧑‍✈️', greeting_vi: 'Chào bạn, lên xe nào! Hôm nay mình học từ gì?', color: '#F5B82E' },
  clinic: { sign: '🏥', host: '🧑‍⚕️', greeting_vi: 'Chào bạn! Bạn muốn học từ nào khi đi khám bệnh?', color: '#3E6FB0' },
}
