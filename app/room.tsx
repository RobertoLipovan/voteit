import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export default function Room() {

    return (

        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.roomData}>
                    <Text style={styles.roomLabel}>ID de la sala</Text>
                    <View style={styles.idContainer}>
                        <Text style={styles.id}>TEST</Text>
                        <Ionicons name="share-social" size={50} color="grey" />
                    </View>
                </View>

                <View style={styles.votingBoard}>
                    <View style={styles.headerBoard}>
                        <Text style={styles.headerBoardText}>Nombres</Text>
                        <Text style={styles.headerBoardText}>Votos</Text>
                    </View>
                    <View style={styles.voteList}>
                        <View style={styles.vote}>
                            <Text style={styles.voteText}>Héctor</Text>
                            <Text style={styles.voteText}>1</Text>
                        </View>
                        <View style={styles.vote}>
                            <Text style={styles.voteText}>María</Text>
                            <Text style={styles.voteText}>1</Text>
                        </View>
                        <View style={styles.vote}>
                            <Text style={styles.voteText}>Juan</Text>
                            <Text style={styles.voteText}>1</Text>
                        </View>
                        <View style={styles.vote}>
                            <Text style={styles.voteText}>Pedro</Text>
                            <Text style={styles.voteText}>1</Text>
                        </View>
                        <View style={styles.vote}>
                            <Text style={styles.voteText}>Luis</Text>
                            <Text style={styles.voteText}>1</Text>
                        </View>
                        <View style={styles.vote}>
                            <Text style={styles.voteText}>Ana</Text>
                            <Text style={styles.voteText}>1</Text>
                        </View> 
                    </View>
                </View>

            </View>
        </View>

    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        gap: 25,
    },
    roomData: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    roomLabel: {
        color: 'grey',
        fontSize: 24,
        fontWeight: 'bold',
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    id: {
        color: '#FFFFFF',
        fontSize: 64,
        fontWeight: '900',
    },
    votingBoard: {
        backgroundColor: '#464646',
        borderRadius: 20,
        padding: 20,
        gap: 10,
    },
    headerBoard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerBoardText: {
        color: 'grey',
        fontSize: 16,
        fontWeight: 'bold',
    },
    voteList: {
        gap: 10,
    },
    vote: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    voteText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
})