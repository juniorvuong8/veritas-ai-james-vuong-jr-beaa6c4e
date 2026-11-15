// The coin shop: things the player can buy and wear in the city.
import { PLAYER_EMOJI } from './art'

/** hat: worn on top of the head. look: changes the face itself (beard, hair). pet: walks beside you. */
export type Slot = 'hat' | 'look' | 'pet'
export const SLOTS: Slot[] = ['hat', 'look', 'pet']

export interface ShopItem {
  id: string
  slot: Slot
  emoji: string
  name_vi: string
  name_en: string
  price: number
}

/** Prices are in coins; a correct quiz answer earns 10, so a full round earns roughly 150. */
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'cap', slot: 'hat', emoji: '🧢', name_vi: 'Mũ lưỡi trai', name_en: 'Cap', price: 20 },
  { id: 'sunhat', slot: 'hat', emoji: '👒', name_vi: 'Mũ rộng vành', name_en: 'Sun hat', price: 30 },
  { id: 'gradcap', slot: 'hat', emoji: '🎓', name_vi: 'Mũ tốt nghiệp', name_en: 'Graduation cap', price: 40 },
  { id: 'tophat', slot: 'hat', emoji: '🎩', name_vi: 'Mũ chóp cao', name_en: 'Top hat', price: 60 },
  { id: 'crown', slot: 'hat', emoji: '👑', name_vi: 'Vương miện', name_en: 'Crown', price: 120 },
  { id: 'beard', slot: 'look', emoji: '🧔', name_vi: 'Râu', name_en: 'Beard', price: 30 },
  { id: 'blond', slot: 'look', emoji: '👱', name_vi: 'Tóc vàng', name_en: 'Blond hair', price: 30 },
  { id: 'redhair', slot: 'look', emoji: '🧑‍🦰', name_vi: 'Tóc đỏ', name_en: 'Red hair', price: 30 },
  { id: 'curly', slot: 'look', emoji: '🧑‍🦱', name_vi: 'Tóc xoăn', name_en: 'Curly hair', price: 30 },
  { id: 'dog', slot: 'pet', emoji: '🐶', name_vi: 'Cún con', name_en: 'Puppy', price: 70 },
  { id: 'cat', slot: 'pet', emoji: '🐱', name_vi: 'Mèo con', name_en: 'Kitten', price: 70 },
  { id: 'parrot', slot: 'pet', emoji: '🦜', name_vi: 'Vẹt', name_en: 'Parrot', price: 90 },
]

export const SLOT_NAMES: Record<Slot, { vi: string; en: string }> = {
  hat: { vi: 'Mũ', en: 'Hats' },
  look: { vi: 'Diện mạo', en: 'Looks' },
  pet: { vi: 'Thú cưng', en: 'Pets' },
}

/** What the player is wearing: at most one item id per slot. */
export type Outfit = Partial<Record<Slot, string>>

export const getItem = (id: string | undefined) => SHOP_ITEMS.find((i) => i.id === id)

/** The emojis to draw for an outfit; the face falls back to the default player. */
export function outfitEmojis(outfit: Outfit) {
  return {
    face: getItem(outfit.look)?.emoji ?? PLAYER_EMOJI,
    hat: getItem(outfit.hat)?.emoji,
    pet: getItem(outfit.pet)?.emoji,
  }
}
