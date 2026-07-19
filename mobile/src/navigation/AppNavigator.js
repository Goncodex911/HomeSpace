import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { LoadingScreen } from '../components/ui';
import { colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CancelOrderScreen from '../screens/CancelOrderScreen';
import ReturnOrderScreen from '../screens/ReturnOrderScreen';
import MockPaymentScreen from '../screens/MockPaymentScreen';
import StoresScreen from '../screens/StoresScreen';
import StoreProfileScreen from '../screens/StoreProfileScreen';
import RoomBuilderScreen from '../screens/RoomBuilderScreen';
import VendorRegisterScreen from '../screens/VendorRegisterScreen';
import StoreDashboardScreen from '../screens/StoreDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right',
};

export default function AppNavigator() {
  const { loading } = useContext(AuthContext);

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Catalog" component={CatalogScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Stores" component={StoresScreen} />
        <Stack.Screen name="StoreProfile" component={StoreProfileScreen} />
        <Stack.Screen name="RoomBuilder" component={RoomBuilderScreen} />
        <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />

        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="CancelOrder" component={CancelOrderScreen} />
        <Stack.Screen name="ReturnOrder" component={ReturnOrderScreen} />
        <Stack.Screen name="MockPayment" component={MockPaymentScreen} />
        <Stack.Screen name="StoreDashboard" component={StoreDashboardScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
