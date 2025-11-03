import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const BackArrow = ({ onPress }: { onPress: () => void }) => {
	return (
		<TouchableOpacity
			className="rounded-full p-2 bg-gray-100"
			onPress={onPress}
		>
			<Icon name="arrow-back" size={24} color="#1e293b" />
		</TouchableOpacity>
	);
};

export default BackArrow;
