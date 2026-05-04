export default function Spinner({ full }) {
  if (full) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f15]">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
}
