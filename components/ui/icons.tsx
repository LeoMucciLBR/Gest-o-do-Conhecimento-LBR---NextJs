export function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={"w-4 h-4 " + (props.className ?? "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

export function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={"w-4 h-4 " + (props.className ?? "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 6h16a2 2 0 0 1 2 2v.2l-10 6L2 8.2V8a2 2 0 0 1 2-2Z" />
      <path d="M22 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8" />
    </svg>
  );
}
export function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={"w-5 h-5 " + (props.className ?? "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.333 5 12 5c4.667 0 8.577 2.51 9.964 6.678.07.212.07.432 0 .644C20.577 16.49 16.667 19 12 19c-4.667 0-8.577-2.51-9.964-6.678Z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
    </svg>
  );
}

export function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={"w-5 h-5 " + (props.className ?? "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.98 8.223C2.8 9.373 1.93 10.77 1.5 12c1.387 4.167 5.297 6.678 9.964 6.678 1.436 0 2.806-.242 4.062-.684M6.53 6.53A10.94 10.94 0 0112 5c4.667 0 8.577 2.51 9.964 6.678a1.012 1.012 0 010 .644c-.45 1.353-1.24 2.567-2.3 3.55M3 3l18 18" />
      <path d="M9.88 9.88A3 3 0 0012 15c.59 0 1.14-.17 1.6-.46" />
    </svg>
  );
}
export function CloudKeyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={"w-5 h-5 " + (props.className ?? "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 15a4 4 0 004 4h10a4 4 0 100-8 6 6 0 10-11.47 2.04A4.5 4.5 0 003 15z" />
      <circle cx="10.5" cy="14.5" r="1.75" />
      <path d="M12.25 14.5H16m0 0v1.5M16 14.5h-1.5" />
    </svg>
  );
}
