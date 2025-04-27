import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";

export default function Index() {

    return (

        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.joinContainer}>

                    <TextInput style={styles.roomInput} placeholder="ID de la sala" placeholderTextColor="#5C5C5C"></TextInput>

                    <Pressable style={styles.joinButton} onPress={() => { router.navigate('/name') }}>
                        <Ionicons name="arrow-forward" size={24} color="#5C5C5C" />
                    </Pressable>

                </View>

                {/* <View style={styles.createContainer}>



                </View> */}

                <Pressable style={styles.createButton} onPress={() => { router.navigate('/name') }}>
                    <Text style={[styles.text, styles.createText]}>Crear una sala</Text>
                </Pressable>

            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    text: {
        color: '#FFFFFF',
    },
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
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    joinContainer: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        gap: 10,
    },
    roomInput: {
        // width: '80%',
        flex: 1,
        height: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#474747',
        color: '#BABABA',
        fontSize: 24,
        fontWeight: '600',
    },
    joinButton: {
        width: '20%',
        height: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#373737',
        color: '#5C5C5C',
        fontSize: 24,
        fontWeight: '600',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        width: '100%',
        height: 60,
        backgroundColor: '#373737',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    createText: {
        color: '#474747',
        fontSize: 24,
        fontWeight: '900',
    },
});