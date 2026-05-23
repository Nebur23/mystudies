import { useRipple } from "~/hooks/useRipple";
import { useClickSound } from "~/hooks/useClickSound";
import { forwardRef, type ElementType } from "react";

type AsProp<T extends ElementType> = {
    as?: T;
};

type PressableProps<T extends ElementType = "button"> =
    AsProp<T> &
    Omit<React.ComponentPropsWithRef<T>, keyof AsProp<T>> & {
        sound?: boolean;
        ripple?: boolean;
        rippleColor?: string;
    };

export function Pressable<T extends ElementType = "button">({
    as,
    children,
    sound = true,
    ripple = true,
    rippleColor,
    onPointerDown,
    className,
    ...props
}: PressableProps<T>) {
    const Tag = as ?? "button";
    const addRipple = useRipple(rippleColor);
    const playSound = useClickSound(0.025);

    const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
        if ((props as any).disabled) return;  // no feedback when disabled
        if (ripple) addRipple(e);
        if (sound) playSound();
        onPointerDown?.(e as any);
    };

    return (
        <Tag
            onPointerDown={handlePointerDown}
            className={`relative overflow-hidden select-none cursor-pointer ${className ?? ""}`}
            {...props}
        >
            {children}
        </Tag>
    );
}

Pressable.displayName = "Pressable";