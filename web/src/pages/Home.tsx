import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVolumes, getLessons } from '../api/client'
import type { Volume, Lesson } from '../types'
import VolumeCard from '../components/VolumeCard'

type ReviewMode = 'smart' | 'all'

// 复习弹窗（单册）
interface VolumeReviewModal {
  type: 'volume'
  volumeId: number
  volumeName: string
  lessons: Lesson[]
}

// 总复习弹窗（多册/全部）
interface GlobalReviewModal {
  type: 'global'
  volumes: Volume[]
}

type ModalState = VolumeReviewModal | GlobalReviewModal | null

export default function Home() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [selectedLessons, setSelectedLessons] = useState<number[]>([])
  const [selectedVolumes, setSelectedVolumes] = useState<number[]>([])
  const [reviewMode, setReviewMode] = useState<ReviewMode>('smart')
  const navigate = useNavigate()

  useEffect(() => {
    getVolumes().then(setVolumes).finally(() => setLoading(false))
  }, [])

  // 复习 - 单册
  const handleVolumeReview = async (volumeId: number) => {
    const v = volumes.find(x => x.id === volumeId)
    if (!v) return
    const lessons = await getLessons(volumeId)
    setModal({ type: 'volume', volumeId, volumeName: v.name, lessons })
    setSelectedLessons([])
    setReviewMode('smart')
  }

  // 总复习
  const handleGlobalReview = () => {
    setModal({ type: 'global', volumes })
    setSelectedVolumes([])
    setReviewMode('smart')
  }

  const handleStartVolumeReview = () => {
    if (modal?.type !== 'volume') return
    const ids = selectedLessons.length > 0 ? selectedLessons.join(',') : 'all'
    navigate(`/review/${modal.volumeId}?lessons=${ids}&mode=${reviewMode}`)
  }

  const handleStartGlobalReview = () => {
    if (modal?.type !== 'global') return
    if (selectedVolumes.length === 0) return
    const vids = selectedVolumes.join(',')
    navigate(`/review/all?volumes=${vids}&mode=${reviewMode}`)
  }

  const toggleLesson = (id: number) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllLessons = () => {
    if (modal?.type !== 'volume') return
    if (selectedLessons.length === modal.lessons.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons(modal.lessons.map(l => l.id))
    }
  }

  const toggleVolume = (id: number) => {
    setSelectedVolumes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllVolumes = () => {
    if (modal?.type !== 'global') return
    if (selectedVolumes.length === modal.volumes.length) {
      setSelectedVolumes([])
    } else {
      setSelectedVolumes(modal.volumes.map(v => v.id))
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-20">加载中...</div>
  }

  if (volumes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">还没有课本</h2>
        <p className="text-gray-500 mb-6">去管理页面添加第一册课本吧</p>
        <button onClick={() => navigate('/manage')} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          去管理
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">选择课本</h1>
        <button
          onClick={handleGlobalReview}
          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          总复习
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {volumes.map(v => (
          <VolumeCard
            key={v.id}
            volume={v}
            onStudy={id => navigate(`/learn/${id}`)}
            onReview={handleVolumeReview}
          />
        ))}
      </div>

      {/* 复习弹窗（单册） */}
      {modal?.type === 'volume' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-1">复习</h3>
            <p className="text-sm text-gray-500 mb-4">{modal.volumeName}</p>

            {/* 模式选择 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setReviewMode('smart')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  reviewMode === 'smart'
                    ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-offset-1 ring-orange-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                智能模式
              </button>
              <button
                onClick={() => setReviewMode('all')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  reviewMode === 'all'
                    ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-offset-1 ring-orange-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                全部汉字
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {reviewMode === 'smart' ? '根据熟练度智能安排出现频率' : '按顺序复习全部汉字'}
            </p>

            {/* 课程选择 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">选择课程</span>
              <button onClick={toggleAllLessons} className="text-xs text-orange-600 hover:underline">
                {selectedLessons.length === modal.lessons.length ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4">
              {modal.lessons.map(l => (
                <label key={l.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLessons.includes(l.id)}
                    onChange={() => toggleLesson(l.id)}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700">第 {l.no} 课</span>
                  <span className="text-xs text-gray-400 ml-auto">{l.char_count} 字</span>
                </label>
              ))}
            </div>

            {/* 整册按钮 */}
            <button
              onClick={() => { setSelectedLessons([]); handleStartVolumeReview() }}
              className="w-full py-2.5 mb-3 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors"
            >
              整册复习
            </button>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                取消
              </button>
              <button
                onClick={handleStartVolumeReview}
                disabled={selectedLessons.length === 0}
                className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                开始 ({selectedLessons.length > 0 ? `${selectedLessons.length} 课` : '选课'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 总复习弹窗 */}
      {modal?.type === 'global' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">总复习</h3>

            {/* 模式选择 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setReviewMode('smart')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  reviewMode === 'smart'
                    ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-offset-1 ring-orange-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                智能模式
              </button>
              <button
                onClick={() => setReviewMode('all')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  reviewMode === 'all'
                    ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-offset-1 ring-orange-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                全部汉字
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {reviewMode === 'smart' ? '根据熟练度智能安排出现频率' : '按顺序复习全部汉字'}
            </p>

            {/* 册选择 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">选择课本</span>
              <button onClick={toggleAllVolumes} className="text-xs text-orange-600 hover:underline">
                {selectedVolumes.length === modal.volumes.length ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4">
              {modal.volumes.map(v => (
                <label key={v.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVolumes.includes(v.id)}
                    onChange={() => toggleVolume(v.id)}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-700">{v.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{v.char_count} 字</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                取消
              </button>
              <button
                onClick={handleStartGlobalReview}
                disabled={selectedVolumes.length === 0}
                className="px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                开始 ({selectedVolumes.length > 0 ? `${selectedVolumes.length} 册` : '选册'})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
