import { ReactNode, ComponentProps } from 'react';
import './PillButton.css';

type Props = {
  children: ReactNode;
  size?: 'sm' | 'md';
  invert?: boolean;
} & ComponentProps<'a' | 'button'>;

export function PillButton({ children, size = 'md', invert = false, ...rest }: Props) {
  const className = `pill pill--${size}${invert ? ' pill--invert' : ''}`;
  if ('href' in rest && rest.href) {
    return (
      <a className={className} {...(rest as ComponentProps<'a'>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} {...(rest as ComponentProps<'button'>)}>
      {children}
    </button>
  );
}
