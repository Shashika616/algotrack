export async function logProblemActivity(
  userId: string,
  problemId: string,
  status: 'solved' | 'attempted' | 'reviewed',
  timeTaken?: number,
  notes?: string
) {
  const response = await fetch('/api/user-problems/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      problemId,
      status,
      timeTaken,
      notes,
    }),
  });
  return response.json();
}

export async function logDailyActivity(userId: string) {
  const response = await fetch('/api/daily-logs/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return response.json();
}