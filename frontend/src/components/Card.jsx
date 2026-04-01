import { cn } from '../utils/cn.js';

export function Card({ className, children }) {
  return <section className={cn('surface-card', className)}>{children}</section>;
}

