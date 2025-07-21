import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TabNotificationBadge } from "../../components/NotificationBadge";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ea5a7b",
        tabBarInactiveTintColor: "#666",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "検索",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "地図",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "お気に入り",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "プロフィール",
          tabBarIcon: ({ color, focused }) => (
            <TabNotificationBadge style={{}}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </TabNotificationBadge>
          ),
        }}
      />
    </Tabs>
  );
}