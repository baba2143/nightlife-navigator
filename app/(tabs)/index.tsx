import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="wine" size={24} color="white" />
          <Text style={styles.headerTitle}>Nightlife Navigator</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>20%</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="bookmark-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="person-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="エリア・駅"
              placeholderTextColor="#999"
            />
          </View>
          <TextInput
            style={styles.searchInput2}
            placeholder="店名・ジャンル・雰囲気"
            placeholderTextColor="#999"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1,234</Text>
            <Text style={styles.statLabel}>店舗</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5,678</Text>
            <Text style={styles.statLabel}>口コミ</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>9,012</Text>
            <Text style={styles.statLabel}>写真</Text>
          </View>
        </View>

        {/* Area Search */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>エリアから探す</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>エリア一覧</Text>
            </TouchableOpacity>
          </View>

          {/* Current Location */}
          <View style={styles.currentLocationContainer}>
            <ImageBackground 
              style={styles.currentLocationImage}
              imageStyle={styles.imageStyle}
              source={{ uri: 'https://via.placeholder.com/335x100/2a2a2a/ffffff?text=現在地周辺' }}
            >
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>現在地周辺</Text>
                <Text style={styles.overlaySubtitle}>全てのジャンル</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Popular Areas */}
          <View style={styles.areaGrid}>
            {[
              { name: "渋谷", count: "1,369" },
              { name: "新宿", count: "2,514" },
              { name: "六本木", count: "893" },
              { name: "銀座", count: "1,902" },
              { name: "恵比寿", count: "756" },
              { name: "表参道", count: "634" }
            ].map((area, index) => (
              <View key={index} style={styles.areaItem}>
                <ImageBackground 
                  style={styles.areaImage}
                  imageStyle={styles.imageStyle}
                  source={{ uri: `https://via.placeholder.com/110x80/333333/ffffff?text=${area.name}` }}
                >
                  <View style={styles.overlay}>
                    <Text style={styles.areaName}>{area.name}</Text>
                    <Text style={styles.areaCount}>{area.count}件</Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </View>
        </View>

        {/* Genre Search */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ジャンルから探す</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>ジャンル一覧</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.genreGrid}>
            {[
              { name: "バー", count: "3,462", emoji: "🍸" },
              { name: "クラブ", count: "1,032", emoji: "🎵" },
              { name: "ラウンジ", count: "2,164", emoji: "🥂" },
              { name: "カラオケ", count: "1,119", emoji: "🎤" },
              { name: "パブ", count: "889", emoji: "🍺" },
              { name: "ワインバー", count: "934", emoji: "🍷" }
            ].map((genre, index) => (
              <View key={index} style={styles.genreItem}>
                <ImageBackground 
                  style={styles.genreImage}
                  imageStyle={styles.imageStyle}
                  source={{ uri: `https://via.placeholder.com/165x100/1a1a1a/ffffff?text=${genre.emoji}` }}
                >
                  <View style={styles.overlay}>
                    <Text style={styles.genreName}>{genre.name}</Text>
                    <Text style={styles.genreCount}>{genre.count}件</Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Search */}
        <View style={styles.detailSearchContainer}>
          <View style={styles.detailSearchHeader}>
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.detailSearchTitle}>お店を詳しく検索</Text>
            <TouchableOpacity style={styles.searchButton}>
              <Text style={styles.searchButtonText}>SEARCH</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchOptions}>
            <View style={styles.searchOption}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.searchOptionText}>エリア</Text>
              <TouchableOpacity style={styles.selectButton}>
                <Text style={styles.selectButtonText}>選択する</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchOption}>
              <Ionicons name="wine-outline" size={20} color="#666" />
              <Text style={styles.searchOptionText}>ジャンル</Text>
              <TouchableOpacity style={styles.selectButton}>
                <Text style={styles.selectButtonText}>選択する</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.detailSearchButton}>
            <Text style={styles.detailSearchButtonText}>詳細検索の条件を適用</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton}>
            <Text style={styles.resetButtonText}>リセット</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#ea5a7b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: "#c40010",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  searchInput2: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  statsSection: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  sectionContainer: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionLink: {
    fontSize: 14,
    color: "#007AFF",
  },
  currentLocationContainer: {
    marginBottom: 16,
  },
  currentLocationImage: {
    height: 96,
    justifyContent: "center",
    alignItems: "center",
  },
  imageStyle: {
    borderRadius: 8,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  overlayTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlaySubtitle: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  areaItem: {
    width: "32%",
    marginBottom: 8,
  },
  areaImage: {
    height: 80,
    justifyContent: "flex-end",
  },
  areaName: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  areaCount: {
    color: "white",
    fontSize: 12,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  genreItem: {
    width: "48%",
    marginBottom: 8,
  },
  genreImage: {
    height: 96,
    justifyContent: "center",
    alignItems: "center",
  },
  genreName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  genreCount: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
  detailSearchContainer: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 8,
  },
  detailSearchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailSearchTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  searchButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  searchButtonText: {
    fontSize: 12,
    color: "#666",
  },
  searchOptions: {
    marginBottom: 16,
  },
  searchOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  searchOptionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  selectButtonText: {
    fontSize: 12,
    color: "#666",
  },
  detailSearchButton: {
    backgroundColor: "#ea5a7b",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  detailSearchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#eee",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
});