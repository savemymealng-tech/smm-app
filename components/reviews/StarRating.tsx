/**
 * StarRating Component
 * Displays or inputs star ratings with support for half stars
 */

import { getStarDisplay } from '@/lib/api/reviews';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface StarRatingProps {
  /** Rating value (0-5) */
  rating: number;
  /** Size of stars in pixels */
  size?: number;
  /** Color for filled stars */
  color?: string;
  /** Color for empty stars */
  emptyColor?: string;
  /** Whether the rating is interactive (user can select) */
  interactive?: boolean;
  /** Callback when rating changes (interactive mode) */
  onRatingChange?: (rating: number) => void;
  /** Show half stars */
  showHalfStars?: boolean;
}

export function StarRating({
  rating,
  size = 18,
  color = '#FFB800',
  emptyColor = '#D1D5DB',
  interactive = false,
  onRatingChange,
  showHalfStars = true,
}: StarRatingProps) {
  const { full, half, empty } = getStarDisplay(rating);

  const handlePress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const renderStars = () => {
    const stars = [];

    // Full stars
    for (let i = 0; i < full; i++) {
      stars.push(
        <StarIcon
          key={`full-${i}`}
          name="star"
          size={size}
          color={color}
          interactive={interactive}
          onPress={() => handlePress(i)}
        />
      );
    }

    // Half star
    if (half && showHalfStars) {
      stars.push(
        <StarIcon
          key="half"
          name="star-half"
          size={size}
          color={color}
          interactive={interactive}
          onPress={() => handlePress(full)}
        />
      );
    }

    // Empty stars
    for (let i = 0; i < empty; i++) {
      stars.push(
        <StarIcon
          key={`empty-${i}`}
          name="star-outline"
          size={size}
          color={emptyColor}
          interactive={interactive}
          onPress={() => handlePress(full + (half ? 1 : 0) + i)}
        />
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      {renderStars()}
    </View>
  );
}

interface StarIconProps {
  name: 'star' | 'star-half' | 'star-outline';
  size: number;
  color: string;
  interactive: boolean;
  onPress: () => void;
}

function StarIcon({ name, size, color, interactive, onPress }: StarIconProps) {
  if (interactive) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.starButton,
          pressed && styles.starButtonPressed,
        ]}
        hitSlop={8}
      >
        <Ionicons name={name} size={size} color={color} />
      </Pressable>
    );
  }

  return <Ionicons name={name} size={size} color={color} style={styles.star} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  starButton: {
    marginRight: 4,
    padding: 2,
  },
  starButtonPressed: {
    opacity: 0.7,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

/**
 * RatingDisplay Component
 * Shows rating with count of reviews
 */


export interface RatingDisplayProps {
  rating: string | number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
  color?: string;
  emptyColor?: string;
}

export function RatingDisplay({
  rating,
  reviewCount,
  size = 16,
  showCount = true,
  color = '#FFB800',
  emptyColor = '#D1D5DB',
}: RatingDisplayProps) {
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  if (!numRating || numRating === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noReviewsText}>No reviews yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.ratingContainer}>
      <StarRating
        rating={numRating}
        size={size}
        color={color}
        emptyColor={emptyColor}
        interactive={false}
      />
      {showCount ? (
        <Text style={styles.ratingText}>
          {`${numRating.toFixed(1)}${reviewCount !== undefined ? ` (${reviewCount})` : ''}`}
        </Text>
      ) : null}
    </View>
  );
}
