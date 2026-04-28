import { useState } from 'react'
import type { Character } from '../types'

interface Props {
  character: Character
  onKnown: () => void
  onUnknown: () => void
  showPinyin?: boolean
  showWords?: boolean
}

export default function CharacterCard({ character, onKnown, onUnknown, showPinyin = false, showWords = false }: Props) {
  const [pinyinVisible, setPinyinVisible] = useState(showPinyin)
  const [wordsVisible, setWordsVisible] = useState(showWords)
  const [animating, setAnimating] = useState(false)

  const handleResult = (known: boolean) => {
    setAnimating(true)
    setTimeout(() => {
      setPinyinVisible(false)
      setWordsVisible(false)
      setAnimating(false)
      if (known) onKnown()
      else onUnknown()
    }, 300)
  }

  const words = [character.word_1, character.word_2, character.word_3].filter(Boolean)

  return (
    <div className={`flex flex-col items-center gap-4 transition-all duration-300 ${animating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
      {/* Pinyin */}
      <div className="h-8 flex items-center">
        {pinyinVisible ? (
          <span className="text-xl text-orange-500 font-medium animate-fade-in">
            {character.pinyin}
          </span>
        ) : (
          <span className="text-xl text-transparent select-none">占位</span>
        )}
      </div>

      {/* Character */}
      <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-white rounded-2xl shadow-lg border-2 border-orange-100">
        <span className="text-8xl sm:text-9xl font-bold text-gray-800 select-none">
          {character.char}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setPinyinVisible(!pinyinVisible)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            pinyinVisible
              ? 'bg-orange-500 text-white'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
        >
          {pinyinVisible ? '隐藏拼音' : '查看拼音'}
        </button>
        <button
          onClick={() => setWordsVisible(!wordsVisible)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            wordsVisible
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {wordsVisible ? '隐藏组词' : '查看组词'}
        </button>
      </div>

      {/* Words */}
      {wordsVisible && words.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center animate-fade-in">
          {words.map((w, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Known / Unknown */}
      <div className="flex gap-4 mt-2">
        <button
          onClick={() => handleResult(true)}
          className="w-28 py-3 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-md"
        >
          认识 ✓
        </button>
        <button
          onClick={() => handleResult(false)}
          className="w-28 py-3 bg-red-400 text-white text-lg font-bold rounded-xl hover:bg-red-500 active:scale-95 transition-all shadow-md"
        >
          不认识
        </button>
      </div>
    </div>
  )
}
