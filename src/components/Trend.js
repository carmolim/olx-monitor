const theilSen = (points) => {
  // points: [{ xDays: number, y: number }]
  const clean = points
    .filter((p) => Number.isFinite(p.xDays) && Number.isFinite(p.y))
    .sort((a, b) => a.xDays - b.xDays)

  if (clean.length < 2) return null

  const slopes = []
  for (let i = 0; i < clean.length; i++) {
    for (let j = i + 1; j < clean.length; j++) {
      const dx = clean[j].xDays - clean[i].xDays
      if (dx === 0) continue
      slopes.push((clean[j].y - clean[i].y) / dx)
    }
  }

  if (slopes.length === 0) return null
  slopes.sort((a, b) => a - b)
  const medianSlope = slopes[Math.floor(slopes.length / 2)]

  const intercepts = clean.map((p) => p.y - medianSlope * p.xDays).sort((a, b) => a - b)
  const medianIntercept = intercepts[Math.floor(intercepts.length / 2)]

  const first = clean[0]
  const last = clean[clean.length - 1]
  const spanDays = last.xDays - first.xDays

  return {
    slopePerDay: medianSlope,
    intercept: medianIntercept,
    n: clean.length,
    spanDays,
  }
}

module.exports = {
  theilSen,
}

