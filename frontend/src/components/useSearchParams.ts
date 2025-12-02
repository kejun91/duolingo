// Simple hook to get URL search params
export function useSearchParams() {
  return new URLSearchParams(window.location.search)
}
