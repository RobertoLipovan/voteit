import { Stack } from "expo-router";
import React, { useEffect } from "react";
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';

export default function Layout() {

    useEffect(() => {
        setTimeout(() => {
            NavigationBar.setPositionAsync('absolute');
            NavigationBar.setBackgroundColorAsync('#00000000');
        }, 500);
    }, []);

    const MyTheme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#2B2B2B', // tu color de fondo global
        },
      };
      

    return (

        <ThemeProvider value={MyTheme}>
            
            <StatusBar style="light" />

            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="name" options={{ headerShown: false }} />
                <Stack.Screen name="[room]" options={{ headerShown: false }} />
            </Stack>
            
            </ThemeProvider>
    );
}