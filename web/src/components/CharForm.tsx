import { useState, useEffect, useRef } from 'react'
import { lookupCharacter } from '../api/client'
import type { Character, CharType } from '../types'

interface Props {
  title: string
  initial?: Character
  onSave: (data: { char: string; pinyin: string; word_1: string; word_2?: string | null; word_3?: string | null; char_type?: CharType }) => void
  onDelete?: () => void
  onCancel: () => void
}

const TYPE_OPTIONS: { value: CharType; label: string; color: string }[] = [
  { value: 'new', label: '生字', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'mistake', label: '错字', color: 'bg-red-50 text-red-700 border-red-300' },
  { value: 'mastered', label: '熟字', color: 'bg-green-50 text-green-700 border-green-300' },
]

export default function CharForm({ title, initial, onSave, onDelete, onCancel }: Props) {
  const isEdit = !!initial?.id
  const [char, setChar] = useState(initial?.char || '')
  const [pinyin, setPinyin] = useState(initial?.pinyin || '')
  const [word1, setWord1] = useState(initial?.word_1 || '')
  const [word2, setWord2] = useState(initial?.word_2 || '')
  const [word3, setWord3] = useState(initial?.word_3 || '')
  const [charType, setCharType] = useState<CharType>(initial?.char_type || 'new')
  const [loading, setLoading] = useState(false)
  const lookupTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setChar(initial?.char || '')
    setPinyin(initial?.pinyin || '')
    setWord1(initial?.word_1 || '')
    setWord2(initial?.word_2 || '')
    setWord3(initial?.word_3 || '')
    setCharType(initial?.char_type || 'new')
  }, [initial])

  // Auto-lookup for new characters
  useEffect(() => {
    if (isEdit) return
    if (lookupTimer.current) clearTimeout(lookupTimer.current)

    if (char.length === 1 && /[一-鿿]/.test(char)) {
      lookupTimer.current = setTimeout(async () => {
        setLoading(true)
        try {
          const result = await lookupCharacter(char)
          setPinyin(result.pinyin)
          setWord1(result.word_1)
          setWord2(result.word_2)
        } catch {}
        setLoading(false)
      }, 300)
    }

    return () => { if (lookupTimer.current) clearTimeout(lookupTimer.current) }
  }, [char, isEdit])

  const canSave = char.trim() && pinyin.trim() && word1.trim()

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div className="flex flex-col gap-3">
          {/* Character */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">汉字</span>
            <input
              type="text"
              maxLength={1}
              value={char}
              onChange={e => setChar(e.target.value)}
              disabled={isEdit}
              className="border border-gray-300 rounded-lg px-3 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </label>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">类型</span>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCharType(opt.value)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    charType === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-orange-300'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading && <div className="text-sm text-orange-500 text-center">正在查询拼音和组词...</div>}

          {/* Pinyin */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">拼音</span>
            <input
              type="text"
              value={pinyin}
              onChange={e => setPinyin(e.target.value)}
              placeholder="如：mā"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>

          {/* Words */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">组词1（必填）</span>
            <input type="text" value={word1} onChange={e => setWord1(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">组词2（可选）</span>
            <input type="text" value={word2} onChange={e => setWord2(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">组词3（可选）</span>
            <input type="text" value={word3} onChange={e => setWord3(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </label>
        </div>

        <div className="flex gap-2 mt-5 justify-between">
          <div>
            {isEdit && onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                删除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              onClick={() => canSave && onSave({
                char: char.trim(),
                pinyin: pinyin.trim(),
                word_1: word1.trim(),
                word_2: word2.trim() || null,
                word_3: word3.trim() || null,
                char_type: charType,
              })}
              disabled={!canSave}
              className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
