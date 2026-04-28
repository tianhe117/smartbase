import { useEffect, useState, useCallback } from 'react'
import {
  getVolumes, createVolume, updateVolume, deleteVolume,
  getLessons, createLesson, updateLesson, deleteLesson,
  getCharacters, createCharacter, updateCharacter, deleteCharacter,
} from '../api/client'
import type { Volume, Lesson, Character } from '../types'
import VolumeLessonForm from '../components/VolumeLessonForm'
import CharForm from '../components/CharForm'

type ModalState =
  | { type: 'addVolume' }
  | { type: 'editVolume'; volume: Volume }
  | { type: 'addLesson'; volumeId: number }
  | { type: 'editLesson'; lesson: Lesson }
  | { type: 'addChar'; lessonId: number }
  | { type: 'editChar'; char: Character }
  | null

export default function Manage() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [modal, setModal] = useState<ModalState>(null)

  const loadVolumes = useCallback(() => {
    getVolumes().then(v => {
      setVolumes(v)
      if (selectedVolume) {
        const updated = v.find(x => x.id === selectedVolume.id)
        if (updated) setSelectedVolume(updated)
        else { setSelectedVolume(null); setLessons([]); setSelectedLesson(null); setCharacters([]) }
      }
    })
  }, [selectedVolume])

  const loadLessons = useCallback((volumeId: number) => {
    getLessons(volumeId).then(l => {
      setLessons(l)
      if (selectedLesson) {
        const updated = l.find(x => x.id === selectedLesson.id)
        if (updated) setSelectedLesson(updated)
        else { setSelectedLesson(null); setCharacters([]) }
      }
    })
  }, [selectedLesson])

  useEffect(() => { loadVolumes() }, []) // eslint-disable-line
  useEffect(() => { if (selectedVolume) loadLessons(selectedVolume.id) }, [selectedVolume]) // eslint-disable-line
  useEffect(() => { if (selectedLesson) getCharacters(selectedLesson.id).then(setCharacters) }, [selectedLesson])

  const handleSaveVolume = async (no: number, name?: string) => {
    if (modal?.type === 'addVolume') {
      await createVolume({ no, name: name || `第${no}册` })
    } else if (modal?.type === 'editVolume') {
      await updateVolume(modal.volume.id, { no, name })
    }
    setModal(null)
    loadVolumes()
  }

  const handleSaveLesson = async (no: number) => {
    if (modal?.type === 'addLesson') {
      await createLesson(modal.volumeId, { no })
    } else if (modal?.type === 'editLesson') {
      await updateLesson(modal.lesson.id, { no })
    }
    setModal(null)
    if (selectedVolume) loadLessons(selectedVolume.id)
  }

  const handleSaveChar = async (data: { char: string; pinyin: string; word_1: string; word_2?: string; word_3?: string }) => {
    if (modal?.type === 'addChar') {
      await createCharacter(modal.lessonId, data)
    } else if (modal?.type === 'editChar') {
      await updateCharacter(modal.char.id, data)
    }
    setModal(null)
    if (selectedLesson) getCharacters(selectedLesson.id).then(setCharacters)
  }

  const handleDeleteVolume = async (id: number) => {
    if (!confirm('确定删除该册？将同时删除所有课和汉字。')) return
    await deleteVolume(id)
    if (selectedVolume?.id === id) { setSelectedVolume(null); setLessons([]); setSelectedLesson(null); setCharacters([]) }
    loadVolumes()
  }

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('确定删除该课？')) return
    await deleteLesson(id)
    if (selectedLesson?.id === id) { setSelectedLesson(null); setCharacters([]) }
    if (selectedVolume) loadLessons(selectedVolume.id)
  }

  const handleDeleteChar = async (id: number) => {
    if (!confirm('确定删除该汉字？')) return
    await deleteCharacter(id)
    if (selectedLesson) getCharacters(selectedLesson.id).then(setCharacters)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 min-h-[60vh]">
      {/* Volume list */}
      <div className="md:w-56 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">册</h2>
          <button onClick={() => setModal({ type: 'addVolume' })} className="text-sm text-orange-600 hover:underline">+ 新建</button>
        </div>
        <div className="flex flex-col gap-2">
          {volumes.map(v => (
            <div
              key={v.id}
              onClick={() => { setSelectedVolume(v); setSelectedLesson(null); setCharacters([]) }}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedVolume?.id === v.id ? 'bg-orange-100 text-orange-800' : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-sm truncate">{v.name}</span>
              <span className="hidden group-hover:flex gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); setModal({ type: 'editVolume', volume: v }) }} className="text-xs text-gray-400 hover:text-gray-600">编辑</button>
                <button onClick={e => { e.stopPropagation(); handleDeleteVolume(v.id) }} className="text-xs text-red-400 hover:text-red-600">删除</button>
              </span>
            </div>
          ))}
          {volumes.length === 0 && <div className="text-sm text-gray-400">暂无数据</div>}
        </div>
      </div>

      {/* Lesson list */}
      <div className="md:w-48 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">课</h2>
          {selectedVolume && (
            <button onClick={() => setModal({ type: 'addLesson', volumeId: selectedVolume.id })} className="text-sm text-orange-600 hover:underline">+ 新建</button>
          )}
        </div>
        {!selectedVolume ? (
          <div className="text-sm text-gray-400">请先选择一册</div>
        ) : (
          <div className="flex flex-col gap-2">
            {lessons.map(l => (
              <div
                key={l.id}
                onClick={() => { setSelectedLesson(l); getCharacters(l.id).then(setCharacters) }}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedLesson?.id === l.id ? 'bg-orange-100 text-orange-800' : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-sm">第 {l.no} 课 <span className="text-gray-400">({l.char_count}字)</span></span>
                <span className="hidden group-hover:flex gap-1 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setModal({ type: 'editLesson', lesson: l }) }} className="text-xs text-gray-400 hover:text-gray-600">编辑</button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteLesson(l.id) }} className="text-xs text-red-400 hover:text-red-600">删除</button>
                </span>
              </div>
            ))}
            {lessons.length === 0 && <div className="text-sm text-gray-400">暂无课程</div>}
          </div>
        )}
      </div>

      {/* Character list */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">汉字</h2>
          {selectedLesson && (
            <button onClick={() => setModal({ type: 'addChar', lessonId: selectedLesson.id })} className="text-sm text-orange-600 hover:underline">+ 添加汉字</button>
          )}
        </div>
        {!selectedLesson ? (
          <div className="text-sm text-gray-400">请先选择一课</div>
        ) : characters.length === 0 ? (
          <div className="text-sm text-gray-400">暂无汉字，点击上方添加</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {characters.map(c => (
              <div key={c.id} className="bg-white rounded-lg p-3 border border-gray-100 group relative">
                <div className="text-3xl font-bold text-center text-gray-800">{c.char}</div>
                <div className="text-sm text-center text-orange-500">{c.pinyin}</div>
                <div className="text-xs text-center text-gray-400 mt-1">{c.word_1}</div>
                <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                  <button onClick={() => setModal({ type: 'editChar', char: c })} className="text-xs bg-gray-100 rounded px-1 hover:bg-gray-200">编辑</button>
                  <button onClick={() => handleDeleteChar(c.id)} className="text-xs bg-red-50 text-red-500 rounded px-1 hover:bg-red-100">删</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'addVolume' && (
        <VolumeLessonForm title="新建册" onSave={handleSaveVolume} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'editVolume' && (
        <VolumeLessonForm title="编辑册" initialNo={modal.volume.no} initialName={modal.volume.name} onSave={handleSaveVolume} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'addLesson' && (
        <VolumeLessonForm title="新建课" showName={false} initialNo={lessons.length + 1} onSave={handleSaveLesson} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'editLesson' && (
        <VolumeLessonForm title="编辑课" showName={false} initialNo={modal.lesson.no} onSave={handleSaveLesson} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'addChar' && (
        <CharForm title="添加汉字" onSave={handleSaveChar} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'editChar' && (
        <CharForm title="编辑汉字" initial={modal.char} onSave={handleSaveChar} onCancel={() => setModal(null)} />
      )}
    </div>
  )
}
