import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import AddTransaction from './screens/AddTransaction';
import ItemStocks from './screens/ItemStocks';
import Accounts from './screens/Accounts';
import Reports from './screens/Reports';
import { ModalProvider } from './context/ModalContext';
import ProfitLossReports from './screens/ProfitLossReports';
import CashFlowReports from './screens/CashFlowReports';
import BalanceSheets from './screens/BalanceSheets';
import Recaps from './screens/Recaps';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs();

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <ModalProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransaction}
          />
          <Stack.Screen
            name="ItemStocks"
            component={ItemStocks}
          />
          <Stack.Screen
            name="Accounts"
            component={Accounts}
          />
          <Stack.Screen
            name="Reports"
            component={Reports}
          />
          <Stack.Screen
            name="ProfitLossReports"
            component={ProfitLossReports}
          />
          <Stack.Screen
            name="CashFlowReports"
            component={CashFlowReports}
          />
          <Stack.Screen
            name="BalanceSheets"
            component={BalanceSheets}
          />
          <Stack.Screen
            name="Recaps"
            component={Recaps}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ModalProvider>
  );
};

export default App;