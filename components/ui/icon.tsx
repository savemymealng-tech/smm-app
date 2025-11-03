import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from "lucide-react-native";

type IconProps = LucideProps & {
  as: LucideIcon;
};

function Icon({
  as: IconComponent,
  className,
  size = 14,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={cn("text-foreground", className)}
      size={size}
      {...props}
    />
  );
}

export { Icon };
