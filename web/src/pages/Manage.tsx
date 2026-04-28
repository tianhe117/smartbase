import { useEffect, useState, useCallback } from 'react'
import {
  getVolumes, createVolume, updateVolume, deleteVolume,
  getLessons, createLesson, updateLesson, deleteLesson,
  getCharacters, batchAddCharacters, updateCharacter, deleteCharacter,
} from '../api/client'
import type { Volume, Lesson, Character } from '../types'
import VolumeLessonForm from '../components/VolumeLessonForm'
import CharForm from '../components/CharForm'
import BatchCharForm from '../components/BatchCharForm'

type ModalState =
  | { type: 'addVolume' }
  | { type: 'editVolume'; volume: Volume }
  | { type: 'addLesson'; volumeId: number }
  | { type: 'editLesson'; lesson: Lesson }
  | { type: 'addChar'; lessonId: number }
  | { type: 'editChar'; char: Character }
  | null

const STORAGE_KEY = 'smartbase_manage_selection'

function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as { volumeId?: number; lessonId?: number }
  } catch {}
  return {}
}

function saveSelection(volumeId?: number, lessonId?: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ volumeId, lessonId }))
}

export default function Manage() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [modal, setModal] = useState<ModalState>(null)
  const [initialized, setInitialized] = useState(false)

  const loadVolumes = useCallback(() => {
    return getVolumes().then(v => {
      const sorted = [...v].sort((a, b) => a.no - b.no)
      setVolumes(sorted)
      return sorted
    })
  }, [])

  // Restore selection from localStorage on mount
  useEffect(() => {
    loadVolumes().then(async (sorted) => {
      const sel = loadSelection()
      if (sel.volumeId) {
        const vol = sorted.find(x => x.id === sel.volumeId)
        if (vol) {
          setSelectedVolume(vol)
          const l = await getLessons(vol.id)
          const sortedLessons = [...l].sort((a, b) => a.no - b.no)
          setLessons(sortedLessons)
          if (sel.lessonId) {
            const les = sortedLessons.find(x => x.id === sel.lessonId)
            if (les) {
              setSelectedLesson(les)
              const chars = await getCharacters(les.id)
              setCharacters(chars)
            }
          }
        }
      }
      setInitialized(true)
    })
  }, []) // eslint-disable-line

  // Reload lessons when volume changes (but not on initial restore)
  useEffect(() => {
    if (!initialized) return
    if (selectedVolume) {
      getLessons(selectedVolume.id).then(l => {
        const sorted = [...l].sort((a, b) => a.no - b.no)
        setLessons(sorted)
        // Keep lesson selection if still valid
        if (selectedLesson) {
          const updated = sorted.find(x => x.id === selectedLesson.id)
          if (updated) setSelectedLesson(updated)
          else { setSelectedLesson(null); setCharacters([]) }
        }
      })
      saveSelection(selectedVolume.id, selectedLesson?.id)
    }
  }, [selectedVolume]) // eslint-disable-line

  // Reload characters when lesson changes
  useEffect(() => {
    if (!initialized) return
    if (selectedLesson) {
      getCharacters(selectedLesson.id).then(setCharacters)
      saveSelection(selectedVolume?.id, selectedLesson.id)
    }
  }, [selectedLesson]) // eslint-disable-line

  const handleSelectVolume = (v: Volume) => {
    setSelectedVolume(v)
    setSelectedLesson(null)
    setCharacters([])
    saveSelection(v.id, undefined)
  }

  const handleSelectLesson = (l: Lesson) => {
    setSelectedLesson(l)
    getCharacters(l.id).then(setCharacters)
    saveSelection(selectedVolume?.id, l.id)
  }

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
    if (selectedVolume) {
      const l = await getLessons(selectedVolume.id)
      setLessons([...l].sort((a, b) => a.no - b.no))
    }
  }

  const handleBatchAdd = async (chars: string) => {
    if (modal?.type === 'addChar') {
      await batchAddCharacters(modal.lessonId, chars)
    }
    setModal(null)
    if (selectedLesson) getCharacters(selectedLesson.id).then(setCharacters)
  }

  const handleSaveChar = async (data: { char: string; pinyin: string; word_1: string; word_2?: string | null; word_3?: string | null; char_type?: string }) => {
    if (modal?.type === 'editChar') {
      await updateCharacter(modal.char.id, data)
    }
    setModal(null)
    if (selectedLesson) getCharacters(selectedLesson.id).then(setCharacters)
  }

  const handleDeleteVolume = async (id: number) => {
    if (!confirm('确定删除该册？将同时删除所有课和汉字。')) return
    await deleteVolume(id)
    if (selectedVolume?.id === id) {
      setSelectedVolume(null); setLessons([]); setSelectedLesson(null); setCharacters([])
      saveSelection(undefined, undefined)
    }
    loadVolumes()
  }

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('确定删除该课？')) return
    await deleteLesson(id)
    if (selectedLesson?.id === id) { setSelectedLesson(null); setCharacters([]) }
    if (selectedVolume) {
      const l = await getLessons(selectedVolume.id)
      setLessons([...l].sort((a, b) => a.no - b.no))
    }
  }

  // Validation: check duplicate no
  const getVolumeNos = (excludeId?: number) =>
    volumes.filter(v => v.id !== excludeId).map(v => v.no)
  const getLessonNos = (excludeId?: number) =>
    lessons.filter(l => l.id !== excludeId).map(l => l.no)

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
              onClick={() => handleSelectVolume(v)}
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
                onClick={() => handleSelectLesson(l)}
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
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {characters.map(c => (
              <button
                key={c.id}
                onClick={() => setModal({ type: 'editChar', char: c })}
                className={`rounded-lg p-2 border aspect-square flex items-center justify-center cursor-pointer transition-colors ${
                  c.char_type === 'mastered' ? 'bg-green-50 border-green-200' :
                  c.char_type === 'mistake' ? 'bg-red-50 border-red-200' :
                  'bg-white border-gray-100'
                } hover:ring-2 hover:ring-orange-300`}
              >
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">{c.char}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'addVolume' && (
        <VolumeLessonForm title="新建册" existingNos={getVolumeNos()} onSave={handleSaveVolume} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'editVolume' && (
        <VolumeLessonForm title="编辑册" initialNo={modal.volume.no} initialName={modal.volume.name} existingNos={getVolumeNos(modal.volume.id)} onSave={handleSaveVolume} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'addLesson' && (
        <VolumeLessonForm title="新建课" showName={false} initialNo={lessons.length > 0 ? Math.max(...lessons.map(l => l.no)) + 1 : 1} existingNos={getLessonNos()} onSave={handleSaveLesson} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'editLesson' && (
        <VolumeLessonForm title="编辑课" showName={false} initialNo={modal.lesson.no} existingNos={getLessonNos(modal.lesson.id)} onSave={handleSaveLesson} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'addChar' && (
        <BatchCharForm lessonId={modal.lessonId} onSave={handleBatchAdd} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'editChar' && (
        <CharForm
          title="编辑汉字"
          initial={modal.char}
          onSave={handleSaveChar}
          onDelete={async () => {
            if (!confirm('确定删除该汉字？')) return
            await deleteCharacter(modal.char.id)
            setModal(null)
            if (selectedLesson) getCharacters(selectedLesson.id).then(setCharacters)
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
