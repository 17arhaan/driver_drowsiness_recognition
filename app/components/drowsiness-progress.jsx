"use client"

import { useEffect, useState } from "react"

export function DrowsinessProgress({ value, className }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    // Smooth transition for the width
    const timeout = setTimeout(() => {
      setWidth(value)
    }, 10)

    return () => clearTimeout(timeout)
  }, [value])

  const isDanger = value > 75

  return (
    <div className={`progress-bar-container ${className}`}>
      <div
        className={`progress-bar ${isDanger ? "progress-bar-danger" : ""}`}
        style={{
          width: `${width}%`,
          backgroundColor: isDanger
            ? "rgba(239, 68, 68, 1)" // red-500
            : value > 40
              ? "rgba(245, 158, 11, 1)" // yellow-500
              : "rgba(34, 197, 94, 1)", // green-500
        }}
      />
    </div>
  )
}
