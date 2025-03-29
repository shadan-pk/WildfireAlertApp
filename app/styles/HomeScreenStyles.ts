import { StyleSheet } from 'react-native';

export const HomeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  topBar: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingTop: 55,
  },
  topBarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    paddingRight: 20,
  },
  topBarTextButton: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#38a169',
    borderRadius: 3,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    width: '45%',
    aspectRatio: 1,
    margin: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  buttonGreen: {
    backgroundColor: '#38a169',
  },
  buttonRed: {
    backgroundColor: '#e53e3e',
  },
  buttonDefault: {
    backgroundColor: '#252525',
  },
  buttonIcon: {
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    width: '40%',
    padding: 7,
    maxWidth: 70,
    alignContent: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    // marginTop: 20,
    // marginBottom: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  }
});