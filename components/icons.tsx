
import React from 'react';

const iconProps = {
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export const BrushIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className}>
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

export const UndoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
);

export const RedoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className}>
        <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
    </svg>
);

export const ClearIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className}>
        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const RetryIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className}>
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);
