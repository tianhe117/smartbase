export interface Volume {
  id: number
  no: number
  name: string
  sort_order: number
  created_at: string
  lesson_count: number
  char_count: number
}

export interface Lesson {
  id: number
  volume_id: number
  no: number
  created_at: string
  char_count: number
}

export type CharType = 'new' | 'mistake' | 'mastered'

export interface Character {
  id: number
  lesson_id: number
  char: string
  pinyin: string
  word_1: string
  word_2: string | null
  word_3: string | null
  char_type: CharType
  created_at: string
}

export interface ReviewChar {
  id: number
  char: string
  pinyin: string
  word_1: string
  word_2: string | null
  word_3: string | null
  lesson_no: number
  weight: number
}

export interface ReviewStats {
  total_chars: number
  mastered: number
  learning: number
  unfamiliar: number
  new_chars: number
}
