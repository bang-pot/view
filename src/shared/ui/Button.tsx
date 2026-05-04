import Link from "next/link";
import type { LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonVisualState = "default" | "hover" | "pressed" | "disabled";

type CommonButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  visualState?: ButtonVisualState;
};

type NativeButtonElementProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof CommonButtonProps
> & {
    href?: never;
  };

type LinkButtonElementProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | keyof CommonButtonProps> &
  Pick<LinkProps, "href" | "locale" | "prefetch" | "replace" | "scroll" | "shallow"> & {
    disabled?: boolean;
  };

type NativeButtonProps = CommonButtonProps & NativeButtonElementProps;
type LinkButtonProps = CommonButtonProps & LinkButtonElementProps;
type ButtonProps = NativeButtonProps | LinkButtonProps;
type ButtonElementProps = NativeButtonElementProps | LinkButtonElementProps;

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function isLinkButtonProps(props: ButtonElementProps): props is LinkButtonElementProps {
  return props.href !== undefined;
}

export function Button({
  children,
  className,
  disabled,
  leftIcon,
  rightIcon,
  size = "sm",
  variant = "primary",
  visualState = "default",
  ...elementProps
}: ButtonProps) {
  const resolvedState = disabled ? "disabled" : visualState;
  const classNameValue = cx(styles.button, styles[variant], styles[size], className);
  const content = (
    <>
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </>
  );

  if (isLinkButtonProps(elementProps)) {
    const { href, locale, onClick, prefetch, replace, scroll, shallow, ...linkProps } = elementProps;

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
      if (disabled) {
        event.preventDefault();
        return;
      }

      onClick?.(event);
    }

    return (
      <Link
        {...linkProps}
        aria-disabled={disabled ? true : linkProps["aria-disabled"]}
        className={classNameValue}
        data-size={size}
        data-state={resolvedState}
        data-variant={variant}
        href={href}
        locale={locale}
        onClick={handleClick}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        tabIndex={disabled ? -1 : linkProps.tabIndex}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = elementProps as NativeButtonElementProps;

  return (
    <button
      {...buttonProps}
      className={classNameValue}
      data-size={size}
      data-state={resolvedState}
      data-variant={variant}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
