import { LucideProps } from "lucide-react";

export function RollerSkate(props: LucideProps) {
  const size = props.size || props.width || 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      width={size}
      height={size}
      style={props.style}
    >
      {/* Boot outline */}
      <path d="M4 15h11a2 2 0 0 0 2-2V7a1 1 0 0 0-1-1h-3.5L9 2.5A1 1 0 0 0 8.3 2H4a1 1 0 0 0-1 1v10a2 2 0 0 0 2 2z" />
      {/* Front toe stop brake */}
      <path d="M17 14.5a1.5 1.5 0 0 0 1.5-1.5v-1a0.5 0.5 0 0 0-.5-.5h-2.5a0.5 0.5 0 0 0-.5.5V13a1.5 1.5 0 0 0 1.5 1.5z" />
      {/* Laces details */}
      <path d="M8 6h3" />
      <path d="M8 9h3" />
      <path d="M8 12h2" />
      {/* Quad Wheels */}
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="14" cy="18" r="2.5" />
    </svg>
  );
}
