import { cn } from '@/lib/utils';
import React, { forwardRef, useState } from 'react';
import { Text, TextInput, type TextInputProps, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type InputVariant = 'flat' | 'bordered' | 'faded' | 'underlined';
type InputColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type InputSize = 'sm' | 'md' | 'lg';
type InputRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

interface InputProps extends Omit<TextInputProps, 'style'> {
  variant?: InputVariant;
  color?: InputColor;
  size?: InputSize;
  radius?: InputRadius;
  label?: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  isClearable?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  labelPlacement?: 'inside' | 'outside' | 'outside-left' | 'outside-top';
  fullWidth?: boolean;
  classNames?: {
    base?: string;
    label?: string;
    inputWrapper?: string;
    input?: string;
    clearButton?: string;
    helperWrapper?: string;
    description?: string;
    errorMessage?: string;
  };
}

const Input = forwardRef<TextInput, InputProps>(({
  variant = 'bordered',
  color = 'default',
  size = 'md',
  radius = 'lg',
  label,
  description,
  errorMessage,
  isRequired = false,
  isInvalid = false,
  isClearable = false,
  startContent,
  endContent,
  labelPlacement = 'outside',
  fullWidth = true,
  classNames,
  className,
  value,
  onChangeText,
  placeholder,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasValue = value && value.length > 0;
  const showClearButton = isClearable && hasValue && !props.editable;

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-sm px-2',
    md: 'h-10 text-base px-3',
    lg: 'h-12 text-lg px-4',
  };

  // Radius classes
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  };

  // Color classes
  const colorClasses = {
    default: {
      base: 'bg-white',
      border: isInvalid ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-200',
      text: 'text-gray-900',
      placeholder: 'placeholder:text-gray-400',
    },
    primary: {
      base: 'bg-blue-50',
      border: isInvalid ? 'border-red-500' : isFocused ? 'border-blue-600' : 'border-blue-100',
      text: 'text-blue-900',
      placeholder: 'placeholder:text-blue-400',
    },
    secondary: {
      base: 'bg-gray-50',
      border: isInvalid ? 'border-red-500' : isFocused ? 'border-gray-500' : 'border-gray-100',
      text: 'text-gray-900',
      placeholder: 'placeholder:text-gray-400',
    },
    success: {
      base: 'bg-green-50',
      border: isInvalid ? 'border-red-500' : isFocused ? 'border-green-500' : 'border-green-100',
      text: 'text-green-900',
      placeholder: 'placeholder:text-green-400',
    },
    warning: {
      base: 'bg-yellow-50',
      border: isInvalid ? 'border-red-500' : isFocused ? 'border-yellow-500' : 'border-yellow-100',
      text: 'text-yellow-900',
      placeholder: 'placeholder:text-yellow-400',
    },
    danger: {
      base: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      placeholder: 'placeholder:text-red-400',
    },
  };

  // Variant classes
  const variantClasses = {
    flat: 'border-0 bg-gray-50 shadow-none',
    bordered: 'border',
    faded: 'border-0 bg-gray-100 shadow-none',
    underlined: 'border-0 border-b-2 rounded-none bg-transparent',
  };

  const currentColor = colorClasses[color];
  const currentSize = sizeClasses[size];
  const currentRadius = radiusClasses[radius];
  const currentVariant = variantClasses[variant];

  const inputWrapperClasses = cn(
    'flex-row items-center',
    currentVariant,
    currentColor.border,
    currentRadius,
    currentSize,
    fullWidth ? 'w-full' : 'w-auto',
    isFocused && 'ring-2 ring-blue-500/20',
    isInvalid && 'ring-2 ring-red-500/20',
    classNames?.inputWrapper,
    className
  );

  const inputClasses = cn(
    'flex-1',
    currentColor.text,
    currentColor.placeholder,
    'outline-none',
    classNames?.input
  );

  const labelClasses = cn(
    'text-sm font-medium',
    isInvalid ? 'text-red-500' : 'text-gray-900',
    classNames?.label
  );

  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
  };

  const renderLabel = () => {
    if (!label) return null;

    if (labelPlacement === 'inside') {
      return (
        <View className="absolute left-3 top-2 z-10">
          <Text className={cn(labelClasses, 'text-xs')}>
            {label} {isRequired && <Text className="text-red-500">*</Text>}
          </Text>
        </View>
      );
    }

    return (
      <Text className={cn(labelClasses, 'mb-2')}>
        {label} {isRequired && <Text className="text-red-500">*</Text>}
      </Text>
    );
  };

  const renderHelperText = () => {
    if (!description && !errorMessage) return null;

    return (
      <View className={cn('mt-2', classNames?.helperWrapper)}>
        {errorMessage && isInvalid && (
          <Text className={cn('text-sm text-red-500', classNames?.errorMessage)}>
            {errorMessage}
          </Text>
        )}
        {description && !isInvalid && (
          <Text className={cn('text-sm text-gray-500', classNames?.description)}>
            {description}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className={cn('w-full', classNames?.base)}>
      {labelPlacement !== 'inside' && renderLabel()}
      
      <View className={inputWrapperClasses}>
        {startContent && (
          <View className="mr-2">
            {startContent}
          </View>
        )}
        
        <TextInput
          ref={ref}
          className={inputClasses}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showClearButton && (
          <TouchableOpacity
            onPress={handleClear}
            className={cn('ml-2 p-1', classNames?.clearButton)}
            activeOpacity={0.7}
          >
            <Icon name="close-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
        
        {endContent && (
          <View className="ml-2">
            {endContent}
          </View>
        )}
      </View>
      
      {renderHelperText()}
    </View>
  );
});

Input.displayName = 'Input';

export { Input };
