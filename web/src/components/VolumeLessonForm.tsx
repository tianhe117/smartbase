import { useState, useEffect } from 'react'

interface Props {
  title: string
  initialNo?: number
  initialName?: string
  showName?: boolean
  onSave: (no: number, name?: string) => void
  onCancel: () => void
}

export default function VolumeLessonForm({ title, initialNo = 1, initialName = '', showName = true, onSave, onCancel }: Props) {
  const [no, setNo] = useState(initialNo)
  const [name, setName] = useState(initialName)

  useEffect(() => {
    setNo(initialNo)
    setName(initialName)
  }, [initialNo, initialName])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">序号</span>
            <input
              type="number"
              min={1}
              value={no}
              onChange={e => setNo(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          {showName && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">名称</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="如：一年级上册"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </label>
          )}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={() => onSave(no, name || undefined)}
            className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
