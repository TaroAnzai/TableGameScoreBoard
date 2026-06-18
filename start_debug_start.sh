#!/bin/bash
set -e

echo "ADB device check..."
adb devices

echo "Setup adb reverse..."
adb reverse tcp:8081 tcp:8081
adb reverse tcp:6080 tcp:6080
adb reverse tcp:8025 tcp:8025

echo "Current reverse settings:"
adb reverse --list

echo "Start Expo dev client..."
npx expo start --dev-client --localhost -c
