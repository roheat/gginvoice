import { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>;
}
