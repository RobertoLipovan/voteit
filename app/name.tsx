import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router"; 
import { useLocalSearchParams } from 'expo-router';

export default function Name() {

    const { roomName } = useLocalSearchParams();

    return (
        <View style={styles.container}>

            <View style={styles.content}>

                <View style={styles.actionContainer}>

                    <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#5C5C5C"></TextInput>

                    <Pressable style={styles.button} onPress={() => { router.navigate(`/${roomName}`) }}>
                        <Ionicons name="arrow-forward" size={24} color="#5C5C5C" />
                    </Pressable>

                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        
    },
    content: {
        // flex: 1,
        width: '100%',
        maxWidth: 400,
        rowGap: 10,
    },
    text: {
        fontSize: 30,
        color: '#FFFFFF',
        fontWeight: '800',
        textAlign: 'left',
        width: '100%',
    },
    input: {
        // flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#474747',
        color: '#BABABA',
        fontSize: 24,
        fontWeight: '600',
        height: 50,
        width: '80%',
    },
    button: {
        // width: '20%',
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#373737',
        color: '#5C5C5C',
        fontSize: 24,
        fontWeight: '600',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContainer: {
        // flex: 0,
        // height: 100,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 10,
        height: 50,
    },
});
