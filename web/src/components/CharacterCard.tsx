import { useState } from 'react'
import type { Character } from '../types'

interface Props {
  character: Character
  onKnown: () => void
  onUnknown: () => void
  showPinyin?: boolean
  showWords?: boolean
  fullHeight?: boolean
}

export default function CharacterCard({ character, onKnown, onUnknown, showPinyin = false, showWords = false, fullHeight = false }: Props) {
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

  if (fullHeight) {
    return (
      <div className={`flex flex-col h-full transition-all duration-300 ${animating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Top: content area - pinyin, character, words grouped tightly */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          {/* Pinyin */}
          <div className="relative z-10 shrink-0">
            {pinyinVisible ? (
              <span className="font-pinyin text-[2.5rem] sm:text-[3.75rem] text-orange-500 font-medium leading-none animate-fade-in">
                {character.pinyin}
              </span>
            ) : (
              <button
                onClick={() => setPinyinVisible(true)}
                className="px-6 py-1.5 text-xl sm:text-3xl font-medium text-orange-600 bg-orange-50 border-2 border-orange-200 border-dashed rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-colors"
              >
                拼音
              </button>
            )}
          </div>

          {/* Character */}
          <span className="font-song text-[min(40vw,35vh)] font-bold text-gray-800 select-none leading-none shrink-0">
            {character.char}
          </span>

          {/* Words */}
          <div className="relative z-10 shrink-0 mt-2">
            {wordsVisible && words.length > 0 ? (
              <div className="flex gap-2 flex-wrap justify-center animate-fade-in">
                {words.map((w, i) => (
                  <span
                    key={i}
                    className="font-pinyin px-4 py-1 bg-amber-50 border border-amber-200 rounded-full text-xl sm:text-3xl text-amber-800"
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setWordsVisible(true)}
                className="px-6 py-1.5 text-xl sm:text-3xl font-medium text-amber-600 bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-colors"
              >
                组词
              </button>
            )}
          </div>
        </div>

        {/* Bottom: action buttons */}
        <div className="flex gap-3 justify-center items-center pt-2 pb-1">
          <button
            onClick={() => handleResult(true)}
            className="px-5 py-2 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-md whitespace-nowrap"
          >
            认识 ✓
          </button>
          <button
            onClick={() => handleResult(false)}
            className="px-5 py-2 bg-red-400 text-white text-lg font-bold rounded-xl hover:bg-red-500 active:scale-95 transition-all shadow-md whitespace-nowrap"
          >
            不认识
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center transition-all duration-300 ${animating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
      {/* Left: Character area */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        {/* Pinyin: button or text */}
        <div className="h-[12vh] sm:h-[15vh] flex items-end justify-center">
          {pinyinVisible ? (
            <span className="font-pinyin text-[12vw] sm:text-[8vh] text-orange-500 font-medium leading-none animate-fade-in">
              {character.pinyin}
            </span>
          ) : (
            <button
              onClick={() => setPinyinVisible(true)}
              className="px-8 py-2 text-lg sm:text-xl font-medium text-orange-600 bg-orange-50 border-2 border-orange-200 border-dashed rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-colors"
            >
              拼音
            </button>
          )}
        </div>

        {/* Character */}
        <div className="h-[40vh] sm:h-[50vh] w-full flex items-center justify-center">
          <span className="font-song text-[45vw] sm:text-[35vh] font-bold text-gray-800 select-none leading-none">
            {character.char}
          </span>
        </div>

        {/* Words: button or text */}
        <div className="h-[10vh] flex items-start justify-center">
          {wordsVisible && words.length > 0 ? (
            <div className="flex gap-3 flex-wrap justify-center animate-fade-in">
              {words.map((w, i) => (
                <span
                  key={i}
                  className="font-pinyin px-5 py-2 bg-amber-50 border border-amber-200 rounded-full text-2xl sm:text-3xl text-amber-800"
                >
                  {w}
                </span>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setWordsVisible(true)}
              className="px-8 py-2 text-lg sm:text-xl font-medium text-amber-600 bg-amber-50 border-2 border-amber-200 border-dashed rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-colors"
            >
              组词
            </button>
          )}
        </div>
      </div>

      {/* Right: result buttons */}
      <div className="flex sm:flex-col gap-3 sm:gap-4 sm:w-40 sm:pl-6 justify-center items-center mt-4 sm:mt-0">
        <button
          onClick={() => handleResult(true)}
          className="px-5 py-2.5 sm:py-3.5 bg-green-500 text-white text-base sm:text-xl font-bold rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-md whitespace-nowrap"
        >
          认识 ✓
        </button>
        <button
          onClick={() => handleResult(false)}
          className="px-5 py-2.5 sm:py-3.5 bg-red-400 text-white text-base sm:text-xl font-bold rounded-xl hover:bg-red-500 active:scale-95 transition-all shadow-md whitespace-nowrap"
        >
          不认识
        </button>
      </div>
    </div>
  )
}
