/* =========================================================
   GLASS TOASTS
   Lightweight in-app notification system that replaces the
   native alert() popups. Presentation only — every message
   keeps the exact original wording from the app logic.
========================================================= */

export type ToastVariant = "info" | "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving?: boolean;
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (variant === "error") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const [firstLine, ...rest] = toast.message.split("\n");
        const description = rest.join("\n").trim();

        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.variant}${
              toast.leaving ? " toast-leaving" : ""
            }`}
          >
            <span className="toast-icon" aria-hidden="true">
              <ToastIcon variant={toast.variant} />
            </span>

            <div className="toast-content">
              <p className="toast-title">{firstLine}</p>

              {description ? (
                <p className="toast-description">{description}</p>
              ) : null}
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}