export function selectRandomJobs(jobs, limit, random = Math.random) {
  const count = Math.max(0, Math.floor(Number(limit) || 0))
  const shuffled = [...jobs]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled.slice(0, count)
}
