import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
  Modal,
  Pressable,
  Alert,
  Dimensions,
  Animated,
  PressableProps,
  TextStyle,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as SplashScreen from 'expo-splash-screen';
import {Camera, CameraType, type BarCodeScanningResult} from 'expo-camera';
import Clipboard from '@react-native-clipboard/clipboard';
import {WebView} from 'react-native-webview';
import {FontAwesome} from '@expo/vector-icons';

const {width: screenWidth /* height: screenHeight */} =
  Dimensions.get('screen');
const centered: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
};
const row: ViewStyle = {
  flexDirection: 'row',
};
interface QrMaskProps {
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

const QrMask: React.FC<QrMaskProps> = ({
  borderColor = '#fff',
  borderWidth = 4,
  borderRadius = 5,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0.2)).current;
  const topLeft: ViewStyle = {
    borderTopWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderTopColor: borderColor,
    borderLeftColor: borderColor,
    borderTopLeftRadius: borderRadius,
  };
  const topRight: ViewStyle = {
    borderTopWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderTopColor: borderColor,
    borderRightColor: borderColor,
    borderTopRightRadius: borderRadius,
  };
  const bottomLeft: ViewStyle = {
    borderBottomWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderBottomColor: borderColor,
    borderLeftColor: borderColor,
    borderBottomLeftRadius: borderRadius,
  };
  const bottomRight: ViewStyle = {
    borderBottomWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderBottomColor: borderColor,
    borderRightColor: borderColor,
    borderBottomRightRadius: borderRadius,
  };
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        delay: 3000,
      }),
    ).start();
  }, [fadeAnim]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, centered]}>
      <Animated.View
        style={{
          width: screenWidth / 2,
          height: screenWidth / 2,
          opacity: fadeAnim,
        }}>
        <Animated.View style={[styles.container, row]}>
          <Animated.View style={[styles.container, topLeft]} />
          <Animated.View style={styles.container} />
          <Animated.View style={[styles.container, topRight]} />
        </Animated.View>
        <Animated.View style={styles.container} />
        <Animated.View style={[styles.container, row]}>
          <Animated.View style={[styles.container, bottomLeft]} />
          <Animated.View style={styles.container} />
          <Animated.View style={[styles.container, bottomRight]} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

interface ButtonProps extends PressableProps {
  title?: string;
  color?: string;
  isBoldText?: boolean;
}
const Button: React.FC<ButtonProps> = ({
  title = 'Submit',
  color = Colors.primary,
  isBoldText = true,
  style,
  ...rest
}) => {
  const originalStyle = Array.isArray(style)
    ? Object.assign({}, ...style)
    : style;
  const mainStyle: ViewStyle = {
    ...row,
    ...centered,
    ...styles.minW55P,
    backgroundColor: color,
    paddingHorizontal: '5%',
    paddingVertical: '2.5%',
    borderRadius: 20,
    ...originalStyle,
  };
  const textStyle: TextStyle = {
    fontWeight: isBoldText ? 'bold' : 'normal',
  };
  return (
    <Pressable style={mainStyle} {...rest}>
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
};

const ExpoCamera: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [appIsReady, setAppIsReady] = React.useState<boolean>(false);
  const [scanned, setScanned] = React.useState<boolean>(false);
  const [qrcode, setQrcode] = React.useState<string>('');
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);

  const validUrl = React.useMemo(() => isValidUrl(qrcode), [qrcode]);

  const bgColor = isDarkMode ? Colors.darker : Colors.lighter;
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;

  const backgroundStyle: ViewStyle = {
    backgroundColor: bgColor,
    flex: 1,
    alignItems: 'center',
  };

  React.useEffect(() => {
    const preventAutoHideSplashScreen = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.log(e);
      }
    };
    preventAutoHideSplashScreen();
    const prepareResources = async () => {
      /* await performAPICalls(...);
      await downloadAssets(...); */
      setAppIsReady(true);
      await SplashScreen.hideAsync();
    };
    prepareResources();
  }, []);

  React.useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission?.canAskAgain, permission?.granted, requestPermission]);

  const handleBarCodeScanned = ({data}: BarCodeScanningResult) => {
    setScanned(true);
    setQrcode(data);
  };

  const scanAgain = () => {
    setScanned(false);
    setQrcode('');
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('', 'Copied to clipboard.');
  };

  if (!appIsReady) {
    return null;
  }

  if (!permission) {
    return (
      <Text style={{color: textColor}}>Requesting for camera permission</Text>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.centeredView}>
        <Text style={[{color: textColor}, styles.mb4]}>
          No access to camera
        </Text>
        <Button title={'Request Again'} onPress={requestPermission} />
      </View>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {!scanned ? (
        <>
          <Camera
            style={[StyleSheet.absoluteFillObject, styles.container]}
            type={CameraType.back}
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={[styles.header, {backgroundColor: bgColor}, row]}>
            <Text style={[styles.headerText, styles.boldFont]}>Qr App</Text>
            <FontAwesome
              name="qrcode"
              size={15}
              color={textColor}
              style={styles.ml4}
            />
          </View>
          <View style={[styles.header, {backgroundColor: bgColor}]}>
            <Text style={[styles.descText]}>Scan a qr code.</Text>
          </View>
          <QrMask borderColor={Colors.primary} />
        </>
      ) : (
        <View style={styles.centeredView}>
          <Text style={[styles.qrText, styles.mb4]}>{qrcode}</Text>
          <Button
            title={'Copy'}
            onPress={() => copyToClipboard(qrcode)}
            style={styles.mb4}
          />
          {validUrl && (
            <Button
              title={'Open in the browser'}
              onPress={() => setModalVisible(true)}
              style={styles.mb4}
            />
          )}
          <Button
            title={'Tap to Scan Again'}
            color="grey"
            onPress={scanAgain}
          />
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <SafeAreaView style={[styles.container, {backgroundColor: bgColor}]}>
          <View style={[styles.modalHeader, {backgroundColor: bgColor}]}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.pr6}>
              <Text style={[styles.boldFont, {color: Colors.primary}]}>
                Back
              </Text>
            </Pressable>
            <Text
              style={[styles.boldFont, styles.alignSelfCenter]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {qrcode}
            </Text>
          </View>
          <WebView source={{uri: qrcode}} on />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 70,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    textTransform: 'uppercase',
  },
  descText: {
    marginTop: '2%',
    fontWeight: '600',
  },
  horizontalCenterAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mask: {
    height: 250,
    width: 250,
    backgroundColor: 'transparent',
    borderColor: 'blue',
    borderWidth: 1,
    borderRadius: 10,
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontWeight: 'bold',
    marginBottom: '2%',
  },
  btn: {
    borderRadius: 25,
  },
  mb2: {
    marginBottom: '2%',
  },
  mb4: {
    marginBottom: '4%',
  },
  mb8: {
    marginBottom: '8%',
  },
  ml4: {
    marginLeft: '4%',
  },
  ml6: {
    marginLeft: '6%',
  },
  ml8: {
    marginLeft: '8%',
  },
  pr6: {
    paddingRight: '6%',
  },
  modalHeader: {
    height: 70,
    backgroundColor: 'blue',
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: '5%',
  },
  modalBackBtn: {
    color: 'silver',
  },
  alignSelfCenter: {
    alignSelf: 'center',
  },
  boldFont: {
    fontWeight: 'bold',
  },
  minW55P: {
    minWidth: '55%',
  },
});

const isValidUrl = (url: any): boolean => {
  if (!url) {
    return false;
  }
  const urlExpression =
    /[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&//=]*)?/gi;
  return url.match(new RegExp(urlExpression));
};

export default ExpoCamera;
