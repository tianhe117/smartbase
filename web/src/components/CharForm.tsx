import { useState, useEffect } from 'react'
import type { Character } from '../types'

interface Props {
  title: string
  initial?: Partial<Character>
  onSave: (data: { char: string; pinyin: string; word_1: string; word_2?: string; word_3?: string }) => void
  onCancel: () => void
}

export default function CharForm({ title, initial, onSave, onCancel }: Props) {
  const [char, setChar] = useState(initial?.char || '')
  const [pinyin, setPinyin] = useState(initial?.pinyin || '')
  const [word1, setWord1] = useState(initial?.word_1 || '')
  const [word2, setWord2] = useState(initial?.word_2 || '')
  const [word3, setWord3] = useState(initial?.word_3 || '')

  useEffect(() => {
    setChar(initial?.char || '')
    setPinyin(initial?.pinyin || '')
    setWord1(initial?.word_1 || '')
    setWord2(initial?.word_2 || '')
    setWord3(initial?.word_3 || '')
  }, [initial])

  const canSave = char.trim() && pinyin.trim() && word1.trim()

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">汉字</span>
            <input
              type="text"
              maxLength={1}
              value={char}
              onChange={e => setChar(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
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
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">组词1（必填）</span>
            <input
              type="text"
              value={word1}
              onChange={e => setWord1(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">组词2（可选）</span>
            <input
              type="text"
              value={word2}
              onChange={e => setWord2(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">组词3（可选）</span>
            <input
              type="text"
              value={word3}
              onChange={e => setWord3(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={() => canSave && onSave({ char: char.trim(), pinyin: pinyin.trim(), word_1: word1.trim(), word_2: word2.trim() || undefined, word_3: word3.trim() || undefined })}
            disabled={!canSave}
            className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
