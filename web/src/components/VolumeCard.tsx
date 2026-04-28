import type { Volume } from '../types'

interface Props {
  volume: Volume
  onStudy: (id: number) => void
  onReview: (id: number) => void
}

export default function VolumeCard({ volume, onStudy, onReview }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 flex flex-col gap-3">
      <div>
        <div className="text-xs text-gray-400">第 {volume.no} 册</div>
        <h3 className="text-lg font-bold text-gray-800">{volume.name}</h3>
        <div className="text-sm text-gray-500 mt-1">
          {volume.lesson_count} 课 · {volume.char_count} 字
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onStudy(volume.id)}
          className="flex-1 py-2 px-3 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          学习
        </button>
        <button
          onClick={() => onReview(volume.id)}
          className="flex-1 py-2 px-3 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors"
        >
          复习
        </button>
      </div>
    </div>
  )
}
