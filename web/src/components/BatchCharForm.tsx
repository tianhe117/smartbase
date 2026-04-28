import { useState } from 'react'

interface Props {
  lessonId: number
  onSave: (chars: string) => void
  onCancel: () => void
}

export default function BatchCharForm({ onSave, onCancel }: Props) {
  const [text, setText] = useState('')

  // Filter to only Chinese characters
  const chineseChars = text.replace(/[^一-鿿㐀-䶿]/g, '')
  const charCount = chineseChars.length
  const canSave = charCount > 0 && charCount <= 100

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-1">批量添加汉字</h3>
        <p className="text-sm text-gray-500 mb-4">输入或粘贴汉字，拼音和组词将自动查询</p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={200}
          placeholder="在此输入或粘贴汉字..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
        />

        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm ${charCount > 100 ? 'text-red-500' : 'text-gray-500'}`}>
            {charCount > 0 ? `识别到 ${charCount} 个汉字` : '未识别到汉字'}
            {charCount > 100 && ' (超过100个上限)'}
          </span>
          <span className="text-xs text-gray-400">非汉字字符将自动忽略</span>
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={() => canSave && onSave(chineseChars)}
            disabled={!canSave}
            className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            添加 {charCount > 0 && `(${charCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}
