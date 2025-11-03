import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
	LayoutAnimation,
	Platform,
	Text,
	TouchableOpacity,
	UIManager,
	View,
} from 'react-native';
import { Divider } from './divider';

if (
	Platform.OS === 'android' &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const data = [
	{
		id: '1',
		question: 'What is the Partywithme app?',
		answer:
			'Enjoy your favorite dishes and a lovely time with your friends and family and have a great time. Food from local food trucks will be available for everyone to enjoy.',
	},
	{
		id: '2',
		question: 'What is the Partywithme app?',
		answer:
			'Enjoy your favorite dishes and a lovely your friends and family and have a great time. Food from local food trucks will be available for.',
	},
	{
		id: '3',
		question: 'What is the Partywithme app?',
		answer: 'Short description here.',
	},
	{
		id: '4',
		question: 'What is the Partywithme app?',
		answer: 'Short description here.',
	},
	{
		id: '5',
		question: 'What is the Partywithme app?',
		answer: 'Short description here.',
	},
	{
		id: '6',
		question: 'What is the Partywithme app?',
		answer: 'Short description here.',
	},
];

interface AccordionItemType {
	id: string;
	question: string;
	answer: string;
}

interface AccordionItemProps {
	item: AccordionItemType;
	expanded: boolean;
	onPress: () => void;
}

const AccordionItem = ({ item, expanded, onPress }: AccordionItemProps) => {
	return (
		<View className="bg-white rounded-xl p-4 ">
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={0.8}
				className="flex-row justify-between items-center"
			>
				<Text className="text-[15px] font-semibold text-[#0f1724] flex-1 pr-2">
					{item.question}
				</Text>
				<Feather
					name={expanded ? 'chevron-up' : 'chevron-down'}
					size={20}
					color="#334155"
				/>
			</TouchableOpacity>

			{expanded && (
				<View className="mt-3">
					<Text className="">{item.answer}</Text>
				</View>
			)}

			<Divider className="mt-6" />
		</View>
	);
};

export default function AccordionFAQ() {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const toggle = (id: string) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpandedId(expandedId === id ? null : id);
	};

	return (
		<View className="py-8">
			{data.map((item) => (
				<AccordionItem
					key={item.id}
					item={item}
					expanded={expandedId === item.id}
					onPress={() => toggle(item.id)}
				/>
			))}
		</View>
	);
}
