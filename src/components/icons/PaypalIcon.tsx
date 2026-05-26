import type { SVGProps } from 'react'

/**
 * Line-style PayPal mark drawn to match the stroke weight of lucide-react
 * icons so it sits naturally next to them in buttons. Color follows
 * `currentColor`.
 */
export function PaypalIcon({
  className,
  strokeWidth = 1.75,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M10 13h2.5c2.5 0 5 -2.5 5 -5c0 -3 -1.9 -5 -5 -5h-5.5l-3 17h3l1 -5l2 -2z" />
      <path d="M12 17h2.5c2.5 0 5 -2.5 5 -5c0 -3 -1.9 -5 -5 -5" />
    </svg>
  )
}
