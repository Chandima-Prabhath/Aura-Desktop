import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseEpisodeRange = (
  rangeStr: string,
  total: number
): number[] => {
  if (!rangeStr || rangeStr.trim().toLowerCase() === "all") {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const selected = new Set<number>()
  const parts = rangeStr.split(",")

  for (const part of parts) {
    const trimmedPart = part.trim()
    if (trimmedPart.includes("-")) {
      try {
        const [start, end] = trimmedPart.split("-")
        let s = parseInt(start, 10)
        let e = parseInt(end, 10)

        if (isNaN(s) || isNaN(e)) {
          continue
        }

        if (s < 1) s = 1
        if (e > total) e = total

        for (let i = s; i <= e; i++) {
          selected.add(i)
        }
      } catch (error) {
        // Ignore parsing errors
      }
    } else {
      try {
        const num = parseInt(trimmedPart, 10)
        if (!isNaN(num) && num >= 1 && num <= total) {
          selected.add(num)
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b)
}
