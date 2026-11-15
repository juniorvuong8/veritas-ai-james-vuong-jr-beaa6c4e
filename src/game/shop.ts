// The coin shop: things the player can buy and wear in the city.
import { PLAYER_EMOJI } from './art'

/** Chosen for free in the shop; looks (beard, hair) follow it. */
export type Gender = 'neutral' | 'male' | 'female'
export const GENDERS: Gender[] = ['neutral', 'male', 'female']

export const GENDER_OPTIONS: Record<Gender, { emoji: string; vi: string; en: string }> = {
  neutral: { emoji: PLAYER_EMOJI, vi: 'Trung tính', en: 'Neutral' },
  male: { emoji: '👨', vi: 'Nam', en: 'Male' },
  female: { emoji: '👩', vi: 'Nữ', en: 'Female' },
}

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
  /** Looks only: the emoji for each gender (`emoji` is the neutral one). */
  byGender?: Record<Exclude<Gender, 'neutral'>, string>
}

/** Prices are in coins; a correct quiz answer earns 10, so a full round earns roughly 150. */
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'cap', slot: 'hat', emoji: '🧢', name_vi: 'Mũ lưỡi trai', name_en: 'Cap', price: 20 },
  { id: 'sunhat', slot: 'hat', emoji: '👒', name_vi: 'Mũ rộng vành', name_en: 'Sun hat', price: 30 },
  { id: 'gradcap', slot: 'hat', emoji: '🎓', name_vi: 'Mũ tốt nghiệp', name_en: 'Graduation cap', price: 40 },
  { id: 'tophat', slot: 'hat', emoji: '🎩', name_vi: 'Mũ chóp cao', name_en: 'Top hat', price: 60 },
  { id: 'crown', slot: 'hat', emoji: '👑', name_vi: 'Vương miện', name_en: 'Crown', price: 120 },
  { id: 'beard', slot: 'look', emoji: '🧔', byGender: { male: '🧔‍♂️', female: '🧔‍♀️' }, name_vi: 'Râu', name_en: 'Beard', price: 30 },
  { id: 'blond', slot: 'look', emoji: '👱', byGender: { male: '👱‍♂️', female: '👱‍♀️' }, name_vi: 'Tóc vàng', name_en: 'Blond hair', price: 30 },
  { id: 'redhair', slot: 'look', emoji: '🧑‍🦰', byGender: { male: '👨‍🦰', female: '👩‍🦰' }, name_vi: 'Tóc đỏ', name_en: 'Red hair', price: 30 },
  { id: 'curly', slot: 'look', emoji: '🧑‍🦱', byGender: { male: '👨‍🦱', female: '👩‍🦱' }, name_vi: 'Tóc xoăn', name_en: 'Curly hair', price: 30 },
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

/** An item's emoji for the chosen gender (only looks change). */
export function itemEmoji(item: ShopItem, gender: Gender = 'neutral'): string {
  return gender !== 'neutral' && item.byGender ? item.byGender[gender] : item.emoji
}

/** The emojis to draw for an outfit; with no look, the face is the gender's plain face. */
export function outfitEmojis(outfit: Outfit, gender: Gender = 'neutral') {
  const look = getItem(outfit.look)
  return {
    face: look ? itemEmoji(look, gender) : GENDER_OPTIONS[gender].emoji,
    hat: getItem(outfit.hat)?.emoji,
    pet: getItem(outfit.pet)?.emoji,
  }
}
