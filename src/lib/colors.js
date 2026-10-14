export const subjectColors = ['#5965d8', '#16a085', '#e58c51', '#b45ba6', '#3985bd', '#d46a78']

export function colorFor(value, index = 0) {
  if (!value) return subjectColors[index % subjectColors.length]
  let hash = 0
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return subjectColors[hash % subjectColors.length]
}