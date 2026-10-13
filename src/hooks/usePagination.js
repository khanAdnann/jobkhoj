import { useMemo } from 'react'

/**
 * Client-side pagination.
 *
 * @param {Array}  items      Full result set (already filtered + sorted).
 * @param {number} page       1-based current page.
 * @param {number} pageSize   Items per page.
 * @returns {{pageItems, totalItems, totalPages, rangeStart, rangeEnd, hasPrev, hasNext, pageFrom}}
 */
export function usePagination(items = [], page = 1, pageSize = 12) {
  return useMemo(() => {
    const totalItems = items.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    // Clamp so deleting items on the last page can't strand the user.
    const safePage = Math.min(Math.max(1, page), totalPages)

    const start = (safePage - 1) * pageSize
    const pageItems = items.slice(start, start + pageSize)

    return {
      pageItems,
      totalItems,
      totalPages,
      page: safePage,
      pageSize,
      rangeStart: totalItems === 0 ? 0 : start + 1,
      rangeEnd: Math.min(start + pageSize, totalItems),
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
      /** First/last visible page index for a sliding window. */
      pageFrom: Math.max(1, Math.min(safePage - 2, totalPages - 4)),
      pageTo: Math.min(Math.max(safePage + 2, 5), totalPages),
    }
  }, [items, page, pageSize])
}

export default usePagination
