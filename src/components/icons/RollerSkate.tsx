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
      <path d="M3 13c0-1.1.9-2 2-2h1.2a2 2 0 0 0 1.6-.8L9 8.6A2 2 0 0 1 10.6 8H14a2 2 0 0 1 2 2v3.5c0 1.1.9 2 2 2h1" />
      <path d="M18 17.5a1.5 1.5 0 0 0 1.5-1.5v-1a.5.5 0 0 0-.5-.5H17a.5.5 0 0 0-.5.5v1a1.5 1.5 0 0 0 1.5 1.5Z" />
      <path d="M6 8h3" />
      <path d="M6 11h2" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="16" cy="18.5" r="2.5" />
      <path d="M10.5 8v3" />
      <line x1="12" y1="3" x2="14" y2="5" />
      <line x1="14" y1="3" x2="12" y2="5" />
    </svg>
  );
}
