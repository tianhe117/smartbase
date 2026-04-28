import axios from 'axios'
import type { Volume, Lesson, Character, ReviewChar, ReviewStats } from '../types'

const api = axios.create({ baseURL: '/api/v1' })

// Volumes
export const getVolumes = () => api.get<Volume[]>('/volumes').then(r => r.data)
export const createVolume = (data: { no: number; name: string }) =>
  api.post<Volume>('/volumes', data).then(r => r.data)
export const updateVolume = (id: number, data: { no?: number; name?: string }) =>
  api.put<Volume>(`/volumes/${id}`, data).then(r => r.data)
export const deleteVolume = (id: number) => api.delete(`/volumes/${id}`)

// Lessons
export const getLessons = (volumeId: number) =>
  api.get<Lesson[]>(`/volumes/${volumeId}/lessons`).then(r => r.data)
export const createLesson = (volumeId: number, data: { no: number }) =>
  api.post<Lesson>(`/volumes/${volumeId}/lessons`, data).then(r => r.data)
export const updateLesson = (id: number, data: { no?: number }) =>
  api.put<Lesson>(`/lessons/${id}`, data).then(r => r.data)
export const deleteLesson = (id: number) => api.delete(`/lessons/${id}`)

// Characters
export const getCharacters = (lessonId: number) =>
  api.get<Character[]>(`/lessons/${lessonId}/characters`).then(r => r.data)
export const createCharacter = (lessonId: number, data: { char: string; pinyin: string; word_1: string; word_2?: string | null; word_3?: string | null }) =>
  api.post<Character>(`/lessons/${lessonId}/characters`, data).then(r => r.data)
export const updateCharacter = (id: number, data: { char?: string; pinyin?: string; word_1?: string; word_2?: string | null; word_3?: string | null }) =>
  api.put<Character>(`/characters/${id}`, data).then(r => r.data)
export const deleteCharacter = (id: number) => api.delete(`/characters/${id}`)

// Learning
export const getLearningChars = (volumeId: number) =>
  api.get<Character[]>(`/learning/volume/${volumeId}`).then(r => r.data)

// Review
export const getReviewNext = (volumeId: number, count = 20) =>
  api.get<ReviewChar[]>(`/review/next`, { params: { volume_id: volumeId, count } }).then(r => r.data)
export const submitReviewResult = (characterId: number, known: boolean) =>
  api.post('/review/result', { character_id: characterId, known }).then(r => r.data)
export const getReviewStats = (volumeId: number) =>
  api.get<ReviewStats>('/review/stats', { params: { volume_id: volumeId } }).then(r => r.data)
